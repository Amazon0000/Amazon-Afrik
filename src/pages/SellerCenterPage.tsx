import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { fetchProducts, fetchOrders, fetchAdCampaigns, uploadProductImage, createProduct, fetchSellerPaymentMethods, addSellerPaymentMethod, removeSellerPaymentMethod, toggleSellerPaymentMethod, updateSellerPlan, fetchSellerFlashDeals, createFlashDeal, endFlashDeal } from '@/lib/db';
import type { Product, Order, AdCampaign, SellerPaymentMethod, FlashDeal } from '@/lib/db';
import { StatCard, Badge } from '@/components/ui';
import { LayoutDashboard, Package, ShoppingCart, Truck, RotateCcw, Star, CreditCard, Megaphone, BarChart3, Plus, TrendingUp, DollarSign, Users, Clock, CheckCircle, XCircle, MessageSquare, Wallet, FileText, Settings, Bell, Loader2, ImagePlus, Trash2, ShieldCheck, Flame } from 'lucide-react';

// Major payment service providers by category, with strong African coverage —
// sellers pick their own PSP here; Zando never touches the funds or takes a cut.
const PSP_OPTIONS: Record<string, string[]> = {
  card: ['Flutterwave', 'Paystack', 'Interswitch', 'DPO Pay', 'Peach Payments', 'Yoco', 'PayFast', 'Cellulant (Tingg)', 'Fawry', 'PawaPay', 'Stripe', 'Autre / Other'],
  mobile_money: ['M-Pesa', 'MTN Mobile Money (MoMo)', 'Orange Money', 'Airtel Money', 'Moov Money', 'Wave', 'Tigo Pesa', 'EcoCash', 'Autre / Other'],
  bank: ['Virement bancaire direct / Direct bank transfer', 'Autre / Other'],
  crypto: ['USDT (TRC20)', 'USDT (ERC20)', 'Bitcoin', 'Autre / Other'],
};

type NewProduct = {
  name: string;
  description: string;
  price: string;
  oldPrice: string;
  stock: string;
  sku: string;
  categoryId: string;
};

const emptyProduct: NewProduct = { name: '', description: '', price: '', oldPrice: '', stock: '', sku: '', categoryId: '' };

