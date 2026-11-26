-- Email case updates to residents.
-- Every new resident notification is also sent by email through the send-email Edge Function.
-- Residents can turn this off in My Profile.
--
-- One-time setup (run once in the SQL Editor, with your own values):
--   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/send-email', 'email_function_url');
--   select vault.create_secret('<same value as the EMAIL_HOOK_SECRET function secret>', 'email_hook_secret');

alter table profiles add column if not exists email_updates boolean not null default true;

create extension if not exists pg_net;

create or replace function public.email_resident_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_secret text;
begin
  if not exists (
    select 1 from profiles p
    where p.id = new.user_id and p.role = 'resident' and p.email_updates and p.account_status <> 'blocked'
  ) then
    return new;
  end if;

  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'email_function_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'email_hook_secret';
  if v_url is null or v_secret is null then
    return new;
  end if;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-hook-secret', v_secret),
    timeout_milliseconds := 10000
  );
  return new;
exception when others then
  return new;
end;
$$;

revoke execute on function public.email_resident_notification() from public, anon, authenticated;

drop trigger if exists email_resident_notification on complaint_notifications;
create trigger email_resident_notification
after insert on complaint_notifications
for each row execute function public.email_resident_notification();
