-- ============================================================================
-- Official forms: barangay settings + saved, issuable form documents.
-- Run this whole file once in the Supabase SQL Editor BEFORE deploying the app.
-- ============================================================================

-- 1. Barangay settings (one row): fills the header and signature lines of every form
create table if not exists barangay_settings (
  id int primary key default 1 check (id = 1),
  province text not null default '',
  locality_type text not null default 'City' check (locality_type in ('City', 'Municipality')),
  locality text not null default '',
  barangay text not null default '',
  punong_barangay text not null default '',
  secretary text not null default '',
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

alter table barangay_settings enable row level security;

drop policy if exists "Signed-in users read barangay settings" on barangay_settings;
create policy "Signed-in users read barangay settings" on barangay_settings
  for select to authenticated using (true);

drop policy if exists "Admins add barangay settings" on barangay_settings;
create policy "Admins add barangay settings" on barangay_settings
  for insert with check (is_admin_or_staff());

drop policy if exists "Admins update barangay settings" on barangay_settings;
create policy "Admins update barangay settings" on barangay_settings
  for update using (is_admin_or_staff()) with check (is_admin_or_staff());

insert into barangay_settings (id, province, locality_type, locality, barangay)
values (1, 'Zambales', 'City', 'Olongapo', 'New Kababae')
on conflict (id) do nothing;

-- 2. Saved forms: a draft can be edited; an issued form is locked; a void form is kept for the record
create table if not exists case_documents (
  id bigint generated always as identity primary key,
  complaint_id bigint not null references complaints(id) on delete cascade,
  form_no int not null,
  form_title text not null default '',
  version int not null default 1,
  status text not null default 'draft' check (status in ('draft', 'issued', 'void')),
  fields jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  issued_by uuid references auth.users(id),
  issued_by_name text,
  issued_at timestamptz,
  voided_by uuid references auth.users(id),
  voided_by_name text,
  voided_at timestamptz,
  void_reason text
);

create unique index if not exists case_documents_one_active
  on case_documents (complaint_id, form_no) where status in ('draft', 'issued');
create unique index if not exists case_documents_version
  on case_documents (complaint_id, form_no, version);

alter table case_documents enable row level security;

drop policy if exists "Admins read forms" on case_documents;
create policy "Admins read forms" on case_documents
  for select using (is_admin_or_staff());

-- Admins can only create and change DRAFTS directly. Issuing and voiding go through the
-- functions below, so an issued form can never be edited, even by calling the API directly.
drop policy if exists "Admins create draft forms" on case_documents;
create policy "Admins create draft forms" on case_documents
  for insert with check (is_admin_or_staff() and status = 'draft');

drop policy if exists "Admins edit draft forms" on case_documents;
create policy "Admins edit draft forms" on case_documents
  for update using (is_admin_or_staff() and status = 'draft')
  with check (is_admin_or_staff() and status = 'draft');

drop policy if exists "Admins delete draft forms" on case_documents;
create policy "Admins delete draft forms" on case_documents
  for delete using (is_admin_or_staff() and status = 'draft');

-- 3. Issue a draft: lock it, stamp who and when, and write to the case log
create or replace function public.issue_document(p_document_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  d case_documents%rowtype;
  admin_name text;
  stamped jsonb;
begin
  if not is_admin_or_staff() then
    raise exception 'Only barangay admins can issue forms.';
  end if;

  select * into d from case_documents where id = p_document_id for update;
  if not found then
    raise exception 'Form not found.';
  end if;
  if d.status <> 'draft' then
    raise exception 'This form has already been issued.';
  end if;

  select coalesce(full_name, 'a barangay admin') into admin_name from profiles where id = auth.uid();

  stamped := d.fields;
  if coalesce(stamped ->> 'issueDate', '') = '' then
    stamped := jsonb_set(stamped, '{issueDate}',
      to_jsonb(to_char((now() at time zone 'Asia/Manila')::date, 'YYYY-MM-DD')));
  end if;

  update case_documents
    set status = 'issued', fields = stamped, issued_at = now(), issued_by = auth.uid(),
        issued_by_name = admin_name, updated_at = now(), updated_by = auth.uid()
    where id = d.id;

  insert into case_activity_log (complaint_id, entry_type, remarks, created_by)
  values (d.complaint_id, 'note',
    'Form ' || d.form_no || ' (' || d.form_title || ') issued by ' || admin_name
      || case when d.version > 1 then ' (version ' || d.version || ')' else '' end || '.',
    auth.uid());
end;
$$;

-- 4. Void an issued form and open a fresh draft copy (the old one is kept as history)
create or replace function public.void_and_reissue(p_document_id bigint, p_reason text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  d case_documents%rowtype;
  admin_name text;
  new_id bigint;
begin
  if not is_admin_or_staff() then
    raise exception 'Only barangay admins can void forms.';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A reason is required to void a form.';
  end if;

  select * into d from case_documents where id = p_document_id for update;
  if not found then
    raise exception 'Form not found.';
  end if;
  if d.status <> 'issued' then
    raise exception 'Only an issued form can be voided.';
  end if;

  select coalesce(full_name, 'a barangay admin') into admin_name from profiles where id = auth.uid();

  update case_documents
    set status = 'void', void_reason = trim(p_reason), voided_at = now(),
        voided_by = auth.uid(), voided_by_name = admin_name, updated_at = now(), updated_by = auth.uid()
    where id = d.id;

  insert into case_documents (complaint_id, form_no, form_title, version, status, fields,
                              created_by, created_by_name, updated_by)
  values (d.complaint_id, d.form_no, d.form_title, d.version + 1, 'draft', d.fields - 'issueDate',
          auth.uid(), admin_name, auth.uid())
  returning id into new_id;

  insert into case_activity_log (complaint_id, entry_type, remarks, created_by)
  values (d.complaint_id, 'note',
    'Form ' || d.form_no || ' (' || d.form_title || ') version ' || d.version || ' voided by '
      || admin_name || '. Reason: ' || trim(p_reason),
    auth.uid());

  return new_id;
end;
$$;

revoke all on function public.issue_document(bigint) from public;
grant execute on function public.issue_document(bigint) to authenticated;
revoke all on function public.void_and_reissue(bigint, text) from public;
grant execute on function public.void_and_reissue(bigint, text) to authenticated;
