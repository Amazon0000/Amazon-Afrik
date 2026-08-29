/*
Bug d'incohérence réel #3 : uploadSellerKycDocument() (src/lib/db.ts)
uploade vers le bucket `seller-kyc`, qui n'existait pas du tout sur cette
base — chaque upload de pièce d'identité pendant l'onboarding vendeur
échouait silencieusement (error loggée en console, jamais montrée à
l'utilisateur, le flux continuait quand même).

Bucket PRIVÉ (contrairement à product-images/seller-assets/site-media) :
ce sont des pièces d'identité, jamais accessibles publiquement. Le code
(uploadSellerKycDocument) stocke déjà le chemin, pas une URL publique, et
prévoit de résoudre une URL signée à la demande — cohérent avec un bucket privé.
*/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('seller-kyc', 'seller-kyc', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

drop policy if exists "seller_upload_own_kyc" on storage.objects;
create policy "seller_upload_own_kyc" on storage.objects for insert
  to authenticated with check (
    bucket_id = 'seller-kyc'
    and (storage.foldername(name))[1] in (select id::text from sellers where user_id = (select auth.uid()))
  );

drop policy if exists "seller_read_own_kyc" on storage.objects;
create policy "seller_read_own_kyc" on storage.objects for select
  to authenticated using (
    bucket_id = 'seller-kyc'
    and (
      (storage.foldername(name))[1] in (select id::text from sellers where user_id = (select auth.uid()))
      or exists (select 1 from super_admins sa where sa.email = (select auth.jwt())->>'email' and sa.is_active = true)
    )
  );
