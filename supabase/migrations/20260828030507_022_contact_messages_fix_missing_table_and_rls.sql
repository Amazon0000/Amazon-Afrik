/*
# Bug d'incohérence réel #2 trouvé en production

Le formulaire de contact (footer) appelle contact_messages.insert()
(src/lib/db.ts) sur une table qui n'existait pas du tout en production —
le formulaire "envoyait" silencieusement dans le vide.

Corrigé en créant la table, ET en durcissant la policy de lecture par
rapport à la version du dépôt Git (20260826020000_015_contact_messages.sql) :
la version d'origine (auth_read_contact_messages) autorisait TOUT
utilisateur connecté à lire les emails/noms/messages de TOUS les visiteurs
ayant contacté le support — une fuite de PII. Restreint ici aux super
admins uniquement.
*/

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contact_messages" ON contact_messages;
CREATE POLICY "anon_insert_contact_messages" ON contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Corrigé (plus restrictif que la version Git d'origine) : seuls les
-- super admins peuvent lire les messages de contact, pas tout utilisateur connecté.
DROP POLICY IF EXISTS "auth_read_contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "superadmin_read_contact_messages" ON contact_messages;
CREATE POLICY "superadmin_read_contact_messages" ON contact_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = (select auth.jwt())->>'email' AND sa.is_active = true));
