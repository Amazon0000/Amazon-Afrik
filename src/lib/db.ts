import { supabase } from './supabase';

export type Country = {
  id: string; name: string; flag: string; phone_code: string;
  currency_code: string; is_active: boolean; is_african: boolean; region: string;
};

export type Currency = {
  code: string; name: string; symbol: string; exchange_rate: number; is_active: boolean;
};

export type Category = {
  id: string; parent_id: string | null; slug: string; name: string;
  icon: string | null; banner_url: string | null; is_featured: boolean;
  is_trending: boolean; sort_order: number; is_active: boolean;
  children?: Category[];
};

export type Brand = {
  id: string; name: string; slug: string; logo_url: string | null;
  country_id: string | null; is_verified: boolean; is_active: boolean;
};

export type Seller = {
  id: string; business_name: string; store_slug: string;
  store_logo_url: string | null; store_banner_url: string | null;
  description: string | null; country_id: string | null; city: string | null;
  phone: string | null; plan: 'starter' | 'premium' | 'enterprise';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  business_type: string | null; rating: number; total_reviews: number;
  total_products: number; joined_year: number | null; is_official: boolean;
};

export type ProductImage = { id: string; image_url: string; sort_order: number; is_hidden?: boolean };
export type ProductVariant = { id: string; variant_type: string; variant_value: string; price_adjustment: number; stock: number };
export type ProductSpec = { id: string; spec_name: string; spec_value: string };
export type Review = { id: string; author_name: string; rating: number; comment: string | null; is_verified: boolean; created_at: string };

export type Product = {
  id: string; seller_id: string; category_id: string | null; brand_id: string | null;
  country_id: string | null; name: string; slug: string; description: string | null;
  price: number; old_price: number | null; currency_code: string; sku: string | null;
  stock: number; rating: number; total_reviews: number;
  is_sponsored: boolean; is_active: boolean; created_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null; reviewed_at: string | null; rejection_reason: string | null;
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
  product_specifications?: ProductSpec[];
  reviews?: Review[];
  sellers?: Seller;
  categories?: Category;
  brands?: Brand;
  countries?: Country;
};

export type AdCampaign = {
  id: string; seller_id: string; name: string; target_country: string | null;
  target_city: string | null; target_category: string | null; budget: number;
  duration_days: number; impressions: number; clicks: number; conversions: number;
  status: 'pending' | 'active' | 'ended' | 'rejected'; created_at: string;
  reviewed_by?: string | null; reviewed_at?: string | null;
};

export type PaymentProvider = {
  id: string; name: string; slug: string; logo_url: string | null;
  is_active: boolean; countries: string[]; sort_order: number;
};

export type Order = {
  id: string; user_id: string; seller_id: string | null;
  status: 'pending' | 'confirmed' | 'preparing' | 'inTransit' | 'delivered' | 'cancelled';
  total: number; currency_code: string; payment_method: string | null;
  delivery_address: string | null; tracking_id: string | null; created_at: string;
  order_items?: OrderItem[];
  sellers?: Seller;
};

export type OrderItem = {
  id: string; order_id: string; product_id: string | null;
  product_name: string; qty: number; price: number; image_url: string | null;
};

export type Address = {
  id: string; label: string; full_name: string; phone: string | null;
  street: string; country_id: string | null; city: string | null;
  region: string | null; district: string | null; neighborhood: string | null;
  landmark: string | null; is_default: boolean;
};

export type AuditLog = {
  id: string; actor_id: string | null; actor_name: string | null;
  action: string; target_type: string | null; target_id: string | null;
  target_name: string | null; previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null; reason: string | null;
  ip_address: string | null; created_at: string;
};

export type ComplianceReport = {
  id: string; reporter_id: string | null; reporter_name: string | null;
  report_type: string; target_type: string; target_id: string | null;
  target_name: string | null; reason: string | null; description: string | null;
  status: string; case_id: string | null; created_at: string;
};

export type ComplianceCase = {
  id: string; case_number: string; status: string; priority: string;
  assigned_to: string | null; assigned_name: string | null;
  seller_id: string | null; seller_name: string | null;
  product_id: string | null; report_ids: string[] | null;
  ai_risk_level: string | null; ai_analysis: Record<string, unknown> | null;
  internal_notes: string | null; resolution: string | null;
  created_at: string; updated_at: string;
};

export type StoreHealthScore = {
  id: string; seller_id: string; health_score: number; health_status: string;
  verification_score: number; order_completion_score: number; rating_score: number;
  refund_rate_score: number; complaint_rate_score: number; response_time_score: number;
  shipping_score: number; profile_completeness_score: number; subscription_score: number;
  compliance_score: number; flagged_for_review: boolean; calculated_at: string;
};

export type SellerPaymentMethod = {
  id: string; seller_id: string; provider_name: string; provider_type: string;
  account_identifier: string | null; is_active: boolean; is_verified: boolean;
  display_name: string | null; instructions: string | null; created_at: string;
};

export type SellerDocument = {
  id: string; seller_id: string; doc_type: string; file_url: string;
  file_name: string | null; status: string; admin_notes: string | null;
  flagged_reason: string | null; reviewed_by: string | null; reviewed_at: string | null;
  created_at: string;
};

export type ComplianceSeller = Seller & {
  created_at?: string;
  risk_score: number | null;
  compliance_score: number | null;
  health_status: string | null;
  strikes_count: number | null;
  suspended_reason: string | null;
  suspended_at: string | null;
  identity_selfie_url: string | null;
  warehouse_photos: string[] | null;
  store_photos: string[] | null;
  phone_verified: boolean | null;
  email_verified: boolean | null;
  bank_verified: boolean | null;
  compliance_status: string | null;
  registration_number: string | null;
  vat_number: string | null;
  bank_name: string | null;
  bank_iban: string | null;
  bank_swift: string | null;
  mobile_money_number: string | null;
};

