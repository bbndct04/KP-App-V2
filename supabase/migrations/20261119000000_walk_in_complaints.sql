-- ============================================================================
-- Walk-in complaints: an official encodes a complaint for a resident who came
-- to the barangay hall. It goes straight to Active Cases ('filed').
-- Run this whole file once in the Supabase SQL Editor.
-- ============================================================================

-- 1. New columns. A walk-in may have no resident account (user_id null).
alter table complaints
  add column if not exists source text not null default 'online',
  add column if not exists encoded_by uuid references auth.users(id),
  add column if not exists encoded_by_name text;

alter table complaints drop constraint if exists complaints_source_check;
alter table complaints add constraint complaints_source_check check (source in ('online', 'walk_in'));

alter table complaints alter column user_id drop not null;

alter table complaints drop constraint if exists complaints_user_required;
alter table complaints add constraint complaints_user_required check (user_id is not null or source = 'walk_in');


-- 2. Residents can never mark their own complaint as a walk-in.
create or replace function public.force_new_complaint_status()
returns trigger
language plpgsql
as $$
begin
  new.status := 'submitted';
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.declined_reason := null;
  if not is_admin_or_staff() then
    new.source := 'online';
    new.encoded_by := null;
    new.encoded_by_name := null;
  end if;
  return new;
end;
$$;


-- 3. Notifications for a complaint without an account are skipped, everywhere.
create or replace function public.skip_notification_without_user()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is null then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists skip_notification_without_user on complaint_notifications;
create trigger skip_notification_without_user
before insert on complaint_notifications
for each row execute function public.skip_notification_without_user();


-- 4. "Submitted, waiting for review" and "new complaint" alerts are for online complaints only.
create or replace function public.notify_resident_complaint_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.source = 'walk_in' then
    return new;
  end if;
  insert into complaint_notifications (complaint_id, user_id, title, type, message)
  values (new.id, new.user_id, 'Complaint Submitted', 'info',
    'Your complaint (Ref: ' || new.reference_number || ') was submitted and is waiting for the barangay to review it. You''ll be notified once it is accepted.');
  return new;
end;
$$;

create or replace function public.notify_admins_new_complaint()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.source = 'walk_in' then
    return new;
  end if;
  insert into complaint_notifications (complaint_id, user_id, title, type, message)
  select
    new.id,
    p.id,
    '🆕 New Complaint Filed',
    'info',
    'Case ' || new.reference_number || ' (' || coalesce(new.category, 'Uncategorized') || ') was filed by '
      || coalesce(new.complainant_name, 'a resident') || '. The complainant should appear at the barangay hall within 24 hours.'
  from profiles p
  where p.role in ('admin', 'staff');
  return new;
end;
$$;


-- 5. File a walk-in complaint in one safe step (admins only).
create or replace function public.file_walk_in_complaint(
  p_resident uuid,
  p_category text,
  p_description text,
  p_complainant_name text,
  p_complainant_contact text,
  p_complainant_address text,
  p_respondent_name text,
  p_respondent_address text,
  p_incident_date date,
  p_incident_time time,
  p_location text,
  p_relief_requested text,
  p_attachment_url text default null
)
returns table (id bigint, reference_number text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  admin_name text;
  c complaints%rowtype;
begin
  if not is_admin_or_staff() then
    raise exception 'Only barangay officials can file walk-in complaints.';
  end if;
  if p_resident is not null and not exists (select 1 from profiles where profiles.id = p_resident and role = 'resident') then
    raise exception 'The selected resident account was not found.';
  end if;
  if coalesce(trim(p_complainant_name), '') = '' or coalesce(trim(p_respondent_name), '') = '' or coalesce(trim(p_description), '') = '' then
    raise exception 'Complainant, respondent and statement of facts are required.';
  end if;

  select coalesce(full_name, 'a barangay official') into admin_name from profiles where profiles.id = auth.uid();

  insert into complaints (
    user_id, source, encoded_by, encoded_by_name, category, description,
    complainant_name, complainant_contact, complainant_address,
    respondent_name, respondent_address, incident_date, incident_time,
    location, relief_requested, attachment_url
  ) values (
    p_resident, 'walk_in', auth.uid(), admin_name, trim(p_category), trim(p_description),
    trim(p_complainant_name), nullif(trim(p_complainant_contact), ''), trim(p_complainant_address),
    trim(p_respondent_name), trim(p_respondent_address), p_incident_date, p_incident_time,
    trim(p_location), trim(p_relief_requested), p_attachment_url
  )
  returning * into c;

  update complaints
    set status = 'filed', reviewed_by = auth.uid(), reviewed_at = now()
    where complaints.id = c.id;

  insert into case_activity_log (complaint_id, entry_type, remarks, created_by)
  values (c.id, 'note', 'Walk-in complaint received at the barangay hall and filed by ' || admin_name || '.', auth.uid());

  insert into complaint_notifications (complaint_id, user_id, title, type, message)
  values (c.id, c.user_id, 'Complaint Filed', 'success',
    'Your complaint (Ref: ' || c.reference_number || ') was filed at the barangay hall. You will be notified when a summons is issued.');

  return query select c.id, c.reference_number;
end;
$$;

revoke all on function public.file_walk_in_complaint(uuid, text, text, text, text, text, text, text, date, time, text, text, text) from public;
grant execute on function public.file_walk_in_complaint(uuid, text, text, text, text, text, text, text, date, time, text, text, text) to authenticated;
