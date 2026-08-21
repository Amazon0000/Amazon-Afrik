-- Expand categories to Amazon-style full tree with subcategories
-- Adds new root categories and enriches existing ones with more subcategories

-- New root categories
INSERT INTO categories (slug, name, icon, is_featured, is_trending, sort_order) VALUES
('phones-tablets', 'Phones & Tablets', 'Smartphone', true, true, 11),
('computing', 'Computing & IT', 'Laptop', true, false, 12),
('home-kitchen', 'Home & Kitchen', 'CookingPot', false, false, 13),
('baby-products', 'Baby & Child', 'Baby', false, false, 14),
('auto-moto', 'Auto & Moto', 'Car', false, false, 15),
('diy-garden', 'DIY & Garden', 'Wrench', false, false, 16),
('video-games', 'Video Games', 'Gamepad2', false, true, 17),
('books', 'Books & Stationery', 'BookOpen', false, false, 18),
('bags-luggage', 'Bags & Luggage', 'Briefcase', false, false, 19),
('pet-supplies', 'Pet Supplies', 'PawPrint', false, false, 20),
('music', 'Music & Instruments', 'Music', false, false, 21),
('industrial', 'Industrial & Scientific', 'Factory', false, false, 22)
ON CONFLICT (slug) DO NOTHING;

-- Rename 'home' to 'Home & Living' conceptually (keep slug, update name)
UPDATE categories SET name = 'Home & Living' WHERE slug = 'home';
UPDATE categories SET name = 'Fashion & Clothing' WHERE slug = 'fashion';
UPDATE categories SET name = 'Electronics & Accessories' WHERE slug = 'electronics';
UPDATE categories SET name = 'Food & Grocery' WHERE slug = 'food-grocery';

-- ============ SUBCATEGORIES FOR EXISTING ROOTS ============

-- Fashion subcats (add more)
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'fashion-men', 'Men Fashion', 'Shirt', 4 FROM categories c WHERE c.slug = 'fashion'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'fashion-kids', 'Kids Fashion', 'Shirt', 5 FROM categories c WHERE c.slug = 'fashion'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'fashion-shoes', 'Shoes', 'Footprints', 6 FROM categories c WHERE c.slug = 'fashion'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'fashion-bags', 'Bags & Purses', 'ShoppingBag', 7 FROM categories c WHERE c.slug = 'fashion'
ON CONFLICT (slug) DO NOTHING;

-- Electronics subcats (add more)
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'elec-audio', 'Audio & Headphones', 'Headphones', 1 FROM categories c WHERE c.slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'elec-cameras', 'Cameras & Photo', 'Camera', 2 FROM categories c WHERE c.slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'elec-tv', 'TV & Home Theater', 'Tv', 3 FROM categories c WHERE c.slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'elec-accessories', 'Accessories', 'Cable', 4 FROM categories c WHERE c.slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

-- Beauty subcats (add more)
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'beauty-hair', 'Hair Care', 'Scissors', 3 FROM categories c WHERE c.slug = 'beauty'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'beauty-makeup', 'Makeup', 'Sparkles', 4 FROM categories c WHERE c.slug = 'beauty'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'beauty-perfume', 'Perfumes & Fragrances', 'SprayCan', 5 FROM categories c WHERE c.slug = 'beauty'
ON CONFLICT (slug) DO NOTHING;

-- Home subcats (add more)
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'home-decor', 'Decor', 'Sofa', 2 FROM categories c WHERE c.slug = 'home'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'home-furniture', 'Furniture', 'Sofa', 3 FROM categories c WHERE c.slug = 'home'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'home-bedding', 'Bedding & Bath', 'Bed', 4 FROM categories c WHERE c.slug = 'home'
ON CONFLICT (slug) DO NOTHING;

-- Food subcats (add more)
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'food-spices', 'Spices & Seasonings', 'Pepper', 2 FROM categories c WHERE c.slug = 'food-grocery'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'food-beverages', 'Beverages', 'Coffee', 3 FROM categories c WHERE c.slug = 'food-grocery'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'food-staples', 'Staples & Grains', 'Wheat', 4 FROM categories c WHERE c.slug = 'food-grocery'
ON CONFLICT (slug) DO NOTHING;

