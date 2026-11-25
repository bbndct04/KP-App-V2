-- ============================================================================
-- Abuse detection (flag only, never blocks filing)
--  * Risk score per resident (Low / Medium / High) with reasons
--  * Possible duplicate accounts: same ID fingerprint, same contact number,
--    or same name + birthdate
--  * Admins are notified about high-risk complaints and possible duplicates
-- The ID fingerprint is a SHA-256 hash made in the browser at sign-up
-- (raw_user_meta_data.id_fp). The ID number itself is never stored.
-- Run this whole file once in the Supabase SQL Editor BEFORE merging the app code.
-- ============================================================================

-- 1. Matching helpers
create or replace function public.norm_name(p text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(coalesce(p, '')), '[^a-z]', '', 'g')
$$;

create or replace function public.norm_phone(p text)
returns text
language sql
immutable
as $$
  select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 10)
$$;


-- 2. Accounts that look like the same person (internal)
create or replace function public.duplicate_matches(p_user uuid)
returns table (user_id uuid, match text)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select
      p.id,
      u.raw_user_meta_data->>'id_fp' as fp,
      norm_phone(coalesce(p.contact_number, u.raw_user_meta_data->>'contact_number')) as phone,
      norm_name(coalesce(p.full_name, u.raw_user_meta_data->>'full_name')) as name,
      u.raw_user_meta_data->>'date_of_birth' as dob
    from profiles p
    join auth.users u on u.id = p.id
    where p.id = p_user
  ),
  others as (
    select
      p.id,
      u.raw_user_meta_data->>'id_fp' as fp,
      norm_phone(coalesce(p.contact_number, u.raw_user_meta_data->>'contact_number')) as phone,
      norm_name(coalesce(p.full_name, u.raw_user_meta_data->>'full_name')) as name,
      u.raw_user_meta_data->>'date_of_birth' as dob
    from profiles p
    join auth.users u on u.id = p.id
    where p.id <> p_user and p.role not in ('admin', 'staff')
  )
  select o.id, 'id' from me join others o on me.fp is not null and me.fp <> '' and o.fp = me.fp
  union
  select o.id, 'phone' from me join others o on length(me.phone) = 10 and o.phone = me.phone
  union
  select o.id, 'name_dob' from me join others o on me.name <> '' and me.dob is not null and o.name = me.name and o.dob = me.dob
$$;

revoke all on function public.duplicate_matches(uuid) from public, authenticated;


