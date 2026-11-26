-- New complaint alert for admins: complaints are reviewed online; personal appearance only when required.
-- Run this once in the Supabase SQL Editor.

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
      || coalesce(new.complainant_name, 'a resident') || '. Review it in New Complaints.'
  from profiles p
  where p.role in ('admin', 'staff');
  return new;
end;
$$;