-- Jewelry subcats (add more)
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'jewelry-rings', 'Rings', 'Gem', 3 FROM categories c WHERE c.slug = 'jewelry'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'jewelry-bracelets', 'Bracelets', 'Gem', 4 FROM categories c WHERE c.slug = 'jewelry'
ON CONFLICT (slug) DO NOTHING;

-- Art subcats (add more)
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'art-paintings', 'Paintings', 'Palette', 3 FROM categories c WHERE c.slug = 'art-crafts'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'art-pottery', 'Pottery & Ceramics', 'Palette', 4 FROM categories c WHERE c.slug = 'art-crafts'
ON CONFLICT (slug) DO NOTHING;

-- Sports subcats
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'sports-fitness', 'Fitness Equipment', 'Dumbbell', 1 FROM categories c WHERE c.slug = 'sports'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'sports-outdoor', 'Outdoor & Camping', 'Tent', 2 FROM categories c WHERE c.slug = 'sports'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'sports-team', 'Team Sports', 'Volleyball', 3 FROM categories c WHERE c.slug = 'sports'
ON CONFLICT (slug) DO NOTHING;

-- Health subcats
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'health-vitamins', 'Vitamins & Supplements', 'Pill', 1 FROM categories c WHERE c.slug = 'health-wellness'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'health-personal', 'Personal Care', 'HeartPulse', 2 FROM categories c WHERE c.slug = 'health-wellness'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'health-medical', 'Medical Supplies', 'Stethoscope', 3 FROM categories c WHERE c.slug = 'health-wellness'
ON CONFLICT (slug) DO NOTHING;

-- Textiles subcats (add more)
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'textiles-ankara', 'Ankara Prints', 'Scissors', 4 FROM categories c WHERE c.slug = 'textiles'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'textiles-batik', 'Batik', 'Scissors', 5 FROM categories c WHERE c.slug = 'textiles'
ON CONFLICT (slug) DO NOTHING;

-- ============ SUBCATEGORIES FOR NEW ROOTS ============

-- Phones & Tablets
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'phones-smartphones', 'Smartphones', 'Smartphone', 1 FROM categories c WHERE c.slug = 'phones-tablets'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'phones-tablets-devices', 'Tablets', 'Tablet', 2 FROM categories c WHERE c.slug = 'phones-tablets'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'phones-cases', 'Cases & Accessories', 'Smartphone', 3 FROM categories c WHERE c.slug = 'phones-tablets'
ON CONFLICT (slug) DO NOTHING;

-- Computing
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'comp-laptops', 'Laptops', 'Laptop', 1 FROM categories c WHERE c.slug = 'computing'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'comp-desktops', 'Desktops & Monitors', 'Monitor', 2 FROM categories c WHERE c.slug = 'computing'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'comp-accessories', 'Accessories & Peripherals', 'Keyboard', 3 FROM categories c WHERE c.slug = 'computing'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'comp-storage', 'Storage & Memory', 'HardDrive', 4 FROM categories c WHERE c.slug = 'computing'
ON CONFLICT (slug) DO NOTHING;

-- Home & Kitchen
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'kitchen-cookware', 'Cookware', 'CookingPot', 1 FROM categories c WHERE c.slug = 'home-kitchen'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'kitchen-appliances', 'Kitchen Appliances', 'Microwave', 2 FROM categories c WHERE c.slug = 'home-kitchen'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'kitchen-dining', 'Dining & Entertaining', 'Utensils', 3 FROM categories c WHERE c.slug = 'home-kitchen'
ON CONFLICT (slug) DO NOTHING;

-- Baby & Child
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'baby-diapers', 'Diapers & Wipes', 'Baby', 1 FROM categories c WHERE c.slug = 'baby-products'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'baby-feeding', 'Feeding & Nursing', 'Baby', 2 FROM categories c WHERE c.slug = 'baby-products'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'baby-toys', 'Toys & Gear', 'Baby', 3 FROM categories c WHERE c.slug = 'baby-products'
ON CONFLICT (slug) DO NOTHING;

