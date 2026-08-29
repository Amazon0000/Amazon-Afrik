import { supabase } from './supabase';

export type Country = {
  id: string; name: string; flag: string; phone_code: string;
  currency_code: string; is_active: boolean; is_african: boolean; region: string;
};

// exchange_rate convention: the USD value of ONE unit of this currency
// (e.g. XOF ≈ 0.0017 since 1 XOF ≈ $0.0017, roughly 610 XOF per USD).
// To convert a USD price to this currency: usdAmount / exchange_rate.
// Keep every currency in this table on this same convention — a prior
// migration briefly mixed in the opposite one for non-African currencies
// and silently broke conversion by orders of magnitude.
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

export type Affiliate = {
  id: string; user_id: string; referral_code: string; full_name: string; email: string;
  audience_description: string | null; status: 'pending' | 'approved' | 'rejected' | 'suspended';
  commission_rate: number; payout_provider: string | null; payout_account_identifier: string | null;
  total_earned: number; total_paid: number; reviewed_by: string | null; reviewed_at: string | null;
  rejection_reason: string | null; created_at: string;
};

export type ProductAnswer = {
  id: string; question_id: string; user_id: string; author_name: string;
  is_seller_answer: boolean; answer: string; created_at: string;
};

export type ProductQuestion = {
  id: string; product_id: string; user_id: string; author_name: string;
  question: string; created_at: string;
  product_answers?: ProductAnswer[];
};

export type AffiliateReferral = {
  id: string; affiliate_id: string; referred_seller_id: string; status: 'signed_up' | 'converted';
  commission_amount: number; created_at: string; converted_at: string | null;
  sellers?: { business_name: string; plan: string };
};

export type Coupon = {
  id: string; seller_id: string; code: string; discount_type: 'percent' | 'fixed';
  discount_value: number; min_order_amount: number; usage_limit: number | null;
  times_used: number; expires_at: string | null; is_active: boolean; created_at: string;
};

export type CouponValidation =
  | { valid: true; discount_amount: number; coupon_id: string; discount_type: 'percent' | 'fixed'; discount_value: number }
  | { valid: false; reason: 'not_found' | 'expired' | 'limit_reached' | 'min_order_not_met'; min_order_amount?: number };

export type FlashDeal = {
  id: string; product_id: string; seller_id: string; discount_percent: number;
  deal_price: number; stock_limit: number | null; claimed_count: number;
  starts_at: string; ends_at: string; is_active: boolean; created_at: string;
  products?: Product;
};

export type AdCampaign = {
  id: string; seller_id: string; name: string; target_country: string | null;
  target_city: string | null; target_category: string | null; budget: number;
  duration_days: number; impressions: number; clicks: number; conversions: number;
  status: 'pending' | 'active' | 'paused' | 'expired' | 'cancelled' | 'ended' | 'rejected';
  created_at: string;
  reviewed_by?: string | null; reviewed_at?: string | null;
  // Module Advertising / Sponsored Products (migration 016)
  plan_id?: string | null;
  product_id?: string | null;
  placement_id?: string | null;
  price?: number | null;
  currency_code?: string | null;
  payment_provider?: 'stripe' | 'flutterwave' | 'payunit' | null;
  payment_reference?: string | null;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  starts_at?: string | null;
  expires_at?: string | null;
  updated_at?: string | null;
  products?: Product;
  sellers?: Seller;
  advertising_plans?: AdvertisingPlan;
};

export type AdvertisingPlan = {
  id: string; name: string; description: string | null;
  duration_days: number; price: number; currency_code: string;
  allowed_placements: string[]; max_active_per_seller: number | null;
  is_active: boolean; sort_order: number; created_at: string; updated_at?: string;
};

export type AdvertisingPlacement = {
  id: string; name: string; description: string | null;
  is_active: boolean; sort_order: number;
};

