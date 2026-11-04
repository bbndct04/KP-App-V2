import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const MAX_BASE64 = 2_000_000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function toBytes(dataUrl: string) {
  const bin = atob(dataUrl.replace(/^data:image\/\w+;base64,/, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { user_id?: string; email?: string; id_front?: string; id_back?: string | null; face?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const { user_id, email, id_front, id_back, face } = body;
  if (!user_id || !email || typeof id_front !== "string" || typeof face !== "string") {
    return json({ error: "Missing ID or face photo." }, 400);
  }
  if ([id_front, id_back ?? "", face].some((img) => img.length > MAX_BASE64)) {
    return json({ error: "Photo is too large." }, 413);
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: found, error: userError } = await admin.auth.admin.getUserById(user_id);
  const user = found?.user;
  if (userError || !user || (user.email ?? "").toLowerCase() !== email.trim().toLowerCase()) {
    return json({ error: "Account not found." }, 404);
  }
  if (user.email_confirmed_at) {
    return json({ error: "This account is already verified. Log in to update your ID at the Barangay Hall." }, 403);
  }

  const opts = { contentType: "image/jpeg", upsert: true };
  const uploads = [
    admin.storage.from("id-uploads").upload(`${user_id}/id.jpg`, toBytes(id_front), opts),
    admin.storage.from("face-uploads").upload(`${user_id}/face.jpg`, toBytes(face), opts),
  ];
  if (id_back) uploads.push(admin.storage.from("id-uploads").upload(`${user_id}/id_back.jpg`, toBytes(id_back), opts));
  else await admin.storage.from("id-uploads").remove([`${user_id}/id_back.jpg`]);

  const results = await Promise.all(uploads);
  const failed = results.find((r) => r.error);
  if (failed?.error) return json({ error: failed.error.message }, 500);

  return json({ ok: true });
});
