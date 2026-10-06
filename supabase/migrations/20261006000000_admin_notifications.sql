-- Summary notifications (e.g. "3 hearings today") aren't tied to one case
alter table complaint_notifications alter column complaint_id drop not null;


-- 1. INSTANT: notify every admin when a resident files a complaint
create or replace function public.notify_admins_new_complaint()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop trigger if exists on_complaint_filed_notify_admins on complaints;
create trigger on_complaint_filed_notify_admins
after insert on complaints
for each row execute function public.notify_admins_new_complaint();


-- 2. DAILY: one summary per admin of today's hearings
create or replace function public.send_admin_hearing_summary()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Manila')::date;
  hearing_count int;
  refs text;
begin
  select count(*), string_agg(reference_number, ', ' order by hearing_time)
  into hearing_count, refs
  from complaints
  where hearing_date = today
    and status in ('summoned', 'mediation', 'pangkat_hearing');

  if hearing_count = 0 then
    return;
  end if;

  insert into complaint_notifications (complaint_id, user_id, title, type, message)
  select
    null,
    p.id,
    '📅 Today''s Hearings',
    'info',
    'You have ' || hearing_count || ' hearing' || case when hearing_count > 1 then 's' else '' end
      || ' scheduled today: ' || refs || '.'
  from profiles p
  where p.role in ('admin', 'staff')
    and not exists (
      select 1 from complaint_notifications n
      where n.user_id = p.id
        and n.title = '📅 Today''s Hearings'
        and n.created_at > now() - interval '20 hours'
    );
end;
$$;


-- 3. DAILY: flag cases that are stalled or past KP deadlines (RA 7160, Sec. 410)
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
      coalesce(
        (select max(l.created_at) from case_activity_log l
         where l.complaint_id = c.id and l.entry_type = 'stage_change' and l.stage = 'summoned'),
        c.created_at
      ) as mediation_start,
      coalesce(
        (select max(l.created_at) from case_activity_log l
         where l.complaint_id = c.id and l.entry_type = 'stage_change' and l.stage = 'pangkat_formed'),
        c.created_at
      ) as pangkat_start
    from complaints c
    where c.status not in ('settled', 'cfa_issued', 'dismissed')
  ),
  alerts as (
    select id, '⏳ No Action Taken' as title, 'warning' as type,
      'Case ' || reference_number || ' has been in "Filed" for over 3 days with no summons issued.' as message
    from stage_start
    where status = 'filed' and created_at < now() - interval '3 days'

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


-- Run both daily checks at 8:00 AM Philippine time (00:00 UTC)
select cron.schedule(
  'admin-daily-alerts',
  '0 0 * * *',
  $$select public.send_admin_hearing_summary(); select public.send_admin_deadline_alerts();$$
);