export type AdvertisingPayment = {
  id: string; campaign_id: string; seller_id: string;
  provider: 'stripe' | 'flutterwave' | 'payunit';
  provider_reference: string; internal_reference: string;
  amount: number; currency_code: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  created_at: string; updated_at?: string;
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
  { code: 'XOF', name: 'CFA Franc', symbol: 'FCFA', exchange_rate: 0.00164, is_active: true },
  { code: 'NGN', name: 'Naira', symbol: '₦', exchange_rate: 0.000667, is_active: true },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', exchange_rate: 0.00769, is_active: true },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', exchange_rate: 0.06897, is_active: true },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', exchange_rate: 0.05405, is_active: true },
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
  cityName?: string;
}): Promise<Product[]> {
  try {
    // Products have no city of their own — city lives on the seller. When
    // filtering by city, switch the sellers embed to an inner join so
    // PostgREST can filter on sellers.city directly.
    const sellersEmbed = opts?.cityName ? 'sellers!inner(*)' : 'sellers(*)';
    let query = supabase.from('products').select(`
      *, product_images(*), product_variants(*), product_specifications(*),
      reviews(*), ${sellersEmbed}, categories(*), brands(*), countries(*)
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
    if (opts?.cityName) query = query.eq('sellers.city', opts.cityName);

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

// Real distinct city list for a country — sourced from approved sellers'
// own city field (no separate cities master table exists), used to power
// the "Shop by Location" city picker.
// Real counts for trust-building UI (auth page, etc.) — never a made-up number.
export async function fetchPlatformStats(): Promise<{ sellers: number; products: number; countries: number }> {
  const [sellersRes, productsRes, countriesRes] = await Promise.all([
    supabase.from('sellers').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved').eq('is_active', true),
    supabase.from('countries').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);
  return {
    sellers: sellersRes.count || 0,
    products: productsRes.count || 0,
    countries: countriesRes.count || 0,
  };
}

export async function fetchCitiesForCountry(countryId: string): Promise<string[]> {
  const { data, error } = await supabase.from('sellers').select('city').eq('country_id', countryId).eq('status', 'approved').not('city', 'is', null);
  if (error || !data) { console.error('fetchCitiesForCountry:', error?.message); return []; }
  const cities = Array.from(new Set((data as { city: string | null }[]).map((s) => s.city).filter(Boolean))) as string[];
  return cities.sort();
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

export async function fetchActiveFlashDeals(limit = 12): Promise<FlashDeal[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('flash_deals')
    .select(`*, products(*, product_images(*), sellers(*))`)
    .eq('is_active', true)
    .lte('starts_at', nowIso)
    .gte('ends_at', nowIso)
    .order('ends_at', { ascending: true })
    .limit(limit);
  if (error) { console.error('fetchActiveFlashDeals:', error.message); return []; }
  return (data || []) as FlashDeal[];
}

export async function fetchProductFlashDeal(productId: string): Promise<FlashDeal | null> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('flash_deals')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .lte('starts_at', nowIso)
    .gte('ends_at', nowIso)
    .maybeSingle();
  if (error) { console.error('fetchProductFlashDeal:', error.message); return null; }
  return data as FlashDeal | null;
}

export async function fetchSellerFlashDeals(sellerId: string): Promise<FlashDeal[]> {
  const { data, error } = await supabase
    .from('flash_deals')
    .select(`*, products(*, product_images(*))`)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchSellerFlashDeals:', error.message); return []; }
  return (data || []) as FlashDeal[];
}

export async function createFlashDeal(opts: {
  productId: string; sellerId: string; discountPercent: number; dealPrice: number;
  stockLimit?: number | null; startsAt: string; endsAt: string;
}): Promise<string | null> {
  const { data, error } = await supabase.from('flash_deals').insert({
    product_id: opts.productId,
    seller_id: opts.sellerId,
    discount_percent: opts.discountPercent,
    deal_price: opts.dealPrice,
    stock_limit: opts.stockLimit ?? null,
    starts_at: opts.startsAt,
    ends_at: opts.endsAt,
    is_active: true,
  }).select('id').single();
  if (error || !data) { console.error('createFlashDeal:', error?.message); return null; }
  return data.id;
}

export async function endFlashDeal(dealId: string): Promise<boolean> {
  const { error } = await supabase.from('flash_deals').update({ is_active: false }).eq('id', dealId);
  if (error) { console.error('endFlashDeal:', error.message); return false; }
  return true;
}

export async function fetchSellerCoupons(sellerId: string): Promise<Coupon[]> {
  const { data, error } = await supabase.from('coupons').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
  if (error) { console.error('fetchSellerCoupons:', error.message); return []; }
  return data || [];
}

export async function createCoupon(opts: {
  sellerId: string; code: string; discountType: 'percent' | 'fixed'; discountValue: number;
  minOrderAmount?: number; usageLimit?: number | null; expiresAt?: string | null;
}): Promise<string | null> {
  const { data, error } = await supabase.from('coupons').insert({
    seller_id: opts.sellerId,
    code: opts.code,
    discount_type: opts.discountType,
    discount_value: opts.discountValue,
    min_order_amount: opts.minOrderAmount ?? 0,
    usage_limit: opts.usageLimit ?? null,
    expires_at: opts.expiresAt ?? null,
  }).select('id').single();
  if (error || !data) { console.error('createCoupon:', error?.message); return null; }
  return data.id;
}

export async function deactivateCoupon(couponId: string): Promise<boolean> {
  const { error } = await supabase.from('coupons').update({ is_active: false }).eq('id', couponId);
  if (error) { console.error('deactivateCoupon:', error.message); return false; }
  return true;
}

// ============ Affiliate program ============

function generateReferralCode(name: string): string {
  const base = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6) || 'ZANDO';
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`;
}

export async function applyForAffiliate(opts: { userId: string; fullName: string; email: string; audienceDescription?: string }): Promise<string | null> {
  // Retry on the rare code collision — UNIQUE constraint on referral_code.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase.from('affiliates').insert({
      user_id: opts.userId,
      full_name: opts.fullName,
      email: opts.email,
      audience_description: opts.audienceDescription || null,
      referral_code: generateReferralCode(opts.fullName),
    }).select('id').single();
    if (!error && data) return data.id;
    if (error && !error.message.includes('duplicate key')) { console.error('applyForAffiliate:', error.message); return null; }
  }
  return null;
}

