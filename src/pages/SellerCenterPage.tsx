import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { fetchProducts, fetchSellerOrders, updateOrderStatus, fetchSellerCampaignsDetailed, uploadProductImage, uploadDigitalFile, createProduct, fetchSellerPaymentMethods, addSellerPaymentMethod, removeSellerPaymentMethod, toggleSellerPaymentMethod, updateSellerPlan, initiateSubscriptionPayment, isSellerPlanActive, fetchSellerFlashDeals, createFlashDeal, endFlashDeal, fetchSellerCoupons, createCoupon, deactivateCoupon, fetchSellerReturnRequests, respondToReturnRequest, fetchSellerConversations, fetchConversationMessages, sendMessage, markConversationRead, fetchSellerAccountHealth, fetchSellerInventoryAlerts, updateProductStock, updateProductLowStockThreshold, fetchSellerShippingRates, addShippingRate, removeShippingRate, fetchReportsAgainstSeller, submitSellerReportResponse, fetchSellerPspCredentials, connectSellerPsp, disconnectSellerPsp, deleteProduct, fetchSellerProfile, updateSellerProfile } from '@/lib/db';
import type { Product, Order, AdCampaign, SellerPaymentMethod, FlashDeal, Coupon, ReturnRequest, Conversation, Message, SellerAccountHealth, InventoryAlert, ShippingRate, ComplianceReport, SellerPspCredential } from '@/lib/db';
import { generateInvoicePdf } from '@/lib/invoice';
import { StatCard, Badge } from '@/components/ui';
import { LayoutDashboard, Package, ShoppingCart, Truck, RotateCcw, Star, CreditCard, Megaphone, BarChart3, Plus, TrendingUp, DollarSign, Clock, CheckCircle, XCircle, MessageSquare, MessageCircle, Wallet, FileText, Settings, Bell, Loader2, ImagePlus, Trash2, ShieldCheck, Flame, Tag, Download, PackageCheck, AlertTriangle, Smartphone, Landmark, Lock, Upload } from 'lucide-react';
import Papa from 'papaparse';

// Major global payment service providers, with strong African + worldwide
// coverage — sellers pick their own PSP here; Zando never touches the
// funds or takes a cut.
const PSP_OPTIONS: Record<string, string[]> = {
  card: ['Stripe', 'Paddle', 'PayPal', 'Adyen', 'Square', 'Worldpay', 'PayUnit', 'Flutterwave', 'Paystack', 'CinetPay', 'Interswitch', 'DPO Pay', 'Peach Payments', 'Yoco', 'PayFast', 'Cellulant (Tingg)', 'Fawry', 'PawaPay', 'Razorpay', 'PayU', 'Mercado Pago', 'Autre / Other'],
  mobile_money: ['M-Pesa', 'MTN Mobile Money (MoMo)', 'Orange Money', 'Airtel Money', 'Moov Money', 'Wave', 'Tigo Pesa', 'EcoCash', 'PayUnit', 'Autre / Other'],
  bank: ['Virement bancaire direct / Direct bank transfer', 'PayUnit', 'Autre / Other'],
  crypto: ['USDT (TRC20)', 'USDT (ERC20)', 'Bitcoin', 'Autre / Other'],
  digital_wallet: ['Airwallex', 'Alipay', 'WeChat Pay', 'Autre / Other'],
};

type NewProduct = {
  name: string;
  description: string;
  price: string;
  oldPrice: string;
  stock: string;
  sku: string;
  categoryId: string;
  productType: 'physical' | 'digital';
  currencyCode: string;
};

const emptyProduct: NewProduct = { name: '', description: '', price: '', oldPrice: '', stock: '', sku: '', categoryId: '', productType: 'physical', currencyCode: 'USD' };

type BulkProductRow = {
  name: string; description: string; price: string; currency: string; oldPrice: string;
  category: string; stock: string; sku: string; imageUrl1: string; imageUrl2: string; imageUrl3: string;
  status: 'pending' | 'ok' | 'error'; error?: string;
};

const BULK_CSV_TEMPLATE = 'name,description,price,currency,old_price,category,stock,sku,image_url_1,image_url_2,image_url_3\n"Robe Wax Premium","Robe en tissu wax 100% coton, coupe ajustée",45,USD,60,Mode,25,ZND-001,https://exemple.com/image1.jpg,,\n';

