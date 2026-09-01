/*
# Messagerie Acheteur-Vendeur (modèle Amazon Seller Central) — remplace
l'onglet "Messages" purement décoratif du Seller Center.

## Modèle
Comme Amazon : une conversation est rattachée à UNE commande précise (pas
de chat libre sans contexte commercial), entre l'acheteur et le vendeur de
cette commande. Chaque conversation a plusieurs messages.

## Vérifié réellement
Test end-to-end complet exécuté : commande de test créée, conversation
créée par l'acheteur, message envoyé, compteur non-lu vendeur incrémenté
automatiquement (trigger), vendeur lit et répond, tiers non-participant
confirmé ne voyant aucun message (0 résultat), nettoyage complet (cascade).
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  subject text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  buyer_unread_count int NOT NULL DEFAULT 0,
  seller_unread_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('buyer', 'seller')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "buyer_read_own_conversations" ON conversations;
CREATE POLICY "buyer_read_own_conversations" ON conversations FOR SELECT
  TO authenticated USING (
    buyer_id = (select auth.uid())
    OR seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "buyer_create_own_conversation" ON conversations;
CREATE POLICY "buyer_create_own_conversation" ON conversations FOR INSERT
  TO authenticated WITH CHECK (
    buyer_id = (select auth.uid())
    AND EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "seller_create_own_conversation" ON conversations;
CREATE POLICY "seller_create_own_conversation" ON conversations FOR INSERT
  TO authenticated WITH CHECK (
    seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid()))
    AND EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.seller_id = conversations.seller_id)
  );

DROP POLICY IF EXISTS "participant_update_conversation" ON conversations;
CREATE POLICY "participant_update_conversation" ON conversations FOR UPDATE
  TO authenticated
  USING (buyer_id = (select auth.uid()) OR seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid())))
  WITH CHECK (buyer_id = (select auth.uid()) OR seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "participant_read_messages" ON messages;
CREATE POLICY "participant_read_messages" ON messages FOR SELECT
  TO authenticated USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE buyer_id = (select auth.uid())
         OR seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "participant_send_message" ON messages;
CREATE POLICY "participant_send_message" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    sender_id = (select auth.uid())
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE buyer_id = (select auth.uid())
         OR seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid()))
    )
  );

CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sender_role = 'buyer' THEN
    UPDATE conversations SET last_message_at = now(), seller_unread_count = seller_unread_count + 1 WHERE id = NEW.conversation_id;
  ELSE
    UPDATE conversations SET last_message_at = now(), buyer_unread_count = buyer_unread_count + 1 WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_new_message ON messages;
CREATE TRIGGER trg_handle_new_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION handle_new_message();
