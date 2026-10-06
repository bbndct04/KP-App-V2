-- ============================================================================
-- Complaint intake: residents submit -> admins review -> accept (becomes a case)
-- or decline (with a reason). Run this whole file once in the Supabase SQL Editor
-- BEFORE deploying the new app code.
-- ============================================================================

-- 1. New columns on complaints
alter table complaints
  add column if not exists declined_reason text,
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz;

-- 2. Two new statuses: 'submitted' (awaiting review) and 'declined'
alter table complaints drop constraint if exists complaints_status_check;
alter table complaints add constraint complaints_status_check check (status in (
  'submitted', 'declined',
  'filed', 'summoned', 'mediation', 'pangkat_formed', 'pangkat_hearing',
  'settled', 'cfa_issued', 'dismissed'
));
alter table complaints alter column status set default 'submitted';

-- 3. Every new complaint starts as 'submitted', no matter what the client sends.
--    (Stops a resident from skipping review by inserting status = 'filed' directly.)
create or replace function public.force_new_complaint_status()
returns trigger
language plpgsql
as $$
begin
  new.status := 'submitted';
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.declined_reason := null;
  return new;
end;
$$;

drop trigger if exists force_new_complaint_status on complaints;
create trigger force_new_complaint_status
before insert on complaints
for each row execute function public.force_new_complaint_status();

-- 4. Accept or decline a complaint in one safe step (status + log + resident notification)
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
begin
  if not is_admin_or_staff() then
    raise exception 'Only barangay admins can review complaints.';
  end if;

  select * into c from complaints where id = p_complaint_id for update;
  if not found then
    raise exception 'Complaint not found.';
  end if;
  if c.status <> 'submitted' then
    raise exception 'This complaint has already been reviewed.';
  end if;

  select coalesce(full_name, 'a barangay admin') into admin_name from profiles where id = auth.uid();

  if p_decision = 'accept' then
    update complaints
      set status = 'filed', reviewed_by = auth.uid(), reviewed_at = now()
      where id = c.id;

    insert into case_activity_log (complaint_id, entry_type, remarks, created_by)
    values (c.id, 'note', 'Complaint accepted and filed by ' || admin_name || '.', auth.uid());

    insert into complaint_notifications (complaint_id, user_id, title, type, message)
    values (c.id, c.user_id, 'Complaint Accepted', 'success',
      'Your complaint (Ref: ' || c.reference_number || ') was accepted and filed by the barangay. You will be notified when a summons is issued.');

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

-- 5. "Identity verified" record: an admin checks a resident's ID once, not on every complaint
create table if not exists identity_verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  verified_by uuid references auth.users(id),
  verified_by_name text,
  verified_at timestamptz not null default now()
);

alter table identity_verifications enable row level security;

drop policy if exists "View identity verification" on identity_verifications;
create policy "View identity verification" on identity_verifications
  for select using (auth.uid() = user_id or is_admin_or_staff());

drop policy if exists "Admins record identity verification" on identity_verifications;
create policy "Admins record identity verification" on identity_verifications
  for insert with check (is_admin_or_staff() and verified_by = auth.uid());

drop policy if exists "Admins remove identity verification" on identity_verifications;
create policy "Admins remove identity verification" on identity_verifications
  for delete using (is_admin_or_staff());

-- 6. Private ID / selfie / evidence files, readable only by admins (and owners for ID + selfie)
update storage.buckets set public = false
where id in ('id-uploads', 'face-uploads', 'complaint-attachments');

drop policy if exists "Admins read identity and evidence files" on storage.objects;
create policy "Admins read identity and evidence files" on storage.objects
  for select using (
    bucket_id in ('id-uploads', 'face-uploads', 'complaint-attachments') and is_admin_or_staff()
  );

drop policy if exists "Users upload own identity files" on storage.objects;
create policy "Users upload own identity files" on storage.objects
  for insert with check (
    bucket_id in ('id-uploads', 'face-uploads') and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own identity files" on storage.objects;
create policy "Users update own identity files" on storage.objects
  for update using (
    bucket_id in ('id-uploads', 'face-uploads') and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users read own identity files" on storage.objects;
create policy "Users read own identity files" on storage.objects
  for select using (
    bucket_id in ('id-uploads', 'face-uploads') and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 7. Daily admin alerts, updated for the new "submitted" stage
create or replace function public.send_admin_deadline_alerts()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with stage_start as (
    select
      c.id,
      c.reference_number,
      c.status,
      c.created_at,
      coalesce(c.reviewed_at, c.created_at) as filed_start,
      coalesce(
        (select max(l.created_at) from case_activity_log l
         where l.complaint_id = c.id and l.entry_type = 'stage_change' and l.stage = 'summoned'),
        coalesce(c.reviewed_at, c.created_at)
      ) as mediation_start,
      coalesce(
        (select max(l.created_at) from case_activity_log l
         where l.complaint_id = c.id and l.entry_type = 'stage_change' and l.stage = 'pangkat_formed'),
        coalesce(c.reviewed_at, c.created_at)
      ) as pangkat_start
    from complaints c
    where c.status not in ('settled', 'cfa_issued', 'dismissed', 'declined')
  ),
  alerts as (
    select id, '⏳ Awaiting Review' as title, 'warning' as type,
      'Complaint ' || reference_number || ' has been waiting for review for over a day. The respondent should be summoned by the next working day after a complaint is received.' as message
    from stage_start
    where status = 'submitted' and created_at < now() - interval '1 day'

    union all
    select id, '⏳ No Action Taken', 'warning',
      'Case ' || reference_number || ' has been in "Filed" for over 3 days with no summons issued.'
    from stage_start
    where status = 'filed' and filed_start < now() - interval '3 days'

    union all
    select id, '⚠ Mediation Deadline Passed', 'warning',
      'Case ' || reference_number || ' has exceeded the 15-day mediation period. Consider forming a Pangkat.'
    from stage_start
    where status in ('summoned', 'mediation') and mediation_start < now() - interval '15 days'

    union all
    select id, '⚠ Pangkat Extension Needed', 'warning',
      'Case ' || reference_number || ' has reached the 15-day Pangkat period. An extension of up to 15 days may be granted.'
    from stage_start
    where status in ('pangkat_formed', 'pangkat_hearing')
      and pangkat_start < now() - interval '15 days'
      and pangkat_start >= now() - interval '30 days'

    union all
    select id, '🚨 Pangkat Deadline Exceeded', 'danger',
      'Case ' || reference_number || ' has exceeded the maximum 30-day Pangkat period.'
    from stage_start
    where status in ('pangkat_formed', 'pangkat_hearing') and pangkat_start < now() - interval '30 days'
  )
  insert into complaint_notifications (complaint_id, user_id, title, type, message)
  select a.id, p.id, a.title, a.type, a.message
  from alerts a
  cross join profiles p
  where p.role in ('admin', 'staff')
    and not exists (
      select 1 from complaint_notifications n
      where n.user_id = p.id
        and n.complaint_id = a.id
        and n.title = a.title
        and n.created_at > now() - interval '3 days'
    );
end;
$$;
