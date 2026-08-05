/*
# Seed Categories, Brands, Payment Providers, Sellers, Products

## Purpose
Populates the marketplace with real catalog data using UUIDs for all ID columns.
*/

-- ============ CATEGORIES ============
-- Use gen_random_uuid() by omitting id column
INSERT INTO categories (slug, name, icon, is_featured, is_trending, sort_order) VALUES
('fashion', 'Fashion', 'Shirt', true, true, 1),
('art-crafts', 'Art & Crafts', 'Palette', true, true, 2),
('jewelry', 'Jewelry', 'Gem', true, false, 3),
('beauty', 'Beauty', 'Sparkles', true, true, 4),
('home', 'Home', 'Home', false, false, 5),
('food-grocery', 'Food & Grocery', 'ShoppingBasket', false, true, 6),
('electronics', 'Electronics', 'Smartphone', true, false, 7),
('textiles', 'Textiles', 'Scissors', false, true, 8),
('health-wellness', 'Health & Wellness', 'HeartPulse', false, false, 9),
('sports', 'Sports & Outdoors', 'Dumbbell', false, false, 10)
ON CONFLICT (slug) DO NOTHING;

-- Subcategories (link to parents by slug lookup)
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'fashion-dresses', 'Dresses', 'Shirt', 1 FROM categories c WHERE c.slug = 'fashion'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'fashion-boubou', 'Boubous', 'Shirt', 2 FROM categories c WHERE c.slug = 'fashion'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'fashion-accessories', 'Accessories', 'Watch', 3 FROM categories c WHERE c.slug = 'fashion'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'art-masks', 'Masks', 'Palette', 1 FROM categories c WHERE c.slug = 'art-crafts'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'art-sculptures', 'Sculptures', 'Palette', 2 FROM categories c WHERE c.slug = 'art-crafts'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'jewelry-necklaces', 'Necklaces', 'Gem', 1 FROM categories c WHERE c.slug = 'jewelry'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'jewelry-earrings', 'Earrings', 'Gem', 2 FROM categories c WHERE c.slug = 'jewelry'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'beauty-skincare', 'Skincare', 'Sparkles', 1 FROM categories c WHERE c.slug = 'beauty'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'beauty-oils', 'Oils', 'Sparkles', 2 FROM categories c WHERE c.slug = 'beauty'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'home-baskets', 'Baskets', 'Home', 1 FROM categories c WHERE c.slug = 'home'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'food-coffee', 'Coffee', 'Coffee', 1 FROM categories c WHERE c.slug = 'food-grocery'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'textiles-kente', 'Kente', 'Scissors', 1 FROM categories c WHERE c.slug = 'textiles'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'textiles-wax', 'Wax', 'Scissors', 2 FROM categories c WHERE c.slug = 'textiles'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'textiles-aso', 'Aso Oke', 'Scissors', 3 FROM categories c WHERE c.slug = 'textiles'
ON CONFLICT (slug) DO NOTHING;

-- Category Translations
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'fr', 'Mode', 'Mode africaine et contemporaine' FROM categories WHERE slug = 'fashion'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'en', 'Fashion', 'African and contemporary fashion' FROM categories WHERE slug = 'fashion'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'fr', 'Art & Artisanat', 'Art et artisanat africain' FROM categories WHERE slug = 'art-crafts'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'en', 'Art & Crafts', 'African art and crafts' FROM categories WHERE slug = 'art-crafts'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name)
SELECT id, 'fr', 'Bijoux' FROM categories WHERE slug = 'jewelry'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name)
SELECT id, 'en', 'Jewelry' FROM categories WHERE slug = 'jewelry'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name)
SELECT id, 'fr', 'Beauté' FROM categories WHERE slug = 'beauty'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name)
SELECT id, 'en', 'Beauty' FROM categories WHERE slug = 'beauty'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name)
SELECT id, 'fr', 'Maison' FROM categories WHERE slug = 'home'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name)
SELECT id, 'en', 'Home' FROM categories WHERE slug = 'home'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name)
SELECT id, 'fr', 'Épicerie' FROM categories WHERE slug = 'food-grocery'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name)
SELECT id, 'en', 'Food & Grocery' FROM categories WHERE slug = 'food-grocery'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name)
SELECT id, 'fr', 'Électronique' FROM categories WHERE slug = 'electronics'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name)
SELECT id, 'en', 'Electronics' FROM categories WHERE slug = 'electronics'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name)
SELECT id, 'fr', 'Textiles' FROM categories WHERE slug = 'textiles'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name)
SELECT id, 'en', 'Textiles' FROM categories WHERE slug = 'textiles'
ON CONFLICT (category_id, locale) DO NOTHING;

