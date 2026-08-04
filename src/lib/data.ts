export type Category = {
  id: string;
  name: { fr: string; en: string };
  icon: string;
  subcategories: { id: string; name: { fr: string; en: string } }[];
};

export const categories: Category[] = [
  {
    id: 'electronics', name: { fr: 'Électronique & Appareils', en: 'Electronics & Appliances' }, icon: 'Smartphone',
    subcategories: [
      { id: 'elec-phones', name: { fr: 'Téléphones & Tablettes', en: 'Phones & Tablets' } },
      { id: 'elec-computers', name: { fr: 'Ordinateurs & Accessoires', en: 'Computers & Accessories' } },
      { id: 'elec-tv', name: { fr: 'Télévisions & Audio', en: 'TVs & Audio' } },
      { id: 'elec-appliances', name: { fr: 'Électroménager', en: 'Home Appliances' } },
    ],
  },
  {
    id: 'fashion', name: { fr: 'Mode & Vêtements', en: 'Fashion & Apparel' }, icon: 'Shirt',
    subcategories: [
      { id: 'fashion-dresses', name: { fr: 'Robes', en: 'Dresses' } },
      { id: 'fashion-boubou', name: { fr: 'Boubous & Caftans', en: 'Boubous & Kaftans' } },
      { id: 'fashion-mens', name: { fr: 'Mode Homme', en: 'Men\'s Fashion' } },
      { id: 'fashion-shoes', name: { fr: 'Chaussures', en: 'Shoes' } },
      { id: 'fashion-accessories', name: { fr: 'Sacs & Accessoires', en: 'Bags & Accessories' } },
    ],
  },
  {
    id: 'art', name: { fr: 'Art & Artisanat', en: 'Art & Crafts' }, icon: 'Palette',
    subcategories: [
      { id: 'art-masks', name: { fr: 'Masques Africains', en: 'African Masks' } },
      { id: 'art-sculptures', name: { fr: 'Sculptures & Statuettes', en: 'Sculptures & Figurines' } },
      { id: 'art-paintings', name: { fr: 'Peintures & Toiles', en: 'Paintings & Canvas' } },
      { id: 'art-souvenirs', name: { fr: 'Souvenirs & Cadeaux', en: 'Souvenirs & Gifts' } },
    ],
  },
  {
    id: 'jewelry', name: { fr: 'Bijoux & Parures', en: 'Jewelry & Adornments' }, icon: 'Gem',
    subcategories: [
      { id: 'jewelry-necklaces', name: { fr: 'Colliers', en: 'Necklaces' } },
      { id: 'jewelry-earrings', name: { fr: 'Boucles d\'oreilles', en: 'Earrings' } },
      { id: 'jewelry-rings', name: { fr: 'Bagues', en: 'Rings' } },
      { id: 'jewelry-bracelets', name: { fr: 'Bracelets', en: 'Bracelets' } },
    ],
  },
  {
    id: 'beauty', name: { fr: 'Beauté & Cosmétiques', en: 'Beauty & Cosmetics' }, icon: 'Sparkles',
    subcategories: [
      { id: 'beauty-skincare', name: { fr: 'Soins de la peau', en: 'Skincare' } },
      { id: 'beauty-hair', name: { fr: 'Soins des cheveux', en: 'Hair Care' } },
      { id: 'beauty-oils', name: { fr: 'Huiles Naturelles', en: 'Natural Oils' } },
      { id: 'beauty-makeup', name: { fr: 'Maquillage', en: 'Makeup' } },
    ],
  },
  {
    id: 'home', name: { fr: 'Maison, Cuisine & Déco', en: 'Home, Kitchen & Decor' }, icon: 'Home',
    subcategories: [
      { id: 'home-baskets', name: { fr: 'Paniers de Bolga & Tressages', en: 'Bolga Baskets & Weavings' } },
      { id: 'home-decor', name: { fr: 'Objets de Décoration', en: 'Decorative Items' } },
      { id: 'home-furniture', name: { fr: 'Meubles & Mobilier', en: 'Furniture' } },
      { id: 'home-cookware', name: { fr: 'Ustensiles de Cuisine', en: 'Cookware & Kitchen' } },
    ],
  },
  {
    id: 'food', name: { fr: 'Épicerie & Agroalimentaire', en: 'Food & Agribusiness' }, icon: 'ShoppingBasket',
    subcategories: [
      { id: 'food-coffee', name: { fr: 'Café & Thé', en: 'Coffee & Tea' } },
      { id: 'food-spices', name: { fr: 'Épices & Condiments', en: 'Spices & Seasonings' } },
      { id: 'food-cacao', name: { fr: 'Cacao, Chocolat & Confiseries', en: 'Cocoa, Chocolate & Sweets' } },
      { id: 'food-grains', name: { fr: 'Céréales & Grains', en: 'Cereals & Grains' } },
    ],
  },
  {
    id: 'books', name: { fr: 'Livres, Culture & Papeterie', en: 'Books & Stationery' }, icon: 'BookOpen',
    subcategories: [
      { id: 'books-novels', name: { fr: 'Romans & Littérature', en: 'Novels & Literature' } },
      { id: 'books-education', name: { fr: 'Manuels Scolaires', en: 'Educational Books' } },
      { id: 'books-stationery', name: { fr: 'Fournitures de bureau', en: 'Office Stationery' } },
    ],
  },
  {
    id: 'kids', name: { fr: 'Bébés, Enfants & Jouets', en: 'Baby, Kids & Toys' }, icon: 'Gamepad2',
    subcategories: [
      { id: 'kids-toys', name: { fr: 'Jouets & Jeux', en: 'Toys & Games' } },
      { id: 'kids-clothes', name: { fr: 'Vêtements Enfant', en: 'Children\'s Clothes' } },
      { id: 'kids-babycare', name: { fr: 'Puériculture', en: 'Baby Care' } },
    ],
  },
  {
    id: 'automotive', name: { fr: 'Automobile & Outillage', en: 'Automotive & Tools' }, icon: 'Wrench',
    subcategories: [
      { id: 'auto-parts', name: { fr: 'Pièces & Accessoires Auto', en: 'Car Parts & Accessories' } },
      { id: 'auto-tools', name: { fr: 'Outillage & Matériel', en: 'Hand Tools & Hardware' } },
    ],
  },
  {
    id: 'textiles', name: { fr: 'Textiles & Tissus', en: 'Textiles & Fabrics' }, icon: 'Scissors',
    subcategories: [
      { id: 'textiles-kente', name: { fr: 'Tissu Kente', en: 'Kente Fabric' } },
      { id: 'textiles-wax', name: { fr: 'Pagne Wax', en: 'Wax Print' } },
      { id: 'textiles-aso', name: { fr: 'Tissu Aso Oke', en: 'Aso Oke' } },
    ],
  },
];

