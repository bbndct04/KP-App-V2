-- ============================================================================
-- Case stages v2 (based on the DILG Katarungang Pambarangay Handbook)
--  * New stages: arbitration, execution, closed
--  * Settlement is final only after the 10-day repudiation period
--  * Outcome reasons for CFA and dismissal
-- Run once in the Supabase SQL Editor BEFORE deploying the matching app code.
-- Safe to re-run.
-- ============================================================================

-- 1. New columns
alter table complaints
  add column if not exists settled_at timestamptz,
  add column if not exists settlement_type text,
  add column if not exists cfa_type text,
  add column if not exists dismissal_reason text,
  add column if not exists closed_at timestamptz;

alter table complaints drop constraint if exists complaints_settlement_type_check;
alter table complaints add constraint complaints_settlement_type_check
  check (settlement_type is null or settlement_type in ('amicable', 'arbitration_award'));

alter table complaints drop constraint if exists complaints_cfa_type_check;
alter table complaints add constraint complaints_cfa_type_check
  check (cfa_type is null or cfa_type in ('repudiated', 'no_settlement', 'respondent_refused'));

alter table complaints drop constraint if exists complaints_dismissal_reason_check;
alter table complaints add constraint complaints_dismissal_reason_check
  check (dismissal_reason is null or dismissal_reason in ('complainant_failed_to_appear', 'withdrawn', 'not_covered', 'other'));

-- 2. Statuses
alter table complaints drop constraint if exists complaints_status_check;
alter table complaints add constraint complaints_status_check check (status in (
  'submitted', 'declined',
  'filed', 'summoned', 'mediation', 'pangkat_formed', 'pangkat_hearing', 'arbitration',
  'settled', 'execution', 'closed', 'cfa_issued', 'dismissed'
));

-- 3. Backfill the settlement date of cases that were already settled
update complaints c
set settled_at = coalesce(
      (select max(l.created_at) from case_activity_log l
       where l.complaint_id = c.id and l.entry_type = 'stage_change' and l.stage = 'settled'),
      c.reviewed_at, c.created_at),
    settlement_type = coalesce(c.settlement_type, 'amicable')
where c.status = 'settled' and c.settled_at is null;


-- 4. Allowed stage changes (enforced for everyone except the SQL Editor / service role)
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
      when 'submitted'       then array['filed', 'declined']
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


-- 5. Advance a case: status + details + log + resident notification, in one transaction
drop function if exists public.advance_case(bigint, text, text, date, time, text, text);