-- ============ BRANDS ============
INSERT INTO brands (name, slug, country_id, is_verified) VALUES
('Maison Baoulé', 'maison-baoule', 'CI', true),
('Teranga', 'teranga', 'SN', true),
('Lagos Luxe', 'lagos-luxe', 'NG', true),
('Nairobi Weaves', 'nairobi-weaves', 'KE', true),
('Accra Gold', 'accra-gold', 'GH', true),
('Sahel Crafts', 'sahel-crafts', 'ML', false),
('Cairo Textiles', 'cairo-textiles', 'EG', true),
('Cape Town Designs', 'cape-town-designs', 'ZA', true)
ON CONFLICT (slug) DO NOTHING;

-- ============ PAYMENT PROVIDERS ============
INSERT INTO payment_providers (name, slug, is_active, countries, sort_order) VALUES
('Mobile Money', 'mobile-money', true, ARRAY['CI','SN','ML','BF','BJ','TG','CM','CG','CD','GH','UG','TZ','RW','ZM'], 1),
('Paystack', 'paystack', true, ARRAY['NG','GH','ZA','KE'], 2),
('Flutterwave', 'flutterwave', true, ARRAY['NG','GH','KE','UG','TZ','ZA','EG'], 3),
('M-Pesa', 'mpesa', true, ARRAY['KE','TZ'], 4),
('Stripe', 'stripe', true, ARRAY['ZA','NG','EG','KE','GH','CI'], 5),
('PayPal', 'paypal', true, ARRAY['ZA','EG','NG','KE','GH'], 6)
ON CONFLICT (slug) DO NOTHING;

-- ============ SELLERS ============
INSERT INTO sellers (business_name, store_slug, store_logo_url, store_banner_url, description, country_id, city, phone, plan, status, business_type, rating, total_reviews, total_products, joined_year, is_official) VALUES
('Maison Baoulé', 'maison-baoule',
  'https://images.pexels.com/photos/32433910/pexels-photo-32433910.jpeg?auto=compress&cs=tinysrgb&w=512',
  'https://images.pexels.com/photos/30088728/pexels-photo-30088728.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'Premium fashion house specializing in wax and contemporary African creations.',
  'CI', 'Abidjan', '+225 07 00 00 01', 'enterprise', 'approved', 'company', 4.9, 342, 87, 2023, true),
('Teranga Crafts', 'teranga-crafts',
  'https://images.pexels.com/photos/33111458/pexels-photo-33111458.jpeg?auto=compress&cs=tinysrgb&w=512',
  'https://images.pexels.com/photos/999283/pexels-photo-999283.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'Authentic Senegalese crafts, masks and sculptures from Dakar artisans.',
  'SN', 'Dakar', '+221 77 00 00 02', 'premium', 'approved', 'company', 4.8, 218, 54, 2023, true),
('Lagos Luxe', 'lagos-luxe',
  'https://images.pexels.com/photos/11086637/pexels-photo-11086637.jpeg?auto=compress&cs=tinysrgb&w=512',
  'https://images.pexels.com/photos/8526816/pexels-photo-8526816.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'High-end Nigerian men and women fashion. Premium agbada and aso oke.',
  'NG', 'Lagos', '+234 800 000 003', 'premium', 'approved', 'company', 4.7, 189, 63, 2024, false),
('Nairobi Weaves', 'nairobi-weaves',
  'https://images.pexels.com/photos/33627196/pexels-photo-33627196.jpeg?auto=compress&cs=tinysrgb&w=512',
  'https://images.pexels.com/photos/29672003/pexels-photo-29672003.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'Musical instruments and Kenyan crafts. Authentic djembe drums.',
  'KE', 'Nairobi', '+254 700 000 004', 'enterprise', 'approved', 'company', 4.9, 156, 41, 2023, true),
('Accra Gold', 'accra-gold',
  'https://images.pexels.com/photos/30988134/pexels-photo-30988134.jpeg?auto=compress&cs=tinysrgb&w=512',
  'https://images.pexels.com/photos/36773397/pexels-photo-36773397.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'Kente textiles and Ghanaian jewelry from Accra artisans.',
  'GH', 'Accra', '+233 200 000 005', 'starter', 'approved', 'individual', 4.6, 98, 12, 2024, false),
