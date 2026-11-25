-- ============================================================================
-- Admin activity monitoring
--  * One activity feed of what each official did (accounts, cases, forms, records)
--  * Alerts to the OTHER officials when an official:
--      - views the IDs of 10+ residents within an hour
--      - declines 5+ complaints within an hour
--      - gives someone admin access
-- Run this whole file once in the Supabase SQL Editor BEFORE merging the app code.
-- ============================================================================

-- 1. Activity feed (admins only)
create or replace function public.admin_activity(p_days int default 30)
returns table (
  at timestamptz,
  actor_id uuid,
  actor_name text,
  category text,
  action text,
  details text,
  complaint_id bigint,
  reference_number text,
  target_user uuid,
  target_name text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(least(coalesce(p_days, 30), 365), 1));
begin
  if not is_admin_or_staff() then
    raise exception 'Only barangay admins can view admin activity.';
  end if;

  return query
  select a.created_at, a.actor_id, coalesce(a.actor_name, ap.full_name), 'account'::text, a.action, a.details,
         null::bigint, null::text, a.user_id, tp.full_name
  from user_audit_log a
  left join profiles ap on ap.id = a.actor_id
  left join profiles tp on tp.id = a.user_id
  where a.actor_id is not null and a.created_at >= since

  union all
  select l.created_at, l.created_by, ap.full_name, 'case'::text,
         case
           when l.entry_type = 'stage_change' then 'stage_change'
           when l.remarks like 'Complaint declined%' then 'complaint_declined'
           when l.remarks like 'Complaint accepted%' or l.remarks like 'Complainant appeared%' then 'complaint_accepted'
           when l.remarks like 'Walk-in complaint%' then 'walk_in_filed'
           when l.remarks like 'Personal appearance required%' then 'appearance_required'
           when l.remarks like 'Form % issued by%' then 'form_issued'
           when l.remarks like 'Form % voided by%' then 'form_voided'
           else 'note'
         end,
         l.remarks, l.complaint_id, c.reference_number, null::uuid, null::text
  from case_activity_log l
  left join profiles ap on ap.id = l.created_by
  left join complaints c on c.id = l.complaint_id
  where l.created_by is not null and l.created_at >= since

  union all
  select r.created_at, r.issued_by, coalesce(r.issued_by_name, ap.full_name), 'record'::text, 'record_released',
         r.control_no || ' · ' || r.document || ' for ' || r.requester_name || ' (' || r.requester_relation || ') · ' || r.purpose,
         r.complaint_id, c.reference_number, null::uuid, null::text
  from record_requests r
  left join profiles ap on ap.id = r.issued_by
  left join complaints c on c.id = r.complaint_id
  where r.created_at >= since

  order by 1 desc
  limit 1000;
end;
$$;

revoke all on function public.admin_activity(int) from public;
grant execute on function public.admin_activity(int) to authenticated;


-- 2. Notify every other official (internal)
create or replace function public.alert_other_admins(p_actor uuid, p_title text, p_message text, p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into complaint_notifications (complaint_id, user_id, title, type, message)
  select null, p.id, p_title, 'warning', p_message
  from profiles p
  where p.role in ('admin', 'staff')
    and p.id is distinct from p_actor
    and not exists (
      select 1 from complaint_notifications n
      where n.user_id = p.id and n.title = p_title
        and n.message like p_key || '%'
        and n.created_at > now() - interval '1 hour'
    );
end;
$$;

revoke all on function public.alert_other_admins(uuid, text, text, text) from public, authenticated;


-- 3. Unusual ID viewing and admin role changes
create or replace function public.watch_account_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
  actor text;
begin
  if new.actor_id is null then
    return new;
  end if;
  actor := coalesce(new.actor_name, (select full_name from profiles where id = new.actor_id), 'An official');

  if new.action = 'id_viewed' then
    select count(distinct user_id) into n
    from user_audit_log
    where actor_id = new.actor_id and action = 'id_viewed' and created_at > now() - interval '1 hour';
    if n >= 10 then
      perform alert_other_admins(new.actor_id, '⚠ Unusual Admin Activity',
        actor || ' viewed the IDs of ' || n || ' residents within one hour.', actor || ' viewed the IDs');
    end if;

  elsif (new.action = 'role_changed' and (coalesce(new.details, '') ilike '% to admin%' or coalesce(new.details, '') ilike '% to staff%'))
        or new.action = 'official_invited' then
    perform alert_other_admins(new.actor_id, '🔐 Admin Access Given',
      actor || ' gave admin access to ' || coalesce((select full_name from profiles where id = new.user_id), 'a new official') || '.',
      actor || ' gave admin access to ' || coalesce((select full_name from profiles where id = new.user_id), 'a new official'));
  end if;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists zz_watch_account_audit on user_audit_log;
create trigger zz_watch_account_audit
after insert on user_audit_log
for each row execute function public.watch_account_audit();


-- 4. Many declines in a short time
create or replace function public.watch_case_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if new.created_by is null or coalesce(new.remarks, '') not like 'Complaint declined%' then
    return new;
  end if;
  select count(*) into n
  from case_activity_log
  where created_by = new.created_by and remarks like 'Complaint declined%' and created_at > now() - interval '1 hour';
  if n >= 5 then
    perform alert_other_admins(new.created_by, '⚠ Unusual Admin Activity',
      coalesce((select full_name from profiles where id = new.created_by), 'An official')
        || ' declined ' || n || ' complaints within one hour.',
      coalesce((select full_name from profiles where id = new.created_by), 'An official') || ' declined ');
  end if;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists zz_watch_case_activity on case_activity_log;
create trigger zz_watch_case_activity
after insert on case_activity_log
for each row execute function public.watch_case_activity();


-- 5. Logs can't be edited or deleted from the app (only from the SQL Editor)
create or replace function public.protect_log_rows()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    raise exception 'Activity logs cannot be edited or deleted.';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists protect_case_activity_log on case_activity_log;
create trigger protect_case_activity_log
before update or delete on case_activity_log
for each row execute function public.protect_log_rows();

drop trigger if exists protect_user_audit_log on user_audit_log;
create trigger protect_user_audit_log
before update or delete on user_audit_log
for each row execute function public.protect_log_rows();