// ============ QUERIES ============

const MOCK_COUNTRIES: Country[] = [
  { id: 'CI', name: 'Côte d’Ivoire', flag: '🇨🇮', phone_code: '+225', currency_code: 'XOF', is_active: true, is_african: true, region: 'West' },
  { id: 'SN', name: 'Sénégal', flag: '🇸🇳', phone_code: '+221', currency_code: 'XOF', is_active: true, is_african: true, region: 'West' },
  { id: 'NG', name: 'Nigeria', flag: '🇳🇬', phone_code: '+234', currency_code: 'NGN', is_active: true, is_african: true, region: 'West' },
  { id: 'KE', name: 'Kenya', flag: '🇰🇪', phone_code: '+254', currency_code: 'KES', is_active: true, is_african: true, region: 'East' },
  { id: 'GH', name: 'Ghana', flag: '🇬🇭', phone_code: '+233', currency_code: 'GHS', is_active: true, is_african: true, region: 'West' },
  { id: 'ZA', name: 'South Africa', flag: '🇿🇦', phone_code: '+27', currency_code: 'ZAR', is_active: true, is_african: true, region: 'South' },
];

const MOCK_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', exchange_rate: 1.0, is_active: true },
  { code: 'XOF', name: 'CFA Franc', symbol: 'FCFA', exchange_rate: 610.0, is_active: true },
  { code: 'NGN', name: 'Naira', symbol: '₦', exchange_rate: 1500.0, is_active: true },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', exchange_rate: 130.0, is_active: true },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', exchange_rate: 14.5, is_active: true },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', exchange_rate: 18.5, is_active: true },
];

const MOCK_CATEGORIES: Category[] = [
  { id: 'electronics', parent_id: null, slug: 'electronics', name: 'Electronics', icon: 'Smartphone', banner_url: null, is_featured: true, is_trending: true, sort_order: 1, is_active: true },
  { id: 'fashion', parent_id: null, slug: 'fashion', name: 'Fashion', icon: 'Shirt', banner_url: null, is_featured: true, is_trending: true, sort_order: 2, is_active: true },
  { id: 'beauty', parent_id: null, slug: 'beauty', name: 'Beauty', icon: 'Sparkles', banner_url: null, is_featured: true, is_trending: false, sort_order: 3, is_active: true },
  { id: 'jewelry', parent_id: null, slug: 'jewelry', name: 'Jewelry', icon: 'Gem', banner_url: null, is_featured: true, is_trending: false, sort_order: 4, is_active: true },
  { id: 'home', parent_id: null, slug: 'home', name: 'Home & Kitchen', icon: 'Home', banner_url: null, is_featured: true, is_trending: false, sort_order: 5, is_active: true },
  { id: 'food-grocery', parent_id: null, slug: 'food-grocery', name: 'Groceries', icon: 'ShoppingBasket', banner_url: null, is_featured: false, is_trending: false, sort_order: 6, is_active: true },
  { id: 'art-crafts', parent_id: null, slug: 'art-crafts', name: 'Art & Crafts', icon: 'Palette', banner_url: null, is_featured: true, is_trending: true, sort_order: 7, is_active: true },
  { id: 'textiles', parent_id: null, slug: 'textiles', name: 'Textiles', icon: 'Scissors', banner_url: null, is_featured: true, is_trending: true, sort_order: 8, is_active: true },
];

