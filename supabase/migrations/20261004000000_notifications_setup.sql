-- Resident notifications: schema fixes, insert permissions, realtime, and hearing reminders

-- 1. Columns the app expects
alter table complaint_notifications
  add column if not exists title text,
  add column if not exists type text not null default 'info';

alter table complaint_notifications alter column is_read set default false;
update complaint_notifications set is_read = false where is_read is null;

-- 2. Allow inserts: residents for themselves, admins/staff for anyone
drop policy if exists "Insert notifications" on complaint_notifications;
create policy "Insert notifications"
on complaint_notifications for insert
with check (auth.uid() = user_id or is_admin_or_staff());

-- 3. Live updates for the bell badge and admin toasts
alter publication supabase_realtime add table complaint_notifications;

-- 4. Daily hearing reminders for residents (8:00 AM Philippine time)
create extension if not exists pg_cron;

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
      || coalesce(' at ' || c.hearing_time::text, '') || '. Please be prepared to attend.'
  from complaints c
  where c.hearing_date = (now() at time zone 'Asia/Manila')::date + 1
    and c.status in ('summoned', 'mediation', 'pangkat_hearing')
    and not exists (
      select 1 from complaint_notifications n
      where n.complaint_id = c.id
        and n.title = '⏰ Hearing Reminder'
        and n.created_at > now() - interval '20 hours'
    );
end;
$$;

select cron.schedule(
  'hearing-reminders-daily',
  '0 0 * * *',
  $$select public.send_hearing_reminders();$$
);
