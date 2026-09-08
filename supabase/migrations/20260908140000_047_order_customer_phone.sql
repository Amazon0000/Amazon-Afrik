/*
# Customer phone snapshot on orders (for vendor WhatsApp confirmation)

Vendors need the buyer's phone number to open a pre-filled WhatsApp chat
confirming the order (item list, tracking ID, delivery address, timeline).
The phone previously only existed on `addresses.phone` (logged-in buyers)
or `orders.guest_phone` (guest checkout) — neither is queried together
easily from the Seller Center orders list. Snapshotting it directly on the
order, like delivery_address already is, keeps this simple and consistent
with the existing pattern (and survives the buyer later editing/deleting
the address).
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;