const MOCK_SELLERS: Seller[] = [
  { id: 's1', business_name: 'Maison Baoulé', store_slug: 'maison-baoule', store_logo_url: 'https://images.pexels.com/photos/32433910/pexels-photo-32433910.jpeg?auto=compress&cs=tinysrgb&w=300', store_banner_url: 'https://images.pexels.com/photos/30088728/pexels-photo-30088728.jpeg?auto=compress&cs=tinysrgb&w=1000', description: 'Premium fashion house specializing in wax and contemporary creations.', country_id: 'CI', city: 'Abidjan', phone: '+22507000000', plan: 'enterprise', status: 'approved', business_type: 'Company', rating: 4.9, total_reviews: 342, total_products: 87, joined_year: 2023, is_official: true },
  { id: 's2', business_name: 'Teranga Crafts', store_slug: 'teranga-crafts', store_logo_url: 'https://images.pexels.com/photos/33111458/pexels-photo-33111458.jpeg?auto=compress&cs=tinysrgb&w=300', store_banner_url: 'https://images.pexels.com/photos/999283/pexels-photo-999283.jpeg?auto=compress&cs=tinysrgb&w=1000', description: 'Authentic Senegalese crafts, masks and sculptures.', country_id: 'SN', city: 'Dakar', phone: '+22177000000', plan: 'premium', status: 'approved', business_type: 'Individual', rating: 4.8, total_reviews: 218, total_products: 54, joined_year: 2023, is_official: false },
  { id: 's3', business_name: 'Lagos Luxe', store_slug: 'lagos-luxe', store_logo_url: 'https://images.pexels.com/photos/11086637/pexels-photo-11086637.jpeg?auto=compress&cs=tinysrgb&w=300', store_banner_url: 'https://images.pexels.com/photos/8526816/pexels-photo-8526816.jpeg?auto=compress&cs=tinysrgb&w=1000', description: 'High-end Nigerian men\'s and women\'s fashion.', country_id: 'NG', city: 'Lagos', phone: '+23480000000', plan: 'premium', status: 'approved', business_type: 'Company', rating: 4.7, total_reviews: 189, total_products: 63, joined_year: 2024, is_official: false },
  { id: 's4', business_name: 'Nairobi Weaves', store_slug: 'nairobi-weaves', store_logo_url: 'https://images.pexels.com/photos/33627196/pexels-photo-33627196.jpeg?auto=compress&cs=tinysrgb&w=300', store_banner_url: 'https://images.pexels.com/photos/29672003/pexels-photo-29672003.jpeg?auto=compress&cs=tinysrgb&w=1000', description: 'Musical instruments and Kenyan crafts.', country_id: 'KE', city: 'Nairobi', phone: '+25470000000', plan: 'enterprise', status: 'approved', business_type: 'Company', rating: 4.9, total_reviews: 156, total_products: 41, joined_year: 2023, is_official: true },
  { id: 's5', business_name: 'Accra Gold', store_slug: 'accra-gold', store_logo_url: 'https://images.pexels.com/photos/30988134/pexels-photo-30988134.jpeg?auto=compress&cs=tinysrgb&w=300', store_banner_url: 'https://images.pexels.com/photos/36773397/pexels-photo-36773397.jpeg?auto=compress&cs=tinysrgb&w=1000', description: 'Kente textiles and Ghanaian jewelry.', country_id: 'GH', city: 'Accra', phone: '+2332000000', plan: 'starter', status: 'approved', business_type: 'Individual', rating: 4.6, total_reviews: 98, total_products: 12, joined_year: 2024, is_official: false },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    seller_id: 's1',
    category_id: 'fashion',
    brand_id: null,
    country_id: 'CI',
    name: 'Robe Wax Premium',
    slug: 'robe-wax-premium',
    description: 'Robe en pagne wax authentique, couture artisanale. Tissu importé du Ghana, confectionnée à Abidjan.',
    price: 45,
    old_price: 60,
    currency_code: 'USD',
    sku: 'WAX-ROBE-1',
    stock: 12,
    rating: 4.9,
    total_reviews: 87,
    is_sponsored: true,
    is_active: true,
    created_at: '2026-07-15T00:00:00Z',
    approval_status: 'approved',
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    product_images: [{ id: 'img1', image_url: 'https://images.pexels.com/photos/30088728/pexels-photo-30088728.jpeg?auto=compress&cs=tinysrgb&w=1000', sort_order: 0 }],
    product_variants: [
      { id: 'v1', variant_type: 'Size', variant_value: 'S', price_adjustment: 0, stock: 5 },
      { id: 'v2', variant_type: 'Size', variant_value: 'M', price_adjustment: 0, stock: 4 },
      { id: 'v3', variant_type: 'Size', variant_value: 'L', price_adjustment: 0, stock: 3 },
    ],
    product_specifications: [
      { id: 'sp1', spec_name: 'Material', spec_value: '100% Cotton Wax' },
      { id: 'sp2', spec_name: 'Origin', spec_value: 'Ghana / Ivory Coast' },
    ],
    reviews: [
      { id: 'r1', author_name: 'Awa K.', rating: 5, comment: 'Qualité exceptionnelle, livraison rapide par le vendeur.', is_verified: true, created_at: '2026-07-20T00:00:00Z' },
      { id: 'r2', author_name: 'Mamadou D.', rating: 4, comment: 'Très bon produit, conforme à la description.', is_verified: true, created_at: '2026-07-15T00:00:00Z' },
    ],
    sellers: MOCK_SELLERS[0],
    categories: MOCK_CATEGORIES[1],
    countries: MOCK_COUNTRIES[0],
  },
  {
    id: 'p2',
    seller_id: 's1',
    category_id: 'jewelry',
    brand_id: null,
    country_id: 'CI',
    name: 'Collier Akan Or',
    slug: 'collier-akan-or',
    description: 'Collier en or 18 carats, motif traditionnel akan. Fait main par des orfèvres d\'Abidjan.',
    price: 320,
    old_price: null,
    currency_code: 'USD',
    sku: 'AKAN-GOLD-1',
    stock: 3,
    rating: 5.0,
    total_reviews: 34,
    is_sponsored: false,
    is_active: true,
    created_at: '2026-07-10T00:00:00Z',
    approval_status: 'approved',
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    product_images: [{ id: 'img2', image_url: 'https://images.pexels.com/photos/32693394/pexels-photo-32693394.jpeg?auto=compress&cs=tinysrgb&w=1000', sort_order: 0 }],
    product_specifications: [
      { id: 'sp3', spec_name: 'Material', spec_value: '18k Real Gold' },
    ],
    reviews: [
      { id: 'r3', author_name: 'Fatou N.', rating: 5, comment: 'Je recommande vivement, or très brillant.', is_verified: true, created_at: '2026-07-18T00:00:00Z' },
    ],
    sellers: MOCK_SELLERS[0],
    categories: MOCK_CATEGORIES[3],
    countries: MOCK_COUNTRIES[0],
  },
  {
    id: 'p3',
    seller_id: 's2',
    category_id: 'art-crafts',
    brand_id: null,
    country_id: 'SN',
    name: 'Masque Sénoufo en Bois',
    slug: 'masque-senoufo',
    description: 'Masque sculpté à la main, bois noble. Pièce unique d\'art traditionnel sénoufo.',
    price: 85,
    old_price: 110,
    currency_code: 'USD',
    sku: 'ART-MASK-1',
    stock: 7,
    rating: 4.8,
    total_reviews: 56,
    is_sponsored: true,
    is_active: true,
    created_at: '2026-07-20T00:00:00Z',
    approval_status: 'approved',
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    product_images: [{ id: 'img3', image_url: 'https://images.pexels.com/photos/999283/pexels-photo-999283.jpeg?auto=compress&cs=tinysrgb&w=1000', sort_order: 0 }],
    product_specifications: [
      { id: 'sp4', spec_name: 'Type', spec_value: 'Hand-carved Wood' },
    ],
    sellers: MOCK_SELLERS[1],
    categories: MOCK_CATEGORIES[6],
    countries: MOCK_COUNTRIES[1],
  },
  {
    id: 'p4',
    seller_id: 's3',
    category_id: 'textiles',
    brand_id: null,
    country_id: 'NG',
    name: 'Aso Oke Wrapper',
    slug: 'aso-oke-wrapper',
    description: 'Tissu Aso Oke tissé à la main, Nigeria. Idéal pour cérémonies et événements spéciaux.',
    price: 65,
    old_price: null,
    currency_code: 'USD',
    sku: 'ASO-OKE-1',
    stock: 15,
    rating: 4.6,
    total_reviews: 41,
    is_sponsored: false,
    is_active: true,
    created_at: '2026-07-22T00:00:00Z',
    approval_status: 'approved',
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    product_images: [{ id: 'img4', image_url: 'https://images.pexels.com/photos/24738158/pexels-photo-24738158.jpeg?auto=compress&cs=tinysrgb&w=1000', sort_order: 0 }],
    sellers: MOCK_SELLERS[2],
    categories: MOCK_CATEGORIES[7],
    countries: MOCK_COUNTRIES[2],
  },
  {
    id: 'p5',
    seller_id: 's4',
    category_id: 'jewelry',
    brand_id: null,
    country_id: 'KE',
    name: 'Collier Perlé Maasai',
    slug: 'collier-perle-maasai',
    description: 'Collier perlé traditionnel Maasai, Kenya. Artisanat authentique aux couleurs vibrantes.',
    price: 38,
    old_price: 50,
    currency_code: 'USD',
    sku: 'MAASAI-COLLAR-1',
    stock: 9,
    rating: 4.9,
    total_reviews: 29,
    is_sponsored: false,
    is_active: true,
    created_at: '2026-07-19T00:00:00Z',
    approval_status: 'approved',
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    product_images: [{ id: 'img5', image_url: 'https://images.pexels.com/photos/35619407/pexels-photo-35619407.jpeg?auto=compress&cs=tinysrgb&w=1000', sort_order: 0 }],
    sellers: MOCK_SELLERS[3],
    categories: MOCK_CATEGORIES[3],
    countries: MOCK_COUNTRIES[3],
  },
  {
    id: 'p6',
    seller_id: 's5',
    category_id: 'textiles',
    brand_id: null,
    country_id: 'GH',
    name: 'Étole Kente Royale',
    slug: 'etole-kente-royale',
    description: 'Étole Kente authentique du Ghana, tissée à la main sur métier traditionnel.',
    price: 55,
    old_price: null,
    currency_code: 'USD',
    sku: 'GH-KENTE-1',
    stock: 6,
    rating: 4.5,
    total_reviews: 18,
    is_sponsored: true,
    is_active: true,
    created_at: '2026-07-21T00:00:00Z',
    approval_status: 'approved',
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    product_images: [{ id: 'img6', image_url: 'https://images.pexels.com/photos/36773397/pexels-photo-36773397.jpeg?auto=compress&cs=tinysrgb&w=1000', sort_order: 0 }],
    sellers: MOCK_SELLERS[4],
    categories: MOCK_CATEGORIES[7],
    countries: MOCK_COUNTRIES[4],
  }
];

