-- ============================================================================
-- Resident profile personalization
--  * Profile photo (private "avatars" bucket, one folder per user)
--  * Language preference (English / Tagalog)
--  * Residents cannot change their name after their ID is verified
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================

alter table profiles
  add column if not exists avatar_path text,
  add column if not exists language text not null default 'en';

alter table profiles drop constraint if exists profiles_language_check;
alter table profiles add constraint profiles_language_check check (language in ('en', 'tl'));

-- Name lock: once an admin verifies the resident's ID, the name must keep matching the ID.
create or replace function public.guard_profile_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.full_name is distinct from old.full_name
     and auth.uid() is not null
     and not is_admin_or_staff()
     and exists (select 1 from identity_verifications where user_id = old.id) then
    raise exception 'Your name is already verified against your ID. Visit the Barangay Hall to correct it.';
  end if;
  if new.avatar_path is not null and new.avatar_path not like old.id::text || '/%' then
    raise exception 'Invalid profile photo.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_name on profiles;
create trigger guard_profile_name
before update on profiles
for each row execute function public.guard_profile_name();

-- Private bucket for profile photos (2 MB, images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Users manage own avatar" on storage.objects;
create policy "Users manage own avatar" on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Admins view avatars" on storage.objects;
create policy "Admins view avatars" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and is_admin_or_staff());