export async function fetchMyAffiliateAccount(userId: string): Promise<Affiliate | null> {
  const { data, error } = await supabase.from('affiliates').select('*').eq('user_id', userId).maybeSingle();
  if (error) { console.error('fetchMyAffiliateAccount:', error.message); return null; }
  return data;
}

export async function fetchAffiliateReferrals(affiliateId: string): Promise<AffiliateReferral[]> {
  const { data, error } = await supabase.from('affiliate_referrals').select('*, sellers(business_name, plan)').eq('affiliate_id', affiliateId).order('created_at', { ascending: false });
  if (error) { console.error('fetchAffiliateReferrals:', error.message); return []; }
  return data || [];
}

export async function updateAffiliatePayoutDetails(affiliateId: string, provider: string, accountIdentifier: string): Promise<boolean> {
  const { error } = await supabase.from('affiliates').update({ payout_provider: provider, payout_account_identifier: accountIdentifier }).eq('id', affiliateId);
  if (error) { console.error('updateAffiliatePayoutDetails:', error.message); return false; }
  return true;
}

// Resolves a ?ref= code to an affiliate id at signup — real server-side
// check, never trusts a code the client claims is valid.
export async function resolveAffiliateCode(code: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('resolve_affiliate_code', { p_code: code });
  if (error) { console.error('resolveAffiliateCode:', error.message); return null; }
  return data as string | null;
}

export async function fetchAllAffiliates(): Promise<Affiliate[]> {
  const { data, error } = await supabase.from('affiliates').select('*').order('created_at', { ascending: false });
  if (error) { console.error('fetchAllAffiliates:', error.message); return []; }
  return data || [];
}

export async function updateAffiliateStatus(affiliateId: string, status: 'approved' | 'rejected' | 'suspended', reviewerEmail: string, rejectionReason?: string): Promise<boolean> {
  const { error } = await supabase.from('affiliates').update({
    status, reviewed_by: reviewerEmail, reviewed_at: new Date().toISOString(),
    rejection_reason: status === 'rejected' ? (rejectionReason || null) : null,
  }).eq('id', affiliateId);
  if (error) { console.error('updateAffiliateStatus:', error.message); return false; }
  return true;
}

// Called once, right after a new seller row is created, if they arrived
// via a valid ?ref= link. Links the seller to the affiliate (permanently
// — sellers.referred_by_affiliate_id) and opens the referral tracking row.
export async function recordAffiliateReferral(affiliateId: string, sellerId: string): Promise<boolean> {
  await supabase.from('sellers').update({ referred_by_affiliate_id: affiliateId }).eq('id', sellerId);
  const { error } = await supabase.from('affiliate_referrals').insert({ affiliate_id: affiliateId, referred_seller_id: sellerId });
  if (error) { console.error('recordAffiliateReferral:', error.message); return false; }
  return true;
}