export async function fetchCountries(): Promise<Country[]> {
  try {
    const { data, error } = await supabase.from('countries').select('*').eq('is_active', true).order('name');
    if (error || !data || data.length === 0) return MOCK_COUNTRIES;
    return data;
  } catch {
    return MOCK_COUNTRIES;
  }
}

export async function fetchCurrencies(): Promise<Currency[]> {
  try {
    const { data, error } = await supabase.from('currencies').select('*').eq('is_active', true);
    if (error || !data || data.length === 0) return MOCK_CURRENCIES;
    return data;
  } catch {
    return MOCK_CURRENCIES;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');
    if (error || !data || data.length === 0) return MOCK_CATEGORIES;
    return data;
  } catch {
    return MOCK_CATEGORIES;
  }
}

export async function fetchBrands(): Promise<Brand[]> {
  try {
    const { data, error } = await supabase.from('brands').select('*').eq('is_active', true).order('name');
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchPaymentProviders(countryId?: string): Promise<PaymentProvider[]> {
  try {
    const query = supabase.from('payment_providers').select('*').eq('is_active', true).order('sort_order');
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return [
        { id: 'pp1', name: 'Mobile Money (Wave / Orange)', slug: 'mobile-money', logo_url: null, is_active: true, countries: ['CI', 'SN', 'NG', 'KE', 'GH'], sort_order: 1 },
        { id: 'pp2', name: 'M-Pesa / MTN MoMo', slug: 'mpesa', logo_url: null, is_active: true, countries: ['KE', 'GH', 'NG'], sort_order: 2 },
        { id: 'pp3', name: 'Credit Card', slug: 'card', logo_url: null, is_active: true, countries: ['CI', 'SN', 'NG', 'KE', 'GH'], sort_order: 3 },
      ];
    }
    if (countryId) return (data || []).filter((p: PaymentProvider) => p.countries.includes(countryId));
    return data || [];
  } catch {
    return [
      { id: 'pp1', name: 'Mobile Money (Wave / Orange)', slug: 'mobile-money', logo_url: null, is_active: true, countries: ['CI', 'SN', 'NG', 'KE', 'GH'], sort_order: 1 },
      { id: 'pp2', name: 'M-Pesa / MTN MoMo', slug: 'mpesa', logo_url: null, is_active: true, countries: ['KE', 'GH', 'NG'], sort_order: 2 },
      { id: 'pp3', name: 'Credit Card', slug: 'card', logo_url: null, is_active: true, countries: ['CI', 'SN', 'NG', 'KE', 'GH'], sort_order: 3 },
    ];
  }
}

export async function fetchProducts(opts?: {
  countryId?: string; categoryId?: string; sellerId?: string;
  sponsored?: boolean; limit?: number; search?: string;
  sort?: string; minPrice?: number; maxPrice?: number;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'all';
}): Promise<Product[]> {
  try {
    let query = supabase.from('products').select(`
      *, product_images(*), product_variants(*), product_specifications(*),
      reviews(*), sellers(*), categories(*), brands(*), countries(*)
    `).eq('is_active', true);

    if (opts?.approvalStatus && opts.approvalStatus !== 'all') {
      query = query.eq('approval_status', opts.approvalStatus);
    } else if (!opts?.approvalStatus || opts.approvalStatus === 'approved') {
      query = query.eq('approval_status', 'approved');
    }

    if (opts?.countryId) query = query.eq('country_id', opts.countryId);
    if (opts?.categoryId) query = query.eq('category_id', opts.categoryId);
    if (opts?.sellerId) query = query.eq('seller_id', opts.sellerId);
    if (opts?.sponsored) query = query.eq('is_sponsored', true);
    if (opts?.search) query = query.or(`name.ilike.%${opts.search}%,description.ilike.%${opts.search}%`);
    if (opts?.minPrice !== undefined) query = query.gte('price', opts.minPrice);
    if (opts?.maxPrice !== undefined) query = query.lte('price', opts.maxPrice);

    if (opts?.sort === 'newest') query = query.order('created_at', { ascending: false });
    else if (opts?.sort === 'priceLow') query = query.order('price', { ascending: true });
    else if (opts?.sort === 'priceHigh') query = query.order('price', { ascending: false });
    else if (opts?.sort === 'rating') query = query.order('rating', { ascending: false });
    else query = query.order('total_reviews', { ascending: false });

    if (opts?.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      let list = [...MOCK_PRODUCTS];
      if (opts?.countryId) list = list.filter(p => p.country_id?.toLowerCase() === opts.countryId?.toLowerCase());
      if (opts?.categoryId) list = list.filter(p => p.category_id === opts.categoryId);
      if (opts?.sellerId) list = list.filter(p => p.seller_id === opts.sellerId);
      if (opts?.sponsored) list = list.filter(p => p.is_sponsored);
      if (opts?.search) {
        const q = opts.search.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
      }
      if (opts?.minPrice !== undefined) list = list.filter(p => p.price >= opts.minPrice!);
      if (opts?.maxPrice !== undefined) list = list.filter(p => p.price <= opts.maxPrice!);

      if (opts?.sort === 'newest') list.sort((a,b) => b.created_at.localeCompare(a.created_at));
      else if (opts?.sort === 'priceLow') list.sort((a,b) => a.price - b.price);
      else if (opts?.sort === 'priceHigh') list.sort((a,b) => b.price - a.price);
      else if (opts?.sort === 'rating') list.sort((a,b) => b.rating - a.rating);
      else list.sort((a,b) => b.total_reviews - a.total_reviews);

      if (opts?.limit) list = list.slice(0, opts.limit);
      return list;
    }
    return data;
  } catch {
    return MOCK_PRODUCTS;
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase.from('products').select(`
      *, product_images(*), product_variants(*), product_specifications(*),
      reviews(*), sellers(*), categories(*), brands(*), countries(*)
    `).eq('slug', slug).eq('is_active', true).eq('approval_status', 'approved').maybeSingle();
    if (error || !data) {
      return MOCK_PRODUCTS.find(p => p.slug === slug) || null;
    }
    return data;
  } catch {
    return MOCK_PRODUCTS.find(p => p.slug === slug) || null;
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase.from('products').select(`
      *, product_images(*), product_variants(*), product_specifications(*),
      reviews(*), sellers(*), categories(*), brands(*), countries(*)
    `).eq('id', id).eq('is_active', true).eq('approval_status', 'approved').maybeSingle();
    if (error || !data) {
      return MOCK_PRODUCTS.find(p => p.id === id) || null;
    }
    return data;
  } catch {
    return MOCK_PRODUCTS.find(p => p.id === id) || null;
  }
}

export async function fetchSellers(opts?: { countryId?: string; limit?: number }): Promise<Seller[]> {
  try {
    let query = supabase.from('sellers').select('*').eq('status', 'approved');
    if (opts?.countryId) query = query.eq('country_id', opts.countryId);
    query = query.order('rating', { ascending: false });
    if (opts?.limit) query = query.limit(opts.limit);
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      let list = [...MOCK_SELLERS];
      if (opts?.countryId) list = list.filter(s => s.country_id?.toLowerCase() === opts.countryId?.toLowerCase());
      if (opts?.limit) list = list.slice(0, opts.limit);
      return list;
    }
    return data;
  } catch {
    return MOCK_SELLERS;
  }
}

