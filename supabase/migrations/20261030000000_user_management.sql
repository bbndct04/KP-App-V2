-- ============================================================================
-- User management & account security
--  * Restrict (can't file complaints) / Block (no access) with reason and duration
--  * Role and position changes through safe functions, last-admin protection
--  * Audit log: role changes, restrictions, verifications, ID views
--  * Spam limit: 3 complaints per day per resident
-- Run once in the Supabase SQL Editor BEFORE deploying the matching app code.
-- Safe to re-run.
-- ============================================================================

-- 1. Account status on profiles
alter table profiles
  add column if not exists account_status text not null default 'active',
  add column if not exists status_reason text,
  add column if not exists status_until timestamptz,
  add column if not exists status_set_by uuid references auth.users(id),
  add column if not exists status_set_at timestamptz;

alter table profiles drop constraint if exists profiles_account_status_check;
alter table profiles add constraint profiles_account_status_check
  check (account_status in ('active', 'restricted', 'blocked'));

-- Effective status: a restriction or block with an end date expires on its own
create or replace function public.account_state(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.account_status = 'active' then 'active'
    when p.status_until is not null and p.status_until <= now() then 'active'
    else p.account_status
  end
  from profiles p where p.id = p_user;
$$;


-- 2. Audit log (admins read; written only by the functions below)
create table if not exists user_audit_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  details text,
  actor_id uuid references auth.users(id),
  actor_name text,
  created_at timestamptz not null default now()
);

create index if not exists user_audit_log_user_idx on user_audit_log (user_id, created_at desc);
alter table user_audit_log enable row level security;

drop policy if exists "Admins read audit log" on user_audit_log;
create policy "Admins read audit log" on user_audit_log for select using (is_admin_or_staff());

create or replace function public.write_audit(p_user uuid, p_action text, p_details text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into user_audit_log (user_id, action, details, actor_id, actor_name)
  values (p_user, p_action, p_details, auth.uid(),
          coalesce((select full_name from profiles where id = auth.uid()), 'System'));
end;
$$;
revoke all on function public.write_audit(uuid, text, text) from public, authenticated;


-- 3. Profile guard: residents can't change their role, title or account status;
--    the last admin can never be demoted.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.role := 'resident';
    new.account_status := 'active';
    return new;
  end if;

  if auth.uid() is not null and not is_admin_or_staff() then
    if new.role is distinct from old.role then
      raise exception 'You are not allowed to change account roles.';
    end if;
    new.official_title := old.official_title;
    new.account_status := old.account_status;
    new.status_reason := old.status_reason;
    new.status_until := old.status_until;
    new.status_set_by := old.status_set_by;
    new.status_set_at := old.status_set_at;
  end if;

  if new.role is distinct from old.role then
    if auth.uid() = old.id then
      raise exception 'You cannot change your own role.';
    end if;
    if old.role in ('admin', 'staff') and new.role not in ('admin', 'staff')
       and (select count(*) from profiles where role in ('admin', 'staff') and id <> old.id) = 0 then
      raise exception 'This is the last admin account. Make someone else an admin first.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_role on profiles;
create trigger guard_profile_role
before insert or update on profiles
for each row execute function public.guard_profile_role();


-- 4. Change a user's role and position
create or replace function public.set_user_role(p_user uuid, p_role text, p_title text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_role text;
  old_title text;
begin
  if not is_admin_or_staff() then
    raise exception 'Only barangay admins can change roles.';
  end if;
  if p_role not in ('resident', 'admin') then
    raise exception 'Invalid role.';
  end if;
  if p_user = auth.uid() and p_role <> 'admin' then
    raise exception 'You cannot change your own role.';
  end if;

  select role, official_title into old_role, old_title from profiles where id = p_user for update;
  if not found then
    raise exception 'User not found.';
  end if;

  update profiles
  set role = p_role,
      official_title = case when p_role = 'admin' then nullif(trim(coalesce(p_title, '')), '') else null end
  where id = p_user;

  if old_role is distinct from p_role then
    perform write_audit(p_user, 'role_changed', 'Role changed from ' || old_role || ' to ' || p_role
      || coalesce(' (' || nullif(trim(coalesce(p_title, '')), '') || ')', '') || '.');
  elsif coalesce(old_title, '') is distinct from coalesce(trim(p_title), '') then
    perform write_audit(p_user, 'position_changed', 'Position set to ' || coalesce(nullif(trim(coalesce(p_title, '')), ''), 'none') || '.');
  end if;
end;
$$;
revoke all on function public.set_user_role(uuid, text, text) from public;
grant execute on function public.set_user_role(uuid, text, text) to authenticated;


-- 5. Restrict, block or restore an account
create or replace function public.set_account_status(p_user uuid, p_status text, p_reason text default null, p_days int default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target profiles%rowtype;
  until_at timestamptz := case when p_days is not null and p_days > 0 then now() + make_interval(days => p_days) else null end;
  until_txt text;
begin
  if not is_admin_or_staff() then
    raise exception 'Only barangay admins can restrict or block accounts.';
  end if;
  if p_status not in ('active', 'restricted', 'blocked') then
    raise exception 'Invalid account status.';
  end if;
  if p_user = auth.uid() then
    raise exception 'You cannot restrict or block your own account.';
  end if;

  select * into target from profiles where id = p_user for update;
  if not found then
    raise exception 'User not found.';
  end if;
  if target.role in ('admin', 'staff') and p_status <> 'active' then
    raise exception 'Admin accounts cannot be restricted or blocked. Change their role to Resident first.';
  end if;
  if p_status <> 'active' and coalesce(trim(p_reason), '') = '' then
    raise exception 'A reason is required.';
  end if;

  update profiles set
    account_status = p_status,
    status_reason = case when p_status = 'active' then null else trim(p_reason) end,
    status_until = case when p_status = 'active' then null else until_at end,
    status_set_by = auth.uid(),
    status_set_at = now()
  where id = p_user;

  until_txt := coalesce(' until ' || to_char(until_at at time zone 'Asia/Manila', 'FMMonth FMDD, YYYY'), '');

  perform write_audit(p_user,
    case p_status when 'active' then 'account_restored' when 'restricted' then 'account_restricted' else 'account_blocked' end,
    case p_status
      when 'active' then 'Account restored' || coalesce('. ' || nullif(trim(coalesce(p_reason, '')), ''), '') || '.'
      else initcap(p_status) || until_txt || '. Reason: ' || trim(p_reason)
    end);

  if p_status = 'restricted' then
    insert into complaint_notifications (complaint_id, user_id, title, type, message)
    values (null, p_user, 'Account Restricted', 'warning',
      'You cannot file new complaints' || until_txt || '. Reason: ' || trim(p_reason)
        || '. You can still view your existing cases. Visit the Barangay Hall if you have questions.');
  elsif p_status = 'active' and target.account_status <> 'active' then
    insert into complaint_notifications (complaint_id, user_id, title, type, message)
    values (null, p_user, 'Account Restored', 'success', 'Your account has been restored. You can file complaints again.');
  end if;
end;
$$;
revoke all on function public.set_account_status(uuid, text, text, int) from public;
grant execute on function public.set_account_status(uuid, text, text, int) to authenticated;


-- 6. Blocked accounts lose access to case data (restrictive = applies on top of other policies)
drop policy if exists "Blocked accounts have no access" on complaints;
create policy "Blocked accounts have no access" on complaints as restrictive for all to authenticated
  using (is_admin_or_staff() or account_state(auth.uid()) <> 'blocked')
  with check (is_admin_or_staff() or account_state(auth.uid()) <> 'blocked');

drop policy if exists "Blocked accounts have no access" on complaint_notifications;
create policy "Blocked accounts have no access" on complaint_notifications as restrictive for all to authenticated
  using (is_admin_or_staff() or account_state(auth.uid()) <> 'blocked')
  with check (is_admin_or_staff() or account_state(auth.uid()) <> 'blocked');

drop policy if exists "Blocked accounts have no access" on case_activity_log;
create policy "Blocked accounts have no access" on case_activity_log as restrictive for all to authenticated
  using (is_admin_or_staff() or account_state(auth.uid()) <> 'blocked')
  with check (is_admin_or_staff() or account_state(auth.uid()) <> 'blocked');


-- 7. New complaints: account must be active, and at most 3 per day per resident
create or replace function public.check_complaint_allowed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  state text;
  today_count int;
begin
  if auth.uid() is null or is_admin_or_staff() then
    return new;
  end if;

  state := account_state(auth.uid());
  if state = 'restricted' then
    raise exception 'Your account is restricted from filing complaints. Please visit the Barangay Hall.';
  elsif state = 'blocked' then
    raise exception 'Your account has been blocked. Please visit the Barangay Hall.';
  end if;

  select count(*) into today_count
  from complaints
  where user_id = auth.uid()
    and (created_at at time zone 'Asia/Manila')::date = (now() at time zone 'Asia/Manila')::date;
  if today_count >= 3 then
    raise exception 'You can file up to 3 complaints per day. Please try again tomorrow or visit the Barangay Hall.';
  end if;

  return new;
end;
$$;

drop trigger if exists check_complaint_allowed on complaints;
create trigger check_complaint_allowed
before insert on complaints
for each row execute function public.check_complaint_allowed();


-- 8. Audit identity verifications and ID views
create or replace function public.audit_identity_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform write_audit(new.user_id, 'identity_verified', 'Identity marked as verified.');
    return new;
  end if;
  perform write_audit(old.user_id, 'verification_removed', 'Identity verification removed.');
  return old;
end;
$$;

drop trigger if exists audit_identity_verification on identity_verifications;
create trigger audit_identity_verification
after insert or delete on identity_verifications
for each row execute function public.audit_identity_verification();

create or replace function public.log_identity_view(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin_or_staff() then
    return;
  end if;
  if exists (
    select 1 from user_audit_log
    where user_id = p_user and action = 'id_viewed' and actor_id = auth.uid() and created_at > now() - interval '10 minutes'
  ) then
    return;
  end if;
  perform write_audit(p_user, 'id_viewed', 'Viewed ID photo and selfie.');
end;
$$;
revoke all on function public.log_identity_view(uuid) from public;
grant execute on function public.log_identity_view(uuid) to authenticated;


-- 9. User list for the admin panel (includes email and last sign-in from auth)
drop function if exists public.admin_list_users();
create or replace function public.admin_list_users()
returns table (
  id uuid,
  full_name text,
  email text,
  contact_number text,
  role text,
  official_title text,
  account_status text,
  effective_status text,
  status_reason text,
  status_until timestamptz,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed boolean,
  verified_at timestamptz,
  complaint_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin_or_staff() then
    raise exception 'Only barangay admins can list users.';
  end if;

  return query
  select
    p.id, p.full_name, u.email::text, p.contact_number, p.role, p.official_title,
    p.account_status, account_state(p.id), p.status_reason, p.status_until,
    coalesce(p.created_at, u.created_at), u.last_sign_in_at, u.email_confirmed_at is not null,
    v.verified_at,
    (select count(*) from complaints c where c.user_id = p.id)
  from profiles p
  join auth.users u on u.id = p.id
  left join identity_verifications v on v.user_id = p.id
  order by coalesce(p.created_at, u.created_at) desc;
end;
$$;
revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;
