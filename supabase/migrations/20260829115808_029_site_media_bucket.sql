-- Bucket public pour les médias du site (vidéos hero, illustrations
-- marketing) — distinct de product-images/seller-assets qui sont pour le
-- contenu généré par les vendeurs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 104857600, array['video/mp4','video/webm','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "public_read_site_media" on storage.objects;
create policy "public_read_site_media" on storage.objects for select
  to anon, authenticated using (bucket_id = 'site-media');

drop policy if exists "superadmin_upload_site_media" on storage.objects;
create policy "superadmin_upload_site_media" on storage.objects for insert
  to authenticated with check (
    bucket_id = 'site-media'
    and exists (select 1 from super_admins sa where sa.email = (select auth.jwt())->>'email' and sa.is_active = true)
  );

drop policy if exists "superadmin_manage_site_media" on storage.objects;
create policy "superadmin_manage_site_media" on storage.objects for update
  to authenticated using (
    bucket_id = 'site-media'
    and exists (select 1 from super_admins sa where sa.email = (select auth.jwt())->>'email' and sa.is_active = true)
  );

drop policy if exists "superadmin_delete_site_media" on storage.objects;
create policy "superadmin_delete_site_media" on storage.objects for delete
  to authenticated using (
    bucket_id = 'site-media'
    and exists (select 1 from super_admins sa where sa.email = (select auth.jwt())->>'email' and sa.is_active = true)
  );
