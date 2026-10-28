-- ============================================================================
-- Reference numbers with the month: KP-YYYY-MM-NNN (e.g. KP-2026-10-003).
-- The counter restarts at 001 every month. Existing reference numbers are kept.
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================

create table if not exists reference_counters (
  period text primary key,
  last_value int not null default 0
);

alter table reference_counters enable row level security;

create or replace function public.assign_reference_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period text := to_char(now() at time zone 'Asia/Manila', 'YYYY-MM');
  n int;
begin
  insert into reference_counters (period, last_value)
  values (v_period, 1)
  on conflict on constraint reference_counters_pkey
  do update set last_value = reference_counters.last_value + 1
  returning last_value into n;

  new.reference_number := 'KP-' || v_period || '-' || case when n < 1000 then lpad(n::text, 3, '0') else n::text end;
  return new;
end;
$$;

-- "zz_" so it runs after any older BEFORE INSERT trigger and has the final say.
drop trigger if exists zz_assign_reference_number on complaints;
create trigger zz_assign_reference_number
before insert on complaints
for each row execute function public.assign_reference_number();

-- Start this month's counter after any references already issued in the new format.
insert into reference_counters (period, last_value)
select substring(reference_number from 4 for 7), max(substring(reference_number from 12)::int)
from complaints
where reference_number ~ '^KP-\d{4}-\d{2}-\d+$'
group by 1
on conflict (period) do update set last_value = greatest(reference_counters.last_value, excluded.last_value);
