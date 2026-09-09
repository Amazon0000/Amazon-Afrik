/*
# Seller status change reason + notification (audit finding)

Suspending or rejecting a seller (AdminPage) was a single click with no
reason captured anywhere, and no notification sent — the seller would just
silently lose access with no explanation. Adds the columns to record why,
and pairs with a new notify-seller-status-change Edge Function (notifications
has no client INSERT policy by design, see migration 017) so the seller
actually receives the reason through their real, working communication
channel — the in-app notification bell.
*/

ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS suspension_reason text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz;
