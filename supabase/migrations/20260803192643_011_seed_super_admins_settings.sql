-- Seed super admins
INSERT INTO super_admins (email, full_name, is_active) VALUES
  ('vincentnogue2@gmail.com', 'Vincent Nogue', true),
  ('vincentnogue@yahoo.com', 'Vincent Nogue', true)
ON CONFLICT (email) DO UPDATE SET is_active = true;

-- Seed platform settings
INSERT INTO platform_settings (key, value) VALUES
  ('reviews_enabled', '{"value": true}'),
  ('reviews_confirmed_buyers_only', '{"value": true}'),
  ('product_approval_required', '{"value": true}'),
  ('guest_checkout_enabled', '{"value": true}'),
  ('seller_trial_days', '{"value": 14}'),
  ('starter_staff_limit', '{"value": 1}'),
  ('premium_staff_limit', '{"value": 5}'),
  ('enterprise_staff_limit', '{"value": 20}'),
  ('commission_rate', '{"value": 5}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;