export async function fetchSellerBySlug(slug: string): Promise<Seller | null> {
  try {
    const { data, error } = await supabase.from('sellers').select('*').eq('store_slug', slug).eq('status', 'approved').maybeSingle();
    if (error || !data) {
      return MOCK_SELLERS.find(s => s.store_slug === slug) || null;
    }
    return data;
  } catch {
    return MOCK_SELLERS.find(s => s.store_slug === slug) || null;
  }
}

export async function fetchAdCampaigns(sellerId?: string): Promise<AdCampaign[]> {
  let query = supabase.from('ad_campaigns').select('*');
  if (sellerId) query = query.eq('seller_id', sellerId);
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchOrders(userId?: string): Promise<Order[]> {
  let query = supabase.from('orders').select(`*, order_items(*), sellers(*)`);
  if (userId) query = query.eq('user_id', userId);
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase.from('addresses').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export function searchSuggestions(products: Product[], sellers: Seller[], categories: Category[], query: string, _locale: 'fr' | 'en'): string[] {
  void _locale;
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const prodNames = products.filter((p) => p.name.toLowerCase().includes(q)).map((p) => p.name).slice(0, 5);
  const sellerNames = sellers.filter((s) => s.business_name.toLowerCase().includes(q)).map((s) => s.business_name).slice(0, 3);
  const catNames = categories.filter((c) => c.name.toLowerCase().includes(q)).map((c) => c.name).slice(0, 2);
  return [...prodNames, ...sellerNames, ...catNames];
}

// ============ UPLOAD ============

export async function uploadProductImage(file: File, sellerId: string): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${sellerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    console.error('Upload error:', error.message);
    return null;
  }
  const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadSellerAsset(file: File, sellerId: string, type: 'logo' | 'banner'): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${sellerId}/${type}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('seller-assets').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    console.error('Upload error:', error.message);
    return null;
  }
  const { data } = supabase.storage.from('seller-assets').getPublicUrl(fileName);
  return data.publicUrl;
}

