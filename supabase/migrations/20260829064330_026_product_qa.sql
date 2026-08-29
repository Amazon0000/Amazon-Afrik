/*
# Product Q&A

Real customer questions on a product page, answerable by the seller or by
other customers (community answers) — the pattern used by Amazon/Noon.
Anyone can read; asking/answering requires an account; a question can be
edited/deleted by its own author, an answer likewise.

is_seller_answer is never trusted from the client alone: the INSERT
policy on product_answers verifies the answering user actually owns the
seller account behind the product being asked about before allowing that
flag to be set — otherwise any buyer could mislabel their own answer as
an official seller response.
*/

CREATE TABLE IF NOT EXISTS product_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  question text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES product_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  is_seller_answer boolean NOT NULL DEFAULT false,
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_questions_product ON product_questions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_answers_question ON product_answers(question_id);

ALTER TABLE product_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_questions" ON product_questions;
CREATE POLICY "public_read_questions" ON product_questions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_own_question" ON product_questions;
CREATE POLICY "auth_insert_own_question" ON product_questions FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "auth_delete_own_question" ON product_questions;
CREATE POLICY "auth_delete_own_question" ON product_questions FOR DELETE
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "public_read_answers" ON product_answers;
CREATE POLICY "public_read_answers" ON product_answers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_own_answer" ON product_answers;
CREATE POLICY "auth_insert_own_answer" ON product_answers FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND (
      is_seller_answer = false
      OR EXISTS (
        SELECT 1 FROM product_questions q
        JOIN products p ON p.id = q.product_id
        JOIN sellers s ON s.id = p.seller_id
        WHERE q.id = question_id AND s.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "auth_delete_own_answer" ON product_answers;
CREATE POLICY "auth_delete_own_answer" ON product_answers FOR DELETE
  TO authenticated USING (user_id = auth.uid());