('Bouaké Textiles', 'bouake-textiles',
  'https://images.pexels.com/photos/19183483/pexels-photo-19183483.jpeg?auto=compress&cs=tinysrgb&w=512',
  'https://images.pexels.com/photos/11284698/pexels-photo-11284698.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'Natural beauty products and textiles from Bouaké.',
  'CI', 'Bouaké', '+225 07 00 00 006', 'starter', 'approved', 'individual', 4.5, 67, 8, 2024, false)
ON CONFLICT (store_slug) DO NOTHING;

-- ============ PRODUCTS ============
DO $$
DECLARE
  s1 uuid; s2 uuid; s3 uuid; s4 uuid; s5 uuid; s6 uuid;
  c_fashion_dresses uuid; c_jewelry_neck uuid; c_art_masks uuid; c_beauty_skincare uuid;
  c_textiles_aso uuid; c_home_baskets uuid; c_beauty_oils uuid; c_fashion_boubou uuid;
  c_art_sculpt uuid; c_food_coffee uuid; c_textiles_kente uuid;
  b1 uuid; b2 uuid; b3 uuid; b4 uuid; b5 uuid; b6 uuid;
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; p6 uuid; p7 uuid; p8 uuid;
  p9 uuid; p10 uuid; p11 uuid; p12 uuid; p13 uuid; p14 uuid; p15 uuid; p16 uuid;