// Server-side authoritative check — never trust a client-computed discount.
export async function validateCoupon(code: string, sellerId: string, subtotal: number): Promise<CouponValidation> {
  const { data, error } = await supabase.rpc('validate_coupon', { p_code: code, p_seller_id: sellerId, p_subtotal: subtotal });
  if (error || !data) { console.error('validateCoupon:', error?.message); return { valid: false, reason: 'not_found' }; }
  return data as CouponValidation;
}

// Atomically consumes one use — called once per seller-group at order placement.
export async function redeemCoupon(code: string, sellerId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('redeem_coupon', { p_code: code, p_seller_id: sellerId });
  if (error) { console.error('redeemCoupon:', error.message); return false; }
  return !!data;
}

export async function fetchOrders(userId?: string): Promise<Order[]> {
  let query = supabase.from('orders').select(`*, order_items(*), sellers(*)`);
  if (userId) query = query.eq('user_id', userId);
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Orders placed against a seller's own products — distinct from fetchOrders(userId),
// which returns orders the person placed as a buyer.
export async function fetchSellerOrders(sellerId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`*, order_items(*), sellers(*)`)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchSellerOrders:', error.message); return []; }
  return data || [];
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) { console.error('updateOrderStatus:', error.message); return false; }
  return true;
}

export async function cancelOwnOrder(orderId: string): Promise<boolean> {
  const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
  if (error) { console.error('cancelOwnOrder:', error.message); return false; }
  return true;
}

// Real, derived notification feed — no separate notifications table; built
// from actual order status so nothing shown is fabricated.
export type NotificationItem = { id: string; text: string; date: string; status: string };