export type Variation = {
  name: { fr: string; en: string };
  options: { id: string; value: { fr: string; en: string } }[];
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: { fr: string; en: string };
  verified: boolean;
};

export type Seller = {
  id: string;
  name: string;
  countryId: string;
  cityName: string;
  rating: number;
  reviews: number;
  badge: 'verified' | 'premium' | 'enterprise';
  plan: 'starter' | 'premium' | 'enterprise';
  banner: string;
  logo: string;
  productsCount: number;
  joinedYear: number;
  description: { fr: string; en: string };
};

export type Product = {
  id: string;
  name: string;
  description: { fr: string; en: string };
  price: number;
  oldPrice?: number;
  currency: string;
  categoryId: string;
  subcategoryId?: string;
  sellerId: string;
  sellerName: string;
  countryId: string;
  cityName: string;
  rating: number;
  reviews: number;
  stock: number;
  images: string[];
  sponsored?: boolean;
  createdAt: string;
  variations?: Variation[];
  reviewList?: Review[];
  features?: { fr: string; en: string }[];
};

const px = (id: string) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1080`;

export const sellers: Seller[] = [
  {
    id: 's1', name: 'Maison Baoulé', countryId: 'ci', cityName: 'Abidjan',
    rating: 4.9, reviews: 342, badge: 'enterprise', plan: 'enterprise',
    banner: px('30088728'), logo: px('32433910'), productsCount: 87, joinedYear: 2023,
    description: { fr: 'Maison de couture premium spécialisée en wax et créations contemporaines.', en: 'Premium fashion house specializing in wax and contemporary creations.' },
  },
  {
    id: 's2', name: 'Teranga Crafts', countryId: 'sn', cityName: 'Dakar',
    rating: 4.8, reviews: 218, badge: 'premium', plan: 'premium',
    banner: px('999283'), logo: px('33111458'), productsCount: 54, joinedYear: 2023,
    description: { fr: 'Artisanat sénégalais authentique, masques et sculptures.', en: 'Authentic Senegalese crafts, masks and sculptures.' },
  },
  {
    id: 's3', name: 'Lagos Luxe', countryId: 'ng', cityName: 'Lagos',
    rating: 4.7, reviews: 189, badge: 'premium', plan: 'premium',
    banner: px('8526816'), logo: px('11086637'), productsCount: 63, joinedYear: 2024,
    description: { fr: 'Mode masculine et féminine nigériane haut de gamme.', en: 'High-end Nigerian men\'s and women\'s fashion.' },
  },
  {
    id: 's4', name: 'Nairobi Weaves', countryId: 'ke', cityName: 'Nairobi',
    rating: 4.9, reviews: 156, badge: 'enterprise', plan: 'enterprise',
    banner: px('29672003'), logo: px('33627196'), productsCount: 41, joinedYear: 2023,
    description: { fr: 'Instruments de musique et artisanat kenyan.', en: 'Musical instruments and Kenyan crafts.' },
  },
  {
    id: 's5', name: 'Accra Gold', countryId: 'gh', cityName: 'Accra',
    rating: 4.6, reviews: 98, badge: 'verified', plan: 'starter',
    banner: px('36773397'), logo: px('30988134'), productsCount: 12, joinedYear: 2024,
    description: { fr: 'Textiles Kente et bijoux ghanéens.', en: 'Kente textiles and Ghanaian jewelry.' },
  },
  {
    id: 's6', name: 'Bouaké Textiles', countryId: 'ci', cityName: 'Bouaké',
    rating: 4.5, reviews: 67, badge: 'verified', plan: 'starter',
    banner: px('11284698'), logo: px('19183483'), productsCount: 8, joinedYear: 2024,
    description: { fr: 'Produits de beauté naturels et textiles.', en: 'Natural beauty products and textiles.' },
  },
];

const commonReviews: Review[] = [
  { id: 'r1', author: 'Awa K.', rating: 5, date: '2026-07-20', comment: { fr: 'Qualité exceptionnelle, livraison rapide par le vendeur.', en: 'Exceptional quality, fast delivery by the seller.' }, verified: true },
  { id: 'r2', author: 'Mamadou D.', rating: 4, date: '2026-07-15', comment: { fr: 'Très bon produit, conforme à la description.', en: 'Very good product, matches the description.' }, verified: true },
  { id: 'r3', author: 'Fatou N.', rating: 5, date: '2026-07-10', comment: { fr: 'Je recommande vivement, artisanat de grande qualité.', en: 'Highly recommend, great quality craftsmanship.' }, verified: false },
];

const sizeVariation: Variation = {
  name: { fr: 'Taille', en: 'Size' },
  options: [
    { id: 's', value: { fr: 'S', en: 'S' } },
    { id: 'm', value: { fr: 'M', en: 'M' } },
    { id: 'l', value: { fr: 'L', en: 'L' } },
    { id: 'xl', value: { fr: 'XL', en: 'XL' } },
  ],
};

const colorVariation: Variation = {
  name: { fr: 'Couleur', en: 'Color' },
  options: [
    { id: 'gold', value: { fr: 'Or', en: 'Gold' } },
    { id: 'earth', value: { fr: 'Terre', en: 'Earth' } },
    { id: 'cocoa', value: { fr: 'Cacao', en: 'Cocoa' } },
  ],
};

export const products: Product[] = [
  {
    id: 'p1', name: 'Robe Wax Premium', description: { fr: 'Robe en pagne wax authentique, couture artisanale. Tissu importé du Ghana, confectionnée à Abidjan.', en: 'Authentic wax print dress, artisan tailoring. Fabric imported from Ghana, tailored in Abidjan.' },
    price: 45, oldPrice: 60, currency: '$', categoryId: 'fashion', subcategoryId: 'fashion-dresses', sellerId: 's1', sellerName: 'Maison Baoulé',
    countryId: 'ci', cityName: 'Abidjan', rating: 4.9, reviews: 87, stock: 12,
    images: [px('30088728'), px('18111538'), px('31871810')], sponsored: true, createdAt: '2026-07-15',
    variations: [sizeVariation, colorVariation],
    reviewList: commonReviews,
    features: [
      { fr: 'Wax 100% coton', en: '100% cotton wax' },
      { fr: 'Couture artisanale', en: 'Artisan tailoring' },
      { fr: 'Lavable en machine', en: 'Machine washable' },
    ],
  },
  {
    id: 'p2', name: 'Collier Akan Or', description: { fr: 'Collier en or 18 carats, motif traditionnel akan. Fait main par des orfèvres d\'Abidjan.', en: '18k gold necklace, traditional Akan motif. Handmade by Abidjan goldsmiths.' },
    price: 320, currency: '$', categoryId: 'jewelry', subcategoryId: 'jewelry-necklaces', sellerId: 's1', sellerName: 'Maison Baoulé',
    countryId: 'ci', cityName: 'Abidjan', rating: 5.0, reviews: 34, stock: 3,
    images: [px('32693394'), px('10727342'), px('19922497')], createdAt: '2026-07-10',
    variations: [colorVariation],
    reviewList: commonReviews.slice(0, 2),
    features: [
      { fr: 'Or 18 carats', en: '18k gold' },
      { fr: 'Fait main', en: 'Handmade' },
      { fr: 'Certificat d\'authenticité', en: 'Authenticity certificate' },
    ],
  },
  {
    id: 'p3', name: 'Masque Sénoufo', description: { fr: 'Masque sculpté à la main, bois noble. Pièce unique d\'art traditionnel.', en: 'Hand-carved mask, fine wood. Unique piece of traditional art.' },
    price: 85, currency: '$', categoryId: 'art', subcategoryId: 'art-masks', sellerId: 's2', sellerName: 'Teranga Crafts',
    countryId: 'sn', cityName: 'Dakar', rating: 4.8, reviews: 56, stock: 7,
    images: [px('999283'), px('33111458'), px('16563046')], sponsored: true, createdAt: '2026-07-20',
    reviewList: commonReviews,
    features: [
      { fr: 'Bois noble sculpté main', en: 'Hand-carved fine wood' },
      { fr: 'Pièce unique', en: 'Unique piece' },
    ],
  },
  {
    id: 'p4', name: 'Beurre de Karité Pur', description: { fr: 'Beurre de karité 100% naturel, du Burkina Faso. Non raffiné, pressé traditionnellement.', en: '100% natural shea butter, from Burkina Faso. Unrefined, traditionally pressed.' },
    price: 12, currency: '$', categoryId: 'beauty', subcategoryId: 'beauty-skincare', sellerId: 's2', sellerName: 'Teranga Crafts',
    countryId: 'sn', cityName: 'Dakar', rating: 4.7, reviews: 142, stock: 80,
    images: [px('11284698'), px('4735913'), px('12572310')], createdAt: '2026-07-18',
    reviewList: commonReviews,
    features: [
      { fr: '100% naturel', en: '100% natural' },
      { fr: 'Non raffiné', en: 'Unrefined' },
      { fr: '250ml', en: '250ml' },
    ],
  },
  {
    id: 'p5', name: 'Aso Oke Wrapper', description: { fr: 'Tissu Aso Oke tissé à la main, Nigeria. Idéal pour cérémonies et événements spéciaux.', en: 'Hand-woven Aso Oke fabric, Nigeria. Perfect for ceremonies and special events.' },
    price: 65, currency: '$', categoryId: 'textiles', subcategoryId: 'textiles-aso', sellerId: 's3', sellerName: 'Lagos Luxe',
    countryId: 'ng', cityName: 'Lagos', rating: 4.6, reviews: 41, stock: 15,
    images: [px('24738158'), px('3592348'), px('30929467')], createdAt: '2026-07-22',
    variations: [colorVariation],
    reviewList: commonReviews.slice(0, 2),
  },
  {
    id: 'p6', name: 'Collier Perlé Maasai', description: { fr: 'Collier perlé traditionnel Maasai, Kenya. Artisanat authentique aux couleurs vibrantes.', en: 'Traditional Maasai beaded collar, Kenya. Authentic craft with vibrant colors.' },
    price: 38, currency: '$', categoryId: 'jewelry', subcategoryId: 'jewelry-necklaces', sellerId: 's4', sellerName: 'Nairobi Weaves',
    countryId: 'ke', cityName: 'Nairobi', rating: 4.9, reviews: 29, stock: 9,
    images: [px('35619407'), px('34138618'), px('16175741')], createdAt: '2026-07-19',
    reviewList: commonReviews,
  },
  {
    id: 'p7', name: 'Étole Kente Royale', description: { fr: 'Étole Kente authentique du Ghana, tissée à la main sur métier traditionnel.', en: 'Authentic Kente stole from Ghana, hand-woven on traditional loom.' },
    price: 55, currency: '$', categoryId: 'textiles', subcategoryId: 'textiles-kente', sellerId: 's5', sellerName: 'Accra Gold',
    countryId: 'gh', cityName: 'Accra', rating: 4.5, reviews: 18, stock: 6,
    images: [px('36773397'), px('30988134'), px('12716001')], createdAt: '2026-07-21',
    reviewList: commonReviews.slice(0, 2),
  },
  {
    id: 'p8', name: 'Panier Tressé Bolga', description: { fr: 'Panier tressé à la main, Bolgatanga, Ghana. Éco-responsable et durable.', en: 'Hand-woven basket, Bolgatanga, Ghana. Eco-friendly and durable.' },
    price: 28, currency: '$', categoryId: 'home', subcategoryId: 'home-baskets', sellerId: 's5', sellerName: 'Accra Gold',
    countryId: 'gh', cityName: 'Accra', rating: 4.7, reviews: 22, stock: 20,
    images: [px('31653080'), px('38483283'), px('32879941')], createdAt: '2026-07-16',
    reviewList: commonReviews,
  },
  {
    id: 'p9', name: 'Huile de Baobab Bio', description: { fr: 'Huile de baobab biologique, pressée à froid. Nourrit peau et cheveux.', en: 'Organic baobab oil, cold-pressed. Nourishes skin and hair.' },
    price: 18, currency: '$', categoryId: 'beauty', subcategoryId: 'beauty-oils', sellerId: 's6', sellerName: 'Bouaké Textiles',
    countryId: 'ci', cityName: 'Bouaké', rating: 4.6, reviews: 34, stock: 50,
    images: [px('4735910'), px('8015483'), px('6963142')], createdAt: '2026-07-23',
    reviewList: commonReviews,
  },
  {
    id: 'p10', name: 'Boubou Brodé Premium', description: { fr: 'Boubou brodé main, coton premium. Élégance traditionnelle nigériane.', en: 'Hand-embroidered boubou, premium cotton. Traditional Nigerian elegance.' },
    price: 72, oldPrice: 95, currency: '$', categoryId: 'fashion', subcategoryId: 'fashion-boubou', sellerId: 's3', sellerName: 'Lagos Luxe',
    countryId: 'ng', cityName: 'Lagos', rating: 4.8, reviews: 47, stock: 11,
    images: [px('8526816'), px('11086637'), px('29063157')], createdAt: '2026-07-14',
    variations: [sizeVariation],
    reviewList: commonReviews,
  },
  {
    id: 'p11', name: 'Tambour Djembe Artisanal', description: { fr: 'Djembe authentique, peau de chèvre. Sculpté et monté à Nairobi.', en: 'Authentic djembe, goat skin. Carved and assembled in Nairobi.' },
    price: 95, currency: '$', categoryId: 'art', subcategoryId: 'art-sculptures', sellerId: 's4', sellerName: 'Nairobi Weaves',
    countryId: 'ke', cityName: 'Nairobi', rating: 4.9, reviews: 38, stock: 5,
    images: [px('29712219'), px('29672003'), px('32803152')], createdAt: '2026-07-12',
    reviewList: commonReviews,
  },
  {
    id: 'p12', name: 'Café Arabica Kenya AA', description: { fr: 'Café Arabica Kenya AA, torréfaction artisanale. Notes fruitées et corps moyen.', en: 'Kenya AA Arabica coffee, artisan roast. Fruity notes, medium body.' },
    price: 22, currency: '$', categoryId: 'food', subcategoryId: 'food-coffee', sellerId: 's4', sellerName: 'Nairobi Weaves',
    countryId: 'ke', cityName: 'Nairobi', rating: 4.7, reviews: 61, stock: 40,
    images: [px('3794802'), px('4820660'), px('29324430')], createdAt: '2026-07-17',
    reviewList: commonReviews,
  },
  {
    id: 'p13', name: 'Robe Traditionnelle Élégante', description: { fr: 'Robe traditionnelle colorée, parfaite pour occasions spéciales.', en: 'Colorful traditional dress, perfect for special occasions.' },
    price: 52, currency: '$', categoryId: 'fashion', subcategoryId: 'fashion-dresses', sellerId: 's1', sellerName: 'Maison Baoulé',
    countryId: 'ci', cityName: 'Abidjan', rating: 4.8, reviews: 53, stock: 14,
    images: [px('32433910'), px('34895185'), px('34169432')], createdAt: '2026-07-19',
    variations: [sizeVariation, colorVariation],
    reviewList: commonReviews,
  },
  {
    id: 'p14', name: 'Boubou Masculin Agbada', description: { fr: 'Agbada brodé, tenue traditionnelle masculine nigériane.', en: 'Embroidered agbada, traditional Nigerian men\'s attire.' },
    price: 68, currency: '$', categoryId: 'fashion', subcategoryId: 'fashion-boubou', sellerId: 's3', sellerName: 'Lagos Luxe',
    countryId: 'ng', cityName: 'Lagos', rating: 4.7, reviews: 29, stock: 8,
    images: [px('9310866'), px('36029407'), px('32524622')], createdAt: '2026-07-20',
    variations: [sizeVariation],
    reviewList: commonReviews.slice(0, 2),
  },
  {
    id: 'p15', name: 'Masque Décoratif Coloré', description: { fr: 'Masque décoratif peint à la main, parfait pour la décoration intérieure.', en: 'Hand-painted decorative mask, perfect for interior decoration.' },
    price: 45, currency: '$', categoryId: 'art', subcategoryId: 'art-masks', sellerId: 's2', sellerName: 'Teranga Crafts',
    countryId: 'sn', cityName: 'Dakar', rating: 4.6, reviews: 18, stock: 12,
    images: [px('5028727'), px('32448078'), px('32405910')], createdAt: '2026-07-21',
    reviewList: commonReviews.slice(0, 2),
  },
  {
    id: 'p16', name: 'Panier Décoratif Marrakech', description: { fr: 'Panier décoratif tressé, style marocain. Idéal pour rangement et déco.', en: 'Decorative woven basket, Moroccan style. Ideal for storage and decor.' },
    price: 32, currency: '$', categoryId: 'home', subcategoryId: 'home-baskets', sellerId: 's5', sellerName: 'Accra Gold',
    countryId: 'gh', cityName: 'Accra', rating: 4.5, reviews: 15, stock: 18,
    images: [px('20852593'), px('11614418'), px('30480965')], createdAt: '2026-07-18',
    reviewList: commonReviews.slice(0, 2),
  },
];

export function getSeller(id: string) {
  return sellers.find((s) => s.id === id);
}
export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}
export function productsBySeller(sellerId: string) {
  return products.filter((p) => p.sellerId === sellerId);
}
export function productsByCategory(categoryId: string) {
  return products.filter((p) => p.categoryId === categoryId);
}
export function searchProducts(query: string, locale: 'fr' | 'en') {
  const q = query.toLowerCase();
  return products.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.description[locale].toLowerCase().includes(q) ||
    p.sellerName.toLowerCase().includes(q)
  );
}
export function searchSuggestions(query: string, locale: 'fr' | 'en') {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const productNames = products.filter((p) => p.name.toLowerCase().includes(q)).map((p) => p.name).slice(0, 5);
  const sellerNames = sellers.filter((s) => s.name.toLowerCase().includes(q)).map((s) => s.name).slice(0, 3);
  const categoryNames = categories.filter((c) => c.name[locale].toLowerCase().includes(q)).map((c) => c.name[locale]).slice(0, 2);
  return [...productNames, ...sellerNames, ...categoryNames];
}
