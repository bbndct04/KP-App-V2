import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const appUrl = (Deno.env.get("APP_URL") ?? Deno.env.get("ALLOWED_ORIGIN") ?? "").replace(/\/$/, "");
const senderName = Deno.env.get("SENDER_NAME") ?? "KP App - Barangay New Kababae";
const senderEmail = Deno.env.get("SENDER_EMAIL") ?? "no-reply@kpapp-newkababae.com";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function render(name: string, title: string, message: string, ref: string | null) {
  const link = appUrl ? `${appUrl}/${ref ? `track?ref=${encodeURIComponent(ref)}` : "notifications"}` : "";
  return `<!doctype html>
<html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
<tr><td style="background:#1e3a8a;color:#ffffff;padding:18px 24px">
<div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85">Barangay New Kababae · Olongapo City</div>
<div style="font-size:18px;font-weight:bold;margin-top:2px">Lupong Tagapamayapa</div>
</td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 14px;font-size:15px">Good day${name ? `, ${esc(name)}` : ""}.</p>
${ref ? `<div style="font-size:12px;color:#64748b;margin-bottom:4px">Barangay Case No. ${esc(ref)}</div>` : ""}
<div style="font-size:18px;font-weight:bold;margin-bottom:10px">${esc(title)}</div>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;white-space:pre-line">${esc(message)}</p>
${link ? `<a href="${link}" style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:11px 20px;border-radius:8px">${ref ? "View your case" : "Open the KP App"}</a>` : ""}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.5">
This is an automated message from the KP App. Please do not reply to this email.<br>
For concerns, visit the Barangay Hall, Monday to Friday, 8:00 AM – 5:00 PM.<br>
You can turn off email updates in My Profile.
</td></tr>
</table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const secret = Deno.env.get("EMAIL_HOOK_SECRET");
  if (!secret || req.headers.get("x-hook-secret") !== secret) return json({ error: "Unauthorized" }, 401);

  let id: string | undefined;
  try {
    ({ id } = await req.json());
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (!id) return json({ error: "Missing id." }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: n } = await admin
    .from("complaint_notifications")
    .select("user_id, title, message, complaints(reference_number)")
    .eq("id", id)
    .maybeSingle();
  if (!n) return json({ skipped: "not found" });

  const { data: p } = await admin.from("profiles").select("full_name, role, email_updates").eq("id", n.user_id).maybeSingle();
  if (!p || p.role !== "resident" || !p.email_updates) return json({ skipped: "opted out" });

  const { data: u } = await admin.auth.admin.getUserById(n.user_id);
  const email = u?.user?.email;
  if (!email || !u?.user?.email_confirmed_at) return json({ skipped: "no confirmed email" });

  const title = (n.title ?? "Case update").replace(/^[^\p{L}\p{N}]+/u, "").trim() || "Case update";
  const ref = (n.complaints as { reference_number?: string } | null)?.reference_number ?? null;
  const message = n.message ?? "";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY") ?? ""}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `${senderName} <${senderEmail}>`,
      to: [email],
      subject: ref ? `${title} – ${ref}` : title,
      text: `${title}\n\n${message}${appUrl ? `\n\n${appUrl}` : ""}`,
      html: render(p.full_name ?? "", title, message, ref),
    }),
  });
  if (!res.ok) return json({ error: await res.text() }, 502);
  return json({ sent: true });
});