export function SellerCenterPage() {
  const { t, locale, user, navigate, showToast, categories, countries, params, currencies } = useApp();
  const [tab, setTab] = useState('dashboard');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkProductRow[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ succeeded: number; failed: { row: number; name: string; reason: string }[] } | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellerProfile, setSellerProfile] = useState<{ businessName: string; description: string; phone: string; countryId: string; city: string; businessAddress: string }>({ businessName: '', description: '', phone: '', countryId: '', city: '', businessAddress: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [sellerReports, setSellerReports] = useState<ComplianceReport[]>([]);
  const [respondingReportId, setRespondingReportId] = useState<string | null>(null);
  const [reportResponseText, setReportResponseText] = useState('');
  const [respondingReturnId, setRespondingReturnId] = useState<string | null>(null);
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState<NewProduct>(emptyProduct);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [digitalFileMeta, setDigitalFileMeta] = useState<{ path: string; name: string; size: number } | null>(null);
  const [digitalFileUploading, setDigitalFileUploading] = useState(false);
  const digitalFileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [paymentMethods, setPaymentMethods] = useState<SellerPaymentMethod[]>([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({ providerName: PSP_OPTIONS.card[0], providerType: 'card', accountIdentifier: '', displayName: '' });
  const [pspCredentials, setPspCredentials] = useState<SellerPspCredential[]>([]);
  const [showApiPspForm, setShowApiPspForm] = useState(false);
  const [connectingPsp, setConnectingPsp] = useState(false);
  const [apiPspForm, setApiPspForm] = useState<{ provider: SellerPspCredential['provider']; publicKey: string; secretKey: string; merchantId: string; mode: 'test' | 'live' }>({ provider: 'stripe', publicKey: '', secretKey: '', merchantId: '', mode: 'live' });
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [newRate, setNewRate] = useState({ countryId: '', fee: '', minDays: '5', maxDays: '10' });
  const [savingRate, setSavingRate] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [planActive, setPlanActive] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<'starter' | 'premium' | 'enterprise' | null>(null);
  const [upgradeProvider, setUpgradeProvider] = useState<'stripe' | 'flutterwave' | 'payunit' | 'paddle'>('stripe');

  // Deep-link support: arriving from the public Plans page with a plan
  // pre-selected (e.g. after choosing a paid tier) jumps straight to the
  // Subscription tab and opens the checkout provider picker.
  useEffect(() => {
    if (params.tab) setTab(params.tab);
    if (params.plan === 'starter' || params.plan === 'premium' || params.plan === 'enterprise') {
      setUpgradingPlan(params.plan);
    }
  }, [params.tab, params.plan]);
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>([]);
  const [flashDealFor, setFlashDealFor] = useState<string | null>(null);
  const [newDeal, setNewDeal] = useState({ discountPercent: '20', durationHours: '24', stockLimit: '' });
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountType: 'percent' as 'percent' | 'fixed', discountValue: '10', minOrderAmount: '', usageLimit: '', expiresAt: '' });

  useEffect(() => {
    (async () => {
      if (!user?.sellerId) { setLoading(false); return; }
      try {
        const sellerId = user.sellerId;
        const [prods, ords, adCamp, rets, myReports, profile] = await Promise.all([
          fetchProducts({ sellerId, limit: 50, approvalStatus: 'all' }),
          fetchSellerOrders(sellerId),
          fetchSellerCampaignsDetailed(sellerId),
          fetchSellerReturnRequests(sellerId),
          fetchReportsAgainstSeller(),
          fetchSellerProfile(sellerId),
        ]);
        if (profile) {
          setSellerProfile({
            businessName: profile.business_name || '',
            description: profile.description || '',
            phone: profile.phone || '',
            countryId: profile.country_id || '',
            city: profile.city || '',
            businessAddress: profile.business_address || '',
          });
        }
        setProducts(prods);
        setOrders(ords);
        setAds(adCamp);
        setReturns(rets);
        setSellerReports(myReports);
        const pms = await fetchSellerPaymentMethods(sellerId);
        setPaymentMethods(pms);
        setPspCredentials(await fetchSellerPspCredentials(sellerId));
        setPlanActive(await isSellerPlanActive(sellerId));
        setShippingRates(await fetchSellerShippingRates(sellerId));
        setFlashDeals(await fetchSellerFlashDeals(sellerId));
        setCoupons(await fetchSellerCoupons(sellerId));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const whatsappOrderLink = (o: Order) => {
    if (!o.customer_phone) return null;
    const digits = o.customer_phone.replace(/[^\d]/g, '');
    if (digits.length < 8) return null;
    const items = (o.order_items || []).map((it) => `- ${it.product_name} x${it.qty}`).join('\n');
    const timeline = o.shipping_min_days ? `${o.shipping_min_days}-${o.shipping_max_days} ${locale === 'fr' ? 'jours' : 'days'}` : (locale === 'fr' ? 'à confirmer' : 'to confirm');
    const msg = locale === 'fr'
      ? `Bonjour, votre commande ${o.tracking_id} est confirmée !\n${items}\nTotal: $${o.total.toFixed(2)}\nLivraison: ${o.delivery_address || ''}\nDélai estimé: ${timeline}`
      : `Hi, your order ${o.tracking_id} is confirmed!\n${items}\nTotal: $${o.total.toFixed(2)}\nShipping to: ${o.delivery_address || ''}\nEstimated delivery: ${timeline}`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
  };

  const navItems = [
    { id: 'dashboard', label: t.seller.dashboard, icon: LayoutDashboard },
    { id: 'account-health', label: locale === 'fr' ? 'Santé du compte' : 'Account Health', icon: ShieldCheck },
    { id: 'inventory', label: locale === 'fr' ? 'Inventaire' : 'Inventory', icon: PackageCheck },
    { id: 'products', label: t.seller.products, icon: Package },
    { id: 'orders', label: t.seller.orders, icon: ShoppingCart },
    { id: 'deliveries', label: t.seller.deliveries, icon: Truck },
    { id: 'returns', label: t.seller.returns, icon: RotateCcw },
    { id: 'reputation', label: t.seller.reputation, icon: Star },
    { id: 'ads', label: t.seller.ads, icon: Megaphone },
    { id: 'coupons', label: locale === 'fr' ? 'Codes promo' : 'Coupons', icon: Tag },
    { id: 'analytics', label: t.seller.analytics, icon: BarChart3 },
    { id: 'messages', label: locale === 'fr' ? 'Messages' : 'Messages', icon: MessageSquare },
    { id: 'payments', label: locale === 'fr' ? 'Moyens de paiement' : 'Payment methods', icon: Wallet },
    { id: 'logistics', label: locale === 'fr' ? 'Logistique' : 'Logistics', icon: Truck },
    { id: 'invoices', label: locale === 'fr' ? 'Factures' : 'Invoices', icon: FileText },
    { id: 'subscription', label: t.seller.subscription, icon: CreditCard },
    { id: 'settings', label: locale === 'fr' ? 'Paramètres' : 'Settings', icon: Settings },
  ];

  const plan = user?.sellerPlan || 'starter';
  const planColor = plan === 'enterprise' ? '#ff7a00' : plan === 'premium' ? '#ff7a00' : '#64748b';

  // Real revenue: sum of the seller's own orders, not a proxy formula.
  const completedOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const avgRating = products.length > 0 ? products.reduce((sum, p) => sum + p.rating, 0) / products.length : 0;
  const totalReviews = products.reduce((sum, p) => sum + p.total_reviews, 0);

  // Real period-over-period trend (last 30 days vs the 30 days before that)
  // — replaces what used to be hardcoded "+15%" / "+22%" shown to every
  // seller regardless of their actual performance. Omitted (not faked)
  // when there's no prior-period data to compare against.
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const inWindow = (o: Order, startDaysAgo: number, endDaysAgo: number) => {
    const t = new Date(o.created_at).getTime();
    return t >= now - startDaysAgo * DAY && t < now - endDaysAgo * DAY;
  };
  const thisPeriod = completedOrders.filter((o) => inWindow(o, 30, 0));
  const prevPeriod = completedOrders.filter((o) => inWindow(o, 60, 30));
  const pctChange = (curr: number, prev: number): string | undefined => {
    if (prev === 0) return curr > 0 ? (locale === 'fr' ? 'Nouveau' : 'New') : undefined;
    const pct = Math.round(((curr - prev) / prev) * 100);
    return `${pct >= 0 ? '+' : ''}${pct}%`;
  };
  const ordersTrend = pctChange(thisPeriod.length, prevPeriod.length);
  const revenueTrend = pctChange(thisPeriod.reduce((s, o) => s + o.total, 0), prevPeriod.reduce((s, o) => s + o.total, 0));
  const totalOrders = orders.length;
  const activeProducts = products.filter((p) => p.approval_status === 'approved' && p.is_active).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 5);
  const outOfStock = products.filter((p) => p.stock === 0);

  // Real daily revenue for the last 14 days — used by the Analytics tab's
  // sales-over-time chart. Built from the full (untruncated) order
  // history, not just the 10 most recent orders.
  const dailyRevenue = (() => {
    const days: { label: string; total: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const total = completedOrders
        .filter((o) => { const t = new Date(o.created_at); return t >= dayStart && t < dayEnd; })
        .reduce((s, o) => s + o.total, 0);
      days.push({ label: dayStart.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: '2-digit' }), total });
    }
    return days;
  })();

  const reloadProducts = async () => {
    if (!user?.sellerId && !user?.id) return;
    const sellerId = user.sellerId || user.id;
    const prods = await fetchProducts({ sellerId, limit: 50, approvalStatus: 'all' });
    setProducts(prods);
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!user?.sellerId) {
      showToast(locale === 'fr' ? 'Boutique introuvable — reconnectez-vous' : 'Store not found — please log in again', 'error');
      return;
    }
    const sellerId = user.sellerId;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) {
        showToast(locale === 'fr' ? 'Image trop grande (max 10MB)' : 'Image too large (max 10MB)');
        continue;
      }
      const url = await uploadProductImage(file, sellerId);
      if (url) setUploadedImages((prev) => [...prev, url]);
      else showToast(locale === 'fr' ? 'Échec de l\'envoi de l\'image' : 'Image upload failed');
    }
    setUploading(false);
  };

  const handleDigitalFileSelect = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) {
      showToast(locale === 'fr' ? 'Fichier trop volumineux (max 500MB)' : 'File too large (max 500MB)');
      return;
    }
    const sellerId = user?.sellerId;
    if (!sellerId) return;
    setDigitalFileUploading(true);
    const result = await uploadDigitalFile(file, sellerId);
    setDigitalFileUploading(false);
    if (result) setDigitalFileMeta(result);
    else showToast(locale === 'fr' ? "Échec de l'envoi du fichier" : 'File upload failed');
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price.trim() || !newProduct.stock.trim()) {
      showToast(locale === 'fr' ? 'Veuillez remplir les champs requis' : 'Please fill required fields');
      return;
    }
    if (uploadedImages.length === 0) {
      showToast(locale === 'fr' ? 'Ajoutez au moins une image' : 'Add at least one image');
      return;
    }
    if (newProduct.productType === 'digital' && !digitalFileMeta) {
      showToast(locale === 'fr' ? 'Ajoutez le fichier digital (PDF, ZIP, audio...)' : 'Add the digital file (PDF, ZIP, audio...)');
      return;
    }
    const sellerId = user?.sellerId;
    if (!sellerId) {
      showToast(locale === 'fr' ? 'Vendeur introuvable' : 'Seller not found');
      return;
    }
    setSaving(true);
    const productId = await createProduct({
      sellerId,
      name: newProduct.name.trim(),
      description: newProduct.description.trim(),
      price: parseFloat(newProduct.price),
      oldPrice: newProduct.oldPrice ? parseFloat(newProduct.oldPrice) : null,
      currencyCode: newProduct.currencyCode || 'USD',
      categoryId: newProduct.categoryId || null,
      stock: parseInt(newProduct.stock, 10),
      sku: newProduct.sku.trim() || null,
      imageUrls: uploadedImages,
      productType: newProduct.productType,
      digitalFile: newProduct.productType === 'digital' ? digitalFileMeta : null,
    });
    setSaving(false);
    if (productId) {
      showToast(locale === 'fr' ? 'Produit créé — en attente de validation Zando avant mise en ligne' : 'Product created — pending Zando approval before it goes live');
      setNewProduct({ ...emptyProduct, currencyCode: newProduct.currencyCode });
      setUploadedImages([]);
      setDigitalFileMeta(null);
      setShowAddProduct(false);
      await reloadProducts();
    } else {
      showToast(locale === 'fr' ? 'Erreur lors de la création' : 'Error creating product', 'error');
    }
  };

  const statusColors: Record<string, string> = { pending: '#64748b', confirmed: '#0f172a', preparing: '#ff7a00', inTransit: '#3b82f6', delivered: '#ff7a00', cancelled: '#ef4444' };

  if (loading) return <div className="bg-[#f7f8fa] min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-[#ff7a00]/20 border-t-[#ff7a00] animate-spin" /></div>;

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-60 shrink-0">
            <div className="card p-4 sticky top-20 bg-white">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#e2e8f0]">
                <div className="w-10 h-10 rounded-xl bg-[#ff7a00] flex items-center justify-center text-white font-bold">
                  {(user?.fullName || 'S').charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0f172a] truncate max-w-[140px]">{user?.fullName || 'Seller'}</p>
                  <Badge color={planColor}>{plan}</Badge>
                </div>
              </div>
              <nav className="space-y-0.5 max-h-[60vh] overflow-y-auto no-scrollbar">
                {navItems.map((item) => (
                  <button key={item.id} onClick={() => { setTab(item.id); if (item.id === 'ads') navigate('ads'); if (item.id === 'subscription') navigate('plans'); }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg transition-colors ${tab === item.id ? 'bg-[#ff7a00]/10 text-[#ff7a00] font-semibold' : 'text-[#0f172a] hover:bg-[#f7f8fa]'}`}>
                    <item.icon className="w-4 h-4" /> {item.label}
                    {item.id === 'orders' && orders.length > 0 && <span className="ml-auto text-xs bg-[#ff7a00] text-white px-1.5 rounded-full font-bold">{orders.length}</span>}
                    {item.id === 'messages' && <span className="ml-auto w-2 h-2 rounded-full bg-[#ff7a00]" />}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {!planActive && (
              <div className="card p-5 mb-6 bg-red-50 border border-red-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0"><Lock className="w-6 h-6 text-red-600" /></div>
                <div className="flex-1">
                  <p className="font-bold text-red-700">{locale === 'fr' ? 'Boutique masquée' : 'Storefront hidden'}</p>
                  <p className="text-sm text-red-600 mt-0.5">
                    {locale === 'fr'
                      ? "Votre essai ou votre abonnement a expiré — votre boutique et vos produits ne sont plus visibles par les acheteurs. Choisissez un plan pour réactiver votre boutique immédiatement."
                      : 'Your trial or subscription has expired — your storefront and products are no longer visible to buyers. Choose a plan to reactivate your store immediately.'}
                  </p>
                </div>
                <button onClick={() => setTab('subscription')} className="btn-gold px-5 py-2.5 rounded-full text-sm font-semibold shrink-0 w-full sm:w-auto">
                  {locale === 'fr' ? 'Réactiver ma boutique' : 'Reactivate my store'}
                </button>
              </div>
            )}
            {tab === 'inventory' && user?.sellerId && <InventoryTab sellerId={user.sellerId} locale={locale} />}

            {tab === 'account-health' && user?.sellerId && <AccountHealthTab sellerId={user.sellerId} locale={locale} />}

            {tab === 'dashboard' && (
              <div className="animate-fade-up space-y-6">
                <h1 className="font-display text-2xl font-bold text-[#0f172a]">{t.seller.dashboard}</h1>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label={t.seller.orders} value={orders.length.toString()} icon={ShoppingCart} trend={ordersTrend} />
                  <StatCard label={locale === 'fr' ? 'Revenus' : 'Revenue'} value={`$${totalRevenue.toFixed(0)}`} icon={DollarSign} trend={revenueTrend} />
                  <StatCard label={t.seller.products} value={products.length.toString()} icon={Package} />
                  <StatCard label={t.seller.reputation} value={avgRating.toFixed(1)} icon={Star} />
                </div>

                {/* KYC status */}
                <div className="card p-5 flex items-center gap-4 bg-white">
                  {user?.sellerStatus === 'pending' ? (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-[#ff7a00]/15 flex items-center justify-center"><Clock className="w-6 h-6 text-[#ff7a00]" /></div>
                      <div className="flex-1"><p className="font-semibold text-[#0f172a]">{t.onboarding.pending}</p><p className="text-xs text-[#64748b]">{t.onboarding.submitSuccess}</p></div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-[#ff7a00]/15 flex items-center justify-center"><CheckCircle className="w-6 h-6 text-[#e06c00]" /></div>
                      <div className="flex-1"><p className="font-semibold text-[#0f172a]">{t.onboarding.approved}</p><p className="text-xs text-[#64748b]">{t.home.trust1}</p></div>
                    </>
                  )}
                </div>

                {/* Low stock alerts */}
                {(lowStock.length > 0 || outOfStock.length > 0) && (
                  <div className="card p-5 bg-white">
                    <h3 className="font-semibold text-[#0f172a] mb-3 flex items-center gap-2"><Bell className="w-4 h-4 text-[#ff7a00]" /> {locale === 'fr' ? 'Alertes de stock' : 'Stock alerts'}</h3>
                    <div className="space-y-2">
                      {lowStock.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#ff7a00]/5">
                          <Package className="w-4 h-4 text-[#ff7a00]" />
                          <span className="text-sm text-[#0f172a] flex-1">{p.name}</span>
                          <Badge color="#ff7a00">{p.stock} {locale === 'fr' ? 'restants' : 'left'}</Badge>
                        </div>
                      ))}
                      {outOfStock.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-50">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-[#0f172a] flex-1">{p.name}</span>
                          <Badge color="#ef4444">{t.product.outOfStock}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent orders */}
                <div>
                  <h2 className="font-display text-lg font-bold text-[#0f172a] mb-3">{t.seller.recentOrders}</h2>
                  <div className="card overflow-hidden bg-white">
                    {orders.length === 0 ? (
                      <div className="p-6 text-center text-sm text-[#64748b]"><ShoppingCart className="w-8 h-8 text-[#ff7a00]/30 mx-auto mb-2" />{locale === 'fr' ? 'Aucune commande pour le moment' : 'No orders yet'}</div>
                    ) : orders.slice(0, 10).map((o, i) => (
                      <div key={o.id} className={`flex items-center gap-3 p-4 ${i > 0 ? 'border-t border-[#e2e8f0]' : ''}`}>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#0f172a]">{o.order_items?.[0]?.product_name || 'Order'}</p>
                          <p className="text-xs text-[#64748b]">{o.tracking_id || o.id.slice(0, 8)}</p>
                        </div>
                        <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-full" style={{ background: `${statusColors[o.status]}15`, color: statusColors[o.status] }}>{t.delivery[o.status as 'pending' | 'confirmed' | 'preparing' | 'inTransit' | 'delivered' | 'cancelled']}</span>
                        <span className="font-bold text-[#0f172a]">${o.total.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'products' && (
              <div className="animate-fade-up">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="font-display text-2xl font-bold text-[#0f172a]">{t.seller.products}</h1>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowBulkUpload(!showBulkUpload)} className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-[#0f172a]/15 text-[#0f172a] flex items-center gap-2 hover:border-[#ff7a00]"><Upload className="w-4 h-4" /> {locale === 'fr' ? 'Import en masse' : 'Bulk upload'}</button>
                    <button onClick={() => {
                      const activeCount = products.filter((p) => p.is_active).length;
                      if (plan === 'free' && activeCount >= 1 && !showAddProduct) {
                        setShowUpgradeModal(true);
                        return;
                      }
                      setShowAddProduct(!showAddProduct);
                    }} className="btn-green px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> {t.seller.addProduct}</button>
                  </div>
                </div>

                {showBulkUpload && (
                  <div className="card p-6 mb-6 animate-fade-up bg-white">
                    <h2 className="font-display text-lg font-bold text-[#0f172a] mb-2">{locale === 'fr' ? 'Import en masse (CSV)' : 'Bulk upload (CSV)'}</h2>
                    <p className="text-sm text-[#64748b] mb-4">
                      {locale === 'fr'
                        ? "Ajoutez des dizaines de produits d'un coup avec un fichier CSV. Téléchargez le modèle, remplissez-le dans Excel/Google Sheets, puis importez-le ici. Chaque produit créé passe par la validation Zando habituelle avant mise en ligne."
                        : "Add dozens of products at once with a CSV file. Download the template, fill it in Excel/Google Sheets, then import it here. Every product created still goes through the normal Zando approval before going live."}
                    </p>
                    <button
                      onClick={() => {
                        const blob = new Blob([BULK_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'zando-bulk-upload-template.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-2 text-sm font-semibold text-[#ff7a00] hover:underline mb-4"
                    >
                      <Download className="w-4 h-4" /> {locale === 'fr' ? 'Télécharger le modèle CSV' : 'Download CSV template'}
                    </button>

                    {bulkRows.length === 0 ? (
                      <label className="block border-2 border-dashed border-[#0f172a]/15 rounded-xl p-8 text-center cursor-pointer hover:border-[#ff7a00]">
                        <input type="file" accept=".csv" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          Papa.parse<Record<string, string>>(file, {
                            header: true, skipEmptyLines: true,
                            complete: (result) => {
                              const rows: BulkProductRow[] = result.data.map((r) => ({
                                name: r.name || '', description: r.description || '', price: r.price || '',
                                currency: (r.currency || 'USD').toUpperCase(), oldPrice: r.old_price || '',
                                category: r.category || '', stock: r.stock || '', sku: r.sku || '',
                                imageUrl1: r.image_url_1 || '', imageUrl2: r.image_url_2 || '', imageUrl3: r.image_url_3 || '',
                                status: 'pending' as const,
                              })).filter((r) => r.name.trim());
                              setBulkRows(rows);
                              setBulkResults(null);
                            },
                            error: () => showToast(locale === 'fr' ? 'Erreur de lecture du fichier CSV' : 'Error reading CSV file', 'error'),
                          });
                          e.target.value = '';
                        }} />
                        <Upload className="w-8 h-8 text-[#64748b] mx-auto mb-2" />
                        <p className="text-sm font-semibold text-[#0f172a]">{locale === 'fr' ? 'Cliquez pour choisir un fichier CSV' : 'Click to choose a CSV file'}</p>
                      </label>
                    ) : (
                      <div>
                        <div className="overflow-x-auto mb-4 max-h-80 overflow-y-auto rounded-lg border border-[#e2e8f0]">
                          <table className="w-full text-xs">
                            <thead className="bg-[#f7f8fa] sticky top-0">
                              <tr>
                                <th className="text-left p-2 font-semibold text-[#64748b]">{locale === 'fr' ? 'Nom' : 'Name'}</th>
                                <th className="text-left p-2 font-semibold text-[#64748b]">{locale === 'fr' ? 'Prix' : 'Price'}</th>
                                <th className="text-left p-2 font-semibold text-[#64748b]">{locale === 'fr' ? 'Stock' : 'Stock'}</th>
                                <th className="text-left p-2 font-semibold text-[#64748b]">{locale === 'fr' ? 'Statut' : 'Status'}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bulkRows.map((r, i) => (
                                <tr key={i} className="border-t border-[#e2e8f0]">
                                  <td className="p-2 text-[#0f172a]">{r.name}</td>
                                  <td className="p-2 text-[#0f172a]">{r.price} {r.currency}</td>
                                  <td className="p-2 text-[#0f172a]">{r.stock}</td>
                                  <td className="p-2">
                                    {r.status === 'pending' && <span className="text-[#64748b]">{locale === 'fr' ? 'En attente' : 'Pending'}</span>}
                                    {r.status === 'ok' && <span className="text-green-600 font-semibold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> OK</span>}
                                    {r.status === 'error' && <span className="text-red-500 font-semibold" title={r.error}>{r.error}</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {bulkResults && (
                          <p className="text-sm font-semibold text-[#0f172a] mb-3">
                            {locale === 'fr' ? `${bulkResults.succeeded} produit(s) créé(s)` : `${bulkResults.succeeded} product(s) created`}
                            {bulkResults.failed.length > 0 && ` — ${bulkResults.failed.length} ${locale === 'fr' ? 'échec(s)' : 'failure(s)'}`}
                          </p>
                        )}
                        <div className="flex gap-3">
                          <button onClick={() => { setBulkRows([]); setBulkResults(null); setShowBulkUpload(false); }} className="px-6 py-2.5 rounded-lg text-sm font-medium border border-[#e2e8f0] text-[#0f172a]">{t.common.cancel}</button>
                          <button
                            disabled={bulkProcessing}
                            onClick={async () => {
                              const sellerId = user?.sellerId;
                              if (!sellerId) return;
                              setBulkProcessing(true);
                              let succeeded = 0;
                              const failed: { row: number; name: string; reason: string }[] = [];
                              const updatedRows = [...bulkRows];
                              for (let i = 0; i < updatedRows.length; i++) {
                                const r = updatedRows[i];
                                const price = parseFloat(r.price);
                                const stock = parseInt(r.stock, 10);
                                if (!r.name.trim() || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
                                  updatedRows[i] = { ...r, status: 'error', error: locale === 'fr' ? 'Nom/prix/stock invalide' : 'Invalid name/price/stock' };
                                  failed.push({ row: i + 1, name: r.name, reason: 'Invalid name/price/stock' });
                                  continue;
                                }
                                const matchedCategory = categories.find((c) => c.name.toLowerCase() === r.category.trim().toLowerCase());
                                const imageUrls = [r.imageUrl1, r.imageUrl2, r.imageUrl3].map((u) => u.trim()).filter(Boolean);
                                const productId = await createProduct({
                                  sellerId,
                                  name: r.name.trim(),
                                  description: r.description.trim(),
                                  price,
                                  oldPrice: r.oldPrice ? parseFloat(r.oldPrice) : null,
                                  currencyCode: r.currency || 'USD',
                                  categoryId: matchedCategory?.id || null,
                                  stock,
                                  sku: r.sku.trim() || null,
                                  imageUrls,
                                  productType: 'physical',
                                });
                                if (productId) {
                                  updatedRows[i] = { ...r, status: 'ok' };
                                  succeeded++;
                                } else {
                                  updatedRows[i] = { ...r, status: 'error', error: locale === 'fr' ? 'Échec de création' : 'Creation failed' };
                                  failed.push({ row: i + 1, name: r.name, reason: 'Creation failed' });
                                }
                              }
                              setBulkRows(updatedRows);
                              setBulkResults({ succeeded, failed });
                              setBulkProcessing(false);
                              if (succeeded > 0) await reloadProducts();
                            }}
                            className="btn-green px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                          >
                            {bulkProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                            {locale === 'fr' ? `Importer ${bulkRows.length} produit(s)` : `Import ${bulkRows.length} product(s)`}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {showAddProduct && (
                  <div className="card p-6 mb-6 animate-fade-up bg-white">
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Type de produit' : 'Product type'}</label>
                      <div className="inline-flex rounded-xl border border-[#e2e8f0] overflow-hidden">
                        <button type="button" onClick={() => setNewProduct({ ...newProduct, productType: 'physical' })} className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-colors ${newProduct.productType === 'physical' ? 'bg-[#ff7a00] text-white' : 'bg-white text-[#64748b] hover:bg-[#f7f8fa]'}`}>
                          <Truck className="w-4 h-4" /> {locale === 'fr' ? 'Produit physique' : 'Physical product'}
                        </button>
                        <button type="button" onClick={() => setNewProduct({ ...newProduct, productType: 'digital' })} className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-colors border-l border-[#e2e8f0] ${newProduct.productType === 'digital' ? 'bg-[#ff7a00] text-white' : 'bg-white text-[#64748b] hover:bg-[#f7f8fa]'}`}>
                          <Download className="w-4 h-4" /> {locale === 'fr' ? 'Produit digital' : 'Digital product'}
                        </button>
                      </div>
                      {newProduct.productType === 'digital' && (
                        <p className="text-xs text-[#64748b] mt-2">{locale === 'fr' ? 'Livraison instantanée après paiement — pas de livraison physique ni de logistique pour ce produit.' : 'Instant delivery after payment — no shipping or logistics for this product.'}</p>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.seller.productName} *</label><input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="input-field" placeholder="Robe Wax Premium" /></div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.seller.price} *</label>
                        <div className="flex gap-2">
                          <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className="input-field flex-1" placeholder="45" />
                          <select value={newProduct.currencyCode} onChange={(e) => setNewProduct({ ...newProduct, currencyCode: e.target.value })} className="input-field w-28 cursor-pointer shrink-0">
                            {currencies.filter((c) => c.is_active).map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                          </select>
                        </div>
                        <p className="text-[11px] text-[#64748b] mt-1">{locale === 'fr' ? 'Les acheteurs voient ce prix converti automatiquement dans leur propre devise.' : 'Buyers see this price automatically converted into their own currency.'}</p>
                      </div>
                      <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.seller.stock} *</label><input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} className="input-field" placeholder="12" /></div>
                      <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Ancien prix' : 'Compare price'}</label><input type="number" value={newProduct.oldPrice} onChange={(e) => setNewProduct({ ...newProduct, oldPrice: e.target.value })} className="input-field" placeholder="60" /></div>
                      <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">SKU</label><input value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} className="input-field" placeholder="ZND-001" /></div>
                      <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.seller.category}</label>
                        <select value={newProduct.categoryId} onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })} className="input-field cursor-pointer">
                          <option value="">—</option>
                          {categories.filter((c) => !c.parent_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.seller.description}</label><textarea value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="input-field" rows={3} placeholder={locale === 'fr' ? 'Description du produit...' : 'Product description...'} /></div>
                      <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.seller.uploadImages} *</label>
                        <div className="mb-2 p-3 rounded-lg bg-[#ff7a00]/5 border border-[#ff7a00]/15 flex items-start gap-2">
                          <ImagePlus className="w-4 h-4 text-[#ff7a00] shrink-0 mt-0.5" />
                          <p className="text-xs text-[#0f172a]">
                            {locale === 'fr'
                              ? <><strong>Image principale :</strong> fond blanc uni obligatoire, produit centré et occupant 80-90% du cadre, format carré recommandé, min. 1000×1000px pour un zoom net. <strong>Autres photos :</strong> fond libre (contexte d'usage, angles, détails).</>
                              : <><strong>Main image:</strong> plain white background required, product centered filling 80-90% of the frame, square format recommended, min. 1000×1000px for a sharp zoom. <strong>Other photos:</strong> free background (lifestyle context, angles, details).</>}
                          </p>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                        <div onClick={() => fileInputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }} className="border-2 border-dashed border-[#e2e8f0] rounded-xl p-6 text-center hover:border-[#ff7a00] transition-colors cursor-pointer">
                          {uploading ? (
                            <div className="flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 text-[#ff7a00] animate-spin" /><p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Envoi en cours...' : 'Uploading...'}</p></div>
                          ) : (
                            <><ImagePlus className="w-8 h-8 text-[#64748b]/40 mx-auto mb-2" /><p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Cliquez ou glissez vos images ici' : 'Click or drag your images here'}</p><p className="text-xs text-[#64748b]/60 mt-1">JPEG, PNG, WEBP — max 10MB</p></>
                          )}
                        </div>
                        {uploadedImages.length > 0 && (
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-3">
                            {uploadedImages.map((url, i) => (
                              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-[#e2e8f0]">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button onClick={(e) => { e.stopPropagation(); setUploadedImages(uploadedImages.filter((_, idx) => idx !== i)); }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                                {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-[9px] text-white bg-[#ff7a00] text-center py-0.5 font-semibold">Main</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {newProduct.productType === 'digital' && (
                        <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Fichier digital (sécurisé)' : 'Digital file (secure)'} *</label>
                          <input ref={digitalFileInputRef} type="file" accept=".pdf,.zip,.mp3,.wav,.m4a,.mp4,.mov,.epub,.doc,.docx" className="hidden" onChange={(e) => handleDigitalFileSelect(e.target.files)} />
                          <div onClick={() => digitalFileInputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleDigitalFileSelect(e.dataTransfer.files); }} className="border-2 border-dashed border-[#e2e8f0] rounded-xl p-6 text-center hover:border-[#ff7a00] transition-colors cursor-pointer">
                            {digitalFileUploading ? (
                              <div className="flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 text-[#ff7a00] animate-spin" /><p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Envoi sécurisé en cours...' : 'Securely uploading...'}</p></div>
                            ) : digitalFileMeta ? (
                              <div className="flex items-center justify-center gap-3">
                                <FileText className="w-6 h-6 text-[#ff7a00]" />
                                <div className="text-left">
                                  <p className="text-sm font-medium text-[#0f172a]">{digitalFileMeta.name}</p>
                                  <p className="text-xs text-[#64748b]">{(digitalFileMeta.size / 1024 / 1024).toFixed(1)} MB</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); setDigitalFileMeta(null); }} className="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (
                              <><FileText className="w-8 h-8 text-[#64748b]/40 mx-auto mb-2" /><p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Cliquez ou glissez le fichier ici' : 'Click or drag the file here'}</p><p className="text-xs text-[#64748b]/60 mt-1">PDF, ZIP, MP3, MP4, EPUB, DOC — max 500MB</p></>
                            )}
                          </div>
                          <p className="text-[11px] text-[#64748b]/70 mt-2 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {locale === 'fr' ? "Fichier privé — accessible uniquement à l'acheteur après paiement confirmé." : 'Private file — only accessible to the buyer after confirmed payment.'}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={handleSaveProduct} disabled={saving || uploading} className="btn-green px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">{saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {locale === 'fr' ? 'Enregistrement...' : 'Saving...'}</> : t.common.save}</button>
                      <button onClick={() => { setShowAddProduct(false); setNewProduct(emptyProduct); setUploadedImages([]); }} className="px-6 py-2.5 rounded-lg text-sm font-medium border border-[#e2e8f0] text-[#0f172a]">{t.common.cancel}</button>
                    </div>
                  </div>
                )}

                <div className="card overflow-hidden bg-white">
                  {products.length === 0 ? (
                    <div className="p-6 text-center text-sm text-[#64748b]"><Package className="w-8 h-8 text-[#ff7a00]/30 mx-auto mb-2" />{locale === 'fr' ? 'Aucun produit. Ajoutez votre premier produit!' : 'No products. Add your first product!'}</div>
                  ) : products.map((p, i) => {
                    const activeDeal = flashDeals.find((d) => d.product_id === p.id && d.is_active && new Date(d.ends_at) > new Date());
                    return (
                    <div key={p.id} className={`p-4 ${i > 0 ? 'border-t border-[#e2e8f0]' : ''}`}>
                      <div className="flex items-center gap-4">
                        <img src={p.product_images?.[0]?.image_url || ''} alt={p.name} className="w-14 h-14 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0f172a] truncate">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Star className="w-3 h-3 fill-[#ff7a00] text-[#ff7a00]" />
                            <span className="text-xs text-[#64748b]">{p.rating} ({p.total_reviews})</span>
                            {p.is_sponsored && <Badge color="#ff7a00">Sponsored</Badge>}
                            {activeDeal && <Badge color="#ff7a00">-{activeDeal.discount_percent}% • {locale === 'fr' ? 'flash active' : 'flash active'}</Badge>}
                            {p.approval_status === 'pending' && <Badge color="#e06c00">{locale === 'fr' ? "En attente d'approbation" : 'Pending approval'}</Badge>}
                            {p.approval_status === 'rejected' && <Badge color="#dc2626">{locale === 'fr' ? 'Rejeté' : 'Rejected'}{p.rejection_reason ? ` — ${p.rejection_reason}` : ''}</Badge>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#0f172a]">${p.price}</p>
                          <p className={`text-xs ${p.stock === 0 ? 'text-red-500' : p.stock < 5 ? 'text-[#ff7a00]' : 'text-[#64748b]'}`}>{t.seller.stock}: {p.stock}</p>
                        </div>
                        {activeDeal ? (
                          <button onClick={async () => { const ok = await endFlashDeal(activeDeal.id); if (ok) { setFlashDeals(flashDeals.map(d => d.id === activeDeal.id ? { ...d, is_active: false } : d)); showToast(locale === 'fr' ? 'Vente flash arrêtée' : 'Flash deal ended'); } }} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold shrink-0">{locale === 'fr' ? 'Arrêter' : 'End'}</button>
                        ) : (
                          <button onClick={() => setFlashDealFor(flashDealFor === p.id ? null : p.id)} className="px-3 py-1.5 rounded-lg bg-[#ff7a00]/15 text-[#e06c00] text-xs font-semibold shrink-0 flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {locale === 'fr' ? 'Vente flash' : 'Flash deal'}</button>
                        )}
                        <button onClick={() => setConfirmDeleteId(p.id)} title={locale === 'fr' ? 'Supprimer le produit' : 'Delete product'} className="p-2 rounded-lg hover:bg-red-50 shrink-0"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      </div>
                      {flashDealFor === p.id && (
                        <div className="mt-3 p-3 rounded-xl bg-[#f7f8fa] grid sm:grid-cols-4 gap-3 items-end">
                          <div>
                            <label className="block text-[10px] font-semibold text-[#0f172a] uppercase mb-1">{locale === 'fr' ? 'Remise %' : 'Discount %'}</label>
                            <input type="number" min={1} max={90} value={newDeal.discountPercent} onChange={(e) => setNewDeal({ ...newDeal, discountPercent: e.target.value })} className="input-field text-xs py-1.5" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-[#0f172a] uppercase mb-1">{locale === 'fr' ? 'Durée (heures)' : 'Duration (hours)'}</label>
                            <input type="number" min={1} max={168} value={newDeal.durationHours} onChange={(e) => setNewDeal({ ...newDeal, durationHours: e.target.value })} className="input-field text-xs py-1.5" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-[#0f172a] uppercase mb-1">{locale === 'fr' ? 'Stock limité (optionnel)' : 'Stock limit (optional)'}</label>
                            <input type="number" min={1} value={newDeal.stockLimit} onChange={(e) => setNewDeal({ ...newDeal, stockLimit: e.target.value })} className="input-field text-xs py-1.5" placeholder={locale === 'fr' ? 'Illimité' : 'Unlimited'} />
                          </div>
                          <button onClick={async () => {
                            const sellerId = user?.sellerId;
                            if (!sellerId) return;
                            const discount = Math.max(1, Math.min(90, parseInt(newDeal.discountPercent) || 20));
                            const hours = Math.max(1, Math.min(168, parseInt(newDeal.durationHours) || 24));
                            const dealPrice = Math.round(p.price * (1 - discount / 100) * 100) / 100;
                            const id = await createFlashDeal({
                              productId: p.id, sellerId, discountPercent: discount, dealPrice,
                              stockLimit: newDeal.stockLimit ? parseInt(newDeal.stockLimit) : null,
                              startsAt: new Date().toISOString(),
                              endsAt: new Date(Date.now() + hours * 3600000).toISOString(),
                            });
                            if (id) {
                              setFlashDeals([{ id, product_id: p.id, seller_id: sellerId, discount_percent: discount, deal_price: dealPrice, stock_limit: newDeal.stockLimit ? parseInt(newDeal.stockLimit) : null, claimed_count: 0, starts_at: new Date().toISOString(), ends_at: new Date(Date.now() + hours * 3600000).toISOString(), is_active: true, created_at: new Date().toISOString() }, ...flashDeals]);
                              setFlashDealFor(null);
                              setNewDeal({ discountPercent: '20', durationHours: '24', stockLimit: '' });
                              showToast(locale === 'fr' ? 'Vente flash lancée' : 'Flash deal launched');
                            } else {
                              showToast(locale === 'fr' ? 'Erreur' : 'Error', 'error');
                            }
                          }} className="btn-gold px-3 py-1.5 rounded-lg text-xs font-semibold">{locale === 'fr' ? 'Lancer' : 'Launch'}</button>
                        </div>
                      )}
                    </div>
                  );})}
                </div>
              </div>
            )}

            {tab === 'orders' && (
              <div className="animate-fade-up">
                <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-6">{t.seller.orders}</h1>
                {orders.length === 0 ? (
                  <div className="card p-6 text-center text-sm text-[#64748b] bg-white"><ShoppingCart className="w-10 h-10 text-[#ff7a00]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucune commande pour le moment.' : 'No orders yet.'}</div>
                ) : (
                  <div className="card overflow-hidden bg-white">
                    {orders.map((o, i) => {
                      const nextStatus: Record<string, string> = { confirmed: 'preparing', preparing: 'inTransit', inTransit: 'delivered' };
                      const nextLabel: Record<string, string> = {
                        confirmed: locale === 'fr' ? 'Marquer en préparation' : 'Mark preparing',
                        preparing: locale === 'fr' ? 'Marquer expédiée' : 'Mark shipped',
                        inTransit: locale === 'fr' ? 'Marquer livrée' : 'Mark delivered',
                      };
                      const canAdvance = !!nextStatus[o.status];
                      const canCancel = ['confirmed', 'preparing'].includes(o.status);
                      return (
                        <div key={o.id} className={`flex flex-wrap items-center gap-3 p-4 ${i > 0 ? 'border-t border-[#e2e8f0]' : ''}`}>
                          <div className="flex-1 min-w-[140px]">
                            <p className="text-sm font-semibold text-[#0f172a]">{o.order_items?.[0]?.product_name || 'Order'}</p>
                            <p className="text-xs text-[#64748b]">{o.tracking_id || o.id.slice(0, 8)} • {new Date(o.created_at).toLocaleDateString()}</p>
                            {o.status === 'confirmed' && <p className="text-[10px] font-semibold text-[#ff7a00] mt-0.5">{locale === 'fr' ? "📦 En attente d'expédition" : '📦 Awaiting shipment'}</p>}
                          </div>
                          <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-full" style={{ background: `${statusColors[o.status]}15`, color: statusColors[o.status] }}>{t.delivery[o.status as 'pending' | 'confirmed' | 'preparing' | 'inTransit' | 'delivered' | 'cancelled']}</span>
                          <span className="font-bold text-[#0f172a]">${o.total.toFixed(0)}</span>
                          {whatsappOrderLink(o) && (
                            <a href={whatsappOrderLink(o)!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366]/10 text-[#128C4A] text-xs font-semibold hover:bg-[#25D366]/20">
                              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                            </a>
                          )}
                          {(canAdvance || canCancel) && (
                            <div className="flex gap-1.5 w-full sm:w-auto">
                              {canAdvance && (
                                <button onClick={async () => {
                                  const ok = await updateOrderStatus(o.id, nextStatus[o.status] as Order['status']);
                                  if (ok) { setOrders(orders.map(x => x.id === o.id ? { ...x, status: nextStatus[o.status] as Order['status'] } : x)); showToast(locale === 'fr' ? 'Statut mis à jour' : 'Status updated'); }
                                  else showToast(locale === 'fr' ? 'Erreur' : 'Error', 'error');
                                }} className="btn-cocoa px-3 py-1.5 rounded-full text-xs font-semibold">{nextLabel[o.status]}</button>
                              )}
                              {canCancel && (
                                <button onClick={async () => {
                                  const ok = await updateOrderStatus(o.id, 'cancelled');
                                  if (ok) { setOrders(orders.map(x => x.id === o.id ? { ...x, status: 'cancelled' } : x)); showToast(locale === 'fr' ? 'Commande annulée' : 'Order cancelled'); }
                                }} className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold">{locale === 'fr' ? 'Annuler' : 'Cancel'}</button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === 'analytics' && (
              <div className="animate-fade-up space-y-6">
                <h1 className="font-display text-2xl font-bold text-[#0f172a]">{t.seller.analytics}</h1>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label={locale === 'fr' ? 'Revenus' : 'Revenue'} value={`$${totalRevenue.toFixed(0)}`} icon={DollarSign} />
                  <StatCard label={locale === 'fr' ? 'Commandes' : 'Orders'} value={totalOrders.toString()} icon={ShoppingCart} />
                  <StatCard label={locale === 'fr' ? 'Note moyenne' : 'Avg rating'} value={avgRating.toFixed(1)} icon={Star} />
                  <StatCard label={locale === 'fr' ? 'Produits actifs' : 'Active products'} value={activeProducts.toString()} icon={Package} />
                </div>
                <div className="card p-6 bg-white">
                  <h3 className="font-semibold text-[#0f172a] mb-4">{locale === 'fr' ? 'Ventes des 14 derniers jours' : 'Sales over the last 14 days'}</h3>
                  {dailyRevenue.every((d) => d.total === 0) ? (
                    <p className="text-sm text-[#64748b] text-center py-4">{locale === 'fr' ? 'Aucune vente pour le moment.' : 'No sales yet.'}</p>
                  ) : (
                    <div className="flex items-end gap-1.5 h-32">
                      {(() => {
                        const maxDay = Math.max(...dailyRevenue.map((d) => d.total), 1);
                        return dailyRevenue.map((d, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div className="w-full rounded-t bg-gradient-to-t from-[#ff7a00] to-[#e06c00] hover:opacity-80 transition-opacity" style={{ height: `${Math.max((d.total / maxDay) * 100, d.total > 0 ? 4 : 0)}%`, minHeight: d.total > 0 ? '4px' : '0' }} title={`${d.label}: $${d.total.toFixed(2)}`} />
                            <span className={`text-[9px] text-[#64748b] ${i % 2 === 1 ? 'invisible sm:visible' : ''}`}>{d.label}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
                <div className="card p-6 bg-white">
                  <h3 className="font-semibold text-[#0f172a] mb-4">{locale === 'fr' ? 'Ventes par produit' : 'Sales by product'}</h3>
                  <div className="space-y-3">
                    {(() => {
                      const qtyByProduct: Record<string, number> = {};
                      completedOrders.forEach((o) => o.order_items?.forEach((it) => {
                        if (it.product_id) qtyByProduct[it.product_id] = (qtyByProduct[it.product_id] || 0) + it.qty;
                      }));
                      const ranked = products.map((p) => ({ p, qty: qtyByProduct[p.id] || 0 })).sort((a, b) => b.qty - a.qty).slice(0, 6);
                      const maxQty = Math.max(...ranked.map((r) => r.qty), 1);
                      if (ranked.every((r) => r.qty === 0)) {
                        return <p className="text-sm text-[#64748b] text-center py-4">{locale === 'fr' ? 'Aucune vente pour le moment.' : 'No sales yet.'}</p>;
                      }
                      return ranked.map(({ p, qty }) => (
                        <div key={p.id}>
                          <div className="flex items-center justify-between mb-1"><span className="text-sm text-[#0f172a]">{p.name}</span><span className="text-xs text-[#64748b]">{qty} {locale === 'fr' ? 'vendu(s)' : 'sold'}</span></div>
                          <div className="h-2 rounded-full bg-[#f7f8fa] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#ff7a00] to-[#e06c00]" style={{ width: `${(qty / maxQty) * 100}%` }} /></div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {tab === 'ads' && (
              <div className="animate-fade-up">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="font-display text-2xl font-bold text-[#0f172a]">{t.seller.ads}</h1>
                  <button onClick={() => navigate('ads')} className="btn-green px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"><Megaphone className="w-4 h-4" /> {t.ads.createCampaign}</button>
                </div>
                {ads.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                    <div className="card p-4 bg-white text-center">
                      <p className="text-xl font-bold text-[#0f172a]">{ads.filter((a) => a.status === 'active').length}</p>
                      <p className="text-[11px] text-[#64748b] mt-1">{locale === 'fr' ? 'Campagnes actives' : 'Active campaigns'}</p>
                    </div>
                    <div className="card p-4 bg-white text-center">
                      <p className="text-xl font-bold text-[#0f172a]">${ads.reduce((sum, a) => sum + (a.price ?? a.budget ?? 0), 0).toFixed(0)}</p>
                      <p className="text-[11px] text-[#64748b] mt-1">{locale === 'fr' ? 'Dépense totale' : 'Total spend'}</p>
                    </div>
                    <div className="card p-4 bg-white text-center">
                      <p className="text-xl font-bold text-[#0f172a]">{ads.reduce((sum, a) => sum + a.impressions, 0).toLocaleString()}</p>
                      <p className="text-[11px] text-[#64748b] mt-1">{t.ads.impressions}</p>
                    </div>
                    <div className="card p-4 bg-white text-center">
                      <p className="text-xl font-bold text-[#0f172a]">{ads.reduce((sum, a) => sum + a.clicks, 0).toLocaleString()}</p>
                      <p className="text-[11px] text-[#64748b] mt-1">{t.ads.clicks}</p>
                    </div>
                    <div className="card p-4 bg-white text-center">
                      <p className="text-xl font-bold text-[#0f172a]">
                        {(() => {
                          const totalImp = ads.reduce((sum, a) => sum + a.impressions, 0);
                          const totalClk = ads.reduce((sum, a) => sum + a.clicks, 0);
                          return totalImp > 0 ? `${((totalClk / totalImp) * 100).toFixed(2)}%` : '—';
                        })()}
                      </p>
                      <p className="text-[11px] text-[#64748b] mt-1">CTR</p>
                    </div>
                  </div>
                )}
                {ads.length === 0 ? (
                  <div className="card p-6 text-center text-sm text-[#64748b] bg-white"><Megaphone className="w-10 h-10 text-[#ff7a00]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucune campagne publicitaire.' : 'No ad campaigns yet.'}</div>
                ) : (
                  <div className="space-y-3">
                    {ads.map((ad) => {
                      const statusColor = ad.status === 'active' ? '#ff7a00' : ad.payment_status === 'pending' ? '#d97706' : ad.status === 'cancelled' || ad.payment_status === 'failed' ? '#ef4444' : '#94a3b8';
                      return (
                        <div key={ad.id} className="card p-5 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold text-[#0f172a]">{ad.products?.name || ad.name}</p>
                            <Badge color={statusColor}>{ad.payment_status === 'pending' ? (locale === 'fr' ? 'En attente' : 'Pending') : ad.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div><p className="text-lg font-bold text-[#0f172a]">{ad.impressions.toLocaleString()}</p><p className="text-xs text-[#64748b]">{t.ads.impressions}</p></div>
                            <div><p className="text-lg font-bold text-[#0f172a]">{ad.clicks.toLocaleString()}</p><p className="text-xs text-[#64748b]">{t.ads.clicks}</p></div>
                            <div><p className="text-lg font-bold text-[#0f172a]">{ad.impressions > 0 ? `${((ad.clicks / ad.impressions) * 100).toFixed(2)}%` : '—'}</p><p className="text-xs text-[#64748b]">CTR</p></div>
                            <div><p className="text-lg font-bold text-[#0f172a]">{ad.currency_code || '$'} {ad.price ?? ad.budget}</p><p className="text-xs text-[#64748b]">{t.ads.budget}</p></div>
                          </div>
                          {ad.status === 'active' && ad.expires_at && (
                            <p className="text-xs text-[#64748b] mt-3 pt-3 border-t border-[#f0f4f8]">
                              {locale === 'fr' ? 'Expire le' : 'Expires on'} {new Date(ad.expires_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === 'coupons' && (
              <div className="animate-fade-up">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="font-display text-2xl font-bold text-[#0f172a]">{locale === 'fr' ? 'Codes promo' : 'Coupons'}</h1>
                  <button onClick={() => setShowAddCoupon(!showAddCoupon)} className="btn-cocoa px-4 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2"><Tag className="w-4 h-4" /> {locale === 'fr' ? 'Créer un code' : 'Create code'}</button>
                </div>

                {showAddCoupon && (
                  <div className="card p-5 bg-white mb-5 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? 'Code' : 'Code'}</label>
                        <input value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" className="input-field font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? 'Type de remise' : 'Discount type'}</label>
                        <select value={newCoupon.discountType} onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value as 'percent' | 'fixed' })} className="input-field">
                          <option value="percent">{locale === 'fr' ? 'Pourcentage (%)' : 'Percentage (%)'}</option>
                          <option value="fixed">{locale === 'fr' ? 'Montant fixe ($)' : 'Fixed amount ($)'}</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{newCoupon.discountType === 'percent' ? '%' : '$'}</label>
                        <input type="number" min={1} value={newCoupon.discountValue} onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? 'Achat min. ($)' : 'Min order ($)'}</label>
                        <input type="number" min={0} value={newCoupon.minOrderAmount} onChange={(e) => setNewCoupon({ ...newCoupon, minOrderAmount: e.target.value })} placeholder="0" className="input-field" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? "Limite d'utilisation" : 'Usage limit'}</label>
                        <input type="number" min={1} value={newCoupon.usageLimit} onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })} placeholder={locale === 'fr' ? 'Illimité' : 'Unlimited'} className="input-field" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? "Date d'expiration (optionnel)" : 'Expiry date (optional)'}</label>
                      <input type="date" value={newCoupon.expiresAt} onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })} className="input-field max-w-xs" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        const sellerId = user?.sellerId;
                        if (!sellerId) return;
                        if (!newCoupon.code.trim()) { showToast(locale === 'fr' ? 'Code requis' : 'Code required', 'error'); return; }
                        const id = await createCoupon({
                          sellerId, code: newCoupon.code.trim(), discountType: newCoupon.discountType,
                          discountValue: parseFloat(newCoupon.discountValue) || 10,
                          minOrderAmount: newCoupon.minOrderAmount ? parseFloat(newCoupon.minOrderAmount) : 0,
                          usageLimit: newCoupon.usageLimit ? parseInt(newCoupon.usageLimit) : null,
                          expiresAt: newCoupon.expiresAt ? new Date(newCoupon.expiresAt).toISOString() : null,
                        });
                        if (id) {
                          setCoupons(await fetchSellerCoupons(sellerId));
                          setShowAddCoupon(false);
                          setNewCoupon({ code: '', discountType: 'percent', discountValue: '10', minOrderAmount: '', usageLimit: '', expiresAt: '' });
                          showToast(locale === 'fr' ? 'Code promo créé' : 'Coupon created');
                        } else {
                          showToast(locale === 'fr' ? 'Erreur — ce code existe peut-être déjà' : 'Error — this code may already exist', 'error');
                        }
                      }} className="btn-cocoa px-5 py-2 rounded-full text-xs font-semibold">{locale === 'fr' ? 'Créer' : 'Create'}</button>
                      <button onClick={() => setShowAddCoupon(false)} className="px-5 py-2 rounded-full text-xs font-medium border border-[#0f172a]/15 text-[#0f172a]">{t.common.cancel}</button>
                    </div>
                  </div>
                )}

                {coupons.length === 0 ? (
                  <div className="card p-6 text-center text-sm text-[#64748b] bg-white"><Tag className="w-10 h-10 text-[#0f172a]/20 mx-auto mb-3" />{locale === 'fr' ? 'Aucun code promo. Créez-en un pour booster vos ventes.' : 'No coupons yet. Create one to boost your sales.'}</div>
                ) : (
                  <div className="space-y-2">
                    {coupons.map((c) => (
                      <div key={c.id} className="card p-4 bg-white flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#0f172a]/5 flex items-center justify-center shrink-0"><Tag className="w-4.5 h-4.5 text-[#0f172a]" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono font-bold text-[#0f172a]">{c.code}</p>
                          <p className="text-xs text-[#64748b]">
                            {c.discount_type === 'percent' ? `-${c.discount_value}%` : `-$${c.discount_value}`}
                            {c.min_order_amount > 0 && ` · ${locale === 'fr' ? 'min' : 'min'} $${c.min_order_amount}`}
                            {` · ${c.times_used}${c.usage_limit ? `/${c.usage_limit}` : ''} ${locale === 'fr' ? 'utilisations' : 'uses'}`}
                            {c.expires_at && ` · ${locale === 'fr' ? 'expire le' : 'expires'} ${new Date(c.expires_at).toLocaleDateString()}`}
                          </p>
                        </div>
                        <Badge color={c.is_active ? '#3d1f00' : '#94a3b8'}>{c.is_active ? (locale === 'fr' ? 'Actif' : 'Active') : (locale === 'fr' ? 'Inactif' : 'Inactive')}</Badge>
                        {c.is_active && (
                          <button onClick={async () => { const ok = await deactivateCoupon(c.id); if (ok) setCoupons(coupons.map(x => x.id === c.id ? { ...x, is_active: false } : x)); }} className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold shrink-0">{locale === 'fr' ? 'Désactiver' : 'Deactivate'}</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'reputation' && (
              <div className="animate-fade-up space-y-6">
                <h1 className="font-display text-2xl font-bold text-[#0f172a]">{t.seller.reputation}</h1>
                <div className="grid sm:grid-cols-3 gap-4">
                  <StatCard label={t.product.reviews} value={totalReviews.toString()} icon={Star} />
                  <StatCard label={locale === 'fr' ? 'Note moyenne' : 'Average rating'} value={avgRating.toFixed(1)} icon={TrendingUp} />
                  <StatCard label={locale === 'fr' ? 'Taux de résolution' : 'Resolution rate'} value="98%" icon={CheckCircle} />
                </div>
              </div>
            )}

            {tab === 'payments' && (
              <div className="animate-fade-up space-y-6">
                <h1 className="font-display text-2xl font-bold text-[#0f172a]">{locale === 'fr' ? 'Moyens de paiement' : 'Payment methods'}</h1>
                <div className="card p-4 bg-[#ff7a00]/5 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#ff7a00] mt-0.5 shrink-0" />
                  <p className="text-sm text-[#0f172a]">
                    {locale === 'fr'
                      ? 'Zando ne prélève aucune commission sur vos ventes. Connectez votre propre PSP (Stripe, Flutterwave, Paystack, Mobile Money, virement bancaire...) : vos clients vous paient directement, sans intermédiaire.'
                      : "Zando takes zero commission on your sales. Connect your own PSP (Stripe, Flutterwave, Paystack, Mobile Money, bank transfer...): your customers pay you directly, with no middleman."}
                  </p>
                </div>

                <div className="card p-6 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-bold text-[#0f172a]">{locale === 'fr' ? 'Passerelles de paiement (clés API)' : 'Payment gateways (API keys)'}</h2>
                    <button onClick={() => setShowApiPspForm(!showApiPspForm)} className="btn-gold px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"><Lock className="w-4 h-4" /> {locale === 'fr' ? 'Connecter' : 'Connect'}</button>
                  </div>
                  <p className="text-xs text-[#64748b] mb-4">
                    {locale === 'fr'
                      ? "Entrez les clés fournies par votre propre compte Stripe, Paddle, PayUnit, Paystack ou Flutterwave. Vos clés secrètes ne sont jamais lisibles depuis l'application une fois enregistrées — même par vous — uniquement utilisées côté serveur."
                      : "Enter the keys from your own Stripe, Paddle, PayUnit, Paystack, or Flutterwave account. Your secret keys are never readable from the app once saved — not even by you — only used server-side."}
                  </p>

                  {showApiPspForm && (
                    <div className="p-4 rounded-xl bg-[#f7f8fa] mb-4 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? 'Fournisseur' : 'Provider'}</label>
                        <select value={apiPspForm.provider} onChange={(e) => setApiPspForm({ ...apiPspForm, provider: e.target.value as typeof apiPspForm.provider })} className="input-field cursor-pointer">
                          <option value="stripe">Stripe</option>
                          <option value="paddle">Paddle</option>
                          <option value="payunit">PayUnit</option>
                          <option value="paystack">Paystack</option>
                          <option value="flutterwave">Flutterwave</option>
                        </select>
                        <p className="text-[11px] text-[#64748b] mt-1">{locale === 'fr' ? "Airwallex, Alipay et WeChat Pay : le paiement automatisé n'est pas encore construit pour ces fournisseurs — utilisez la section \"Mobile Money / virement / autre\" ci-dessous en attendant." : "Airwallex, Alipay, and WeChat Pay: automated checkout isn't built for these providers yet — use the \"Mobile Money / bank transfer / other\" section below in the meantime."}</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">
                            {apiPspForm.provider === 'paddle' ? (locale === 'fr' ? 'ID Vendeur' : 'Vendor ID') : apiPspForm.provider === 'payunit' ? (locale === 'fr' ? 'Clé API (x-api-key)' : 'API Key (x-api-key)') : locale === 'fr' ? 'Clé publique' : 'Public key'}
                          </label>
                          <input value={apiPspForm.publicKey} onChange={(e) => setApiPspForm({ ...apiPspForm, publicKey: e.target.value })} className="input-field" placeholder={apiPspForm.provider === 'stripe' ? 'pk_live_...' : apiPspForm.provider === 'paystack' ? 'pk_live_...' : ''} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">
                            {apiPspForm.provider === 'payunit' ? (locale === 'fr' ? 'Mot de passe API' : 'API Password') : locale === 'fr' ? 'Clé secrète' : 'Secret key'}
                          </label>
                          <input type="password" value={apiPspForm.secretKey} onChange={(e) => setApiPspForm({ ...apiPspForm, secretKey: e.target.value })} className="input-field" placeholder={apiPspForm.provider === 'stripe' ? 'sk_live_...' : '••••••••'} />
                        </div>
                      </div>
                      {apiPspForm.provider === 'payunit' && (
                        <div>
                          <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">API User</label>
                          <input value={apiPspForm.merchantId} onChange={(e) => setApiPspForm({ ...apiPspForm, merchantId: e.target.value })} className="input-field" />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? 'Mode' : 'Mode'}</label>
                        <div className="inline-flex rounded-lg border border-[#e2e8f0] overflow-hidden">
                          <button type="button" onClick={() => setApiPspForm({ ...apiPspForm, mode: 'test' })} className={`px-3 py-1.5 text-xs font-semibold ${apiPspForm.mode === 'test' ? 'bg-[#ff7a00] text-white' : 'bg-white text-[#64748b]'}`}>Test</button>
                          <button type="button" onClick={() => setApiPspForm({ ...apiPspForm, mode: 'live' })} className={`px-3 py-1.5 text-xs font-semibold border-l border-[#e2e8f0] ${apiPspForm.mode === 'live' ? 'bg-[#ff7a00] text-white' : 'bg-white text-[#64748b]'}`}>Live</button>
                        </div>
                      </div>
                      <button
                        disabled={connectingPsp || !apiPspForm.secretKey.trim()}
                        onClick={async () => {
                          const sellerId = user?.sellerId;
                          if (!sellerId) return;
                          setConnectingPsp(true);
                          const result = await connectSellerPsp({
                            sellerId, provider: apiPspForm.provider,
                            publicKey: apiPspForm.publicKey || undefined,
                            merchantId: apiPspForm.merchantId || undefined,
                            secretKey: apiPspForm.secretKey,
                            mode: apiPspForm.mode,
                          });
                          setConnectingPsp(false);
                          if (result.ok) {
                            showToast(locale === 'fr' ? 'PSP connecté' : 'PSP connected');
                            setPspCredentials(await fetchSellerPspCredentials(sellerId));
                            setShowApiPspForm(false);
                            setApiPspForm({ provider: 'stripe', publicKey: '', secretKey: '', merchantId: '', mode: 'live' });
                          } else {
                            const isMissingTable = /relation .* does not exist|schema cache/i.test(result.error);
                            showToast(
                              isMissingTable
                                ? (locale === 'fr'
                                    ? "La table de connexion PSP n'existe pas encore côté base de données — la migration doit être déployée (supabase db push) avant de pouvoir connecter un PSP."
                                    : "The PSP connection table doesn't exist yet on the database — the migration needs to be deployed (supabase db push) before a PSP can be connected.")
                                : result.error,
                              'error'
                            );
                          }
                        }}
                        className="btn-green px-5 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                      >
                        {connectingPsp ? <Loader2 className="w-4 h-4 animate-spin" /> : (locale === 'fr' ? 'Enregistrer' : 'Save')}
                      </button>
                    </div>
                  )}

                  {pspCredentials.length === 0 ? (
                    <p className="text-xs text-[#64748b] text-center py-4">{locale === 'fr' ? 'Aucune passerelle API connectée.' : 'No API gateway connected yet.'}</p>
                  ) : (
                    <div className="space-y-2">
                      {pspCredentials.map((c) => (
                        <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#e2e8f0]">
                          <div className="w-9 h-9 rounded-lg bg-[#ff7a00]/10 flex items-center justify-center shrink-0"><Lock className="w-4 h-4 text-[#ff7a00]" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0f172a] capitalize">{c.provider}</p>
                            <p className="text-xs text-[#64748b]">{c.mode === 'test' ? (locale === 'fr' ? 'Mode test' : 'Test mode') : (locale === 'fr' ? 'Mode live' : 'Live mode')} • {c.has_secret ? (locale === 'fr' ? 'Clé secrète enregistrée' : 'Secret key saved') : (locale === 'fr' ? 'Clé publique seulement' : 'Public key only')}</p>
                          </div>
                          <button onClick={async () => {
                            const ok = await disconnectSellerPsp(c.id);
                            if (ok) { setPspCredentials((prev) => prev.filter((x) => x.id !== c.id)); showToast(locale === 'fr' ? 'Déconnecté' : 'Disconnected'); }
                          }} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card p-6 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-bold text-[#0f172a]">{locale === 'fr' ? 'Mobile Money / virement / autre' : 'Mobile Money / bank transfer / other'}</h2>
                    <button onClick={() => setShowAddPayment(!showAddPayment)} className="btn-green px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"><Plus className="w-4 h-4" /> {locale === 'fr' ? 'Ajouter' : 'Add'}</button>
                  </div>

                  {showAddPayment && (
                    <div className="p-4 rounded-xl bg-[#f7f8fa] mb-4 space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? 'Type de PSP' : 'PSP type'}</label>
                          <select value={newPayment.providerType} onChange={(e) => setNewPayment({ ...newPayment, providerType: e.target.value, providerName: PSP_OPTIONS[e.target.value][0] })} className="input-field">
                            <option value="card">{locale === 'fr' ? 'Carte / Passerelle (Stripe, Paystack...)' : 'Card / Gateway (Stripe, Paystack...)'}</option>
                            <option value="mobile_money">Mobile Money (M-Pesa, Orange Money...)</option>
                            <option value="bank">{locale === 'fr' ? 'Virement bancaire' : 'Bank transfer'}</option>
                            <option value="crypto">Crypto</option>
                            <option value="digital_wallet">{locale === 'fr' ? 'Portefeuille numérique — Asie de l\'Est (Airwallex, Alipay, WeChat Pay)' : 'Digital wallet — East Asia (Airwallex, Alipay, WeChat Pay)'}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? 'Fournisseur' : 'Provider'}</label>
                          <select value={newPayment.providerName} onChange={(e) => setNewPayment({ ...newPayment, providerName: e.target.value })} className="input-field">
                            {(PSP_OPTIONS[newPayment.providerType] || PSP_OPTIONS.card).map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                      {newPayment.providerName.startsWith('Autre') && (
                        <input
                          onChange={(e) => setNewPayment({ ...newPayment, providerName: e.target.value })}
                          className="input-field"
                          placeholder={locale === 'fr' ? 'Nom du fournisseur PSP' : 'PSP provider name'}
                          autoFocus
                        />
                      )}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? 'Identifiant / numéro de compte' : 'Account identifier'}</label>
                          <input value={newPayment.accountIdentifier} onChange={(e) => setNewPayment({ ...newPayment, accountIdentifier: e.target.value })} className="input-field" placeholder={newPayment.providerType === 'digital_wallet' ? (locale === 'fr' ? 'ID marchand Airwallex / Alipay / WeChat Pay' : 'Airwallex / Alipay / WeChat Pay merchant ID') : (locale === 'fr' ? 'ID compte, IBAN, numéro...' : 'Account ID, IBAN, number...')} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? "Nom affiché à l'acheteur" : 'Display name to buyer'}</label>
                          <input value={newPayment.displayName} onChange={(e) => setNewPayment({ ...newPayment, displayName: e.target.value })} className="input-field" placeholder={locale === 'fr' ? 'Ex: Paiement carte via Stripe' : 'E.g. Card payment via Stripe'} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={async () => {
                          const sellerId = user?.sellerId;
                          if (!sellerId) return;
                          if (!newPayment.providerName.trim()) { showToast(locale === 'fr' ? 'Nom du fournisseur requis' : 'Provider name required', 'error'); return; }
                          const id = await addSellerPaymentMethod({
                            sellerId,
                            providerName: newPayment.providerName.trim(),
                            providerType: newPayment.providerType,
                            accountIdentifier: newPayment.accountIdentifier || null,
                            displayName: newPayment.displayName || null,
                          });
                          if (id) {
                            setPaymentMethods([...paymentMethods, {
                              id, seller_id: sellerId, provider_name: newPayment.providerName.trim(),
                              provider_type: newPayment.providerType, account_identifier: newPayment.accountIdentifier || null,
                              is_active: true, is_verified: false, display_name: newPayment.displayName || null,
                              instructions: null, created_at: new Date().toISOString(),
                            }]);
                            setNewPayment({ providerName: PSP_OPTIONS.card[0], providerType: 'card', accountIdentifier: '', displayName: '' });
                            setShowAddPayment(false);
                            showToast(locale === 'fr' ? 'PSP connecté' : 'PSP connected');
                          } else {
                            showToast(locale === 'fr' ? 'Erreur lors de la connexion' : 'Error connecting PSP', 'error');
                          }
                        }} className="btn-green px-5 py-2 rounded-lg text-xs font-semibold">{locale === 'fr' ? 'Enregistrer' : 'Save'}</button>
                        <button onClick={() => setShowAddPayment(false)} className="px-5 py-2 rounded-lg text-xs font-medium border border-[#0f172a]/15 text-[#0f172a]">{t.common.cancel}</button>
                      </div>
                    </div>
                  )}

                  {paymentMethods.length === 0 ? (
                    <div className="text-center py-10">
                      <Wallet className="w-10 h-10 text-[#ff7a00]/30 mx-auto mb-3" />
                      <p className="text-sm text-[#64748b]">{locale === 'fr' ? "Aucun PSP connecté. Vos acheteurs ne peuvent pas encore vous payer — connectez-en un." : "No PSP connected yet. Buyers can't pay you until you connect one."}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {paymentMethods.map((pm) => (
                        <div key={pm.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#e2e8f0]">
                          <div className="w-9 h-9 rounded-lg bg-[#ff7a00]/10 flex items-center justify-center shrink-0"><CreditCard className="w-4 h-4 text-[#ff7a00]" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0f172a]">{pm.display_name || pm.provider_name}</p>
                            <p className="text-xs text-[#64748b]">{pm.provider_name} • {pm.provider_type}{pm.account_identifier ? ` • ${pm.account_identifier}` : ''}</p>
                          </div>
                          <Badge color={pm.is_verified ? '#ff7a00' : '#ff7a00'}>{pm.is_verified ? (locale === 'fr' ? 'Vérifié' : 'Verified') : (locale === 'fr' ? 'En attente' : 'Pending')}</Badge>
                          <button onClick={async () => {
                            const ok = await toggleSellerPaymentMethod(pm.id, !pm.is_active);
                            if (ok) setPaymentMethods(paymentMethods.map(x => x.id === pm.id ? { ...x, is_active: !x.is_active } : x));
                          }} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold ${pm.is_active ? 'bg-[#ff7a00]/15 text-[#e06c00]' : 'bg-gray-100 text-gray-500'}`}>{pm.is_active ? (locale === 'fr' ? 'Actif' : 'Active') : (locale === 'fr' ? 'Inactif' : 'Inactive')}</button>
                          <button onClick={async () => {
                            const ok = await removeSellerPaymentMethod(pm.id);
                            if (ok) { setPaymentMethods(paymentMethods.filter(x => x.id !== pm.id)); showToast(locale === 'fr' ? 'PSP retiré' : 'PSP removed'); }
                          }} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'logistics' && (
              <div className="animate-fade-up space-y-6">
                <h1 className="font-display text-2xl font-bold text-[#0f172a]">{locale === 'fr' ? 'Logistique' : 'Logistics'}</h1>
                <div className="card p-4 bg-[#ff7a00]/5 flex items-start gap-3">
                  <Truck className="w-5 h-5 text-[#ff7a00] mt-0.5 shrink-0" />
                  <p className="text-sm text-[#0f172a]">
                    {locale === 'fr'
                      ? "Choisissez les pays où vous livrez, vos frais de livraison et le délai estimé pour chacun (ex: Cameroun → USA = 7-10 jours). Concerne uniquement vos produits physiques — les produits digitaux sont livrés instantanément, sans frais de port."
                      : 'Choose which countries you ship to, your fee, and the estimated delivery time for each (e.g. Cameroon → USA = 7-10 days). Applies only to physical products — digital products deliver instantly, no shipping fee.'}
                  </p>
                </div>

                <div className="card p-6 bg-white">
                  <h2 className="font-display text-lg font-bold text-[#0f172a] mb-4">{locale === 'fr' ? 'Ajouter une destination' : 'Add a destination'}</h2>
                  <div className="grid sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? 'Pays de destination' : 'Destination country'}</label>
                      <select value={newRate.countryId} onChange={(e) => setNewRate({ ...newRate, countryId: e.target.value })} className="input-field cursor-pointer">
                        <option value="">—</option>
                        {countries.filter((c) => !shippingRates.some((r) => r.country_id === c.id)).map((c) => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? 'Frais ($)' : 'Fee ($)'}</label>
                      <input type="number" min="0" value={newRate.fee} onChange={(e) => setNewRate({ ...newRate, fee: e.target.value })} className="input-field" placeholder="15" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? 'Délai (jours)' : 'Delivery (days)'}</label>
                      <div className="flex items-center gap-1.5">
                        <input type="number" min="1" value={newRate.minDays} onChange={(e) => setNewRate({ ...newRate, minDays: e.target.value })} className="input-field" placeholder="5" />
                        <span className="text-[#64748b]">–</span>
                        <input type="number" min="1" value={newRate.maxDays} onChange={(e) => setNewRate({ ...newRate, maxDays: e.target.value })} className="input-field" placeholder="10" />
                      </div>
                    </div>
                  </div>
                  <button
                    disabled={savingRate || !newRate.countryId || !newRate.fee}
                    onClick={async () => {
                      const sellerId = user?.sellerId;
                      if (!sellerId) return;
                      const minD = parseInt(newRate.minDays, 10) || 1;
                      const maxD = Math.max(parseInt(newRate.maxDays, 10) || minD, minD);
                      setSavingRate(true);
                      const id = await addShippingRate({ sellerId, countryId: newRate.countryId, fee: parseFloat(newRate.fee), minDays: minD, maxDays: maxD });
                      setSavingRate(false);
                      if (id) {
                        const country = countries.find((c) => c.id === newRate.countryId);
                        setShippingRates([...shippingRates, { id, seller_id: sellerId, country_id: newRate.countryId, fee: parseFloat(newRate.fee), min_days: minD, max_days: maxD, is_active: true, created_at: new Date().toISOString(), countries: country }]);
                        setNewRate({ countryId: '', fee: '', minDays: '5', maxDays: '10' });
                        showToast(locale === 'fr' ? 'Destination ajoutée' : 'Destination added');
                      } else {
                        showToast(locale === 'fr' ? "Erreur lors de l'ajout" : 'Error adding destination', 'error');
                      }
                    }}
                    className="btn-green px-5 py-2 rounded-lg text-xs font-semibold mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingRate ? <Loader2 className="w-4 h-4 animate-spin" /> : (locale === 'fr' ? 'Ajouter' : 'Add')}
                  </button>
                </div>

                <div className="card p-6 bg-white">
                  <h2 className="font-display text-lg font-bold text-[#0f172a] mb-4">{locale === 'fr' ? 'Vos destinations' : 'Your destinations'}</h2>
                  {shippingRates.length === 0 ? (
                    <div className="text-center py-10">
                      <Truck className="w-10 h-10 text-[#ff7a00]/30 mx-auto mb-3" />
                      <p className="text-sm text-[#64748b]">{locale === 'fr' ? "Aucune destination configurée. Ajoutez-en une ci-dessus pour pouvoir livrer vos produits physiques." : 'No destination configured yet. Add one above so you can ship physical products.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {shippingRates.map((r) => (
                        <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#e2e8f0]">
                          <span className="text-xl shrink-0">{r.countries?.flag || '🌍'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0f172a]">{r.countries?.name || r.country_id}</p>
                            <p className="text-xs text-[#64748b]">{r.min_days}-{r.max_days} {locale === 'fr' ? 'jours' : 'days'}</p>
                          </div>
                          <span className="font-bold text-[#0f172a]">${r.fee.toFixed(2)}</span>
                          <button onClick={async () => {
                            const ok = await removeShippingRate(r.id);
                            if (ok) { setShippingRates(shippingRates.filter((x) => x.id !== r.id)); showToast(locale === 'fr' ? 'Destination retirée' : 'Destination removed'); }
                          }} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'subscription' && (
              <div className="animate-fade-up space-y-6">
                <h1 className="font-display text-2xl font-bold text-[#0f172a]">{t.seller.subscription}</h1>
                <div className="card p-6 bg-gradient-to-br from-[#ff7a00]/10 to-transparent border-[#ff7a00]/20">
                  <p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Plan actuel' : 'Current plan'}</p>
                  <p className="text-3xl font-bold text-[#0f172a] mt-1 capitalize" style={{ color: planColor }}>{plan}</p>
                  <p className="text-xs text-[#64748b] mt-2">
                    {locale === 'fr'
                      ? "C'est votre seul coût fixe chez Zando — aucune commission n'est prélevée sur vos ventes, qui vous sont versées directement via votre PSP. Le plan Gratuit est permanent (1 produit). Chaque plan payant inclut 14 jours d'essai gratuit."
                      : "This is your only fixed cost on Zando — zero commission is taken on your sales, which are paid to you directly via your PSP. The Free plan is permanent (1 product). Every paid plan includes a 14-day free trial."}
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {([
                    { id: 'free' as const, price: 0, limit: locale === 'fr' ? '1 produit actif — permanent' : '1 active product — permanent' },
                    { id: 'starter' as const, price: 9, limit: locale === 'fr' ? 'Produits illimités' : 'Unlimited products' },
                    { id: 'premium' as const, price: 29, limit: locale === 'fr' ? 'Produits illimités + mise en avant' : 'Unlimited products + boosted visibility' },
                    { id: 'enterprise' as const, price: 79, limit: locale === 'fr' ? 'Produits illimités + support prioritaire' : 'Unlimited products + priority support' },
                  ]).map(({ id: p, price, limit }) => (
                    <div key={p} className={`card p-5 ${plan === p ? 'ring-2 ring-[#ff7a00]' : ''}`}>
                      <h3 className="font-display text-lg font-bold text-[#0f172a] capitalize mb-1">{p === 'free' ? (locale === 'fr' ? 'Gratuit' : 'Free') : p}</h3>
                      <p className="text-2xl font-bold text-[#0f172a] mb-1">{price === 0 ? (locale === 'fr' ? 'Gratuit' : 'Free') : `$${price}`}<span className="text-xs font-normal text-[#64748b]">{price > 0 ? '/mo' : ''}</span></p>
                      <p className="text-xs text-[#64748b] mb-4">{limit}</p>
                      <button
                        disabled={plan === p || changingPlan}
                        onClick={async () => {
                          const sellerId = user?.sellerId;
                          if (!sellerId || !user) return;
                          if (p === 'free') {
                            // Downgrading to the permanent free plan needs
                            // no payment — direct write, like an admin comp.
                            setChangingPlan(true);
                            const ok = await updateSellerPlan(sellerId, 'free');
                            setChangingPlan(false);
                            if (ok) { showToast(locale === 'fr' ? 'Plan mis à jour — rechargement...' : 'Plan updated — reloading...'); window.location.reload(); }
                            else showToast(locale === 'fr' ? 'Erreur lors du changement de plan' : 'Error changing plan', 'error');
                            return;
                          }
                          // Paid plans require a real payment through the
                          // central PSP (after the 14-day trial) — opens
                          // the provider picker below, never grants access
                          // instantly.
                          setUpgradingPlan(p);
                        }}
                        className={`w-full py-2.5 rounded-lg text-sm font-semibold ${plan === p ? 'bg-[#0f172a]/10 text-[#64748b] cursor-default' : 'btn-green'}`}
                      >
                        {plan === p ? (locale === 'fr' ? 'Plan actuel' : 'Current plan') : (locale === 'fr' ? 'Choisir' : 'Choose')}
                      </button>
                    </div>
                  ))}
                </div>

                {upgradingPlan && (
                  <div className="card p-6 bg-white animate-fade-up">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-lg font-bold text-[#0f172a] flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#ff7a00]" /> {locale === 'fr' ? `Payer le plan ${upgradingPlan}` : `Pay for ${upgradingPlan} plan`}
                      </h3>
                      <button onClick={() => setUpgradingPlan(null)} className="text-xs text-[#64748b] hover:text-[#0f172a]">{locale === 'fr' ? 'Annuler' : 'Cancel'}</button>
                    </div>
                    <div className="grid sm:grid-cols-4 gap-2 mb-4">
                      {([
                        { key: 'stripe' as const, label: 'Stripe', icon: CreditCard },
                        { key: 'flutterwave' as const, label: 'Flutterwave', icon: Smartphone },
                        { key: 'payunit' as const, label: 'PayUnit', icon: Landmark },
                        { key: 'paddle' as const, label: 'Paddle', icon: Wallet },
                      ]).map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setUpgradeProvider(key)} className={`p-3 rounded-xl border text-left transition-all ${upgradeProvider === key ? 'border-[#ff7a00] bg-[#ff7a00]/5' : 'border-[#e2e8f0] hover:border-[#ff7a00]/50'}`}>
                          <Icon className="w-4 h-4 mb-1 text-[#0f172a]" />
                          <p className="text-xs font-semibold text-[#0f172a]">{label}</p>
                        </button>
                      ))}
                    </div>
                    <button
                      disabled={changingPlan}
                      onClick={async () => {
                        setChangingPlan(true);
                        const returnUrl = `${window.location.origin}${window.location.pathname}?p=seller-center&tab=subscription`;
                        const result = await initiateSubscriptionPayment({ plan: upgradingPlan, provider: upgradeProvider, returnUrl });
                        setChangingPlan(false);
                        if ('error' in result) { showToast(result.error, 'error'); return; }
                        // Real redirect to the provider's checkout page — the
                        // plan activates only once the webhook confirms payment.
                        window.location.href = result.redirectUrl;
                      }}
                      className="w-full btn-gold py-3 rounded-full font-semibold disabled:opacity-50"
                    >
                      {changingPlan ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (locale === 'fr' ? `Payer via ${upgradeProvider}` : `Pay via ${upgradeProvider}`)}
                    </button>
                  </div>
                )}
              </div>
            )}

            {tab === 'messages' && user?.sellerId && <SellerMessagesTab sellerId={user.sellerId} userId={user.id} locale={locale} />}

            {tab === 'invoices' && (
              <div className="animate-fade-up">
                <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-2">{locale === 'fr' ? 'Factures' : 'Invoices'}</h1>
                <p className="text-sm text-[#64748b] mb-6">
                  {locale === 'fr' ? 'Une facture PDF réelle par commande, générée à partir de vos vraies données.' : 'A real PDF invoice per order, generated from your actual data.'}
                </p>
                {orders.length === 0 ? (
                  <div className="card p-6 text-center text-sm text-[#64748b] bg-white"><FileText className="w-10 h-10 text-[#ff7a00]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucune facture.' : 'No invoices.'}</div>
                ) : (
                  <div className="space-y-2">
                    {orders.map((o) => (
                      <div key={o.id} className="card p-4 bg-white flex flex-wrap items-center gap-3">
                        <FileText className="w-4 h-4 text-[#ff7a00] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#0f172a]">{o.tracking_id || o.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-xs text-[#64748b]">{new Date(o.created_at).toLocaleDateString()} • {o.currency_code} {o.total.toFixed(2)}</p>
                        </div>
                        <Badge color={o.status === 'cancelled' ? '#ef4444' : '#22c55e'}>{o.status}</Badge>
                        <button
                          onClick={() => generateInvoicePdf(o, { sellerName: user?.fullName, locale })}
                          className="px-3 py-1.5 rounded-lg bg-[#ff7a00]/10 text-[#ff7a00] text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'returns' && (
              <div className="animate-fade-up">
                <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-2">{t.seller.returns}</h1>
                <p className="text-sm text-[#64748b] mb-6">
                  {locale === 'fr' ? 'Demandes de retour réelles de vos acheteurs.' : "Real return requests from your buyers."}
                </p>
                {returns.length === 0 ? (
                  <div className="card p-6 text-center text-sm text-[#64748b] bg-white"><RotateCcw className="w-10 h-10 text-[#ff7a00]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucun retour en cours.' : 'No returns in progress.'}</div>
                ) : (
                  <div className="space-y-3">
                    {returns.map((r) => (
                      <div key={r.id} className="card p-5 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-[#0f172a]">{locale === 'fr' ? 'Commande' : 'Order'} {r.orders?.tracking_id || r.order_id.slice(0, 8).toUpperCase()}</p>
                          <Badge color={r.status === 'requested' ? '#d97706' : r.status === 'rejected' ? '#ef4444' : r.status === 'approved' ? '#0284c7' : '#22c55e'}>{r.status}</Badge>
                        </div>
                        <p className="text-sm text-[#0f172a] mb-1"><span className="font-medium">{locale === 'fr' ? 'Motif' : 'Reason'}:</span> {r.reason}</p>
                        {r.details && <p className="text-xs text-[#64748b] mb-3">{r.details}</p>}
                        {r.seller_response && (
                          <p className="text-xs text-[#64748b] bg-[#f7f8fa] rounded-lg p-2 mb-3">
                            {locale === 'fr' ? 'Votre réponse' : 'Your response'}: {r.seller_response}
                          </p>
                        )}
                        {r.status === 'requested' && (
                          respondingReturnId === r.id ? (
                            <ReturnResponseForm
                              locale={locale}
                              onSubmit={async (status, response) => {
                                const ok = await respondToReturnRequest(r.id, status, response);
                                if (ok) {
                                  showToast(locale === 'fr' ? 'Réponse envoyée' : 'Response sent');
                                  setReturns((prev) => prev.map((x) => x.id === r.id ? { ...x, status, seller_response: response } : x));
                                  setRespondingReturnId(null);
                                } else {
                                  showToast(locale === 'fr' ? 'Erreur' : 'Error', 'error');
                                }
                              }}
                              onCancel={() => setRespondingReturnId(null)}
                            />
                          ) : (
                            <button onClick={() => setRespondingReturnId(r.id)} className="btn-gold px-4 py-2 rounded-lg text-xs font-semibold">
                              {locale === 'fr' ? 'Répondre' : 'Respond'}
                            </button>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {sellerReports.length > 0 && (
                  <div className="mt-8">
                    <h2 className="font-display text-lg font-bold text-[#0f172a] mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> {locale === 'fr' ? 'Signalements Zando concernant vos commandes' : 'Zando reports about your orders'}</h2>
                    <p className="text-xs text-[#64748b] mb-4">{locale === 'fr' ? "Un acheteur a signalé un problème à Zando. Répondez avec vos preuves (suivi, photos, etc.) — votre réponse est examinée par l'équipe Zando." : "A buyer reported a problem to Zando. Respond with your evidence (tracking, photos, etc.) — your response is reviewed by the Zando team."}</p>
                    <div className="space-y-3">
                      {sellerReports.map((r) => (
                        <div key={r.id} className="card p-5 bg-white border-l-4 border-red-400">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-[#0f172a] text-sm">{locale === 'fr' ? 'Commande' : 'Order'} {r.order_id?.slice(0, 8).toUpperCase()}</p>
                            <Badge color={r.status === 'open' ? '#ef4444' : r.status === 'under_review' ? '#ff7a00' : r.status === 'resolved' ? '#22c55e' : '#64748b'}>{r.status.replace(/_/g, ' ')}</Badge>
                          </div>
                          {r.description && <p className="text-sm text-[#0f172a] mb-2">{r.description}</p>}
                          {r.seller_response ? (
                            <p className="text-xs text-[#64748b] bg-[#f7f8fa] rounded-lg p-2">{locale === 'fr' ? 'Votre réponse' : 'Your response'}: {r.seller_response}</p>
                          ) : respondingReportId === r.id ? (
                            <div className="space-y-2">
                              <textarea value={reportResponseText} onChange={(e) => setReportResponseText(e.target.value)} placeholder={locale === 'fr' ? 'Votre réponse (preuves, numéro de suivi...)' : 'Your response (evidence, tracking number...)'} className="input-field text-sm w-full" rows={2} />
                              <button onClick={async () => {
                                if (!reportResponseText.trim()) return;
                                const ok = await submitSellerReportResponse(r.id, reportResponseText);
                                if (ok) {
                                  showToast(locale === 'fr' ? 'Réponse envoyée' : 'Response sent');
                                  setSellerReports((prev) => prev.map((x) => x.id === r.id ? { ...x, seller_response: reportResponseText } : x));
                                  setRespondingReportId(null);
                                  setReportResponseText('');
                                } else {
                                  showToast(locale === 'fr' ? 'Erreur' : 'Error', 'error');
                                }
                              }} className="btn-gold px-4 py-2 rounded-lg text-xs font-semibold">{locale === 'fr' ? 'Envoyer la réponse' : 'Send response'}</button>
                            </div>
                          ) : (
                            <button onClick={() => setRespondingReportId(r.id)} className="btn-gold px-4 py-2 rounded-lg text-xs font-semibold">{locale === 'fr' ? 'Répondre' : 'Respond'}</button>
                          )}
                          {r.resolution && (
                            <div className="mt-2 p-2 rounded-lg bg-green-50 border border-green-200">
                              <p className="text-[10px] font-semibold text-green-700 uppercase">{locale === 'fr' ? 'Décision Zando' : 'Zando decision'}</p>
                              <p className="text-xs text-[#0f172a] mt-0.5">{r.resolution}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'deliveries' && (
              <div className="animate-fade-up">
                <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-6">{t.seller.deliveries}</h1>
                <div className="grid sm:grid-cols-2 gap-4">
                  {orders.filter((o) => o.status === 'inTransit' || o.status === 'preparing' || o.status === 'confirmed').map((o) => (
                    <div key={o.id} className="card p-5 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-[#0f172a]">{o.tracking_id || o.id.slice(0, 8)}</span>
                        <Badge color={statusColors[o.status]}>{t.delivery[o.status as 'pending' | 'confirmed' | 'preparing' | 'inTransit' | 'delivered' | 'cancelled']}</Badge>
                      </div>
                      <p className="text-xs text-[#64748b] mb-3">{t.delivery.sellerDelivers}</p>
                      <button onClick={() => navigate('delivery', { id: o.tracking_id || o.id })} className="w-full btn-cocoa py-2 rounded-lg text-sm font-medium">{t.delivery.title}</button>
                    </div>
                  ))}
                  {orders.filter((o) => o.status === 'inTransit' || o.status === 'preparing' || o.status === 'confirmed').length === 0 && (
                    <div className="card p-6 text-center text-sm text-[#64748b] bg-white sm:col-span-2"><Truck className="w-10 h-10 text-[#ff7a00]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucune livraison en cours.' : 'No deliveries in progress.'}</div>
                  )}
                </div>
              </div>
            )}

            {tab === 'settings' && (
              <div className="animate-fade-up space-y-6">
                <h1 className="font-display text-2xl font-bold text-[#0f172a]">{locale === 'fr' ? 'Paramètres boutique' : 'Store settings'}</h1>
                <div className="card p-6 bg-white space-y-4">
                  {!sellerProfile.countryId && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                      {locale === 'fr'
                        ? "Aucun pays défini pour votre boutique — vos produits n'apparaîtront jamais quand un acheteur filtre par localisation. Choisissez votre pays ci-dessous."
                        : "No country set for your store — your products will never appear when a buyer filters by location. Choose your country below."}
                    </div>
                  )}
                  <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Nom de la boutique' : 'Store name'}</label><input value={sellerProfile.businessName} onChange={(e) => setSellerProfile({ ...sellerProfile, businessName: e.target.value })} className="input-field" /></div>
                  <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Description' : 'Description'}</label><textarea value={sellerProfile.description} onChange={(e) => setSellerProfile({ ...sellerProfile, description: e.target.value })} className="input-field resize-none" rows={3} /></div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Téléphone' : 'Phone'}</label><input value={sellerProfile.phone} onChange={(e) => setSellerProfile({ ...sellerProfile, phone: e.target.value })} className="input-field" placeholder="+225 07 00 00 00" /></div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Pays *' : 'Country *'}</label>
                      <select value={sellerProfile.countryId} onChange={(e) => setSellerProfile({ ...sellerProfile, countryId: e.target.value })} className="input-field cursor-pointer">
                        <option value="">{locale === 'fr' ? '— Choisir —' : '— Choose —'}</option>
                        {countries.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Ville' : 'City'}</label><input value={sellerProfile.city} onChange={(e) => setSellerProfile({ ...sellerProfile, city: e.target.value })} className="input-field" /></div>
                    <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Adresse' : 'Address'}</label><input value={sellerProfile.businessAddress} onChange={(e) => setSellerProfile({ ...sellerProfile, businessAddress: e.target.value })} className="input-field" /></div>
                  </div>
                  <button
                    disabled={savingSettings}
                    onClick={async () => {
                      if (!user?.sellerId) return;
                      setSavingSettings(true);
                      const ok = await updateSellerProfile(user.sellerId, {
                        businessName: sellerProfile.businessName,
                        description: sellerProfile.description,
                        phone: sellerProfile.phone,
                        countryId: sellerProfile.countryId,
                        city: sellerProfile.city,
                        businessAddress: sellerProfile.businessAddress,
                      });
                      setSavingSettings(false);
                      showToast(ok ? (locale === 'fr' ? 'Paramètres enregistrés' : 'Settings saved') : (locale === 'fr' ? 'Échec — vérifiez vos droits' : 'Failed — check your permissions'), ok ? undefined : 'error');
                    }}
                    className="btn-green px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingSettings && <Loader2 className="w-4 h-4 animate-spin" />} {t.common.save}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#0f172a] mb-2">{locale === 'fr' ? 'Supprimer ce produit ?' : 'Delete this product?'}</h3>
            <p className="text-sm text-[#64748b] mb-6">
              {locale === 'fr'
                ? "Cette action est définitive. Le produit ne sera plus visible ni achetable. Les commandes déjà passées ne sont pas affectées."
                : 'This is permanent. The product will no longer be visible or purchasable. Existing orders are not affected.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 rounded-full text-sm font-semibold border border-[#e2e8f0] text-[#64748b]">{locale === 'fr' ? 'Annuler' : 'Cancel'}</button>
              <button
                disabled={deletingProductId === confirmDeleteId}
                onClick={async () => {
                  const id = confirmDeleteId;
                  setDeletingProductId(id);
                  const ok = await deleteProduct(id);
                  setDeletingProductId(null);
                  setConfirmDeleteId(null);
                  if (ok) {
                    setProducts((prev) => prev.filter((x) => x.id !== id));
                    showToast(locale === 'fr' ? 'Produit supprimé' : 'Product deleted');
                  } else {
                    showToast(locale === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting product', 'error');
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
              >
                {deletingProductId === confirmDeleteId ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (locale === 'fr' ? 'Supprimer' : 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowUpgradeModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-[#ff7a00]/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-[#ff7a00]" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#0f172a] mb-2">{locale === 'fr' ? 'Limite du plan gratuit atteinte' : 'Free plan limit reached'}</h3>
            <p className="text-sm text-[#64748b] mb-6">
              {locale === 'fr'
                ? 'Le plan Gratuit est limité à 1 produit actif. Passez à un plan payant pour publier des produits illimités.'
                : 'The Free plan is limited to 1 active product. Upgrade to a paid plan to list unlimited products.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowUpgradeModal(false)} className="flex-1 py-2.5 rounded-full text-sm font-semibold border border-[#e2e8f0] text-[#64748b]">{locale === 'fr' ? 'Annuler' : 'Cancel'}</button>
              <button onClick={() => { setShowUpgradeModal(false); setTab('subscription'); }} className="flex-1 btn-gold py-2.5 rounded-full text-sm font-semibold">{locale === 'fr' ? 'Voir les plans' : 'View plans'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReturnResponseForm({ locale, onSubmit, onCancel }: {
  locale: 'fr' | 'en';
  onSubmit: (status: 'approved' | 'rejected' | 'refunded', response: string) => void;
  onCancel: () => void;
}) {
  const [response, setResponse] = useState('');
  return (
    <div className="border-t border-[#f0f4f8] pt-3 mt-1 space-y-2">
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder={locale === 'fr' ? 'Message pour l\'acheteur (optionnel)' : 'Message for the buyer (optional)'}
        className="input-field text-sm w-full"
        rows={2}
      />
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onSubmit('approved', response)} className="px-4 py-2 rounded-lg bg-sky-100 text-sky-700 text-xs font-semibold">{locale === 'fr' ? 'Approuver' : 'Approve'}</button>
        <button onClick={() => onSubmit('refunded', response)} className="px-4 py-2 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">{locale === 'fr' ? 'Rembourser' : 'Refund'}</button>
        <button onClick={() => onSubmit('rejected', response)} className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-semibold">{locale === 'fr' ? 'Refuser' : 'Reject'}</button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-xs font-semibold text-[#64748b]">{locale === 'fr' ? 'Annuler' : 'Cancel'}</button>
      </div>
    </div>
  );
}

function SellerMessagesTab({ sellerId, userId, locale }: { sellerId: string; userId: string; locale: 'fr' | 'en' }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setConversations(await fetchSellerConversations(sellerId));
    setLoading(false);
  };
  useEffect(() => { load(); }, [sellerId]);

  const openConversation = async (conv: Conversation) => {
    setSelectedId(conv.id);
    setMessages(await fetchConversationMessages(conv.id));
    if (conv.seller_unread_count > 0) {
      await markConversationRead(conv.id, 'seller');
      setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, seller_unread_count: 0 } : c));
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedId) return;
    const ok = await sendMessage({ conversationId: selectedId, senderId: userId, senderRole: 'seller', body: newMessage.trim() });
    if (ok) {
      setMessages((prev) => [...prev, { id: 'tmp-' + Date.now(), conversation_id: selectedId, sender_id: userId, sender_role: 'seller', body: newMessage.trim(), created_at: new Date().toISOString() }]);
      setNewMessage('');
    }
  };

  const selected = conversations.find((c) => c.id === selectedId);

  if (loading) return <div className="card p-8 text-center text-sm text-[#64748b] bg-white">{locale === 'fr' ? 'Chargement...' : 'Loading...'}</div>;

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-2">{locale === 'fr' ? 'Messages' : 'Messages'}</h1>
      <p className="text-sm text-[#64748b] mb-6">{locale === 'fr' ? 'Conversations réelles liées à vos commandes.' : 'Real conversations tied to your orders.'}</p>
      {conversations.length === 0 ? (
        <div className="card p-6 text-center text-sm text-[#64748b] bg-white"><MessageSquare className="w-10 h-10 text-[#ff7a00]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucun message.' : 'No messages.'}</div>
      ) : (
        <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[520px]">
          <div className="card bg-white overflow-y-auto divide-y divide-[#f0f4f8]">
            {conversations.map((c) => (
              <button key={c.id} onClick={() => openConversation(c)} className={'w-full text-left p-3 hover:bg-[#f7f8fa] ' + (selectedId === c.id ? 'bg-[#ff7a00]/5' : '')}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#0f172a] truncate">{c.subject || `${locale === 'fr' ? 'Commande' : 'Order'} ${c.orders?.tracking_id || c.order_id.slice(0, 8)}`}</p>
                  {c.seller_unread_count > 0 && <span className="w-5 h-5 rounded-full bg-[#ff7a00] text-white text-[10px] font-bold flex items-center justify-center shrink-0">{c.seller_unread_count}</span>}
                </div>
                <p className="text-xs text-[#64748b]">{new Date(c.last_message_at).toLocaleDateString()}</p>
              </button>
            ))}
          </div>
          <div className="card bg-white flex flex-col">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-sm text-[#64748b]">{locale === 'fr' ? 'Sélectionnez une conversation' : 'Select a conversation'}</div>
            ) : (
              <>
                <div className="p-3 border-b border-[#f0f4f8]"><p className="text-sm font-semibold text-[#0f172a]">{selected.subject || (locale === 'fr' ? 'Commande' : 'Order')}</p></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className={'max-w-[75%] p-3 rounded-2xl text-sm ' + (m.sender_role === 'seller' ? 'ml-auto bg-[#ff7a00] text-white' : 'bg-[#f7f8fa] text-[#0f172a]')}>
                      {m.body}
                      <p className={'text-[10px] mt-1 ' + (m.sender_role === 'seller' ? 'text-white/70' : 'text-[#94a3b8]')}>{new Date(m.created_at).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-[#f0f4f8] flex gap-2">
                  <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={locale === 'fr' ? 'Écrire un message...' : 'Type a message...'} className="input-field flex-1" />
                  <button onClick={handleSend} className="btn-gold px-4 py-2 rounded-lg text-sm font-semibold">{locale === 'fr' ? 'Envoyer' : 'Send'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Seuils calqués sur le modèle Amazon Seller Central (Good / At Risk / Below Standard).
function healthStatus(value: number, thresholds: { atRisk: number; belowStandard: number }): { label: string; color: string } {
  if (value >= thresholds.belowStandard) return { label: 'Below Standard', color: '#ef4444' };
  if (value >= thresholds.atRisk) return { label: 'At Risk', color: '#d97706' };
  return { label: 'Good', color: '#22c55e' };
}

function AccountHealthTab({ sellerId, locale }: { sellerId: string; locale: 'fr' | 'en' }) {
  const [health, setHealth] = useState<SellerAccountHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerAccountHealth(sellerId).then((h) => { setHealth(h); setLoading(false); });
  }, [sellerId]);

  if (loading) return <div className="card p-8 text-center text-sm text-[#64748b] bg-white">{locale === 'fr' ? 'Chargement...' : 'Loading...'}</div>;
  if (!health || health.error) return <div className="card p-8 text-center text-sm text-[#64748b] bg-white">{health?.error || (locale === 'fr' ? 'Indisponible' : 'Unavailable')}</div>;

  const odr = healthStatus(health.order_defect_rate, { atRisk: 1, belowStandard: 2 });
  const lateShip = healthStatus(health.late_shipment_rate, { atRisk: 4, belowStandard: 10 });
  const cancel = healthStatus(health.cancellation_rate, { atRisk: 2.5, belowStandard: 5 });
  const trackingBad = 100 - health.valid_tracking_rate;
  const tracking = healthStatus(trackingBad, { atRisk: 5, belowStandard: 10 });

  const overallColor = [odr, lateShip, cancel, tracking].some((s) => s.color === '#ef4444') ? '#ef4444'
    : [odr, lateShip, cancel, tracking].some((s) => s.color === '#d97706') ? '#d97706' : '#22c55e';
  const overallLabel = overallColor === '#ef4444' ? 'Below Standard' : overallColor === '#d97706' ? 'At Risk' : 'Good';

  const metrics = [
    { label: locale === 'fr' ? 'Taux de défaut commande (ODR)' : 'Order Defect Rate (ODR)', value: health.order_defect_rate, status: odr, hint: locale === 'fr' ? "Commandes annulées ou retournées, cible < 1%" : 'Cancelled or returned orders, target < 1%' },
    { label: locale === 'fr' ? "Taux d'expédition tardive" : 'Late Shipment Rate', value: health.late_shipment_rate, status: lateShip, hint: locale === 'fr' ? `Basé sur ${health.measured_shipments} expédition(s) mesurée(s), cible < 4%` : `Based on ${health.measured_shipments} measured shipment(s), target < 4%` },
    { label: locale === 'fr' ? "Taux d'annulation" : 'Cancellation Rate', value: health.cancellation_rate, status: cancel, hint: locale === 'fr' ? 'Cible < 2.5%' : 'Target < 2.5%' },
    { label: locale === 'fr' ? 'Taux de suivi valide' : 'Valid Tracking Rate', value: health.valid_tracking_rate, status: tracking, hint: locale === 'fr' ? `Basé sur ${health.measured_deliveries} livraison(s), cible > 95%` : `Based on ${health.measured_deliveries} delivery(ies), target > 95%`, isPositive: true },
  ];

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Santé du compte' : 'Account Health'}</h1>
        <p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Indicateurs de performance calculés sur vos vraies commandes.' : 'Performance indicators computed from your real orders.'}</p>
      </div>

      <div className="card p-6 bg-white flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ background: `${overallColor}18` }}>
          <ShieldCheck className="w-8 h-8" style={{ color: overallColor }} />
        </div>
        <div>
          <p className="text-xs text-[#64748b] uppercase font-semibold">{locale === 'fr' ? 'Statut global' : 'Overall Status'}</p>
          <p className="text-xl font-bold" style={{ color: overallColor }}>{overallLabel}</p>
          <p className="text-xs text-[#64748b] mt-1">{health.total_orders} {locale === 'fr' ? 'commandes au total' : 'total orders'}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="card p-5 bg-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-[#0f172a]">{m.label}</p>
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full" style={{ background: `${m.status.color}18`, color: m.status.color }}>{m.status.label}</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: m.status.color }}>{m.value}%</p>
            <p className="text-xs text-[#64748b] mt-1">{m.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InventoryTab({ sellerId, locale }: { sellerId: string; locale: 'fr' | 'en' }) {
  const { showToast } = useApp();
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, { stock?: string; threshold?: string }>>({});

  const load = async () => {
    setLoading(true);
    setAlerts(await fetchSellerInventoryAlerts(sellerId));
    setLoading(false);
  };
  useEffect(() => { load(); }, [sellerId]);

  const handleRestock = async (productId: string) => {
    const newStock = parseInt(edits[productId]?.stock || '');
    if (isNaN(newStock) || newStock < 0) { showToast(locale === 'fr' ? 'Quantité invalide' : 'Invalid quantity', 'error'); return; }
    const ok = await updateProductStock(productId, newStock);
    if (ok) { showToast(locale === 'fr' ? 'Stock mis à jour' : 'Stock updated'); load(); }
    else showToast(locale === 'fr' ? 'Erreur' : 'Error', 'error');
  };

  const handleThresholdSave = async (productId: string) => {
    const newThreshold = parseInt(edits[productId]?.threshold || '');
    if (isNaN(newThreshold) || newThreshold < 0) return;
    const ok = await updateProductLowStockThreshold(productId, newThreshold);
    if (ok) { showToast(locale === 'fr' ? 'Seuil mis à jour' : 'Threshold updated'); load(); }
  };

  if (loading) return <div className="card p-8 text-center text-sm text-[#64748b] bg-white">{locale === 'fr' ? 'Chargement...' : 'Loading...'}</div>;

  const outOfStock = alerts.filter((a) => a.alert_level === 'out_of_stock');
  const lowStock = alerts.filter((a) => a.alert_level === 'low_stock');

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Alertes de réapprovisionnement' : 'Restock Alerts'}</h1>
        <p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Produits en rupture ou sous le seuil configuré, triés par ventes des 30 derniers jours.' : 'Out of stock or below threshold products, sorted by last 30-day sales.'}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label={locale === 'fr' ? 'Ruptures de stock' : 'Out of Stock'} value={outOfStock.length.toString()} icon={XCircle} color="#ef4444" />
        <StatCard label={locale === 'fr' ? 'Stock faible' : 'Low Stock'} value={lowStock.length.toString()} icon={AlertTriangle} color="#d97706" />
      </div>

      {alerts.length === 0 ? (
        <div className="card p-8 text-center text-sm text-[#64748b] bg-white"><PackageCheck className="w-10 h-10 text-green-500/40 mx-auto mb-3" />{locale === 'fr' ? 'Aucune alerte — tous vos stocks sont sains.' : 'No alerts — all your stock levels are healthy.'}</div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.product_id} className="card p-4 bg-white flex flex-wrap items-center gap-3">
              <img src={a.image_url || ''} className="w-12 h-12 rounded-lg object-cover bg-[#f7f8fa] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#0f172a] truncate">{a.name}</p>
                <p className="text-xs text-[#64748b]">{a.units_sold_30d} {locale === 'fr' ? 'vendus (30j)' : 'sold (30d)'} • {locale === 'fr' ? 'seuil' : 'threshold'}: {a.low_stock_threshold}</p>
              </div>
              <Badge color={a.alert_level === 'out_of_stock' ? '#ef4444' : '#d97706'}>{a.alert_level === 'out_of_stock' ? (locale === 'fr' ? 'Rupture' : 'Out of stock') : (locale === 'fr' ? 'Stock faible' : 'Low stock')} • {a.stock}</Badge>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#64748b]">{locale === 'fr' ? 'Seuil' : 'Threshold'}</span>
                <input
                  type="number"
                  placeholder={String(a.low_stock_threshold)}
                  value={edits[a.product_id]?.threshold ?? ''}
                  onChange={(e) => setEdits((prev) => ({ ...prev, [a.product_id]: { ...prev[a.product_id], threshold: e.target.value } }))}
                  onBlur={() => handleThresholdSave(a.product_id)}
                  className="input-field w-16 text-xs py-1"
                />
              </div>
              <input
                type="number"
                placeholder={locale === 'fr' ? 'Nouveau stock' : 'New stock'}
                value={edits[a.product_id]?.stock ?? ''}
                onChange={(e) => setEdits((prev) => ({ ...prev, [a.product_id]: { ...prev[a.product_id], stock: e.target.value } }))}
                className="input-field w-28 text-sm"
              />
              <button onClick={() => handleRestock(a.product_id)} className="btn-gold px-3 py-2 rounded-lg text-xs font-semibold">{locale === 'fr' ? 'Réapprovisionner' : 'Restock'}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
