/*
# Notifications in-app

## Contexte
Aucun système de notifications n'existait dans ce projet (aucune table,
aucun composant UI) — vérifié avant création, conformément à la consigne de
ne pas dupliquer un système déjà présent. Ce module en a besoin (section 20
du cahier des charges Advertising), donc on l'introduit ici de façon
générique pour pouvoir servir aussi à d'autres usages futurs (commandes,
KYC, etc.), pas seulement à la publicité.

## Table
`notifications` : destinataire (user_id), type, titre, message, lien,
métadonnées, lu/non lu.

## Sécurité
RLS : chaque utilisateur ne voit que ses propres notifications. Seules les
Edge Functions (Service Role Key) ou le backend créent des notifications —
pas d'INSERT ouvert aux utilisateurs authentifiés (on ne veut pas qu'un
utilisateur puisse notifier un autre utilisateur depuis le frontend).
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- ex: 'ad_payment_success', 'ad_campaign_activated', 'ad_campaign_expiring', 'ad_campaign_expired', 'ad_payment_failed', 'ad_refund', 'admin_new_paid_campaign', 'admin_suspicious_webhook', 'admin_activation_error'
  title text NOT NULL,
  message text NOT NULL,
  link text, -- route interne optionnelle (ex: 'ads', 'admin')
  metadata jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_read_own_notifications" ON notifications;
CREATE POLICY "user_read_own_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_update_own_notifications" ON notifications;
CREATE POLICY "user_update_own_notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- Pas de policy INSERT pour authenticated : uniquement les Edge Functions
-- (Service Role Key) créent des notifications, pour empêcher qu'un
-- utilisateur en notifie un autre depuis le frontend.

-- ============ Rappel d'expiration : anti-doublon ============
-- Empêche d'envoyer plusieurs fois le rappel "campagne bientôt expirée"
-- à chaque exécution du cron.
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS expiry_reminder_sent_at timestamptz;
