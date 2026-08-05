import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { fetchProducts, fetchOrders, fetchAdCampaigns, uploadProductImage, createProduct, createPayoutRequest } from '@/lib/db';
import type { Product, Order, AdCampaign } from '@/lib/db';
import { StatCard, Badge } from '@/components/ui';
import { LayoutDashboard, Package, ShoppingCart, Truck, RotateCcw, Star, CreditCard, Megaphone, BarChart3, Plus, TrendingUp, DollarSign, Users, Clock, CheckCircle, XCircle, MessageSquare, Wallet, FileText, Settings, Bell, Loader2, ImagePlus, Trash2 } from 'lucide-react';

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
  const { t, locale, user, navigate, showToast, categories, setCategories } = useApp();
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

  // Dynamic Category & Subcategory Creation
  const [showNewCatForm, setShowNewCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      showToast(locale === 'fr' ? 'Nom de catégorie requis' : 'Category name required', 'error');
      return;
    }
    setCreatingCat(true);
    const slug = newCatName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).slice(2, 6);
    const parentId = newCatParentId || null;

    try {
      const { data, error } = await supabase.from('categories').insert({
        name: newCatName.trim(),
        parent_id: parentId,
        slug,
        is_active: true,
      }).select('*').single();

      if (error || !data) {
        // Fallback local mock persistence
        const mockNewCat = {
          id: 'cat-' + Date.now(),
          parent_id: parentId,
          name: newCatName.trim(),
          slug,
          is_active: true,
          icon: 'FolderPlus',
          banner_url: null,
          is_featured: false,
          is_trending: false,
          sort_order: 10,
        };
        const updated = [...categories, mockNewCat];
        setCategories(updated);
        setNewProduct((prev) => ({ ...prev, categoryId: mockNewCat.id }));
        showToast(locale === 'fr' ? 'Catégorie créée (Mode Démo / Local)' : 'Category created (Demo / Local Mode)');
      } else {
        const updated = [...categories, data as typeof categories[0]];
        setCategories(updated);
        setNewProduct((prev) => ({ ...prev, categoryId: data.id }));
        showToast(locale === 'fr' ? 'Catégorie créée avec succès' : 'Category created successfully');
      }
      setNewCatName('');
      setNewCatParentId('');
      setShowNewCatForm(false);
    } catch {
      showToast(locale === 'fr' ? 'Erreur lors de la création de la catégorie' : 'Error creating category', 'error');
    } finally {
      setCreatingCat(false);
    }
  };

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
    { id: 'wallet', label: locale === 'fr' ? 'Portefeuille' : 'Wallet', icon: Wallet },
    { id: 'invoices', label: locale === 'fr' ? 'Factures' : 'Invoices', icon: FileText },
    { id: 'subscription', label: t.seller.subscription, icon: CreditCard },
    { id: 'settings', label: locale === 'fr' ? 'Paramètres' : 'Settings', icon: Settings },
  ];

  const plan = user?.sellerPlan || 'starter';
  const planColor = plan === 'enterprise' ? '#0e9f6e' : plan === 'premium' ? '#ff9900' : '#64748b';

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

  const statusColors: Record<string, string> = { pending: '#64748b', confirmed: '#0f172a', preparing: '#ff9900', inTransit: '#3b82f6', delivered: '#22c55e', cancelled: '#ef4444' };

  if (loading) return <div className="bg-[#f7f8fa] min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-[#0e9f6e]/20 border-t-[#0e9f6e] animate-spin" /></div>;

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-60 shrink-0">
            <div className="card p-4 sticky top-20 bg-white">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#e2e8f0]">
                <div className="w-10 h-10 rounded-xl bg-[#0e9f6e] flex items-center justify-center text-white font-bold">
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
                    className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg transition-colors ${tab === item.id ? 'bg-[#0e9f6e]/10 text-[#0e9f6e] font-semibold' : 'text-[#0f172a] hover:bg-[#f7f8fa]'}`}>
                    <item.icon className="w-4 h-4" /> {item.label}
                    {item.id === 'orders' && orders.length > 0 && <span className="ml-auto text-xs bg-[#ff9900] text-white px-1.5 rounded-full font-bold">{orders.length}</span>}
                    {item.id === 'messages' && <span className="ml-auto w-2 h-2 rounded-full bg-[#ff9900]" />}
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
                      <div className="w-12 h-12 rounded-xl bg-[#ff9900]/15 flex items-center justify-center"><Clock className="w-6 h-6 text-[#ff9900]" /></div>
                      <div className="flex-1"><p className="font-semibold text-[#0f172a]">{t.onboarding.pending}</p><p className="text-xs text-[#64748b]">{t.onboarding.submitSuccess}</p></div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                      <div className="flex-1"><p className="font-semibold text-[#0f172a]">{t.onboarding.approved}</p><p className="text-xs text-[#64748b]">{t.home.trust1}</p></div>
                    </>
                  )}
                </div>

                {/* Low stock alerts */}
                {(lowStock.length > 0 || outOfStock.length > 0) && (
                  <div className="card p-5 bg-white">
                    <h3 className="font-semibold text-[#0f172a] mb-3 flex items-center gap-2"><Bell className="w-4 h-4 text-[#ff9900]" /> {locale === 'fr' ? 'Alertes de stock' : 'Stock alerts'}</h3>
                    <div className="space-y-2">
                      {lowStock.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#ff9900]/5">
                          <Package className="w-4 h-4 text-[#ff9900]" />
                          <span className="text-sm text-[#0f172a] flex-1">{p.name}</span>
                          <Badge color="#ff9900">{p.stock} {locale === 'fr' ? 'restants' : 'left'}</Badge>
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
                      <div className="p-6 text-center text-sm text-[#64748b]"><ShoppingCart className="w-8 h-8 text-[#0e9f6e]/30 mx-auto mb-2" />{locale === 'fr' ? 'Aucune commande pour le moment' : 'No orders yet'}</div>
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
                      <div className="sm:col-span-2 premium-card p-4 bg-[#f8fbfa] border-[#0e9f6e]/20 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-[#0f172a] uppercase">{t.seller.category} *</label>
                          <button type="button" onClick={() => setShowNewCatForm(!showNewCatForm)} className="text-xs font-semibold text-[#0e9f6e] hover:underline flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" />
                            {locale === 'fr' ? 'Créer une catégorie ou sous-catégorie' : 'Create category or subcategory'}
                          </button>
                        </div>
                        <select value={newProduct.categoryId} onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })} className="input-field cursor-pointer">
                          <option value="">—</option>
                          {categories.filter((c) => !c.parent_id).map((parent) => (
                            <optgroup key={parent.id} label={parent.name}>
                              <option value={parent.id}>{parent.name} ({locale === 'fr' ? 'Principale' : 'Main'})</option>
                              {categories.filter((sub) => sub.parent_id === parent.id).map((sub) => (
                                <option key={sub.id} value={sub.id}>↳ {sub.name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>

                        {showNewCatForm && (
                          <div className="p-3 border border-[#0e9f6e]/10 bg-white rounded-lg space-y-3 animate-fade-up">
                            <h4 className="text-xs font-bold text-[#0f172a] flex items-center gap-1">
                              <Plus className="w-4 h-4 text-[#0e9f6e]" />
                              {locale === 'fr' ? 'Nouvelle catégorie ou sous-catégorie' : 'New category or subcategory'}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">{locale === 'fr' ? 'Nom de la catégorie' : 'Category Name'}</label>
                                <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Ex: Robes Wax, Objets Sculptés" className="input-field" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">{locale === 'fr' ? 'Catégorie parente (Optionnel)' : 'Parent Category (Optional)'}</label>
                                <select value={newCatParentId} onChange={(e) => setNewCatParentId(e.target.value)} className="input-field cursor-pointer">
                                  <option value="">{locale === 'fr' ? 'Aucune (Catégorie Principale)' : 'None (Main Category)'}</option>
                                  {categories.filter((c) => !c.parent_id).map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={handleCreateCategory} disabled={creatingCat} className="btn-gold text-xs py-1.5 px-4 disabled:opacity-50 flex items-center gap-1">
                                {creatingCat ? (locale === 'fr' ? 'Création...' : 'Creating...') : (locale === 'fr' ? 'Créer' : 'Create')}
                              </button>
                              <button type="button" onClick={() => { setShowNewCatForm(false); setNewCatName(''); setNewCatParentId(''); }} className="btn-cocoa text-xs py-1.5 px-4">
                                {t.common.cancel}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.seller.description}</label><textarea value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="input-field" rows={3} placeholder={locale === 'fr' ? 'Description du produit...' : 'Product description...'} /></div>
                      <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.seller.uploadImages} *</label>
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                        <div onClick={() => fileInputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }} className="border-2 border-dashed border-[#e2e8f0] rounded-xl p-6 text-center hover:border-[#0e9f6e] transition-colors cursor-pointer">
                          {uploading ? (
                            <div className="flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 text-[#0e9f6e] animate-spin" /><p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Envoi en cours...' : 'Uploading...'}</p></div>
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
                                {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-[9px] text-white bg-[#0e9f6e] text-center py-0.5 font-semibold">Main</span>}
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
                    <div className="p-6 text-center text-sm text-[#64748b]"><Package className="w-8 h-8 text-[#0e9f6e]/30 mx-auto mb-2" />{locale === 'fr' ? 'Aucun produit. Ajoutez votre premier produit!' : 'No products. Add your first product!'}</div>
                  ) : products.map((p, i) => (
                    <div key={p.id} className={`flex items-center gap-4 p-4 ${i > 0 ? 'border-t border-[#e2e8f0]' : ''}`}>
                      <img src={p.product_images?.[0]?.image_url || ''} alt={p.name} className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0f172a] truncate">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Star className="w-3 h-3 fill-[#ff9900] text-[#ff9900]" />
                          <span className="text-xs text-[#64748b]">{p.rating} ({p.total_reviews})</span>
                          {p.is_sponsored && <Badge color="#0e9f6e">Sponsored</Badge>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#0f172a]">${p.price}</p>
                        <p className={`text-xs ${p.stock === 0 ? 'text-red-500' : p.stock < 5 ? 'text-[#ff9900]' : 'text-[#64748b]'}`}>{t.seller.stock}: {p.stock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'orders' && (
              <div className="animate-fade-up">
                <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-6">{t.seller.orders}</h1>
                {orders.length === 0 ? (
                  <div className="card p-6 text-center text-sm text-[#64748b] bg-white"><ShoppingCart className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucune commande pour le moment.' : 'No orders yet.'}</div>
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
                          <div className="h-2 rounded-full bg-[#f7f8fa] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#0e9f6e] to-[#0c8a5f]" style={{ width: `${pct}%` }} /></div>
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
                  <div className="card p-6 text-center text-sm text-[#64748b] bg-white"><Megaphone className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucune campagne publicitaire.' : 'No ad campaigns yet.'}</div>
                ) : (
                  <div className="space-y-3">
                    {ads.map((ad) => (
                      <div key={ad.id} className="card p-5 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-[#0f172a]">{ad.name}</p>
                          <Badge color={ad.status === 'active' ? '#22c55e' : ad.status === 'pending' ? '#ff9900' : '#64748b'}>{ad.status}</Badge>
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

            {tab === 'wallet' && (
              <div className="animate-fade-up space-y-6">
                <h1 className="font-display text-2xl font-bold text-[#0f172a]">{locale === 'fr' ? 'Portefeuille' : 'Wallet'}</h1>

                <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-green-800">
                      {locale === 'fr' ? '0% de commission sur les ventes !' : '0% sales commission!'}
                    </p>
                    <p className="text-xs text-green-700 mt-1 leading-relaxed">
                      {locale === 'fr'
                        ? 'Sur Zando, tout l\'argent de vos ventes vous revient directement lors de la transaction. Zando ne prélève aucune commission sur vos ventes. Le seul argent perçu par la plateforme provient de votre abonnement mensuel.'
                        : 'On Zando, all sales revenue goes directly to you during the transaction. Zando takes 0% commission on your sales. The only platform revenue comes from your monthly subscription.'}
                    </p>
                  </div>
                </div>

                <div className="card p-6 bg-gradient-to-br from-[#0e9f6e]/10 to-transparent border-[#0e9f6e]/20">
                  <p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Solde disponible' : 'Available balance'}</p>
                  <p className="text-4xl font-bold text-[#0f172a] mt-2">${totalRevenue.toFixed(2)}</p>
                  <button onClick={async () => {
                    if (!user?.sellerId && !user?.id) return;
                    const sellerId = user.sellerId || user.id;
                    if (totalRevenue <= 0) { showToast(locale === 'fr' ? 'Solde insuffisant' : 'Insufficient balance'); return; }
                    const id = await createPayoutRequest({ sellerId, amount: totalRevenue });
                    showToast(id ? (locale === 'fr' ? 'Demande de paiement envoyée' : 'Payout request submitted') : (locale === 'fr' ? 'Erreur' : 'Error'), id ? 'success' : 'error');
                  }} className="mt-4 btn-green px-6 py-2.5 rounded-lg text-sm font-semibold">{locale === 'fr' ? 'Demander un paiement' : 'Request payout'}</button>
                </div>
              </div>
            )}

            {tab === 'messages' && (
              <div className="animate-fade-up">
                <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-6">{locale === 'fr' ? 'Messages' : 'Messages'}</h1>
                <div className="card p-6 text-center text-sm text-[#64748b] bg-white"><MessageSquare className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucun message.' : 'No messages.'}</div>
              </div>
            )}

            {tab === 'invoices' && (
              <div className="animate-fade-up">
                <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-6">{locale === 'fr' ? 'Factures' : 'Invoices'}</h1>
                <div className="card p-6 text-center text-sm text-[#64748b] bg-white"><FileText className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucune facture.' : 'No invoices.'}</div>
              </div>
            )}

            {tab === 'returns' && (
              <div className="animate-fade-up">
                <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-6">{t.seller.returns}</h1>
                <div className="card p-6 text-center text-sm text-[#64748b] bg-white"><RotateCcw className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucun retour en cours.' : 'No returns in progress.'}</div>
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
                    <div className="card p-6 text-center text-sm text-[#64748b] bg-white sm:col-span-2"><Truck className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucune livraison en cours.' : 'No deliveries in progress.'}</div>
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