export async function fetchRecentNotifications(userId: string, sellerId?: string): Promise<NotificationItem[]> {
  const items: NotificationItem[] = [];
  const { data: orders } = await supabase.from('orders').select('id, status, tracking_id, total, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
  for (const o of orders || []) {
    items.push({ id: `order-${o.id}`, text: `${o.tracking_id} — $${o.total}`, date: o.created_at, status: o.status });
  }
  if (sellerId) {
    const { data: ads } = await supabase.from('ad_campaigns').select('id, name, status, reviewed_at').eq('seller_id', sellerId).not('reviewed_at', 'is', null).order('reviewed_at', { ascending: false }).limit(3);
    for (const a of ads || []) {
      items.push({ id: `ad-${a.id}`, text: `${a.name} — ${a.status}`, date: a.reviewed_at, status: a.status });
    }
  }
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
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

// Atomic — safe under concurrent checkouts, never goes negative (floored at 0 in the DB function).
export async function decrementProductStock(productId: string, qty: number): Promise<number | null> {
  const { data, error } = await supabase.rpc('decrement_product_stock', { p_product_id: productId, p_qty: qty });
  if (error) { console.error('decrementProductStock:', error.message); return null; }
  return data as number;
}

export async function submitContactMessage(opts: { firstName: string; lastName: string; email: string; message: string }): Promise<boolean> {
  const { error } = await supabase.from('contact_messages').insert({
    first_name: opts.firstName,
    last_name: opts.lastName,
    email: opts.email,
    message: opts.message,
  });
  if (error) { console.error('submitContactMessage:', error.message); return false; }
  return true;
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

export async function fetchProductQuestions(productId: string): Promise<ProductQuestion[]> {
  const { data, error } = await supabase
    .from('product_questions')
    .select('*, product_answers(*)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchProductQuestions:', error.message); return []; }
  return (data || []).map((q: ProductQuestion) => ({ ...q, product_answers: (q.product_answers || []).sort((a: ProductAnswer, b: ProductAnswer) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) }));
}

export async function askProductQuestion(opts: { productId: string; userId: string; authorName: string; question: string }): Promise<string | null> {
  const { data, error } = await supabase.from('product_questions').insert({
    product_id: opts.productId, user_id: opts.userId, author_name: opts.authorName, question: opts.question,
  }).select('id').single();
  if (error || !data) { console.error('askProductQuestion:', error?.message); return null; }
  return data.id;
}

// is_seller_answer is only ever honored server-side if the caller actually
// owns the seller account for this product — see the migration's RLS.
export async function answerProductQuestion(opts: { questionId: string; userId: string; authorName: string; answer: string; isSellerAnswer: boolean }): Promise<string | null> {
  const { data, error } = await supabase.from('product_answers').insert({
    question_id: opts.questionId, user_id: opts.userId, author_name: opts.authorName,
    answer: opts.answer, is_seller_answer: opts.isSellerAnswer,
  }).select('id').single();
  if (error || !data) { console.error('answerProductQuestion:', error?.message); return null; }
  return data.id;
}

export async function deleteProductQuestion(questionId: string): Promise<boolean> {
  const { error } = await supabase.from('product_questions').delete().eq('id', questionId);
  if (error) { console.error('deleteProductQuestion:', error.message); return false; }
  return true;
}

export async function createReview(opts: {
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
}): Promise<{ ok: boolean; reason?: 'duplicate' | 'error' }> {
  // is_verified is computed server-side by a trigger (real purchase check)
  // — never sent from here, and never trusted from the client.
  const { error } = await supabase.from('reviews').insert({
    product_id: opts.productId,
    user_id: opts.userId,
    author_name: opts.authorName,
    rating: opts.rating,
    comment: opts.comment,
  });
  if (error) {
    console.error('createReview error:', error.message);
    if (error.message.includes('duplicate key') || error.message.includes('reviews_product_user_unique')) {
      return { ok: false, reason: 'duplicate' };
    }
    return { ok: false, reason: 'error' };
  }
  return { ok: true };
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
  if (plan !== 'starter') {
    const planPrice = plan === 'premium' ? 29 : 79; // must match PLAN_PRICE_USD
    await supabase.rpc('record_affiliate_conversion', { p_seller_id: sellerId, p_plan_price: planPrice });
  }
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

// Must match PLAN_PRICE_USD in PlansPage.tsx — the canonical seller
// subscription prices in USD. Keeping one number per plan in two files is
// fragile; both are pinned to the same values so admin revenue reporting
// never silently drifts from what sellers are actually shown/charged.
const PLAN_PRICE_USD: Record<'starter' | 'premium' | 'enterprise', number> = {
  starter: 9,
  premium: 29,
  enterprise: 79,
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

// ============ ADVERTISING / SPONSORED PRODUCTS (module payant, migration 016) ============
// Revenu publicitaire RÉEL (paiements confirmés uniquement), distinct de
// adSpendTotal ci-dessus qui reflète l'ancien champ `budget` (déclaratif,
// non lié à un paiement réel). À utiliser pour tout reporting financier.
export async function fetchAdvertisingRevenue(): Promise<{ total: number; byProvider: Record<string, number> }> {
  const { data, error } = await supabase
    .from('advertising_payments')
    .select('amount, provider')
    .eq('status', 'paid');
  if (error || !data) { console.error('fetchAdvertisingRevenue:', error?.message); return { total: 0, byProvider: {} }; }
  const byProvider: Record<string, number> = {};
  let total = 0;
  for (const row of data as { amount: number; provider: string }[]) {
    total += row.amount;
    byProvider[row.provider] = (byProvider[row.provider] || 0) + row.amount;
  }
  return { total, byProvider };
}

export async function fetchAdvertisingPlans(activeOnly = true): Promise<AdvertisingPlan[]> {
  let query = supabase.from('advertising_plans').select('*');
  if (activeOnly) query = query.eq('is_active', true);
  query = query.order('sort_order', { ascending: true });
  const { data, error } = await query;
  if (error) { console.error('fetchAdvertisingPlans:', error.message); return []; }
  return data || [];
}

export async function createAdvertisingPlan(plan: Omit<AdvertisingPlan, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
  const { data, error } = await supabase.from('advertising_plans').insert(plan).select('id').single();
  if (error || !data) { console.error('createAdvertisingPlan:', error?.message); return null; }
  return data.id;
}

export async function updateAdvertisingPlan(id: string, updates: Partial<AdvertisingPlan>): Promise<boolean> {
  const { error } = await supabase.from('advertising_plans').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { console.error('updateAdvertisingPlan:', error.message); return false; }
  return true;
}

export async function fetchAdvertisingPlacements(): Promise<AdvertisingPlacement[]> {
  const { data, error } = await supabase.from('advertising_placements').select('*').eq('is_active', true).order('sort_order');
  if (error) { console.error('fetchAdvertisingPlacements:', error.message); return []; }
  return data || [];
}

// Crée la campagne en statut 'pending' / payment_status 'pending' — ne paie
// pas encore. L'étape de paiement est faite ensuite par createAdvertisingPayment().
export async function createDraftCampaign(opts: {
  sellerId: string; productId: string; planId: string; placementId: string;
  price: number; currencyCode: string; name: string;
}): Promise<string | null> {
  const { data, error } = await supabase.from('ad_campaigns').insert({
    seller_id: opts.sellerId,
    product_id: opts.productId,
    plan_id: opts.planId,
    placement_id: opts.placementId,
    price: opts.price,
    currency_code: opts.currencyCode,
    name: opts.name,
    status: 'pending',
    payment_status: 'pending',
    impressions: 0,
    clicks: 0,
    conversions: 0,
    budget: opts.price, // compat avec l'ancien champ requis
    duration_days: 0, // sera fixé à l'activation via la durée réelle du plan
  }).select('id').single();
  if (error || !data) { console.error('createDraftCampaign:', error?.message); return null; }
  return data.id;
}

// Appelle l'Edge Function ads-create-payment. Le frontend ne fait QUE
// initier la demande — il ne reçoit ni ne décide jamais d'un statut "payé".
export async function initiateAdvertisingPayment(opts: {
  campaignId: string; provider: 'stripe' | 'flutterwave' | 'payunit'; returnUrl: string;
}): Promise<{ redirectUrl: string } | { error: string }> {
  const { data, error } = await supabase.functions.invoke('ads-create-payment', {
    body: { campaignId: opts.campaignId, provider: opts.provider, returnUrl: opts.returnUrl },
  });
  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { redirectUrl: data.redirectUrl };
}

export async function cancelAdvertisingCampaign(campaignId: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('ads-cancel-campaign', { body: { campaignId } });
  if (error || data?.error) { console.error('cancelAdvertisingCampaign:', error?.message || data?.error); return false; }
  return true;
}

export async function refundAdvertisingCampaign(campaignId: string, amount?: number): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('ads-refund-campaign', { body: { campaignId, amount } });
  if (error) return { ok: false, error: error.message };
  if (data?.error) return { ok: false, error: data.error };
  return { ok: true };
}

// ============ NOTIFICATIONS ============
export type AppNotification = {
  id: string; user_id: string; type: string; title: string; message: string;
  link: string | null; metadata: Record<string, unknown> | null;
  is_read: boolean; created_at: string;
};

export async function fetchNotifications(limit = 30): Promise<AppNotification[]> {
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) { console.error('fetchNotifications:', error.message); return []; }
  return data || [];
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { count, error } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false);
  if (error) { console.error('fetchUnreadNotificationCount:', error.message); return 0; }
  return count || 0;
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) { console.error('markNotificationRead:', error.message); return false; }
  return true;
}

