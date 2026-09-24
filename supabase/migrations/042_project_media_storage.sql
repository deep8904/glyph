-- B3: project media storage. Design note: docs/product/glyph-rebuild-progress.md
-- ("B3 — Media Infrastructure: Storage Design Note").
--
-- Public bucket (Supabase serves public-bucket GETs via a dedicated path that bypasses
-- storage.objects RLS entirely) + UUID-namespaced unguessable paths + no SELECT/list grant, so
-- the bucket cannot be enumerated. Write access (insert/update/delete) is owner-only, verified via
-- the path's project_id segment against public.projects.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-media', 'project-media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No select/list policy granted deliberately — see the design note. Public GET still works via
-- Supabase's public-bucket serving path; this only controls list()/enumeration, which stays
-- closed to anon and authenticated.

drop policy if exists "project_media_insert" on storage.objects;
create policy "project_media_insert" on storage.objects for insert
  with check (
    bucket_id = 'project-media'
    and (select auth.uid()) in (
      select owner_id from public.projects where id = (storage.foldername(name))[1]::uuid
    )
  );

drop policy if exists "project_media_update" on storage.objects;
create policy "project_media_update" on storage.objects for update
  using (
    bucket_id = 'project-media'
    and (select auth.uid()) in (
      select owner_id from public.projects where id = (storage.foldername(name))[1]::uuid
    )
  );

drop policy if exists "project_media_delete" on storage.objects;
create policy "project_media_delete" on storage.objects for delete
  using (
    bucket_id = 'project-media'
    and (select auth.uid()) in (
      select owner_id from public.projects where id = (storage.foldername(name))[1]::uuid
    )
  );

-- Owner also needs to list their own project's media (to render "existing screenshots" in the
-- edit UI, reorder, etc.) — a narrow select policy, owner-only, does not enable enumeration by
-- anyone else.
drop policy if exists "project_media_select_own" on storage.objects;
create policy "project_media_select_own" on storage.objects for select
  using (
    bucket_id = 'project-media'
    and (select auth.uid()) in (
      select owner_id from public.projects where id = (storage.foldername(name))[1]::uuid
    )
  );