create or replace function public.advance_case(
  p_complaint_id bigint,
  p_next_stage text,
  p_remarks text default null,
  p_hearing_date date default null,
  p_hearing_time time default null,
  p_settlement_terms text default null,
  p_cfa_reason text default null,
  p_cfa_type text default null,
  p_dismissal_reason text default null
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
  final_date text;
  labels jsonb := '{
    "summoned": "Summoned", "mediation": "Mediation", "pangkat_formed": "Pangkat Formed",
    "pangkat_hearing": "Conciliation", "arbitration": "Arbitration", "settled": "Settled",
    "execution": "Execution", "closed": "Closed", "cfa_issued": "CFA Issued", "dismissed": "Dismissed"
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
    raise exception 'Enter the terms of the settlement or the arbitration award.';
  end if;
  if p_next_stage = 'cfa_issued' and p_cfa_type is null then
    raise exception 'Choose the reason for the Certificate to File Action.';
  end if;
  if p_next_stage = 'cfa_issued' and p_cfa_type = 'repudiated' and coalesce(trim(p_cfa_reason), '') = '' then
    raise exception 'Enter who repudiated and on what ground.';
  end if;
  if p_next_stage = 'dismissed' and p_dismissal_reason is null then
    raise exception 'Choose the reason for dismissing the case.';
  end if;

  update complaints set
    status = p_next_stage,
    hearing_date = coalesce(p_hearing_date, hearing_date),
    hearing_time = coalesce(p_hearing_time, hearing_time),
    settlement_terms = case when p_next_stage = 'settled' then trim(p_settlement_terms) else settlement_terms end,
    settlement_type = case when p_next_stage = 'settled'
                           then case when c.status = 'arbitration' then 'arbitration_award' else 'amicable' end
                           else settlement_type end,
    settled_at = case when p_next_stage = 'settled' then now() else settled_at end,
    cfa_type = case when p_next_stage = 'cfa_issued' then p_cfa_type else cfa_type end,
    cfa_reason = case when p_next_stage = 'cfa_issued' then nullif(trim(coalesce(p_cfa_reason, '')), '') else cfa_reason end,
    cfa_issued_at = case when p_next_stage = 'cfa_issued' then now() else cfa_issued_at end,
    dismissal_reason = case when p_next_stage = 'dismissed' then p_dismissal_reason else dismissal_reason end,
    closed_at = case when p_next_stage in ('closed', 'cfa_issued', 'dismissed') then now() else closed_at end
  where id = c.id;

  insert into case_activity_log (complaint_id, entry_type, stage, remarks, created_by)
  values (
    c.id, 'stage_change', p_next_stage,
    coalesce(nullif(trim(p_remarks), ''), 'Stage changed to ' || coalesce(labels ->> p_next_stage, p_next_stage)),
    auth.uid()
  );

  final_date := to_char((now() + interval '10 days') at time zone 'Asia/Manila', 'FMMonth FMDD, YYYY');

  select t.title, t.type, t.msg into n_title, n_type, n_msg
  from (values
    ('summoned', 'Summons Issued', 'info', 'The respondent has been summoned. A hearing will follow.'),
    ('mediation', 'Mediation Stage', 'info', 'Your case has moved to mediation before the Punong Barangay.'),
    ('pangkat_formed', 'Pangkat Formed', 'info', 'A Pangkat ng Tagapagkasundo will be formed to conciliate your case.'),
    ('pangkat_hearing', 'Conciliation', 'info', 'The Pangkat is now hearing your case to help both sides reach a settlement.'),
    ('arbitration', 'Arbitration', 'info', 'Both parties agreed to arbitration. The arbitrator will decide the dispute after hearing both sides.'),
    ('settled', 'Case Settled', 'success', 'A settlement was reached. It becomes final on ' || final_date || ' unless repudiated within 10 days.'),
    ('execution', 'Execution', 'warning', 'The settlement was not complied with. The barangay will enforce it through execution.'),
    ('closed', 'Case Closed', 'success', 'The settlement has been complied with. Your case is now closed.'),
    ('cfa_issued', 'Certificate to File Action Issued', 'warning', 'A Certificate to File Action has been issued. You may now bring the case to court or the proper government office.'),
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

revoke all on function public.advance_case(bigint, text, text, date, time, text, text, text, text) from public;
grant execute on function public.advance_case(bigint, text, text, date, time, text, text, text, text) to authenticated;


-- 6. Hearing reminders also cover arbitration hearings
create or replace function public.send_hearing_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into complaint_notifications (complaint_id, user_id, title, type, message)
  select
    c.id,
    c.user_id,
    '⏰ Hearing Reminder',
    'warning',
    'Your hearing for case ' || c.reference_number || ' is scheduled for tomorrow'
      || coalesce(' at ' || to_char(c.hearing_time, 'FMHH12:MI AM'), '') || '. Please be prepared to attend.'
  from complaints c
  where c.hearing_date = (now() at time zone 'Asia/Manila')::date + 1
    and c.status in ('summoned', 'mediation', 'pangkat_formed', 'pangkat_hearing', 'arbitration')
    and not exists (
      select 1 from complaint_notifications n
      where n.complaint_id = c.id
        and n.title = '⏰ Hearing Reminder'
        and n.created_at > now() - interval '20 hours'
    );
end;
$$;


-- 7. Daily admin alerts, including repudiation, arbitration and execution deadlines
create or replace function public.send_admin_deadline_alerts()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with stage_start as (
    select
      c.id, c.reference_number, c.status, c.created_at, c.settled_at,
      coalesce(c.reviewed_at, c.created_at) as filed_start,
      coalesce(
        (select max(l.created_at) from case_activity_log l
         where l.complaint_id = c.id and l.entry_type = 'stage_change' and l.stage = 'summoned'),
        coalesce(c.reviewed_at, c.created_at)) as mediation_start,
      coalesce(
        (select max(l.created_at) from case_activity_log l
         where l.complaint_id = c.id and l.entry_type = 'stage_change' and l.stage = 'pangkat_formed'),
        coalesce(c.reviewed_at, c.created_at)) as pangkat_start,
      coalesce(
        (select max(l.created_at) from case_activity_log l
         where l.complaint_id = c.id and l.entry_type = 'stage_change' and l.stage = 'arbitration'),
        coalesce(c.reviewed_at, c.created_at)) as arbitration_start
    from complaints c
    where c.status not in ('closed', 'cfa_issued', 'dismissed', 'declined')
  ),
  alerts as (
    select id, '⏳ Awaiting Review' as title, 'warning' as type,
      'Complaint ' || reference_number || ' has been waiting for review for over a day.' as message
    from stage_start where status = 'submitted' and created_at < now() - interval '1 day'

    union all
    select id, '⏳ No Action Taken', 'warning',
      'Case ' || reference_number || ' has been in "Filed" for over 3 days with no summons issued.'
    from stage_start where status = 'filed' and filed_start < now() - interval '3 days'

    union all
    select id, '⚠ Mediation Deadline Passed', 'warning',
      'Case ' || reference_number || ' has exceeded the 15-day mediation period. Consider forming a Pangkat.'
    from stage_start where status in ('summoned', 'mediation') and mediation_start < now() - interval '15 days'

    union all
    select id, '⚠ Pangkat Extension Needed', 'warning',
      'Case ' || reference_number || ' has reached the 15-day Pangkat period. An extension of up to 15 days may be granted.'
    from stage_start
    where status in ('pangkat_formed', 'pangkat_hearing')
      and pangkat_start < now() - interval '15 days' and pangkat_start >= now() - interval '30 days'

    union all
    select id, '🚨 Pangkat Deadline Exceeded', 'danger',
      'Case ' || reference_number || ' has exceeded the maximum 30-day Pangkat period.'
    from stage_start where status in ('pangkat_formed', 'pangkat_hearing') and pangkat_start < now() - interval '30 days'

    union all
    select id, '⚠ Arbitration Award Due', 'warning',
      'Case ' || reference_number || ' has been in arbitration for over 15 days. The award should be issued.'
    from stage_start where status = 'arbitration' and arbitration_start < now() - interval '15 days'

    union all
    select id, '⚖ Settlement Now Final', 'info',
      'The 10-day repudiation period for case ' || reference_number || ' has ended. Record whether the settlement was complied with.'
    from stage_start where status = 'settled' and settled_at < now() - interval '10 days'

    union all
    select id, '⚠ Execution Deadline Near', 'warning',
      'Case ' || reference_number || ' must be executed within 6 months of the settlement. Less than 30 days remain.'
    from stage_start
    where status = 'execution' and settled_at < now() - interval '150 days' and settled_at >= now() - interval '6 months'

    union all
    select id, '🚨 Execution Period Lapsed', 'danger',
      'The 6-month execution period for case ' || reference_number || ' has passed. The settlement can now only be enforced in court.'
    from stage_start where status = 'execution' and settled_at < now() - interval '6 months'
  )
  insert into complaint_notifications (complaint_id, user_id, title, type, message)
  select a.id, p.id, a.title, a.type, a.message
  from alerts a
  cross join profiles p
  where p.role in ('admin', 'staff')
    and not exists (
      select 1 from complaint_notifications n
      where n.user_id = p.id and n.complaint_id = a.id and n.title = a.title
        and n.created_at > now() - interval '3 days'
    );
end;
$$;
