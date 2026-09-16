import "@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ocrApiKey = Deno.env.get("OCR_SPACE_KEY");

    const formData = new FormData();
    formData.append("apikey", ocrApiKey ?? "");
    formData.append("base64Image", imageBase64);
    formData.append("language", "eng");
    formData.append("OCREngine", "2");

    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
    });

    const ocrData = await ocrResponse.json();

    const parsedText = ocrData?.ParsedResults?.[0]?.ParsedText || "";

    return new Response(JSON.stringify({ text: parsedText, raw: ocrData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});