import { supabase, isOfflineMode } from './supabase';
import * as localData from './data';

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

export type ProductImage = { id: string; image_url: string; sort_order: number };
export type ProductVariant = { id: string; variant_type: string; variant_value: string; price_adjustment: number; stock: number };
export type ProductSpec = { id: string; spec_name: string; spec_value: string };
export type Review = { id: string; author_name: string; rating: number; comment: string | null; is_verified: boolean; created_at: string };

export type Product = {
  id: string; seller_id: string; category_id: string | null; brand_id: string | null;
  country_id: string | null; name: string; slug: string; description: string | null;
  price: number; old_price: number | null; currency_code: string; sku: string | null;
  stock: number; rating: number; total_reviews: number;
  is_sponsored: boolean; is_active: boolean; created_at: string;
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

// ============ MOCK FALLBACK DATA ============

export const MOCK_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', exchange_rate: 1.0, is_active: true },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', exchange_rate: 600, is_active: true },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', exchange_rate: 1500, is_active: true },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', exchange_rate: 130, is_active: true },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', exchange_rate: 14, is_active: true },
];

export const MOCK_COUNTRIES: Country[] = [
  { id: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', phone_code: '+225', currency_code: 'XOF', is_active: true, is_african: true, region: 'West' },
  { id: 'SN', name: 'Sénégal', flag: '🇸🇳', phone_code: '+221', currency_code: 'XOF', is_active: true, is_african: true, region: 'West' },
  { id: 'NG', name: 'Nigeria', flag: '🇳🇬', phone_code: '+234', currency_code: 'NGN', is_active: true, is_african: true, region: 'West' },
  { id: 'KE', name: 'Kenya', flag: '🇰🇪', phone_code: '+254', currency_code: 'KES', is_active: true, is_african: true, region: 'East' },
  { id: 'GH', name: 'Ghana', flag: '🇬🇭', phone_code: '+233', currency_code: 'GHS', is_active: true, is_african: true, region: 'West' },
];

export const MOCK_CATEGORIES: Category[] = [];

localData.categories.forEach((c) => {
  MOCK_CATEGORIES.push({
    id: c.id,
    parent_id: null,
    slug: c.id,
    name: c.name.fr,
    icon: c.icon,
    banner_url: null,
    is_featured: true,
    is_trending: true,
    sort_order: MOCK_CATEGORIES.length + 1,
    is_active: true,
  });
  c.subcategories.forEach((sub) => {
    MOCK_CATEGORIES.push({
      id: sub.id,
      parent_id: c.id,
      slug: sub.id,
      name: sub.name.fr,
      icon: null,
      banner_url: null,
      is_featured: false,
      is_trending: false,
      sort_order: MOCK_CATEGORIES.length + 1,
      is_active: true,
    });
  });
});

export const MOCK_BRANDS: Brand[] = [
  { id: 'b1', name: 'Akan Gold', slug: 'akan-gold', logo_url: null, country_id: 'CI', is_verified: true, is_active: true },
  { id: 'b2', name: 'Vlisco', slug: 'vlisco', logo_url: null, country_id: 'CI', is_verified: true, is_active: true },
  { id: 'b3', name: 'Kente Weavers', slug: 'kente-weavers', logo_url: null, country_id: 'GH', is_verified: true, is_active: true },
];

export const MOCK_SELLERS: Seller[] = localData.sellers.map((s) => ({
  id: s.id,
  business_name: s.name,
  store_slug: s.id,
  store_logo_url: s.logo,
  store_banner_url: s.banner,
  description: s.description.fr,
  country_id: s.countryId.toUpperCase(),
  city: s.cityName,
  phone: '+225 01020304',
  plan: s.plan as 'starter' | 'premium' | 'enterprise',
  status: 'approved',
  business_type: 'retailer',
  rating: s.rating,
  total_reviews: s.reviews,
  total_products: s.productsCount,
  joined_year: s.joinedYear,
  is_official: s.badge === 'enterprise',
}));

export const MOCK_PRODUCTS: Product[] = localData.products.map((p) => {
  const s = MOCK_SELLERS.find(x => x.id === p.sellerId) || MOCK_SELLERS[0];
  const cat = MOCK_CATEGORIES.find(x => x.id === p.categoryId) || MOCK_CATEGORIES[0];
  const country = MOCK_COUNTRIES.find(x => x.id === p.countryId.toUpperCase()) || MOCK_COUNTRIES[0];
  return {
    id: p.id,
    seller_id: p.sellerId,
    category_id: p.categoryId || null,
    brand_id: null,
    country_id: p.countryId.toUpperCase(),
    name: p.name,
    slug: p.id,
    description: p.description.fr,
    price: p.price,
    old_price: p.oldPrice || null,
    currency_code: 'USD',
    sku: 'SKU-' + p.id.toUpperCase(),
    stock: p.stock,
    rating: p.rating,
    total_reviews: p.reviews,
    is_sponsored: !!p.sponsored,
    is_active: true,
    created_at: p.createdAt,
    product_images: p.images.map((url, i) => ({ id: `${p.id}-img-${i}`, image_url: url, sort_order: i })),
    product_variants: p.variations?.flatMap((v) =>
      v.options.map((opt) => ({
        id: `${p.id}-var-${opt.id}`,
        variant_type: v.name.fr,
        variant_value: opt.value.fr,
        price_adjustment: 0,
        stock: 5
      }))
    ) || [],
    product_specifications: p.features?.map((f, i) => ({
      id: `${p.id}-spec-${i}`,
      spec_name: 'Feature',
      spec_value: f.fr
    })) || [],
    reviews: (p.reviewList || []).map((r) => ({
      id: r.id,
      author_name: r.author,
      rating: r.rating,
      comment: r.comment.fr,
      is_verified: r.verified,
      created_at: r.date,
    })),
    sellers: s,
    categories: cat,
    brands: undefined,
    countries: country,
  };
});

export const MOCK_PAYMENT_PROVIDERS: PaymentProvider[] = [
  { id: 'wave', name: 'Wave', slug: 'wave', logo_url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100&h=100&fit=crop', is_active: true, countries: ['CI', 'SN'], sort_order: 1 },
  { id: 'orange', name: 'Orange Money', slug: 'orange', logo_url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100&h=100&fit=crop', is_active: true, countries: ['CI', 'SN'], sort_order: 2 },
  { id: 'mtn', name: 'MTN MoMo', slug: 'mtn', logo_url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100&h=100&fit=crop', is_active: true, countries: ['CI', 'NG', 'GH'], sort_order: 3 },
  { id: 'mpesa', name: 'M-Pesa', slug: 'mpesa', logo_url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100&h=100&fit=crop', is_active: true, countries: ['KE'], sort_order: 4 },
];

// Fallback mutable memory stores
const localReviews: Review[] = [];
const localOrders: Order[] = [];
const localAddresses: Address[] = [];
const localAdCampaigns: AdCampaign[] = [];
const localSellers: Seller[] = [];
const localPaymentMethods: SellerPaymentMethod[] = [];
const localDocuments: SellerDocument[] = [];
const localComplianceReports: ComplianceReport[] = [];
const localComplianceCases: ComplianceCase[] = [];
const localAuditLogs: AuditLog[] = [];
const localStoreHealthScores: StoreHealthScore[] = [];
const localPayouts: unknown[] = [];

// Helper functions for offline simulation
function getOfflineProducts(opts?: {
  countryId?: string; categoryId?: string; sellerId?: string;
  sponsored?: boolean; limit?: number; search?: string;
  sort?: string; minPrice?: number; maxPrice?: number;
}): Product[] {
  let list = [...MOCK_PRODUCTS];
  if (opts?.countryId) {
    list = list.filter((p) => p.country_id?.toLowerCase() === opts.countryId?.toLowerCase());
  }
  if (opts?.categoryId) {
    list = list.filter((p) => p.category_id === opts.categoryId);
  }
  if (opts?.sellerId) {
    list = list.filter((p) => p.seller_id === opts.sellerId);
  }
  if (opts?.sponsored) {
    list = list.filter((p) => p.is_sponsored);
  }
  if (opts?.search) {
    const q = opts.search.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
  }
  if (opts?.minPrice !== undefined) {
    list = list.filter((p) => p.price >= opts.minPrice!);
  }
  if (opts?.maxPrice !== undefined) {
    list = list.filter((p) => p.price <= opts.maxPrice!);
  }

  if (opts?.sort === 'newest') {
    list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } else if (opts?.sort === 'priceLow') {
    list.sort((a, b) => a.price - b.price);
  } else if (opts?.sort === 'priceHigh') {
    list.sort((a, b) => b.price - a.price);
  } else if (opts?.sort === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  } else {
    list.sort((a, b) => b.total_reviews - a.total_reviews);
  }

  if (opts?.limit) {
    list = list.slice(0, opts.limit);
  }
  return list;
}

function getOfflineSellers(opts?: { countryId?: string; limit?: number }): Seller[] {
  let list = [...MOCK_SELLERS, ...localSellers];
  if (opts?.countryId) {
    list = list.filter((s) => s.country_id?.toLowerCase() === opts.countryId?.toLowerCase());
  }
  list.sort((a, b) => b.rating - a.rating);
  if (opts?.limit) {
    list = list.slice(0, opts.limit);
  }
  return list;
}

// ============ TENANT ISOLATION ENFORCER ============
export async function enforceTenantAccess(sellerId?: string | null, userId?: string | null): Promise<boolean> {
  if (isOfflineMode) return true; // Safe offline fallback
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    const meta = session.user.user_metadata || {};
    const userRole = meta.role || 'customer';
    if (userRole === 'superadmin' || userRole === 'admin') return true;

    if (userId && session.user.id !== userId) return false;

    if (sellerId) {
      let activeSellerId = meta.seller_id;
      if (!activeSellerId) {
        // Double check from db
        const { data } = await supabase.from('sellers').select('id').eq('user_id', session.user.id).maybeSingle();
        if (data) activeSellerId = data.id;
      }
      if (activeSellerId && activeSellerId !== sellerId) return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ============ QUERIES ============

export async function fetchCountries(): Promise<Country[]> {
  if (isOfflineMode) return MOCK_COUNTRIES;
  try {
    const { data, error } = await supabase.from('countries').select('*').eq('is_active', true).order('name');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('fetchCountries failed, using offline fallback:', e);
    return MOCK_COUNTRIES;
  }
}

export async function fetchCurrencies(): Promise<Currency[]> {
  if (isOfflineMode) return MOCK_CURRENCIES;
  try {
    const { data, error } = await supabase.from('currencies').select('*').eq('is_active', true);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('fetchCurrencies failed, using offline fallback:', e);
    return MOCK_CURRENCIES;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  if (isOfflineMode) return MOCK_CATEGORIES;
  try {
    const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('fetchCategories failed, using offline fallback:', e);
    return MOCK_CATEGORIES;
  }
}

export async function fetchBrands(): Promise<Brand[]> {
  if (isOfflineMode) return MOCK_BRANDS;
  try {
    const { data, error } = await supabase.from('brands').select('*').eq('is_active', true).order('name');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('fetchBrands failed, using offline fallback:', e);
    return MOCK_BRANDS;
  }
}

export async function fetchPaymentProviders(countryId?: string): Promise<PaymentProvider[]> {
  if (isOfflineMode) {
    if (countryId) return MOCK_PAYMENT_PROVIDERS.filter((p) => p.countries.includes(countryId.toUpperCase()));
    return MOCK_PAYMENT_PROVIDERS;
  }
  try {
    const query = supabase.from('payment_providers').select('*').eq('is_active', true).order('sort_order');
    const { data, error } = await query;
    if (error) throw error;
    if (countryId) return (data || []).filter((p) => p.countries.includes(countryId.toUpperCase()));
    return data || [];
  } catch (e) {
    console.warn('fetchPaymentProviders failed, using offline fallback:', e);
    if (countryId) return MOCK_PAYMENT_PROVIDERS.filter((p) => p.countries.includes(countryId.toUpperCase()));
    return MOCK_PAYMENT_PROVIDERS;
  }
}

export async function fetchProducts(opts?: {
  countryId?: string; categoryId?: string; sellerId?: string;
  sponsored?: boolean; limit?: number; search?: string;
  sort?: string; minPrice?: number; maxPrice?: number;
}): Promise<Product[]> {
  if (isOfflineMode) return getOfflineProducts(opts);
  try {
    let query = supabase.from('products').select(`
      *, product_images(*), product_variants(*), product_specifications(*),
      reviews(*), sellers(*), categories(*), brands(*), countries(*)
    `).eq('is_active', true);

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
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('fetchProducts failed, using offline fallback:', e);
    return getOfflineProducts(opts);
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  if (isOfflineMode) return MOCK_PRODUCTS.find((p) => p.slug === slug) || null;
  try {
    const { data, error } = await supabase.from('products').select(`
      *, product_images(*), product_variants(*), product_specifications(*),
      reviews(*), sellers(*), categories(*), brands(*), countries(*)
    `).eq('slug', slug).eq('is_active', true).maybeSingle();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('fetchProductBySlug failed, using offline fallback:', e);
    return MOCK_PRODUCTS.find((p) => p.slug === slug) || null;
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  if (isOfflineMode) return MOCK_PRODUCTS.find((p) => p.id === id) || null;
  try {
    const { data, error } = await supabase.from('products').select(`
      *, product_images(*), product_variants(*), product_specifications(*),
      reviews(*), sellers(*), categories(*), brands(*), countries(*)
    `).eq('id', id).eq('is_active', true).maybeSingle();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('fetchProductById failed, using offline fallback:', e);
    return MOCK_PRODUCTS.find((p) => p.id === id) || null;
  }
}

export async function fetchSellers(opts?: { countryId?: string; limit?: number }): Promise<Seller[]> {
  if (isOfflineMode) return getOfflineSellers(opts);
  try {
    let query = supabase.from('sellers').select('*').eq('status', 'approved');
    if (opts?.countryId) query = query.eq('country_id', opts.countryId);
    query = query.order('rating', { ascending: false });
    if (opts?.limit) query = query.limit(opts.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('fetchSellers failed, using offline fallback:', e);
    return getOfflineSellers(opts);
  }
}

export async function fetchSellerBySlug(slug: string): Promise<Seller | null> {
  if (isOfflineMode) return MOCK_SELLERS.find((s) => s.store_slug === slug || s.id === slug) || null;
  try {
    const { data, error } = await supabase.from('sellers').select('*').eq('store_slug', slug).eq('status', 'approved').maybeSingle();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('fetchSellerBySlug failed, using offline fallback:', e);
    return MOCK_SELLERS.find((s) => s.store_slug === slug || s.id === slug) || null;
  }
}

export async function fetchAdCampaigns(sellerId?: string): Promise<AdCampaign[]> {
  if (sellerId) {
    const isAllowed = await enforceTenantAccess(sellerId, null);
    if (!isAllowed) {
      console.warn(`Tenant access rejected for sellerId: ${sellerId}`);
      return [];
    }
  }
  if (isOfflineMode) {
    if (sellerId) return localAdCampaigns.filter((a) => a.seller_id === sellerId);
    return localAdCampaigns;
  }
  try {
    let query = supabase.from('ad_campaigns').select('*');
    if (sellerId) query = query.eq('seller_id', sellerId);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('fetchAdCampaigns failed, using offline fallback:', e);
    if (sellerId) return localAdCampaigns.filter((a) => a.seller_id === sellerId);
    return localAdCampaigns;
  }
}

export async function fetchOrders(userId?: string): Promise<Order[]> {
  if (userId) {
    const isAllowed = await enforceTenantAccess(null, userId);
    if (!isAllowed) {
      console.warn(`Tenant access rejected for userId: ${userId}`);
      return [];
    }
  }
  if (isOfflineMode) {
    if (userId) return localOrders.filter((o) => o.user_id === userId);
    return localOrders;
  }
  try {
    let query = supabase.from('orders').select(`*, order_items(*), sellers(*)`);
    if (userId) query = query.eq('user_id', userId);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('fetchOrders failed, using offline fallback:', e);
    if (userId) return localOrders.filter((o) => o.user_id === userId);
    return localOrders;
  }
}

export async function fetchAddresses(userId: string): Promise<Address[]> {
  if (isOfflineMode) return localAddresses;
  try {
    const { data, error } = await supabase.from('addresses').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('fetchAddresses failed, using offline fallback:', e);
    return localAddresses;
  }
}

export function searchSuggestions(products: Product[], sellers: Seller[], categories: Category[], query: string): string[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const prodNames = products.filter((p) => p.name.toLowerCase().includes(q)).map((p) => p.name).slice(0, 5);
  const sellerNames = sellers.filter((s) => s.business_name.toLowerCase().includes(q)).map((s) => s.business_name).slice(0, 3);
  const catNames = categories.filter((c) => c.name.toLowerCase().includes(q)).map((c) => c.name).slice(0, 2);
  return [...prodNames, ...sellerNames, ...catNames];
}

// ============ UPLOAD ============

export async function uploadProductImage(file: File, sellerId: string): Promise<string | null> {
  if (isOfflineMode) {
    return URL.createObjectURL(file);
  }
  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${sellerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (e) {
    console.warn('uploadProductImage failed, using object URL fallback:', e);
    return URL.createObjectURL(file);
  }
}

export async function uploadSellerAsset(file: File, sellerId: string, type: 'logo' | 'banner'): Promise<string | null> {
  if (isOfflineMode) {
    return URL.createObjectURL(file);
  }
  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${sellerId}/${type}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('seller-assets').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('seller-assets').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (e) {
    console.warn('uploadSellerAsset failed, using object URL fallback:', e);
    return URL.createObjectURL(file);
  }
}

// ============ MUTATIONS ============

export async function createSeller(opts: {
  userId: string;
  businessName: string;
  storeSlug: string;
  description: string;
  countryId: string;
  city: string;
  phone: string;
  businessType: string;
  storeLogoUrl?: string | null;
  storeBannerUrl?: string | null;
}): Promise<string | null> {
  const newId = 'seller-' + Math.random().toString(36).slice(2, 9);
  const s: Seller = {
    id: newId,
    business_name: opts.businessName,
    store_slug: opts.storeSlug,
    store_logo_url: opts.storeLogoUrl || 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=200&h=200&fit=crop',
    store_banner_url: opts.storeBannerUrl || 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=1080&h=300&fit=crop',
    description: opts.description,
    country_id: opts.countryId,
    city: opts.city,
    phone: opts.phone,
    plan: 'starter',
    status: 'pending',
    business_type: opts.businessType,
    rating: 5.0,
    total_reviews: 0,
    total_products: 0,
    joined_year: new Date().getFullYear(),
    is_official: false,
  };
  localSellers.push(s);

  if (isOfflineMode) return newId;
  try {
    const { data, error } = await supabase.from('sellers').insert({
      user_id: opts.userId,
      business_name: opts.businessName,
      store_slug: opts.storeSlug,
      description: opts.description,
      country_id: opts.countryId,
      city: opts.city,
      phone: opts.phone,
      business_type: opts.businessType,
      store_logo_url: opts.storeLogoUrl || null,
      store_banner_url: opts.storeBannerUrl || null,
      status: 'pending',
      plan: 'starter',
      rating: 5.0,
      total_reviews: 0,
      total_products: 0,
      joined_year: new Date().getFullYear(),
    }).select('id').single();

    if (error || !data) throw error || new Error('No data');
    return data.id;
  } catch (e) {
    console.warn('createSeller failed, using offline fallback:', e);
    return newId;
  }
}

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
  const isAllowed = await enforceTenantAccess(opts.sellerId, null);
  if (!isAllowed) {
    throw new Error(`Unauthorized tenant access for sellerId: ${opts.sellerId}`);
  }
  const slug = opts.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).slice(2, 6);
  const newId = 'prod-' + Math.random().toString(36).slice(2, 9);

  const s = MOCK_SELLERS.find(x => x.id === opts.sellerId) || MOCK_SELLERS[0];
  const cat = MOCK_CATEGORIES.find(x => x.id === opts.categoryId) || MOCK_CATEGORIES[0];
  const country = MOCK_COUNTRIES.find(x => x.id === opts.countryId) || MOCK_COUNTRIES[0];

  const p: Product = {
    id: newId,
    seller_id: opts.sellerId,
    category_id: opts.categoryId ?? null,
    brand_id: opts.brandId ?? null,
    country_id: opts.countryId ?? null,
    name: opts.name,
    slug,
    description: opts.description,
    price: opts.price,
    old_price: opts.oldPrice ?? null,
    currency_code: opts.currencyCode,
    sku: opts.sku ?? null,
    stock: opts.stock,
    rating: 5.0,
    total_reviews: 0,
    is_sponsored: false,
    is_active: true,
    created_at: new Date().toISOString(),
    product_images: opts.imageUrls.map((url, i) => ({ id: `${newId}-img-${i}`, image_url: url, sort_order: i })),
    product_variants: opts.variants?.map((v, i) => ({ id: `${newId}-var-${i}`, variant_type: v.variant_type, variant_value: v.variant_value, price_adjustment: v.price_adjustment, stock: v.stock })) || [],
    reviews: [],
    sellers: s,
    categories: cat,
    countries: country,
  };
  MOCK_PRODUCTS.push(p);

  if (isOfflineMode) return newId;
  try {
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
    }).select('id').single();

    if (error || !product) throw error || new Error('No data');

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
  } catch (e) {
    console.warn('createProduct failed, using offline fallback:', e);
    return newId;
  }
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
  const newId = 'order-' + Math.random().toString(36).slice(2, 9);

  const orderItems: OrderItem[] = opts.items.map((it) => ({
    id: 'item-' + Math.random().toString(36).slice(2, 9),
    order_id: newId,
    product_id: it.product_id,
    product_name: it.product_name,
    qty: it.qty,
    price: it.price,
    image_url: it.image_url,
  }));

  const s = MOCK_SELLERS.find(x => x.id === opts.sellerId);

  const o: Order = {
    id: newId,
    user_id: opts.userId,
    seller_id: opts.sellerId,
    status: 'pending',
    total: opts.total,
    currency_code: opts.currencyCode,
    payment_method: opts.paymentMethod,
    delivery_address: opts.deliveryAddress,
    tracking_id: trackingId,
    created_at: new Date().toISOString(),
    order_items: orderItems,
    sellers: s,
  };
  localOrders.push(o);

  if (isOfflineMode) return newId;
  try {
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

    if (error || !order) throw error || new Error('No data');

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
  } catch (e) {
    console.warn('createOrder failed, using offline fallback:', e);
    return newId;
  }
}

export async function createReview(opts: {
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
}): Promise<boolean> {
  const r: Review = {
    id: 'rev-' + Math.random().toString(36).slice(2, 9),
    author_name: opts.authorName,
    rating: opts.rating,
    comment: opts.comment,
    is_verified: true,
    created_at: new Date().toISOString(),
  };
  localReviews.push(r);

  const prod = MOCK_PRODUCTS.find((p) => p.id === opts.productId);
  if (prod) {
    if (!prod.reviews) prod.reviews = [];
    prod.reviews.push(r);
  }

  if (isOfflineMode) return true;
  try {
    const { error } = await supabase.from('reviews').insert({
      product_id: opts.productId,
      user_id: opts.userId,
      author_name: opts.authorName,
      rating: opts.rating,
      comment: opts.comment,
      is_verified: true,
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('createReview failed, using offline fallback:', e);
    return true;
  }
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
  const isAllowed = await enforceTenantAccess(opts.sellerId, null);
  if (!isAllowed) {
    throw new Error(`Unauthorized tenant access for sellerId: ${opts.sellerId}`);
  }
  const newId = 'campaign-' + Math.random().toString(36).slice(2, 9);
  const a: AdCampaign = {
    id: newId,
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
    created_at: new Date().toISOString(),
  };
  localAdCampaigns.push(a);

  if (isOfflineMode) return newId;
  try {
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

    if (error || !data) throw error || new Error('No data');
    return data.id;
  } catch (e) {
    console.warn('createAdCampaign failed, using offline fallback:', e);
    return newId;
  }
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
  const newId = 'addr-' + Math.random().toString(36).slice(2, 9);
  const addr: Address = {
    id: newId,
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
  };
  if (opts.isDefault) {
    localAddresses.forEach((a) => a.is_default = false);
  }
  localAddresses.push(addr);

  if (isOfflineMode) return newId;
  try {
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

    if (error || !data) throw error;
    return data.id;
  } catch (e) {
    console.warn('createAddress failed, using offline fallback:', e);
    return newId;
  }
}

// ============ COMPLIANCE CENTER ============

export async function fetchAuditLogs(limit = 100): Promise<AuditLog[]> {
  if (isOfflineMode) return localAuditLogs.slice(0, limit);
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as AuditLog[];
  } catch (e) {
    console.warn('fetchAuditLogs failed, using offline fallback:', e);
    return localAuditLogs.slice(0, limit);
  }
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
  const log: AuditLog = {
    id: 'log-' + Math.random().toString(36).slice(2, 9),
    actor_id: opts.actorId ?? null,
    actor_name: opts.actorName ?? null,
    action: opts.action,
    target_type: opts.targetType ?? null,
    target_id: opts.targetId ?? null,
    target_name: opts.targetName ?? null,
    previous_value: opts.previousValue ?? null,
    new_value: opts.newValue ?? null,
    reason: opts.reason ?? null,
    ip_address: '127.0.0.1',
    created_at: new Date().toISOString(),
  };
  localAuditLogs.unshift(log);

  if (isOfflineMode) return;
  try {
    await supabase.from('audit_logs').insert({
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
  } catch (e) {
    console.warn('logAuditAction failed offline:', e);
  }
}

export async function fetchComplianceReports(status?: string): Promise<ComplianceReport[]> {
  if (isOfflineMode) {
    if (status && status !== 'all') return localComplianceReports.filter((r) => r.status === status);
    return localComplianceReports;
  }
  try {
    let q = supabase.from('compliance_reports').select('*').order('created_at', { ascending: false }).limit(100);
    if (status && status !== 'all') q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as ComplianceReport[];
  } catch (e) {
    console.warn('fetchComplianceReports failed, using offline fallback:', e);
    if (status && status !== 'all') return localComplianceReports.filter((r) => r.status === status);
    return localComplianceReports;
  }
}

export async function fetchComplianceCases(status?: string): Promise<ComplianceCase[]> {
  if (isOfflineMode) {
    if (status && status !== 'all') return localComplianceCases.filter((c) => c.status === status);
    return localComplianceCases;
  }
  try {
    let q = supabase.from('compliance_cases').select('*').order('updated_at', { ascending: false }).limit(100);
    if (status && status !== 'all') q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as ComplianceCase[];
  } catch (e) {
    console.warn('fetchComplianceCases failed, using offline fallback:', e);
    if (status && status !== 'all') return localComplianceCases.filter((c) => c.status === status);
    return localComplianceCases;
  }
}

export async function fetchStoreHealthScores(): Promise<StoreHealthScore[]> {
  if (isOfflineMode) return localStoreHealthScores;
  try {
    const { data, error } = await supabase
      .from('store_health_scores')
      .select('*')
      .order('calculated_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data || []) as StoreHealthScore[];
  } catch (e) {
    console.warn('fetchStoreHealthScores failed, using offline fallback:', e);
    return localStoreHealthScores;
  }
}

export async function fetchSellerPaymentMethods(sellerId: string): Promise<SellerPaymentMethod[]> {
  const isAllowed = await enforceTenantAccess(sellerId, null);
  if (!isAllowed) {
    console.warn(`Tenant access rejected for sellerId: ${sellerId}`);
    return [];
  }
  const filtered = localPaymentMethods.filter((m) => m.seller_id === sellerId);
  if (isOfflineMode) return filtered;
  try {
    const { data, error } = await supabase
      .from('seller_payment_methods')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as SellerPaymentMethod[];
  } catch (e) {
    console.warn('fetchSellerPaymentMethods failed, using offline fallback:', e);
    return filtered;
  }
}

export async function fetchSellerDocuments(sellerId: string): Promise<SellerDocument[]> {
  const isAllowed = await enforceTenantAccess(sellerId, null);
  if (!isAllowed) {
    console.warn(`Tenant access rejected for sellerId: ${sellerId}`);
    return [];
  }
  const filtered = localDocuments.filter((d) => d.seller_id === sellerId);
  if (isOfflineMode) return filtered;
  try {
    const { data, error } = await supabase
      .from('seller_documents')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as SellerDocument[];
  } catch (e) {
    console.warn('fetchSellerDocuments failed, using offline fallback:', e);
    return filtered;
  }
}

export async function fetchComplianceSellers(status?: string): Promise<ComplianceSeller[]> {
  const mappedSellers: ComplianceSeller[] = [...MOCK_SELLERS, ...localSellers].map((s) => ({
    ...s,
    risk_score: 15,
    compliance_score: 95,
    health_status: 'healthy',
    strikes_count: 0,
    suspended_reason: null,
    suspended_at: null,
    identity_selfie_url: null,
    warehouse_photos: [],
    store_photos: [],
    phone_verified: true,
    email_verified: true,
    bank_verified: true,
    compliance_status: 'approved',
    registration_number: 'REG-12345',
    vat_number: null,
    bank_name: 'Ecobank',
    bank_iban: null,
    bank_swift: null,
    mobile_money_number: s.phone,
  }));
  if (status && status !== 'all') {
    return mappedSellers.filter((s) => s.compliance_status === status || s.status === status);
  }
  return mappedSellers;
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
  const idx = localSellers.findIndex((s) => s.id === sellerId);
  if (idx !== -1) {
    localSellers[idx] = { ...localSellers[idx], ...updates } as Seller;
  }
  const idxMock = MOCK_SELLERS.findIndex((s) => s.id === sellerId);
  if (idxMock !== -1) {
    MOCK_SELLERS[idxMock] = { ...MOCK_SELLERS[idxMock], ...updates } as Seller;
  }

  if (isOfflineMode) return true;
  try {
    const { error } = await supabase.from('sellers').update(updates).eq('id', sellerId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('updateSellerCompliance failed offline:', e);
    return true;
  }
}

export async function updateSellerDocument(
  docId: string,
  updates: Record<string, unknown>
): Promise<boolean> {
  const idx = localDocuments.findIndex((d) => d.id === docId);
  if (idx !== -1) {
    localDocuments[idx] = { ...localDocuments[idx], ...updates } as SellerDocument;
  }

  if (isOfflineMode) return true;
  try {
    const { error } = await supabase.from('seller_documents').update(updates).eq('id', docId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('updateSellerDocument failed offline:', e);
    return true;
  }
}

export async function updateComplianceReport(
  reportId: string,
  status: string,
  caseId?: string | null
): Promise<boolean> {
  const idx = localComplianceReports.findIndex((r) => r.id === reportId);
  if (idx !== -1) {
    localComplianceReports[idx].status = status;
    localComplianceReports[idx].case_id = caseId ?? null;
  }

  if (isOfflineMode) return true;
  try {
    const { error } = await supabase
      .from('compliance_reports')
      .update({ status, case_id: caseId ?? null })
      .eq('id', reportId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('updateComplianceReport failed offline:', e);
    return true;
  }
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
  const idx = localComplianceCases.findIndex((c) => c.id === caseId);
  if (idx !== -1) {
    localComplianceCases[idx] = { ...localComplianceCases[idx], ...updates, updated_at: new Date().toISOString() };
  }

  if (isOfflineMode) return true;
  try {
    const { error } = await supabase
      .from('compliance_cases')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', caseId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('updateComplianceCase failed offline:', e);
    return true;
  }
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
  const newId = 'report-' + Math.random().toString(36).slice(2, 9);
  const rep: ComplianceReport = {
    id: newId,
    reporter_id: opts.reporterId ?? null,
    reporter_name: opts.reporterName ?? null,
    report_type: opts.reportType,
    target_type: opts.targetType,
    target_id: opts.targetId ?? null,
    target_name: opts.targetName ?? null,
    reason: opts.reason ?? null,
    description: opts.description ?? null,
    status: 'open',
    case_id: null,
    created_at: new Date().toISOString(),
  };
  localComplianceReports.unshift(rep);

  if (isOfflineMode) return newId;
  try {
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
    if (error || !data) throw error;
    return data.id;
  } catch (e) {
    console.warn('createComplianceReport failed, using offline fallback:', e);
    return newId;
  }
}

export async function addSellerPaymentMethod(opts: {
  sellerId: string;
  providerName: string;
  providerType: string;
  accountIdentifier?: string | null;
  displayName?: string | null;
  instructions?: string | null;
}): Promise<string | null> {
  const isAllowed = await enforceTenantAccess(opts.sellerId, null);
  if (!isAllowed) {
    throw new Error(`Unauthorized tenant access for sellerId: ${opts.sellerId}`);
  }
  const newId = 'method-' + Math.random().toString(36).slice(2, 9);
  const m: SellerPaymentMethod = {
    id: newId,
    seller_id: opts.sellerId,
    provider_name: opts.providerName,
    provider_type: opts.providerType,
    account_identifier: opts.accountIdentifier ?? null,
    display_name: opts.displayName ?? null,
    instructions: opts.instructions ?? null,
    is_active: true,
    is_verified: false,
    created_at: new Date().toISOString(),
  };
  localPaymentMethods.push(m);

  if (isOfflineMode) return newId;
  try {
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
    if (error || !data) throw error;
    return data.id;
  } catch (e) {
    console.warn('addSellerPaymentMethod failed, using offline fallback:', e);
    return newId;
  }
}

export async function removeSellerPaymentMethod(methodId: string): Promise<boolean> {
  const idx = localPaymentMethods.findIndex((m) => m.id === methodId);
  if (idx !== -1) {
    localPaymentMethods.splice(idx, 1);
  }

  if (isOfflineMode) return true;
  try {
    const { error } = await supabase.from('seller_payment_methods').delete().eq('id', methodId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('removeSellerPaymentMethod failed offline:', e);
    return true;
  }
}

export async function toggleSellerPaymentMethod(methodId: string, isActive: boolean): Promise<boolean> {
  const idx = localPaymentMethods.findIndex((m) => m.id === methodId);
  if (idx !== -1) {
    localPaymentMethods[idx].is_active = isActive;
  }

  if (isOfflineMode) return true;
  try {
    const { error } = await supabase.from('seller_payment_methods').update({ is_active: isActive }).eq('id', methodId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('toggleSellerPaymentMethod failed offline:', e);
    return true;
  }
}

export async function updateSellerStatus(sellerId: string, status: string): Promise<boolean> {
  const idx = localSellers.findIndex((s) => s.id === sellerId);
  if (idx !== -1) {
    localSellers[idx].status = status as 'pending' | 'approved' | 'rejected' | 'suspended';
  }
  const idxMock = MOCK_SELLERS.findIndex((s) => s.id === sellerId);
  if (idxMock !== -1) {
    MOCK_SELLERS[idxMock].status = status as 'pending' | 'approved' | 'rejected' | 'suspended';
  }

  if (isOfflineMode) return true;
  try {
    const { error } = await supabase.from('sellers').update({ status }).eq('id', sellerId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('updateSellerStatus failed offline:', e);
    return true;
  }
}

export async function updateAdCampaignStatus(campaignId: string, status: string): Promise<boolean> {
  const idx = localAdCampaigns.findIndex((a) => a.id === campaignId);
  if (idx !== -1) {
    localAdCampaigns[idx].status = status as 'pending' | 'active' | 'ended' | 'rejected';
  }

  if (isOfflineMode) return true;
  try {
    const { error } = await supabase.from('ad_campaigns').update({ status }).eq('id', campaignId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('updateAdCampaignStatus failed offline:', e);
    return true;
  }
}

export async function updateUserProfile(userId: string, updates: { full_name?: string; phone?: string }): Promise<boolean> {
  if (isOfflineMode) return true;
  try {
    const { error } = await supabase.auth.updateUser({
      data: { full_name: updates.full_name, phone: updates.phone },
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('updateUserProfile failed offline:', e);
    return true;
  }
}

export async function createPayoutRequest(opts: { sellerId: string; amount: number; status?: string }): Promise<string | null> {
  const isAllowed = await enforceTenantAccess(opts.sellerId, null);
  if (!isAllowed) {
    throw new Error(`Unauthorized tenant access for sellerId: ${opts.sellerId}`);
  }
  const newId = 'payout-' + Math.random().toString(36).slice(2, 9);
  localPayouts.push({ id: newId, seller_id: opts.sellerId, amount: opts.amount, status: opts.status || 'pending' });

  if (isOfflineMode) return newId;
  try {
    const { data, error } = await supabase.from('payouts').insert({
      seller_id: opts.sellerId,
      amount: opts.amount,
      status: opts.status || 'pending',
    }).select('id').single();
    if (error || !data) throw error;
    return data.id;
  } catch (e) {
    console.warn('createPayoutRequest failed, using offline fallback:', e);
    return newId;
  }
}