-- Auto & Moto
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'auto-parts', 'Car Parts', 'Car', 1 FROM categories c WHERE c.slug = 'auto-moto'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'auto-accessories', 'Car Accessories', 'Car', 2 FROM categories c WHERE c.slug = 'auto-moto'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'auto-motorcycle', 'Motorcycle Parts', 'Bike', 3 FROM categories c WHERE c.slug = 'auto-moto'
ON CONFLICT (slug) DO NOTHING;

-- DIY & Garden
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'diy-tools', 'Power Tools', 'Wrench', 1 FROM categories c WHERE c.slug = 'diy-garden'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'diy-garden-outdoor', 'Garden & Outdoor', 'Flower', 2 FROM categories c WHERE c.slug = 'diy-garden'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'diy-building', 'Building Supplies', 'Hammer', 3 FROM categories c WHERE c.slug = 'diy-garden'
ON CONFLICT (slug) DO NOTHING;

-- Video Games
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'games-consoles', 'Consoles', 'Gamepad2', 1 FROM categories c WHERE c.slug = 'video-games'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'games-games', 'Games', 'Gamepad2', 2 FROM categories c WHERE c.slug = 'video-games'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'games-accessories', 'Accessories', 'Gamepad2', 3 FROM categories c WHERE c.slug = 'video-games'
ON CONFLICT (slug) DO NOTHING;

-- Books
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'books-fiction', 'Fiction & Literature', 'BookOpen', 1 FROM categories c WHERE c.slug = 'books'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'books-education', 'Education & Reference', 'BookOpen', 2 FROM categories c WHERE c.slug = 'books'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'books-stationery', 'Stationery & Office', 'PenTool', 3 FROM categories c WHERE c.slug = 'books'
ON CONFLICT (slug) DO NOTHING;

-- Bags & Luggage
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'bags-backpacks', 'Backpacks', 'Briefcase', 1 FROM categories c WHERE c.slug = 'bags-luggage'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'bags-suitcases', 'Suitcases & Travel', 'Briefcase', 2 FROM categories c WHERE c.slug = 'bags-luggage'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'bags-handbags', 'Handbags', 'Briefcase', 3 FROM categories c WHERE c.slug = 'bags-luggage'
ON CONFLICT (slug) DO NOTHING;

-- Pet Supplies
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'pet-food', 'Pet Food', 'PawPrint', 1 FROM categories c WHERE c.slug = 'pet-supplies'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'pet-accessories', 'Accessories & Toys', 'PawPrint', 2 FROM categories c WHERE c.slug = 'pet-supplies'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'pet-health', 'Pet Health & Grooming', 'PawPrint', 3 FROM categories c WHERE c.slug = 'pet-supplies'
ON CONFLICT (slug) DO NOTHING;

-- Music
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'music-instruments', 'Musical Instruments', 'Music', 1 FROM categories c WHERE c.slug = 'music'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'music-recording', 'Recording & Audio', 'Music', 2 FROM categories c WHERE c.slug = 'music'
ON CONFLICT (slug) DO NOTHING;

-- Industrial
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'ind-safety', 'Safety & Security', 'Factory', 1 FROM categories c WHERE c.slug = 'industrial'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (parent_id, slug, name, icon, sort_order)
SELECT c.id, 'ind-supplies', 'Industrial Supplies', 'Factory', 2 FROM categories c WHERE c.slug = 'industrial'
ON CONFLICT (slug) DO NOTHING;

-- ============ TRANSLATIONS FOR NEW ROOT CATEGORIES ============
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'fr', 'Téléphones & Tablettes', 'Smartphones, tablettes et accessoires' FROM categories WHERE slug = 'phones-tablets'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'en', 'Phones & Tablets', 'Smartphones, tablets and accessories' FROM categories WHERE slug = 'phones-tablets'
ON CONFLICT (category_id, locale) DO NOTHING;

INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'fr', 'Informatique & IT', 'Ordinateurs et équipements informatiques' FROM categories WHERE slug = 'computing'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'en', 'Computing & IT', 'Computers and IT equipment' FROM categories WHERE slug = 'computing'
ON CONFLICT (category_id, locale) DO NOTHING;

INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'fr', 'Maison & Cuisine', 'Tout pour la maison et la cuisine' FROM categories WHERE slug = 'home-kitchen'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'en', 'Home & Kitchen', 'Everything for home and kitchen' FROM categories WHERE slug = 'home-kitchen'
ON CONFLICT (category_id, locale) DO NOTHING;

INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'fr', 'Bébé & Enfant', 'Produits pour bébé et enfant' FROM categories WHERE slug = 'baby-products'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'en', 'Baby & Child', 'Products for baby and child' FROM categories WHERE slug = 'baby-products'
ON CONFLICT (category_id, locale) DO NOTHING;

INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'fr', 'Auto & Moto', 'Pièces et accessoires auto et moto' FROM categories WHERE slug = 'auto-moto'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'en', 'Auto & Moto', 'Car and motorcycle parts and accessories' FROM categories WHERE slug = 'auto-moto'
ON CONFLICT (category_id, locale) DO NOTHING;

INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'fr', 'Bricolage & Jardin', 'Outils et équipements de bricolage' FROM categories WHERE slug = 'diy-garden'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'en', 'DIY & Garden', 'Tools and DIY equipment' FROM categories WHERE slug = 'diy-garden'
ON CONFLICT (category_id, locale) DO NOTHING;

INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'fr', 'Jeux Vidéo', 'Consoles, jeux et accessoires' FROM categories WHERE slug = 'video-games'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'en', 'Video Games', 'Consoles, games and accessories' FROM categories WHERE slug = 'video-games'
ON CONFLICT (category_id, locale) DO NOTHING;

INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'fr', 'Livres & Papeterie', 'Livres, papeterie et fournitures' FROM categories WHERE slug = 'books'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'en', 'Books & Stationery', 'Books, stationery and supplies' FROM categories WHERE slug = 'books'
ON CONFLICT (category_id, locale) DO NOTHING;

INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'fr', 'Bagagerie', 'Sacs, valises et bagages' FROM categories WHERE slug = 'bags-luggage'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'en', 'Bags & Luggage', 'Bags, suitcases and luggage' FROM categories WHERE slug = 'bags-luggage'
ON CONFLICT (category_id, locale) DO NOTHING;

INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'fr', 'Animalerie', 'Alimentation et accessoires pour animaux' FROM categories WHERE slug = 'pet-supplies'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'en', 'Pet Supplies', 'Pet food and accessories' FROM categories WHERE slug = 'pet-supplies'
ON CONFLICT (category_id, locale) DO NOTHING;

INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'fr', 'Musique & Instruments', 'Instruments de musique et équipement' FROM categories WHERE slug = 'music'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'en', 'Music & Instruments', 'Musical instruments and equipment' FROM categories WHERE slug = 'music'
ON CONFLICT (category_id, locale) DO NOTHING;

INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'fr', 'Industriel & Scientifique', 'Fournitures industrielles et scientifiques' FROM categories WHERE slug = 'industrial'
ON CONFLICT (category_id, locale) DO NOTHING;
INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'en', 'Industrial & Scientific', 'Industrial and scientific supplies' FROM categories WHERE slug = 'industrial'
ON CONFLICT (category_id, locale) DO NOTHING;

-- Update existing translations for renamed categories
UPDATE category_translations SET name = 'Mode & Vêtements' WHERE locale = 'fr'
  AND category_id = (SELECT id FROM categories WHERE slug = 'fashion');
UPDATE category_translations SET name = 'Fashion & Clothing' WHERE locale = 'en'
  AND category_id = (SELECT id FROM categories WHERE slug = 'fashion');
UPDATE category_translations SET name = 'Électronique & Accessoires' WHERE locale = 'fr'
  AND category_id = (SELECT id FROM categories WHERE slug = 'electronics');
UPDATE category_translations SET name = 'Electronics & Accessories' WHERE locale = 'en'
  AND category_id = (SELECT id FROM categories WHERE slug = 'electronics');
UPDATE category_translations SET name = 'Maison & Vivre' WHERE locale = 'fr'
  AND category_id = (SELECT id FROM categories WHERE slug = 'home');