// Identity documents (passport/ID scans, selfies) go in a private bucket —
// unlike product images or store assets, these are never public.
export async function uploadSellerKycDocument(file: File, sellerId: string, docType: 'id_front' | 'id_back' | 'selfie'): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${sellerId}/${docType}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('seller-kyc').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    console.error('KYC upload error:', error.message);
    return null;
  }
  // Private bucket: store the path, not a public URL. Resolve to a
  // short-lived signed URL only when actually displaying it (e.g. admin review).
  return fileName;
}

export async function getSellerKycDocumentUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('seller-kyc').createSignedUrl(path, 3600);
  if (error || !data) { console.error('getSellerKycDocumentUrl:', error?.message); return null; }
  return data.signedUrl;
}

export async function createSellerDocument(opts: { sellerId: string; docType: string; fileUrl: string; fileName?: string }): Promise<string | null> {
  const { data, error } = await supabase.from('seller_documents').insert({
    seller_id: opts.sellerId,
    doc_type: opts.docType,
    file_url: opts.fileUrl,
    file_name: opts.fileName || null,
    status: 'pending',
  }).select('id').single();
  if (error || !data) { console.error('createSellerDocument:', error?.message); return null; }
  return data.id;
}

// ============ MUTATIONS ============

export async function createProduct(opts: {
  sellerId: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  currencyCode: string;
  categoryId?: string | null;
  brandId?: string | null;
  countryId?: string | null;
  stock: number;
  sku?: string | null;
  imageUrls: string[];
  variants?: { variant_type: string; variant_value: string; price_adjustment: number; stock: number }[];
}): Promise<string | null> {
  const slug = opts.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).slice(2, 6);

  const { data: product, error } = await supabase.from('products').insert({
    seller_id: opts.sellerId,
    name: opts.name,
    slug,
    description: opts.description,
    price: opts.price,
    old_price: opts.oldPrice ?? null,
    currency_code: opts.currencyCode,
    category_id: opts.categoryId ?? null,
    brand_id: opts.brandId ?? null,
    country_id: opts.countryId ?? null,
    stock: opts.stock,
    sku: opts.sku ?? null,
    is_active: true,
    is_sponsored: false,
    rating: 0,
    total_reviews: 0,
    approval_status: 'pending',
  }).select('id').single();

  if (error || !product) {
    console.error('createProduct error:', error?.message);
    return null;
  }

  if (opts.imageUrls.length > 0) {
    const imgRows = opts.imageUrls.map((url, i) => ({
      product_id: product.id,
      image_url: url,
      sort_order: i,
    }));
    await supabase.from('product_images').insert(imgRows);
  }

  if (opts.variants && opts.variants.length > 0) {
    const variantRows = opts.variants.map((v) => ({
      product_id: product.id,
      variant_type: v.variant_type,
      variant_value: v.variant_value,
      price_adjustment: v.price_adjustment,
      stock: v.stock,
    }));
    await supabase.from('product_variants').insert(variantRows);
  }

  return product.id;
}

export async function createOrder(opts: {
  userId: string;
  sellerId: string;
  items: { product_id: string; product_name: string; qty: number; price: number; image_url: string | null }[];
  total: number;
  currencyCode: string;
  paymentMethod: string;
  deliveryAddress: string;
}): Promise<string | null> {
  const trackingId = 'ZND-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();

  const { data: order, error } = await supabase.from('orders').insert({
    user_id: opts.userId,
    seller_id: opts.sellerId,
    status: 'pending',
    total: opts.total,
    currency_code: opts.currencyCode,
    payment_method: opts.paymentMethod,
    delivery_address: opts.deliveryAddress,
    tracking_id: trackingId,
  }).select('id').single();

  if (error || !order) {
    console.error('createOrder error:', error?.message);
    return null;
  }

  const itemRows = opts.items.map((it) => ({
    order_id: order.id,
    product_id: it.product_id,
    product_name: it.product_name,
    qty: it.qty,
    price: it.price,
    image_url: it.image_url,
  }));
  await supabase.from('order_items').insert(itemRows);

  return order.id;
}

export async function createReview(opts: {
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
}): Promise<boolean> {
  const { error } = await supabase.from('reviews').insert({
    product_id: opts.productId,
    user_id: opts.userId,
    author_name: opts.authorName,
    rating: opts.rating,
    comment: opts.comment,
    is_verified: true,
  });
  if (error) {
    console.error('createReview error:', error.message);
    return false;
  }
  return true;
}

