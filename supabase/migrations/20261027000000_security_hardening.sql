-- ============================================================================
-- Security hardening + atomic case stage changes.
-- Run once in the Supabase SQL Editor BEFORE deploying the matching app code.
-- Safe to re-run.
-- ============================================================================

-- 1. Roles can only be changed by admins/staff (or from the SQL Editor / service role).
--    New sign-ups are always residents, whatever metadata the client sends.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.role := 'resident';
    return new;
  end if;

  if new.role is distinct from old.role then
    if auth.uid() is not null and not is_admin_or_staff() then
      raise exception 'You are not allowed to change account roles.';
    end if;
    if auth.uid() = old.id then
      raise exception 'You cannot change your own role.';
    end if;
  end if;

  if new.official_title is distinct from old.official_title
     and auth.uid() is not null and not is_admin_or_staff() then
    new.official_title := old.official_title;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_role on profiles;
create trigger guard_profile_role
before insert or update on profiles
for each row execute function public.guard_profile_role();


-- 2. Residents can never edit a complaint after filing. Admins can, but only along
--    valid Katarungang Pambarangay stage transitions.
create or replace function public.guard_complaint_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed text[];
begin
  if auth.uid() is not null and not is_admin_or_staff() then
    raise exception 'Complaints can only be updated by the barangay.';
  end if;

  if new.status is distinct from old.status then
    allowed := case old.status
      when 'submitted'       then array['filed', 'declined']
      when 'filed'           then array['summoned', 'dismissed']
      when 'summoned'        then array['mediation', 'dismissed']
      when 'mediation'       then array['pangkat_formed', 'settled', 'dismissed']
      when 'pangkat_formed'  then array['pangkat_hearing']
      when 'pangkat_hearing' then array['settled', 'cfa_issued']
      else array[]::text[]
    end;

    if auth.uid() is not null and not (new.status = any(allowed)) then
      raise exception 'A case cannot move from "%" to "%".', old.status, new.status;
    end if;
  end if;

  new.user_id := old.user_id;
  new.reference_number := old.reference_number;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists guard_complaint_update on complaints;
create trigger guard_complaint_update
before update on complaints
for each row execute function public.guard_complaint_update();


-- 3. Advance a case in one transaction: status + activity log + resident notification.
create or replace function public.advance_case(
  p_complaint_id bigint,
  p_next_stage text,
  p_remarks text default null,
  p_hearing_date date default null,
  p_hearing_time time default null,
  p_settlement_terms text default null,
  p_cfa_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c complaints%rowtype;
  n_title text;
  n_type text;
  n_msg text;
  labels jsonb := '{
    "summoned": "Summoned", "mediation": "Mediation", "pangkat_formed": "Pangkat Formed",
    "pangkat_hearing": "Pangkat Hearing", "settled": "Settled", "cfa_issued": "CFA Issued",
    "dismissed": "Dismissed"
  }';