export async function markAllNotificationsRead(): Promise<boolean> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
  if (error) { console.error('markAllNotificationsRead:', error.message); return false; }
  return true;
}

export async function fetchSellerCampaignsDetailed(sellerId: string): Promise<AdCampaign[]> {
  const { data, error } = await supabase
    .from('ad_campaigns')
    .select('*, products(*, product_images(*)), advertising_plans(*)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchSellerCampaignsDetailed:', error.message); return []; }
  return data || [];
}

// Source de vérité unique pour les produits sponsorisés — passe par la
// fonction SQL get_active_sponsored_products() (campagne active + payée +
// non expirée + produit/vendeur valides). Ne jamais utiliser products.is_sponsored
// directement pour du contenu payant réel.
export async function fetchSponsoredProducts(placementId?: string, limit = 20): Promise<Product[]> {
  const { data, error } = await supabase.rpc('get_active_sponsored_products', {
    p_placement: placementId ?? null,
    p_limit: limit,
  });
  if (error) { console.error('fetchSponsoredProducts:', error.message); return []; }
  return (data || []) as Product[];
}

export async function fetchAllCampaignsAdmin(filters?: {
  status?: string; paymentStatus?: string; provider?: string; placementId?: string;
}): Promise<AdCampaign[]> {
  let query = supabase.from('ad_campaigns').select('*, products(*), sellers(*), advertising_plans(*)');
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.paymentStatus) query = query.eq('payment_status', filters.paymentStatus);
  if (filters?.provider) query = query.eq('payment_provider', filters.provider);
  if (filters?.placementId) query = query.eq('placement_id', filters.placementId);
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) { console.error('fetchAllCampaignsAdmin:', error.message); return []; }
  return data || [];
}

export async function fetchAllAdvertisingPayments(): Promise<AdvertisingPayment[]> {
  const { data, error } = await supabase
    .from('advertising_payments')
    .select('*, ad_campaigns(name), sellers(business_name)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) { console.error('fetchAllAdvertisingPayments:', error.message); return []; }
  return data || [];
}