export async function createAdCampaign(opts: {
  sellerId: string;
  name: string;
  targetCountry?: string | null;
  targetCity?: string | null;
  targetCategory?: string | null;
  budget: number;
  durationDays: number;
}): Promise<string | null> {
  const { data, error } = await supabase.from('ad_campaigns').insert({
    seller_id: opts.sellerId,
    name: opts.name,
    target_country: opts.targetCountry ?? null,
    target_city: opts.targetCity ?? null,
    target_category: opts.targetCategory ?? null,
    budget: opts.budget,
    duration_days: opts.durationDays,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    status: 'pending',
  }).select('id').single();

  if (error || !data) {
    console.error('createAdCampaign error:', error?.message);
    return null;
  }
  return data.id;
}

export async function createAddress(opts: {
  userId: string;
  label: string;
  fullName: string;
  phone: string | null;
  street: string;
  countryId: string | null;
  city: string | null;
  region?: string | null;
  district?: string | null;
  neighborhood?: string | null;
  landmark?: string | null;
  isDefault: boolean;
}): Promise<string | null> {
  const { data, error } = await supabase.from('addresses').insert({
    user_id: opts.userId,
    label: opts.label,
    full_name: opts.fullName,
    phone: opts.phone,
    street: opts.street,
    country_id: opts.countryId,
    city: opts.city,
    region: opts.region ?? null,
    district: opts.district ?? null,
    neighborhood: opts.neighborhood ?? null,
    landmark: opts.landmark ?? null,
    is_default: opts.isDefault,
  }).select('id').single();

  if (error || !data) {
    console.error('createAddress error:', error.message);
    return null;
  }
  return data.id;
}

// ============ COMPLIANCE CENTER ============

export async function fetchAuditLogs(limit = 100): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('fetchAuditLogs:', error.message); return []; }
  return (data || []) as AuditLog[];
}

export async function logAuditAction(opts: {
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  targetName?: string | null;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  reason?: string | null;
}): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    actor_id: opts.actorId ?? null,
    actor_name: opts.actorName ?? null,
    action: opts.action,
    target_type: opts.targetType ?? null,
    target_id: opts.targetId ?? null,
    target_name: opts.targetName ?? null,
    previous_value: opts.previousValue ?? null,
    new_value: opts.newValue ?? null,
    reason: opts.reason ?? null,
  });
  if (error) console.error('logAuditAction:', error.message);
}

export async function fetchComplianceReports(status?: string): Promise<ComplianceReport[]> {
  let q = supabase.from('compliance_reports').select('*').order('created_at', { ascending: false }).limit(100);
  if (status && status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) { console.error('fetchComplianceReports:', error.message); return []; }
  return (data || []) as ComplianceReport[];
}

export async function fetchComplianceCases(status?: string): Promise<ComplianceCase[]> {
  let q = supabase.from('compliance_cases').select('*').order('updated_at', { ascending: false }).limit(100);
  if (status && status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) { console.error('fetchComplianceCases:', error.message); return []; }
  return (data || []) as ComplianceCase[];
}

export async function fetchStoreHealthScores(): Promise<StoreHealthScore[]> {
  const { data, error } = await supabase
    .from('store_health_scores')
    .select('*')
    .order('calculated_at', { ascending: false })
    .limit(100);
  if (error) { console.error('fetchStoreHealthScores:', error.message); return []; }
  return (data || []) as StoreHealthScore[];
}

export async function fetchSellerPaymentMethods(sellerId: string): Promise<SellerPaymentMethod[]> {
  const { data, error } = await supabase
    .from('seller_payment_methods')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: true });
  if (error) { console.error('fetchSellerPaymentMethods:', error.message); return []; }
  return (data || []) as SellerPaymentMethod[];
}

export async function fetchSellerDocuments(sellerId: string): Promise<SellerDocument[]> {
  const { data, error } = await supabase
    .from('seller_documents')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchSellerDocuments:', error.message); return []; }
  return (data || []) as SellerDocument[];
}

export async function fetchComplianceSellers(status?: string): Promise<ComplianceSeller[]> {
  let q = supabase.from('sellers').select('*').order('created_at', { ascending: false }).limit(100);
  if (status && status !== 'all') q = q.eq('compliance_status', status);
  const { data, error } = await q;
  if (error) { console.error('fetchComplianceSellers:', error.message); return []; }
  return (data || []) as ComplianceSeller[];
}

export async function updateSellerCompliance(
  sellerId: string,
  updates: Partial<{
    compliance_status: string;
    risk_score: number;
    compliance_score: number;
    health_status: string;
    strikes_count: number;
    status: string;
    suspended_reason: string | null;
    suspended_at: string | null;
    phone_verified: boolean;
    email_verified: boolean;
    bank_verified: boolean;
  }>
): Promise<boolean> {
  const { error } = await supabase.from('sellers').update(updates).eq('id', sellerId);
  if (error) { console.error('updateSellerCompliance:', error.message); return false; }
  return true;
}

export async function updateSellerDocument(
  docId: string,
  updates: Record<string, unknown>
): Promise<boolean> {
  const { error } = await supabase.from('seller_documents').update(updates).eq('id', docId);
  if (error) { console.error('updateSellerDocument:', error.message); return false; }
  return true;
}

export async function updateComplianceReport(
  reportId: string,
  status: string,
  caseId?: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from('compliance_reports')
    .update({ status, case_id: caseId ?? null })
    .eq('id', reportId);
  if (error) { console.error('updateComplianceReport:', error.message); return false; }
  return true;
}

