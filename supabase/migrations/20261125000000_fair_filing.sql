-- ============================================================================
-- Fair filing rules (KP law: a complaint is never refused)
--  * New statuses: for_appearance (must confirm in person) and not_confirmed
--  * Declines only on legal grounds (enforced in the app)
--  * Restrictions only limit ONLINE filing; residents can always file at the hall
--  * Confirmation deadline = next working day(s), set in Barangay Settings
-- Run this whole file once in the Supabase SQL Editor BEFORE merging the app code.
-- ============================================================================

-- 1. Columns and settings
alter table complaints
  add column if not exists appearance_due timestamptz,
  add column if not exists appearance_reason text;

alter table barangay_settings
  add column if not exists appearance_days int not null default 1;

alter table barangay_settings drop constraint if exists barangay_settings_appearance_days_check;
alter table barangay_settings add constraint barangay_settings_appearance_days_check check (appearance_days between 1 and 10);


-- 2. Statuses
alter table complaints drop constraint if exists complaints_status_check;
alter table complaints add constraint complaints_status_check check (status in (
  'submitted', 'for_appearance', 'not_confirmed', 'declined',
  'filed', 'summoned', 'mediation', 'pangkat_formed', 'pangkat_hearing', 'arbitration',
  'settled', 'execution', 'closed', 'cfa_issued', 'dismissed'
));


-- 3. Allowed stage changes
create or replace function public.guard_complaint_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed text[];
  final_at timestamptz;
begin
  if auth.uid() is not null and not is_admin_or_staff() then
    raise exception 'Complaints can only be updated by the barangay.';
  end if;

  if new.status is distinct from old.status and auth.uid() is not null then
    allowed := case old.status
      when 'submitted'       then array['filed', 'declined', 'for_appearance']
      when 'for_appearance'  then array['filed', 'declined', 'not_confirmed']
      when 'not_confirmed'   then array['filed', 'declined']
      when 'filed'           then array['summoned', 'dismissed']
      when 'summoned'        then array['mediation', 'pangkat_formed', 'dismissed']
      when 'mediation'       then array['pangkat_formed', 'arbitration', 'settled', 'dismissed']
      when 'pangkat_formed'  then array['pangkat_hearing', 'arbitration', 'settled', 'cfa_issued', 'dismissed']
      when 'pangkat_hearing' then array['arbitration', 'settled', 'cfa_issued', 'dismissed']
      when 'arbitration'     then array['settled', 'cfa_issued', 'dismissed']
      when 'settled'         then array['closed', 'execution', 'cfa_issued']
      when 'execution'       then array['closed']
      else array[]::text[]
    end;

    if not (new.status = any(allowed)) then
      raise exception 'A case cannot move from "%" to "%".', old.status, new.status;
    end if;

    if old.status = 'settled' then
      final_at := coalesce(old.settled_at, now()) + interval '10 days';
      if new.status = 'cfa_issued' and now() > final_at then
        raise exception 'The 10-day repudiation period has ended. The settlement is already final.';
      end if;
      if new.status in ('closed', 'execution') and now() < final_at then
        raise exception 'Wait until the 10-day repudiation period ends on %.', to_char(final_at at time zone 'Asia/Manila', 'FMMonth FMDD, YYYY');
      end if;
    end if;
  end if;

  new.user_id := old.user_id;
  new.reference_number := old.reference_number;
  new.created_at := old.created_at;
  return new;
end;
$$;


-- 4. End of office hours (5:00 PM Manila) after N working days, skipping Saturday and Sunday
create or replace function public.working_days_deadline(p_days int)
returns timestamptz
language plpgsql
stable
as $$
declare
  d date := (now() at time zone 'Asia/Manila')::date;
  left_days int := greatest(coalesce(p_days, 1), 1);
begin
  while left_days > 0 loop
    d := d + 1;
    if extract(isodow from d) < 6 then
      left_days := left_days - 1;
    end if;
  end loop;
  return (d + time '17:00') at time zone 'Asia/Manila';
end;
$$;