-- 3. Risk score (internal). Signals and points:
--    declined (1 each, max 4) · not confirmed in person (2 each, max 4) ·
--    dismissed for not appearing (1 each, max 2) · 3+ complaints within an hour (2) ·
--    filed within an hour of sign-up (1) · 3+ complaints against the same person (2) ·
--    same ID (3) · same name + birthdate (3) · same contact number (2) · restricted before (1)
--    Level: 0-1 Low, 2-3 Medium, 4+ High
create or replace function public.compute_account_risk(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  reasons jsonb := '[]'::jsonb;
  score int := 0;
  n int;
  ids uuid[];
  created timestamptz;
begin
  select created_at into created from auth.users where id = p_user;

  select count(*) into n from complaints
  where user_id = p_user and status = 'declined' and coalesce(reviewed_at, created_at) > now() - interval '90 days';
  if n > 0 then
    score := score + least(n, 4);
    reasons := reasons || jsonb_build_object('key', 'declined', 'n', n);
  end if;

  select count(*) into n from complaints
  where user_id = p_user and status = 'not_confirmed' and created_at > now() - interval '90 days';
  if n > 0 then
    score := score + least(n * 2, 4);
    reasons := reasons || jsonb_build_object('key', 'not_confirmed', 'n', n);
  end if;

  select count(*) into n from complaints
  where user_id = p_user and status = 'dismissed' and dismissal_reason = 'complainant_failed_to_appear'
    and created_at > now() - interval '180 days';
  if n > 0 then
    score := score + least(n, 2);
    reasons := reasons || jsonb_build_object('key', 'no_show', 'n', n);
  end if;

  select coalesce(max(cnt), 0) into n from (
    select (select count(*) from complaints c2
            where c2.user_id = p_user and c2.created_at between c1.created_at and c1.created_at + interval '1 hour') as cnt
    from complaints c1
    where c1.user_id = p_user and c1.created_at > now() - interval '30 days'
  ) x;
  if n >= 3 then
    score := score + 2;
    reasons := reasons || jsonb_build_object('key', 'burst', 'n', n);
  end if;

  if created is not null and exists (
    select 1 from complaints where user_id = p_user and source = 'online' and created_at < created + interval '1 hour'
      and created_at > now() - interval '30 days'
  ) then
    score := score + 1;
    reasons := reasons || jsonb_build_object('key', 'new_account', 'n', 1);
  end if;

  select coalesce(max(cnt), 0) into n from (
    select count(*) as cnt from complaints
    where user_id = p_user and created_at > now() - interval '90 days'
    group by norm_name(respondent_name)
  ) x;
  if n >= 3 then
    score := score + 2;
    reasons := reasons || jsonb_build_object('key', 'same_respondent', 'n', n);
  end if;

  select array_agg(distinct user_id) into ids from duplicate_matches(p_user) where match = 'id';
  if ids is not null then
    score := score + 3;
    reasons := reasons || jsonb_build_object('key', 'same_id', 'n', cardinality(ids), 'users', to_jsonb(ids));
  end if;

  select array_agg(distinct user_id) into ids from duplicate_matches(p_user) where match = 'name_dob';
  if ids is not null then
    score := score + 3;
    reasons := reasons || jsonb_build_object('key', 'same_name_dob', 'n', cardinality(ids), 'users', to_jsonb(ids));
  end if;

  select array_agg(distinct user_id) into ids from duplicate_matches(p_user) where match = 'phone';
  if ids is not null then
    score := score + 2;
    reasons := reasons || jsonb_build_object('key', 'same_phone', 'n', cardinality(ids), 'users', to_jsonb(ids));
  end if;

  select count(*) into n from user_audit_log where user_id = p_user and action = 'account_restricted';
  if n > 0 then
    score := score + 1;
    reasons := reasons || jsonb_build_object('key', 'restricted_before', 'n', n);
  end if;

  return jsonb_build_object(
    'score', score,
    'level', case when score >= 4 then 'high' when score >= 2 then 'medium' else 'low' end,
    'reasons', reasons
  );
end;
$$;

revoke all on function public.compute_account_risk(uuid) from public, authenticated;


-- 4. For the app (admins only)
create or replace function public.account_risk(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin_or_staff() then
    raise exception 'Only barangay admins can view account risk.';
  end if;
  return compute_account_risk(p_user);
end;
$$;

revoke all on function public.account_risk(uuid) from public;
grant execute on function public.account_risk(uuid) to authenticated;

create or replace function public.flagged_accounts()
returns table (id uuid, full_name text, email text, contact_number text, score int, level text, reasons jsonb)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin_or_staff() then
    raise exception 'Only barangay admins can view flagged accounts.';
  end if;
  return query
    select x.id, x.full_name, x.email, x.contact_number, (x.r->>'score')::int, x.r->>'level', x.r->'reasons'
    from (
      select p.id, p.full_name, u.email::text as email, p.contact_number, compute_account_risk(p.id) as r
      from profiles p
      join auth.users u on u.id = p.id
      where p.role not in ('admin', 'staff')
    ) x
    where (x.r->>'score')::int >= 2
    order by (x.r->>'score')::int desc, x.full_name;
end;
$$;

revoke all on function public.flagged_accounts() from public;
grant execute on function public.flagged_accounts() to authenticated;


-- 5. Tell admins when a high-risk account files online
create or replace function public.notify_admins_high_risk_complaint()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r jsonb;
begin
  if new.source <> 'online' or new.user_id is null then
    return new;
  end if;
  r := compute_account_risk(new.user_id);
  if r->>'level' = 'high' then
    insert into complaint_notifications (complaint_id, user_id, title, type, message)
    select new.id, p.id, '⚠ Review Carefully', 'warning',
      'Complaint ' || new.reference_number || ' was filed by an account flagged as high risk. Check the warning signs before accepting it.'
    from profiles p
    where p.role in ('admin', 'staff');
  end if;
  return new;
end;
$$;

drop trigger if exists zz_notify_high_risk_complaint on complaints;
create trigger zz_notify_high_risk_complaint
after insert on complaints
for each row execute function public.notify_admins_high_risk_complaint();


-- 6. Tell admins when a new account looks like an existing one
create or replace function public.notify_admins_duplicate_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role in ('admin', 'staff') then
    return new;
  end if;
  if exists (select 1 from duplicate_matches(new.id)) then
    insert into complaint_notifications (complaint_id, user_id, title, type, message)
    select null, p.id, '⚠ Possible Duplicate Account', 'warning',
      'The new account of ' || coalesce(new.full_name, 'a resident') || ' has the same ID, contact number, or name and birthdate as another account. Check it in Manage Users.'
    from profiles p
    where p.role in ('admin', 'staff');
  end if;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists zz_notify_duplicate_account on profiles;
create trigger zz_notify_duplicate_account
after insert on profiles
for each row execute function public.notify_admins_duplicate_account();
