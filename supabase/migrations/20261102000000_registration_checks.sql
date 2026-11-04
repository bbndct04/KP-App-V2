-- ============================================================================
-- Registration: check if an email already has a confirmed account before signing up.
-- Unconfirmed sign-ups (never opened the confirmation link) can register again.
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================

create or replace function public.email_registered(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from auth.users
    where lower(email) = lower(trim(p_email)) and email_confirmed_at is not null
  );
$$;

revoke all on function public.email_registered(text) from public;
grant execute on function public.email_registered(text) to anon, authenticated;
