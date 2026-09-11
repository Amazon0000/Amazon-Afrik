/*
# Admin review moderation (explicit request, applied live 2026-09-11)

Reviews were already protected against fake VERIFICATION (a real trigger
requires a delivered order before is_verified can be true — see migration
028_real_verified_reviews), but there was no way for an admin to remove a
review that's abusive/spam/fake in CONTENT even though it came from a
real verified purchase (e.g. a competitor buying one cheap item just to
leave a damaging review). Only the review's own author could delete it.
*/

DROP POLICY IF EXISTS "admin_delete_any_review" ON reviews;
CREATE POLICY "admin_delete_any_review" ON reviews FOR DELETE
  TO authenticated USING (is_platform_admin());
