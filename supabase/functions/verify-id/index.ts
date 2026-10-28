import "@supabase/functions-js/edge-runtime.d.ts";

const MAX_BASE64_LENGTH = 1_400_000; // ~1 MB image (OCR.space free tier limit)
const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const ocrApiKey = Deno.env.get("OCR_SPACE_KEY");
  if (!ocrApiKey) return json({ error: "OCR is not configured" }, 500);

  try {
    const { imageBase64 } = await req.json();

    if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
      return json({ error: "No image provided" }, 400);
    }
    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return json({ error: "Image is too large. Please retake the photo." }, 413);
    }

    const dataUri = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    const formData = new FormData();
    formData.append("apikey", ocrApiKey);
    formData.append("base64Image", dataUri);
    formData.append("language", "eng");
    formData.append("OCREngine", "2");
    formData.append("scale", "true");

    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(25_000),
    });
    const ocrData = await ocrResponse.json();

    if (ocrData?.IsErroredOnProcessing) {
      const message = [].concat(ocrData.ErrorMessage ?? []).join(" ") || "OCR failed";
      return json({ error: message }, 502);
    }

    return json({ text: ocrData?.ParsedResults?.[0]?.ParsedText ?? "" });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    return json({ error: timedOut ? "OCR timed out" : "Could not read the ID" }, timedOut ? 504 : 500);
  }
});