begin
  if not is_admin_or_staff() then
    raise exception 'Only barangay admins can update cases.';
  end if;

  select * into c from complaints where id = p_complaint_id for update;
  if not found then
    raise exception 'Case not found.';
  end if;

  if p_next_stage = 'settled' and coalesce(trim(p_settlement_terms), '') = '' then
    raise exception 'Settlement terms are required to settle a case.';
  end if;
  if p_next_stage = 'cfa_issued' and coalesce(trim(p_cfa_reason), '') = '' then
    raise exception 'A reason is required to issue a Certificate to File Action.';
  end if;

  update complaints set
    status = p_next_stage,
    hearing_date = coalesce(p_hearing_date, hearing_date),
    hearing_time = coalesce(p_hearing_time, hearing_time),
    settlement_terms = case when p_next_stage = 'settled' then trim(p_settlement_terms) else settlement_terms end,
    cfa_reason = case when p_next_stage = 'cfa_issued' then trim(p_cfa_reason) else cfa_reason end,
    cfa_issued_at = case when p_next_stage = 'cfa_issued' then now() else cfa_issued_at end
  where id = c.id;

  insert into case_activity_log (complaint_id, entry_type, stage, remarks, created_by)
  values (
    c.id, 'stage_change', p_next_stage,
    coalesce(nullif(trim(p_remarks), ''), 'Stage changed to ' || coalesce(labels ->> p_next_stage, p_next_stage)),
    auth.uid()
  );

  select t.title, t.type, t.msg into n_title, n_type, n_msg
  from (values
    ('summoned', 'Summons Issued', 'info', 'The respondent has been summoned. A hearing will follow.'),
    ('mediation', 'Mediation Stage', 'info', 'Your case has moved to mediation before the Punong Barangay.'),
    ('pangkat_formed', 'Pangkat Formed', 'info', 'A Pangkat has been formed to conciliate your case.'),
    ('pangkat_hearing', 'Pangkat Hearing', 'info', 'A Pangkat hearing has been scheduled for your case.'),
    ('settled', 'Case Settled', 'success', 'Your case has been settled.'),
    ('cfa_issued', 'Certificate to File Action Issued', 'warning', 'A Certificate to File Action has been issued for your case.'),
    ('dismissed', 'Case Dismissed', 'danger', 'Your case has been dismissed.')
  ) as t(stage, title, type, msg)
  where t.stage = p_next_stage;

  if n_title is not null then
    insert into complaint_notifications (complaint_id, user_id, title, type, message)
    values (c.id, c.user_id, n_title, n_type,
      n_msg
        || case when p_hearing_date is not null
             then ' Hearing: ' || to_char(p_hearing_date, 'FMMonth FMDD, YYYY')
                  || coalesce(' at ' || to_char(p_hearing_time, 'FMHH12:MI AM'), '') || '.'
             else '' end
        || ' (Ref: ' || c.reference_number || ')');
  end if;
end;
$$;

revoke all on function public.advance_case(bigint, text, text, date, time, text, text) from public;
grant execute on function public.advance_case(bigint, text, text, date, time, text, text) to authenticated;


-- 4. "Complaint Submitted" notification is created by the database, not the browser,
--    so it always matches the real reference number and can't be skipped.
create or replace function public.notify_resident_complaint_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into complaint_notifications (complaint_id, user_id, title, type, message)
  values (new.id, new.user_id, 'Complaint Submitted', 'info',
    'Your complaint (Ref: ' || new.reference_number || ') was submitted and is waiting for the barangay to review it. You''ll be notified once it is accepted.');
  return new;
end;
$$;

drop trigger if exists on_complaint_submitted_notify_resident on complaints;
create trigger on_complaint_submitted_notify_resident
after insert on complaints
for each row execute function public.notify_resident_complaint_submitted();


-- 5. Residents may no longer write notifications at all (only mark their own as read).
drop policy if exists "Insert notifications" on complaint_notifications;
create policy "Insert notifications"
on complaint_notifications for insert
with check (is_admin_or_staff());


-- 6. Evidence uploads: residents may only upload into their own folder.
drop policy if exists "Users upload own evidence" on storage.objects;
create policy "Users upload own evidence" on storage.objects
  for insert with check (
    bucket_id = 'complaint-attachments' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users read own evidence" on storage.objects;
create policy "Users read own evidence" on storage.objects
  for select using (
    bucket_id = 'complaint-attachments' and (storage.foldername(name))[1] = auth.uid()::text
  );


-- 7. Indexes for the queries the app runs on every page load.
create index if not exists complaints_user_id_idx on complaints (user_id);
create index if not exists complaints_status_idx on complaints (status);
create index if not exists complaints_hearing_date_idx on complaints (hearing_date);
create index if not exists complaint_notifications_user_unread_idx on complaint_notifications (user_id, is_read);
create index if not exists case_activity_log_complaint_idx on case_activity_log (complaint_id, created_at);