-- 5. Review a complaint: accept, decline (legal grounds), or require personal appearance
create or replace function public.review_complaint(
  p_complaint_id bigint,
  p_decision text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c complaints%rowtype;
  admin_name text;
  due timestamptz;
  due_text text;
begin
  if not is_admin_or_staff() then
    raise exception 'Only barangay admins can review complaints.';
  end if;

  select * into c from complaints where id = p_complaint_id for update;
  if not found then
    raise exception 'Complaint not found.';
  end if;
  if c.status not in ('submitted', 'for_appearance', 'not_confirmed') then
    raise exception 'This complaint has already been reviewed.';
  end if;

  select coalesce(full_name, 'a barangay admin') into admin_name from profiles where id = auth.uid();

  if p_decision = 'accept' then
    update complaints
      set status = 'filed', reviewed_by = auth.uid(), reviewed_at = now()
      where id = c.id;

    insert into case_activity_log (complaint_id, entry_type, remarks, created_by)
    values (c.id, 'note',
      case when c.status = 'submitted'
        then 'Complaint accepted and filed by ' || admin_name || '.'
        else 'Complainant appeared in person and confirmed the complaint. Accepted and filed by ' || admin_name || '.'
      end, auth.uid());

    insert into complaint_notifications (complaint_id, user_id, title, type, message)
    values (c.id, c.user_id, 'Complaint Accepted', 'success',
      'Your complaint (Ref: ' || c.reference_number || ') was accepted and filed by the barangay. You will be notified when a summons is issued.');

  elsif p_decision = 'appearance' then
    if c.status <> 'submitted' then
      raise exception 'This complaint is already waiting for personal appearance.';
    end if;
    if p_reason is null or length(trim(p_reason)) = 0 then
      raise exception 'A reason is required.';
    end if;

    due := working_days_deadline((select appearance_days from barangay_settings where id = 1));
    due_text := to_char(due at time zone 'Asia/Manila', 'FMMonth FMDD, YYYY');

    update complaints
      set status = 'for_appearance', appearance_due = due, appearance_reason = trim(p_reason),
          reviewed_by = auth.uid(), reviewed_at = now()
      where id = c.id;

    insert into case_activity_log (complaint_id, entry_type, remarks, created_by)
    values (c.id, 'note', 'Personal appearance required by ' || admin_name || ' until ' || due_text || '. Reason: ' || trim(p_reason), auth.uid());

    insert into complaint_notifications (complaint_id, user_id, title, type, message)
    values (c.id, c.user_id, 'Please Visit the Barangay Hall', 'warning',
      'Your complaint (Ref: ' || c.reference_number || ') needs to be confirmed in person. Please visit the Barangay Hall by '
        || due_text || ', 5:00 PM and bring a valid ID. Reason: ' || trim(p_reason) || '.');

  elsif p_decision = 'decline' then
    if p_reason is null or length(trim(p_reason)) = 0 then
      raise exception 'A reason is required to decline a complaint.';
    end if;

    update complaints
      set status = 'declined', declined_reason = trim(p_reason), reviewed_by = auth.uid(), reviewed_at = now()
      where id = c.id;

    insert into case_activity_log (complaint_id, entry_type, remarks, created_by)
    values (c.id, 'note', 'Complaint declined by ' || admin_name || '. Reason: ' || trim(p_reason), auth.uid());

    insert into complaint_notifications (complaint_id, user_id, title, type, message)
    values (c.id, c.user_id, 'Complaint Not Accepted', 'danger',
      'Your complaint (Ref: ' || c.reference_number || ') was not accepted. Reason: ' || trim(p_reason)
        || '. You may visit the barangay hall or submit a new complaint.');

  else
    raise exception 'Invalid decision.';
  end if;
end;
$$;

revoke all on function public.review_complaint(bigint, text, text) from public;
grant execute on function public.review_complaint(bigint, text, text) to authenticated;


-- 6. Mark complaints whose confirmation deadline passed as "not confirmed" (kept on record)
create or replace function public.mark_unconfirmed_complaints()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
begin
  for c in
    update complaints
      set status = 'not_confirmed'
      where status = 'for_appearance' and appearance_due < now()
      returning id, user_id, reference_number
  loop
    insert into case_activity_log (complaint_id, entry_type, remarks)
    values (c.id, 'note', 'The complainant did not appear by the deadline. The complaint is kept on record as not confirmed.');

    insert into complaint_notifications (complaint_id, user_id, title, type, message)
    values (c.id, c.user_id, 'Complaint Not Confirmed', 'warning',
      'Your complaint (Ref: ' || c.reference_number || ') was not confirmed in person by the deadline. It is kept on record. You may still visit the Barangay Hall to continue it.');

    insert into complaint_notifications (complaint_id, user_id, title, type, message)
    select c.id, p.id, 'Complaint Not Confirmed', 'info',
      'Complaint ' || c.reference_number || ' was not confirmed in person by the deadline. It is kept on record as not confirmed.'
    from profiles p
    where p.role in ('admin', 'staff');
  end loop;
end;
$$;

revoke all on function public.mark_unconfirmed_complaints() from public;

select cron.unschedule(jobid) from cron.job where jobname = 'kp-unconfirmed-complaints';
select cron.schedule('kp-unconfirmed-complaints', '5 * * * *', $$select public.mark_unconfirmed_complaints();$$);


-- 7. Restrictions and the daily limit only apply to ONLINE filing
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
  if state in ('restricted', 'blocked') then
    raise exception 'Online filing is not available for your account. You can still file your complaint in person at the Barangay Hall.';
  end if;

  select count(*) into today_count
  from complaints
  where user_id = auth.uid()
    and (created_at at time zone 'Asia/Manila')::date = (now() at time zone 'Asia/Manila')::date;
  if today_count >= 3 then
    raise exception 'You can file up to 3 complaints online per day. You can still file in person at the Barangay Hall.';
  end if;

  return new;
end;
$$;


-- 8. Restriction notice: online filing only; the Barangay Hall stays open
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
      'You cannot file complaints online' || until_txt || '. Reason: ' || trim(p_reason)
        || '. You can still file a complaint in person at the Barangay Hall and view your existing cases.');
  elsif p_status = 'active' and target.account_status <> 'active' then
    insert into complaint_notifications (complaint_id, user_id, title, type, message)
    values (null, p_user, 'Account Restored', 'success', 'Your account has been restored. You can file complaints again.');
  end if;
end;
$$;
revoke all on function public.set_account_status(uuid, text, text, int) from public;
grant execute on function public.set_account_status(uuid, text, text, int) to authenticated;
