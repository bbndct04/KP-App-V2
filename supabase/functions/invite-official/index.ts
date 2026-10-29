import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: caller, error: callerError } = await admin.auth.getUser(jwt);
  if (callerError || !caller?.user) return json({ error: "Please log in again." }, 401);

  const { data: callerProfile } = await admin.from("profiles").select("role, full_name").eq("id", caller.user.id).maybeSingle();
  if (!callerProfile || !["admin", "staff"].includes(callerProfile.role)) {
    return json({ error: "Only barangay admins can invite officials." }, 403);
  }

  let body: { email?: string; full_name?: string; title?: string; redirect_to?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const fullName = (body.full_name ?? "").trim();
  const title = (body.title ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
  if (fullName.length < 3) return json({ error: "Enter the official's full name." }, 400);
  if (!title) return json({ error: "Choose the official's position." }, 400);

  let redirectTo = body.redirect_to;
  if (allowedOrigin !== "*" && (!redirectTo || !redirectTo.startsWith(allowedOrigin))) redirectTo = `${allowedOrigin}/reset-password?invite=1`;

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo,
  });

  if (inviteError || !invited?.user) {
    const msg = inviteError?.message ?? "Could not send the invitation.";
    if (/already been registered|already exists/i.test(msg)) {
      return json({ error: "This email already has an account. Find the person in the user list and change their role to Admin instead." }, 409);
    }
    return json({ error: msg }, 400);
  }

  const id = invited.user.id;
  await admin.from("profiles").upsert({ id, full_name: fullName }, { onConflict: "id" });
  const { error: roleError } = await admin.from("profiles").update({ role: "admin", official_title: title, full_name: fullName }).eq("id", id);
  if (roleError) return json({ error: `Invitation sent, but the role could not be set: ${roleError.message}` }, 500);

  await admin.from("user_audit_log").insert({
    user_id: id,
    action: "official_invited",
    details: `Invited as admin (${title}).`,
    actor_id: caller.user.id,
    actor_name: callerProfile.full_name ?? "Admin",
  });

  return json({ ok: true, id });
});
