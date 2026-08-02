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

// ============ QUERIES ============

export async function fetchCountries(): Promise<Country[]> {
  const { data, error } = await supabase.from('countries').select('*').eq('is_active', true).order('name');
  if (error) throw error;
  return data || [];
}

export async function fetchCurrencies(): Promise<Currency[]> {
  const { data, error } = await supabase.from('currencies').select('*').eq('is_active', true);
  if (error) throw error;
  return data || [];
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await supabase.from('brands').select('*').eq('is_active', true).order('name');
  if (error) throw error;
  return data || [];
}

export async function fetchPaymentProviders(countryId?: string): Promise<PaymentProvider[]> {
  let query = supabase.from('payment_providers').select('*').eq('is_active', true).order('sort_order');
  const { data, error } = await query;
  if (error) throw error;
  if (countryId) return (data || []).filter((p) => p.countries.includes(countryId));
  return data || [];
}

export async function fetchProducts(opts?: {
  countryId?: string; categoryId?: string; sellerId?: string;
  sponsored?: boolean; limit?: number; search?: string;
  sort?: string; minPrice?: number; maxPrice?: number;
}): Promise<Product[]> {
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
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select(`
    *, product_images(*), product_variants(*), product_specifications(*),
    reviews(*), sellers(*), categories(*), brands(*), countries(*)
  `).eq('slug', slug).eq('is_active', true).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select(`
    *, product_images(*), product_variants(*), product_specifications(*),
    reviews(*), sellers(*), categories(*), brands(*), countries(*)
  `).eq('id', id).eq('is_active', true).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSellers(opts?: { countryId?: string; limit?: number }): Promise<Seller[]> {
  let query = supabase.from('sellers').select('*').eq('status', 'approved');
  if (opts?.countryId) query = query.eq('country_id', opts.countryId);
  query = query.order('rating', { ascending: false });
  if (opts?.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchSellerBySlug(slug: string): Promise<Seller | null> {
  const { data, error } = await supabase.from('sellers').select('*').eq('store_slug', slug).eq('status', 'approved').maybeSingle();
  if (error) throw error;
  return data;
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

export function searchSuggestions(products: Product[], sellers: Seller[], categories: Category[], query: string, locale: 'fr' | 'en'): string[] {
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

export async function createPayoutRequest(opts: { sellerId: string; amount: number; status?: string }): Promise<string | null> {
  const { data, error } = await supabase.from('payouts').insert({
    seller_id: opts.sellerId,
    amount: opts.amount,
    status: opts.status || 'pending',
  }).select('id').single();
  if (error || !data) { console.error('createPayoutRequest:', error.message); return null; }
  return data.id;
}