export function SellerCenterPage() {
  const { t, locale, user, setUser, navigate, showToast, categories } = useApp();
  const [tab, setTab] = useState('dashboard');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState<NewProduct>(emptyProduct);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [paymentMethods, setPaymentMethods] = useState<SellerPaymentMethod[]>([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({ providerName: PSP_OPTIONS.card[0], providerType: 'card', accountIdentifier: '', displayName: '' });
  const [changingPlan, setChangingPlan] = useState(false);
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>([]);
  const [flashDealFor, setFlashDealFor] = useState<string | null>(null);
  const [newDeal, setNewDeal] = useState({ discountPercent: '20', durationHours: '24', stockLimit: '' });

  useEffect(() => {
    (async () => {
      if (!user?.sellerId && !user?.id) { setLoading(false); return; }
      try {
        const sellerId = user.sellerId || user.id;
        const [prods, ords, adCamp] = await Promise.all([
          fetchProducts({ sellerId, limit: 50 }),
          fetchOrders(),
          fetchAdCampaigns(sellerId),
        ]);
        setProducts(prods);
        setOrders(ords.slice(0, 10));
        setAds(adCamp);
        const pms = await fetchSellerPaymentMethods(sellerId);
        setPaymentMethods(pms);
        setFlashDeals(await fetchSellerFlashDeals(sellerId));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const navItems = [
    { id: 'dashboard', label: t.seller.dashboard, icon: LayoutDashboard },
    { id: 'products', label: t.seller.products, icon: Package },
    { id: 'orders', label: t.seller.orders, icon: ShoppingCart },
    { id: 'deliveries', label: t.seller.deliveries, icon: Truck },
    { id: 'returns', label: t.seller.returns, icon: RotateCcw },
    { id: 'reputation', label: t.seller.reputation, icon: Star },
    { id: 'ads', label: t.seller.ads, icon: Megaphone },
    { id: 'analytics', label: t.seller.analytics, icon: BarChart3 },
    { id: 'messages', label: locale === 'fr' ? 'Messages' : 'Messages', icon: MessageSquare },
    { id: 'payments', label: locale === 'fr' ? 'Moyens de paiement' : 'Payment methods', icon: Wallet },
    { id: 'invoices', label: locale === 'fr' ? 'Factures' : 'Invoices', icon: FileText },
    { id: 'subscription', label: t.seller.subscription, icon: CreditCard },
    { id: 'settings', label: locale === 'fr' ? 'Paramètres' : 'Settings', icon: Settings },
  ];

  const plan = user?.sellerPlan || 'starter';
  const planColor = plan === 'enterprise' ? '#ff7a00' : plan === 'premium' ? '#ff7a00' : '#64748b';

  const totalRevenue = products.reduce((sum, p) => sum + p.price * (p.total_reviews || 1), 0);
  const avgRating = products.length > 0 ? products.reduce((sum, p) => sum + p.rating, 0) / products.length : 0;
  const totalReviews = products.reduce((sum, p) => sum + p.total_reviews, 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 5);
  const outOfStock = products.filter((p) => p.stock === 0);

  const reloadProducts = async () => {
    if (!user?.sellerId && !user?.id) return;
    const sellerId = user.sellerId || user.id;
    const prods = await fetchProducts({ sellerId, limit: 50 });
    setProducts(prods);
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const sellerId = user?.sellerId || user?.id || 'tmp';
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

  const handleSaveProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price.trim() || !newProduct.stock.trim()) {
      showToast(locale === 'fr' ? 'Veuillez remplir les champs requis' : 'Please fill required fields');
      return;
    }
    if (uploadedImages.length === 0) {
      showToast(locale === 'fr' ? 'Ajoutez au moins une image' : 'Add at least one image');
      return;
    }
    const sellerId = user?.sellerId || user?.id;
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
      currencyCode: 'USD',
      categoryId: newProduct.categoryId || null,
      stock: parseInt(newProduct.stock, 10),
      sku: newProduct.sku.trim() || null,
      imageUrls: uploadedImages,
    });
    setSaving(false);
    if (productId) {
      showToast(locale === 'fr' ? 'Produit créé avec succès' : 'Product created successfully');
      setNewProduct(emptyProduct);
      setUploadedImages([]);
      setShowAddProduct(false);
      await reloadProducts();
    } else {
      showToast(locale === 'fr' ? 'Erreur lors de la création' : 'Error creating product');
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
            {tab === 'dashboard' && (
              <div className="animate-fade-up space-y-6">
                <h1 className="font-display text-2xl font-bold text-[#0f172a]">{t.seller.dashboard}</h1>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label={t.seller.orders} value={orders.length.toString()} icon={ShoppingCart} trend="+15%" />
                  <StatCard label={locale === 'fr' ? 'Revenus' : 'Revenue'} value={`$${totalRevenue.toFixed(0)}`} icon={DollarSign} trend="+22%" />
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
                    ) : orders.map((o, i) => (
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
                  <button onClick={() => setShowAddProduct(!showAddProduct)} className="btn-green px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> {t.seller.addProduct}</button>
                </div>

                {showAddProduct && (
                  <div className="card p-6 mb-6 animate-fade-up bg-white">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.seller.productName} *</label><input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="input-field" placeholder="Robe Wax Premium" /></div>
                      <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.seller.price} *</label><input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className="input-field" placeholder="45" /></div>
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
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={handleSaveProduct} disabled={saving || uploading} className="btn-green px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">{saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {locale === 'fr' ? 'Enregistrement...' : 'Saving...'}</> : t.common.save}</button>
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
                            const sellerId = user?.sellerId || user?.id;
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
                    {orders.map((o, i) => (
                      <div key={o.id} className={`flex items-center gap-3 p-4 ${i > 0 ? 'border-t border-[#e2e8f0]' : ''}`}>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#0f172a]">{o.order_items?.[0]?.product_name || 'Order'}</p>
                          <p className="text-xs text-[#64748b]">{o.tracking_id || o.id.slice(0, 8)} • {new Date(o.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-full" style={{ background: `${statusColors[o.status]}15`, color: statusColors[o.status] }}>{t.delivery[o.status as 'pending' | 'confirmed' | 'preparing' | 'inTransit' | 'delivered' | 'cancelled']}</span>
                        <span className="font-bold text-[#0f172a]">${o.total.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'analytics' && (
              <div className="animate-fade-up space-y-6">
                <h1 className="font-display text-2xl font-bold text-[#0f172a]">{t.seller.analytics}</h1>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label={locale === 'fr' ? 'Ventes' : 'Sales'} value={totalReviews.toString()} icon={DollarSign} trend="+18%" />
                  <StatCard label={locale === 'fr' ? 'Conversion' : 'Conversion'} value="4.2%" icon={TrendingUp} />
                  <StatCard label={locale === 'fr' ? 'Visiteurs' : 'Visitors'} value="12.4K" icon={Users} />
                  <StatCard label={locale === 'fr' ? 'Trafic' : 'Traffic'} value="89K" icon={BarChart3} />
                </div>
                <div className="card p-6 bg-white">
                  <h3 className="font-semibold text-[#0f172a] mb-4">{locale === 'fr' ? 'Ventes par produit' : 'Sales by product'}</h3>
                  <div className="space-y-3">
                    {products.slice(0, 6).map((p) => {
                      const maxReviews = Math.max(...products.map((x) => x.total_reviews), 1);
                      const pct = (p.total_reviews / maxReviews) * 100;
                      return (
                        <div key={p.id}>
                          <div className="flex items-center justify-between mb-1"><span className="text-sm text-[#0f172a]">{p.name}</span><span className="text-xs text-[#64748b]">{p.total_reviews}</span></div>
                          <div className="h-2 rounded-full bg-[#f7f8fa] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#ff7a00] to-[#e06c00]" style={{ width: `${pct}%` }} /></div>
                        </div>
                      );
                    })}
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
                {ads.length === 0 ? (
                  <div className="card p-6 text-center text-sm text-[#64748b] bg-white"><Megaphone className="w-10 h-10 text-[#ff7a00]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucune campagne publicitaire.' : 'No ad campaigns yet.'}</div>
                ) : (
                  <div className="space-y-3">
                    {ads.map((ad) => (
                      <div key={ad.id} className="card p-5 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-[#0f172a]">{ad.name}</p>
                          <Badge color={ad.status === 'active' ? '#ff7a00' : ad.status === 'pending' ? '#ff7a00' : '#64748b'}>{ad.status}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div><p className="text-lg font-bold text-[#0f172a]">{ad.impressions.toLocaleString()}</p><p className="text-xs text-[#64748b]">{t.ads.impressions}</p></div>
                          <div><p className="text-lg font-bold text-[#0f172a]">{ad.clicks.toLocaleString()}</p><p className="text-xs text-[#64748b]">{t.ads.clicks}</p></div>
                          <div><p className="text-lg font-bold text-[#0f172a]">${ad.budget}</p><p className="text-xs text-[#64748b]">{t.ads.budget}</p></div>
                        </div>
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
                    <h2 className="font-display text-lg font-bold text-[#0f172a]">{locale === 'fr' ? 'Vos PSP connectés' : 'Your connected PSPs'}</h2>
                    <button onClick={() => setShowAddPayment(!showAddPayment)} className="btn-green px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"><Plus className="w-4 h-4" /> {locale === 'fr' ? 'Connecter un PSP' : 'Connect a PSP'}</button>
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
                          <input value={newPayment.accountIdentifier} onChange={(e) => setNewPayment({ ...newPayment, accountIdentifier: e.target.value })} className="input-field" placeholder={locale === 'fr' ? 'ID compte, IBAN, numéro...' : 'Account ID, IBAN, number...'} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? "Nom affiché à l'acheteur" : 'Display name to buyer'}</label>
                          <input value={newPayment.displayName} onChange={(e) => setNewPayment({ ...newPayment, displayName: e.target.value })} className="input-field" placeholder={locale === 'fr' ? 'Ex: Paiement carte via Stripe' : 'E.g. Card payment via Stripe'} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={async () => {
                          const sellerId = user?.sellerId || user?.id;
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

            {tab === 'subscription' && (
              <div className="animate-fade-up space-y-6">
                <h1 className="font-display text-2xl font-bold text-[#0f172a]">{t.seller.subscription}</h1>
                <div className="card p-6 bg-gradient-to-br from-[#ff7a00]/10 to-transparent border-[#ff7a00]/20">
                  <p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Plan actuel' : 'Current plan'}</p>
                  <p className="text-3xl font-bold text-[#0f172a] mt-1 capitalize" style={{ color: planColor }}>{plan}</p>
                  <p className="text-xs text-[#64748b] mt-2">
                    {locale === 'fr'
                      ? "C'est votre seul coût fixe chez Zando — aucune commission n'est prélevée sur vos ventes, qui vous sont versées directement via votre PSP."
                      : "This is your only fixed cost on Zando — zero commission is taken on your sales, which are paid to you directly via your PSP."}
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {(['starter', 'premium', 'enterprise'] as const).map((p) => (
                    <div key={p} className={`card p-5 ${plan === p ? 'ring-2 ring-[#ff7a00]' : ''}`}>
                      <h3 className="font-display text-lg font-bold text-[#0f172a] capitalize mb-2">{p}</h3>
                      <button
                        disabled={plan === p || changingPlan}
                        onClick={async () => {
                          const sellerId = user?.sellerId || user?.id;
                          if (!sellerId || !user) return;
                          setChangingPlan(true);
                          const ok = await updateSellerPlan(sellerId, p);
                          if (ok) {
                            setUser({ ...user, sellerPlan: p });
                            showToast(locale === 'fr' ? 'Plan mis à jour' : 'Plan updated');
                          } else {
                            showToast(locale === 'fr' ? 'Erreur lors du changement de plan' : 'Error changing plan', 'error');
                          }
                          setChangingPlan(false);
                        }}
                        className={`w-full py-2.5 rounded-lg text-sm font-semibold ${plan === p ? 'bg-[#0f172a]/10 text-[#64748b] cursor-default' : 'btn-green'}`}
                      >
                        {plan === p ? (locale === 'fr' ? 'Plan actuel' : 'Current plan') : (locale === 'fr' ? 'Choisir' : 'Choose')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'messages' && (
              <div className="animate-fade-up">
                <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-6">{locale === 'fr' ? 'Messages' : 'Messages'}</h1>
                <div className="card p-6 text-center text-sm text-[#64748b] bg-white"><MessageSquare className="w-10 h-10 text-[#ff7a00]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucun message.' : 'No messages.'}</div>
              </div>
            )}

            {tab === 'invoices' && (
              <div className="animate-fade-up">
                <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-6">{locale === 'fr' ? 'Factures' : 'Invoices'}</h1>
                <div className="card p-6 text-center text-sm text-[#64748b] bg-white"><FileText className="w-10 h-10 text-[#ff7a00]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucune facture.' : 'No invoices.'}</div>
              </div>
            )}

            {tab === 'returns' && (
              <div className="animate-fade-up">
                <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-6">{t.seller.returns}</h1>
                <div className="card p-6 text-center text-sm text-[#64748b] bg-white"><RotateCcw className="w-10 h-10 text-[#ff7a00]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucun retour en cours.' : 'No returns in progress.'}</div>
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
                  <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Nom de la boutique' : 'Store name'}</label><input defaultValue={user?.fullName} className="input-field" /></div>
                  <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Téléphone' : 'Phone'}</label><input className="input-field" placeholder="+225 07 00 00 00" /></div>
                  <button onClick={() => showToast(locale === 'fr' ? 'Paramètres enregistrés' : 'Settings saved')} className="btn-green px-6 py-2.5 rounded-lg text-sm font-semibold">{t.common.save}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