export async function updateComplianceCase(
  caseId: string,
  updates: Partial<{
    status: string;
    priority: string;
    assigned_to: string | null;
    assigned_name: string | null;
    internal_notes: string | null;
    resolution: string | null;
    ai_risk_level: string | null;
  }>
): Promise<boolean> {
  const { error } = await supabase
    .from('compliance_cases')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', caseId);
  if (error) { console.error('updateComplianceCase:', error.message); return false; }
  return true;
}

export async function createComplianceReport(opts: {
  reporterId?: string | null;
  reporterName?: string | null;
  reportType: string;
  targetType: string;
  targetId?: string | null;
  targetName?: string | null;
  reason?: string | null;
  description?: string | null;
}): Promise<string | null> {
  const { data, error } = await supabase.from('compliance_reports').insert({
    reporter_id: opts.reporterId ?? null,
    reporter_name: opts.reporterName ?? null,
    report_type: opts.reportType,
    target_type: opts.targetType,
    target_id: opts.targetId ?? null,
    target_name: opts.targetName ?? null,
    reason: opts.reason ?? null,
    description: opts.description ?? null,
    status: 'open',
  }).select('id').single();
  if (error || !data) { console.error('createComplianceReport:', error.message); return null; }
  return data.id;
}

export async function addSellerPaymentMethod(opts: {
  sellerId: string;
  providerName: string;
  providerType: string;
  accountIdentifier?: string | null;
  displayName?: string | null;
  instructions?: string | null;
}): Promise<string | null> {
  const { data, error } = await supabase.from('seller_payment_methods').insert({
    seller_id: opts.sellerId,
    provider_name: opts.providerName,
    provider_type: opts.providerType,
    account_identifier: opts.accountIdentifier ?? null,
    display_name: opts.displayName ?? null,
    instructions: opts.instructions ?? null,
    is_active: true,
    is_verified: false,
  }).select('id').single();
  if (error || !data) { console.error('addSellerPaymentMethod:', error.message); return null; }
  return data.id;
}

export async function removeSellerPaymentMethod(methodId: string): Promise<boolean> {
  const { error } = await supabase.from('seller_payment_methods').delete().eq('id', methodId);
  if (error) { console.error('removeSellerPaymentMethod:', error.message); return false; }
  return true;
}

export async function toggleSellerPaymentMethod(methodId: string, isActive: boolean): Promise<boolean> {
  const { error } = await supabase.from('seller_payment_methods').update({ is_active: isActive }).eq('id', methodId);
  if (error) { console.error('toggleSellerPaymentMethod:', error.message); return false; }
  return true;
}

export async function updateSellerStatus(sellerId: string, status: string): Promise<boolean> {
  const { error } = await supabase.from('sellers').update({ status }).eq('id', sellerId);
  if (error) { console.error('updateSellerStatus:', error.message); return false; }
  return true;
}

export async function updateSellerPlan(sellerId: string, plan: 'starter' | 'premium' | 'enterprise'): Promise<boolean> {
  const { error: dbError } = await supabase.from('sellers').update({ plan, plan_selected: plan }).eq('id', sellerId);
  if (dbError) { console.error('updateSellerPlan:', dbError.message); return false; }
  const { error: authError } = await supabase.auth.updateUser({ data: { seller_plan: plan } });
  if (authError) { console.error('updateSellerPlan (auth):', authError.message); }
  return true;
}

export async function updateAdCampaignStatus(campaignId: string, status: string): Promise<boolean> {
  const { error } = await supabase.from('ad_campaigns').update({ status }).eq('id', campaignId);
  if (error) { console.error('updateAdCampaignStatus:', error.message); return false; }
  return true;
}

export async function updateUserProfile(userId: string, updates: { full_name?: string; phone?: string }): Promise<boolean> {
  const { error } = await supabase.auth.updateUser({
    data: { full_name: updates.full_name, phone: updates.phone },
  });
  if (error) { console.error('updateUserProfile:', error.message); return false; }
  return true;
}

// Zando charges no commission on sales: sellers connect their own PSP
// (seller_payment_methods) and are paid directly by buyers. Platform revenue
// comes only from seller subscriptions (sellers.plan) and ad_campaigns spend.
// Revenue summary for admins — see fetchPlatformRevenue below.
export type PlatformRevenueSummary = {
  subscriptionMonthlyRevenue: number;
  sellersByPlan: Record<'starter' | 'premium' | 'enterprise', number>;
  adSpendTotal: number;
  adSpendActive: number;
};

const PLAN_PRICE_USD: Record<'starter' | 'premium' | 'enterprise', number> = {
  starter: 0,
  premium: 29,
  enterprise: 99,
};

export async function fetchPlatformRevenue(): Promise<PlatformRevenueSummary> {
  const sellersByPlan: Record<'starter' | 'premium' | 'enterprise', number> = { starter: 0, premium: 0, enterprise: 0 };
  let subscriptionMonthlyRevenue = 0;
  const { data: sellers, error: sellersError } = await supabase.from('sellers').select('plan').eq('status', 'approved');
  if (!sellersError && sellers) {
    for (const s of sellers as { plan: string }[]) {
      const plan = (s.plan as 'starter' | 'premium' | 'enterprise') || 'starter';
      if (plan in sellersByPlan) sellersByPlan[plan]++;
      subscriptionMonthlyRevenue += PLAN_PRICE_USD[plan] ?? 0;
    }
  }
  let adSpendTotal = 0;
  let adSpendActive = 0;
  const { data: ads, error: adsError } = await supabase.from('ad_campaigns').select('budget, status');
  if (!adsError && ads) {
    for (const a of ads as { budget: number; status: string }[]) {
      adSpendTotal += a.budget || 0;
      if (a.status === 'active') adSpendActive += a.budget || 0;
    }
  }
  return { subscriptionMonthlyRevenue, sellersByPlan, adSpendTotal, adSpendActive };
}
