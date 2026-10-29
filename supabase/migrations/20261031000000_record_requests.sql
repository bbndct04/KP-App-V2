-- ============================================================================
-- Case record requests: every printed case record or certification is logged
-- with the requester, their relation to the case and the purpose.
-- Control numbers: REC-YYYY-MM-NNN (case record) and CERT-YYYY-MM-NNN.
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================

create table if not exists record_requests (
  id bigint generated always as identity primary key,
  control_no text not null unique,
  complaint_id bigint not null references complaints(id) on delete cascade,
  document text not null check (document in ('record', 'certification')),
  requester_name text not null,
  requester_relation text not null,
  purpose text not null,
  issued_by uuid references auth.users(id),
  issued_by_name text,
  created_at timestamptz not null default now()
);

create index if not exists record_requests_complaint_idx on record_requests (complaint_id, created_at desc);
create index if not exists record_requests_created_idx on record_requests (created_at desc);

alter table record_requests enable row level security;
revoke all on record_requests from anon, authenticated;
grant select on record_requests to authenticated;

drop policy if exists "Admins read record requests" on record_requests;
create policy "Admins read record requests" on record_requests
  for select to authenticated using (is_admin_or_staff());

create or replace function public.log_record_request(
  p_complaint bigint,
  p_document text,
  p_name text,
  p_relation text,
  p_purpose text
)
returns record_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period text := to_char(now() at time zone 'Asia/Manila', 'YYYY-MM');
  v_prefix text;
  n int;
  v_actor text;
  row record_requests;
begin
  if not is_admin_or_staff() then
    raise exception 'Only barangay officials can release case records.';
  end if;
  if p_document not in ('record', 'certification') then
    raise exception 'Invalid document type.';
  end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_relation), '') = '' or coalesce(trim(p_purpose), '') = '' then
    raise exception 'Requester name, relation and purpose are required.';
  end if;
  if not exists (select 1 from complaints where id = p_complaint and status <> 'submitted') then
    raise exception 'Case not found or not yet reviewed.';
  end if;

  v_prefix := case p_document when 'record' then 'REC' else 'CERT' end;

  insert into reference_counters (period, last_value)
  values (v_prefix || '-' || v_period, 1)
  on conflict on constraint reference_counters_pkey
  do update set last_value = reference_counters.last_value + 1
  returning last_value into n;

  select full_name into v_actor from profiles where id = auth.uid();

  insert into record_requests (control_no, complaint_id, document, requester_name, requester_relation, purpose, issued_by, issued_by_name)
  values (
    v_prefix || '-' || v_period || '-' || lpad(n::text, 3, '0'),
    p_complaint, p_document, trim(p_name), trim(p_relation), trim(p_purpose), auth.uid(), v_actor
  )
  returning * into row;

  insert into case_activity_log (complaint_id, entry_type, remarks, created_by)
  values (
    p_complaint, 'note',
    case p_document when 'record' then 'Case record' else 'Certification' end
      || ' (' || row.control_no || ') released to ' || row.requester_name
      || ', ' || row.requester_relation || '. Purpose: ' || row.purpose,
    auth.uid()
  );

  return row;
end;
$$;

revoke all on function public.log_record_request(bigint, text, text, text, text) from public;
grant execute on function public.log_record_request(bigint, text, text, text, text) to authenticated;
