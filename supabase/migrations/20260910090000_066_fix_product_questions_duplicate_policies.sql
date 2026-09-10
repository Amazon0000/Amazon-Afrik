/*
# product_questions had the same duplicate-policy pattern as products
# DELETE (applied live 2026-09-10) — a correctly-scoped INSERT policy
# (auth_insert_own_question, user_id = auth.uid()) coexisted with an
# original, never-removed permissive one (auth_insert_questions, WITH
# CHECK true), letting anyone insert a question impersonating a
# different user as the asker. The UPDATE policy (qual/with_check both
# 'true') is unused by any current app code (no .update() call on this
# table exists — real seller answers go through the separate,
# correctly-scoped product_answers table) but was still a live attack
# surface allowing anyone to silently rewrite any question's text.
*/

DROP POLICY IF EXISTS "auth_insert_questions" ON product_questions;
DROP POLICY IF EXISTS "auth_update_questions" ON product_questions;