BEGIN
  SELECT id INTO s1 FROM sellers WHERE store_slug = 'maison-baoule';
  SELECT id INTO s2 FROM sellers WHERE store_slug = 'teranga-crafts';
  SELECT id INTO s3 FROM sellers WHERE store_slug = 'lagos-luxe';
  SELECT id INTO s4 FROM sellers WHERE store_slug = 'nairobi-weaves';
  SELECT id INTO s5 FROM sellers WHERE store_slug = 'accra-gold';
  SELECT id INTO s6 FROM sellers WHERE store_slug = 'bouake-textiles';

  SELECT id INTO c_fashion_dresses FROM categories WHERE slug = 'fashion-dresses';
  SELECT id INTO c_jewelry_neck FROM categories WHERE slug = 'jewelry-necklaces';
  SELECT id INTO c_art_masks FROM categories WHERE slug = 'art-masks';
  SELECT id INTO c_beauty_skincare FROM categories WHERE slug = 'beauty-skincare';
  SELECT id INTO c_textiles_aso FROM categories WHERE slug = 'textiles-aso';
  SELECT id INTO c_home_baskets FROM categories WHERE slug = 'home-baskets';
  SELECT id INTO c_beauty_oils FROM categories WHERE slug = 'beauty-oils';
  SELECT id INTO c_fashion_boubou FROM categories WHERE slug = 'fashion-boubou';
  SELECT id INTO c_art_sculpt FROM categories WHERE slug = 'art-sculptures';
  SELECT id INTO c_food_coffee FROM categories WHERE slug = 'food-coffee';
  SELECT id INTO c_textiles_kente FROM categories WHERE slug = 'textiles-kente';

  SELECT id INTO b1 FROM brands WHERE slug = 'maison-baoule';
  SELECT id INTO b2 FROM brands WHERE slug = 'teranga';
  SELECT id INTO b3 FROM brands WHERE slug = 'lagos-luxe';
  SELECT id INTO b4 FROM brands WHERE slug = 'nairobi-weaves';
  SELECT id INTO b5 FROM brands WHERE slug = 'accra-gold';
  SELECT id INTO b6 FROM brands WHERE slug = 'sahel-crafts';

  -- Products
  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, old_price, currency_code, stock, rating, total_reviews, is_sponsored)
  VALUES (s1, c_fashion_dresses, b1, 'CI', 'Robe Wax Premium', 'robe-wax-premium', 'Authentic wax print dress, artisan tailoring. Fabric imported from Ghana, tailored in Abidjan.', 45, 60, 'USD', 12, 4.9, 87, true)
  RETURNING id INTO p1;

  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, currency_code, stock, rating, total_reviews)
  VALUES (s1, c_jewelry_neck, b1, 'CI', 'Collier Akan Or', 'collier-akan-or', '18k gold necklace, traditional Akan motif. Handmade by Abidjan goldsmiths.', 320, 'USD', 3, 5.0, 34)
  RETURNING id INTO p2;

  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, currency_code, stock, rating, total_reviews, is_sponsored)
  VALUES (s2, c_art_masks, b2, 'SN', 'Masque Sénoufo', 'masque-senoufo', 'Hand-carved mask, fine wood. Unique piece of traditional art from Senegal.', 85, 'USD', 7, 4.8, 56, true)
  RETURNING id INTO p3;

  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, currency_code, stock, rating, total_reviews)
  VALUES (s2, c_beauty_skincare, b2, 'SN', 'Beurre de Karité Pur', 'beurre-de-karite-pur', '100% natural shea butter from Burkina Faso. Unrefined, traditionally pressed.', 12, 'USD', 80, 4.7, 142)
  RETURNING id INTO p4;

  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, currency_code, stock, rating, total_reviews)
  VALUES (s3, c_textiles_aso, b3, 'NG', 'Aso Oke Wrapper', 'aso-oke-wrapper', 'Hand-woven Aso Oke fabric from Nigeria. Perfect for ceremonies and special events.', 65, 'USD', 15, 4.6, 41)
  RETURNING id INTO p5;

  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, currency_code, stock, rating, total_reviews)
  VALUES (s4, c_jewelry_neck, b4, 'KE', 'Collier Perlé Maasai', 'collier-perle-maasai', 'Traditional Maasai beaded collar from Kenya. Authentic craft with vibrant colors.', 38, 'USD', 9, 4.9, 29)
  RETURNING id INTO p6;

  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, currency_code, stock, rating, total_reviews)
  VALUES (s5, c_textiles_kente, b5, 'GH', 'Étole Kente Royale', 'etole-kente-royale', 'Authentic Kente stole from Ghana, hand-woven on traditional loom.', 55, 'USD', 6, 4.5, 18)
  RETURNING id INTO p7;

  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, currency_code, stock, rating, total_reviews)
  VALUES (s5, c_home_baskets, b5, 'GH', 'Panier Tressé Bolga', 'panier-tresse-bolga', 'Hand-woven basket from Bolgatanga, Ghana. Eco-friendly and durable.', 28, 'USD', 20, 4.7, 22)
  RETURNING id INTO p8;

  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, currency_code, stock, rating, total_reviews)
  VALUES (s6, c_beauty_oils, b6, 'CI', 'Huile de Baobab Bio', 'huile-de-baobab-bio', 'Organic baobab oil, cold-pressed. Nourishes skin and hair.', 18, 'USD', 50, 4.6, 34)
  RETURNING id INTO p9;

  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, old_price, currency_code, stock, rating, total_reviews)
  VALUES (s3, c_fashion_boubou, b3, 'NG', 'Boubou Brodé Premium', 'boubou-brode-premium', 'Hand-embroidered boubou, premium cotton. Traditional Nigerian elegance.', 72, 95, 'USD', 11, 4.8, 47)
  RETURNING id INTO p10;

  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, currency_code, stock, rating, total_reviews)
  VALUES (s4, c_art_sculpt, b4, 'KE', 'Tambour Djembe Artisanal', 'tambour-djembe-artisanal', 'Authentic djembe, goat skin. Carved and assembled in Nairobi.', 95, 'USD', 5, 4.9, 38)
  RETURNING id INTO p11;

  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, currency_code, stock, rating, total_reviews)
  VALUES (s4, c_food_coffee, b4, 'KE', 'Café Arabica Kenya AA', 'cafe-arabica-kenya-aa', 'Kenya AA Arabica coffee, artisan roast. Fruity notes, medium body.', 22, 'USD', 40, 4.7, 61)
  RETURNING id INTO p12;

  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, currency_code, stock, rating, total_reviews)
  VALUES (s1, c_fashion_dresses, b1, 'CI', 'Robe Traditionnelle Élégante', 'robe-traditionnelle-elegante', 'Colorful traditional dress, perfect for special occasions.', 52, 'USD', 14, 4.8, 53)
  RETURNING id INTO p13;

  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, currency_code, stock, rating, total_reviews)
  VALUES (s3, c_fashion_boubou, b3, 'NG', 'Boubou Masculin Agbada', 'boubou-masculin-agbada', 'Embroidered agbada, traditional Nigerian men attire.', 68, 'USD', 8, 4.7, 29)
  RETURNING id INTO p14;

  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, currency_code, stock, rating, total_reviews)
  VALUES (s2, c_art_masks, b2, 'SN', 'Masque Décoratif Coloré', 'masque-decoratif-colore', 'Hand-painted decorative mask, perfect for interior decoration.', 45, 'USD', 12, 4.6, 18)
  RETURNING id INTO p15;

  INSERT INTO products (seller_id, category_id, brand_id, country_id, name, slug, description, price, currency_code, stock, rating, total_reviews)
  VALUES (s5, c_home_baskets, b5, 'GH', 'Panier Décoratif Marrakech', 'panier-decoratif-marrakech', 'Decorative woven basket, Moroccan style. Ideal for storage and decor.', 32, 'USD', 18, 4.5, 15)
  RETURNING id INTO p16;

  -- Product Images
  INSERT INTO product_images (product_id, image_url, sort_order) VALUES
  (p1, 'https://images.pexels.com/photos/30088728/pexels-photo-30088728.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p1, 'https://images.pexels.com/photos/18111538/pexels-photo-18111538.jpeg?auto=compress&cs=tinysrgb&w=1080', 1),
  (p1, 'https://images.pexels.com/photos/31871810/pexels-photo-31871810.jpeg?auto=compress&cs=tinysrgb&w=1080', 2),
  (p2, 'https://images.pexels.com/photos/32693394/pexels-photo-32693394.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p2, 'https://images.pexels.com/photos/10727342/pexels-photo-10727342.jpeg?auto=compress&cs=tinysrgb&w=1080', 1),
  (p2, 'https://images.pexels.com/photos/19922497/pexels-photo-19922497.jpeg?auto=compress&cs=tinysrgb&w=1080', 2),
  (p3, 'https://images.pexels.com/photos/999283/pexels-photo-999283.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p3, 'https://images.pexels.com/photos/33111458/pexels-photo-33111458.jpeg?auto=compress&cs=tinysrgb&w=1080', 1),
  (p3, 'https://images.pexels.com/photos/16563046/pexels-photo-16563046.jpeg?auto=compress&cs=tinysrgb&w=1080', 2),
  (p4, 'https://images.pexels.com/photos/11284698/pexels-photo-11284698.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p4, 'https://images.pexels.com/photos/4735913/pexels-photo-4735913.jpeg?auto=compress&cs=tinysrgb&w=1080', 1),
  (p4, 'https://images.pexels.com/photos/12572310/pexels-photo-12572310.jpeg?auto=compress&cs=tinysrgb&w=1080', 2),
  (p5, 'https://images.pexels.com/photos/24738158/pexels-photo-24738158.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p5, 'https://images.pexels.com/photos/3592348/pexels-photo-3592348.jpeg?auto=compress&cs=tinysrgb&w=1080', 1),
  (p6, 'https://images.pexels.com/photos/35619407/pexels-photo-35619407.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p6, 'https://images.pexels.com/photos/34138618/pexels-photo-34138618.jpeg?auto=compress&cs=tinysrgb&w=1080', 1),
  (p7, 'https://images.pexels.com/photos/36773397/pexels-photo-36773397.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p7, 'https://images.pexels.com/photos/30988134/pexels-photo-30988134.jpeg?auto=compress&cs=tinysrgb&w=1080', 1),
  (p8, 'https://images.pexels.com/photos/31653080/pexels-photo-31653080.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p8, 'https://images.pexels.com/photos/38483283/pexels-photo-38483283.jpeg?auto=compress&cs=tinysrgb&w=1080', 1),
  (p9, 'https://images.pexels.com/photos/4735910/pexels-photo-4735910.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p9, 'https://images.pexels.com/photos/8015483/pexels-photo-8015483.jpeg?auto=compress&cs=tinysrgb&w=1080', 1),
  (p10, 'https://images.pexels.com/photos/8526816/pexels-photo-8526816.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p10, 'https://images.pexels.com/photos/11086637/pexels-photo-11086637.jpeg?auto=compress&cs=tinysrgb&w=1080', 1),
  (p10, 'https://images.pexels.com/photos/29063157/pexels-photo-29063157.jpeg?auto=compress&cs=tinysrgb&w=1080', 2),
  (p11, 'https://images.pexels.com/photos/29712219/pexels-photo-29712219.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p11, 'https://images.pexels.com/photos/29672003/pexels-photo-29672003.jpeg?auto=compress&cs=tinysrgb&w=1080', 1),
  (p11, 'https://images.pexels.com/photos/32803152/pexels-photo-32803152.jpeg?auto=compress&cs=tinysrgb&w=1080', 2),
  (p12, 'https://images.pexels.com/photos/3794802/pexels-photo-3794802.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p12, 'https://images.pexels.com/photos/4820660/pexels-photo-4820660.jpeg?auto=compress&cs=tinysrgb&w=1080', 1),
  (p13, 'https://images.pexels.com/photos/32433910/pexels-photo-32433910.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p13, 'https://images.pexels.com/photos/34895185/pexels-photo-34895185.jpeg?auto=compress&cs=tinysrgb&w=1080', 1),
  (p14, 'https://images.pexels.com/photos/9310866/pexels-photo-9310866.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p14, 'https://images.pexels.com/photos/36029407/pexels-photo-36029407.jpeg?auto=compress&cs=tinysrgb&w=1080', 1),
  (p15, 'https://images.pexels.com/photos/5028727/pexels-photo-5028727.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p15, 'https://images.pexels.com/photos/32448078/pexels-photo-32448078.jpeg?auto=compress&cs=tinysrgb&w=1080', 1),
  (p16, 'https://images.pexels.com/photos/20852593/pexels-photo-20852593.jpeg?auto=compress&cs=tinysrgb&w=1080', 0),
  (p16, 'https://images.pexels.com/photos/11614418/pexels-photo-11614418.png?auto=compress&cs=tinysrgb&w=1080', 1)
  ON CONFLICT DO NOTHING;

  -- Product Variants
  INSERT INTO product_variants (product_id, variant_type, variant_value, stock) VALUES
  (p1, 'size', 'S', 3), (p1, 'size', 'M', 4), (p1, 'size', 'L', 3), (p1, 'size', 'XL', 2),
  (p1, 'color', 'Gold', 6), (p1, 'color', 'Earth', 4), (p1, 'color', 'Cocoa', 2),
  (p10, 'size', 'S', 2), (p10, 'size', 'M', 4), (p10, 'size', 'L', 3), (p10, 'size', 'XL', 2),
  (p13, 'size', 'S', 3), (p13, 'size', 'M', 5), (p13, 'size', 'L', 4), (p13, 'size', 'XL', 2),
  (p14, 'size', 'S', 2), (p14, 'size', 'M', 3), (p14, 'size', 'L', 2), (p14, 'size', 'XL', 1)
  ON CONFLICT DO NOTHING;

  -- Product Specifications
  INSERT INTO product_specifications (product_id, spec_name, spec_value) VALUES
  (p1, 'Material', '100% Cotton Wax'), (p1, 'Care', 'Machine washable'), (p1, 'Origin', 'Abidjan, Côte d''Ivoire'),
  (p2, 'Material', '18k Gold'), (p2, 'Certificate', 'Authenticity included'),
  (p3, 'Material', 'Fine Wood'), (p3, 'Type', 'Hand-carved'),
  (p4, 'Volume', '250ml'), (p4, 'Type', '100% Natural Unrefined'),
  (p11, 'Material', 'Wood + Goat Skin'), (p11, 'Size', '40cm height')
  ON CONFLICT DO NOTHING;

  -- Reviews
  INSERT INTO reviews (product_id, seller_id, author_name, rating, comment, is_verified) VALUES
  (p1, s1, 'Awa K.', 5, 'Qualité exceptionnelle, livraison rapide par le vendeur.', true),
  (p1, s1, 'Mamadou D.', 4, 'Très bon produit, conforme à la description.', true),
  (p1, s1, 'Fatou N.', 5, 'Je recommande vivement, artisanat de grande qualité.', false),
  (p2, s1, 'Awa K.', 5, 'Collier magnifique, or véritable.', true),
  (p2, s1, 'Ibrahim S.', 5, 'Parfait pour un cadeau, très bien fini.', true),
  (p3, s2, 'Cheikh M.', 5, 'Masque magnifique, sculpture détaillée.', true),
  (p3, s2, 'Aminata D.', 4, 'Belle pièce d''art, livraison un peu lente.', true),
  (p4, s2, 'Mariama B.', 5, 'Beurre de karité pur, je recommande.', true),
  (p10, s3, 'Ngozi O.', 5, 'Boubou élégant, broderie impeccable.', true),
  (p11, s4, 'Wanjiku M.', 5, 'Djembe de grande qualité, son excellent.', true),
  (p12, s4, 'James K.', 5, 'Café Kenya AA excellent, arôme fruité.', true)
  ON CONFLICT DO NOTHING;
END $$;
