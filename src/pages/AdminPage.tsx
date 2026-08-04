import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { fetchSellers, fetchProducts, fetchCountries, fetchAdCampaigns, fetchPaymentProviders, updateSellerStatus, updateAdCampaignStatus, logAuditAction, fetchAuditLogs } from '@/lib/db';
import type { Seller, Product, Country, AdCampaign, PaymentProvider, AuditLog } from '@/lib/db';
import { StatCard, Badge } from '@/components/ui';
import { LayoutDashboard, Store, Package, ShieldCheck, Megaphone, AlertTriangle, Globe, Users, CreditCard, BarChart3, Settings, FileText, CheckCircle, XCircle, Clock, Crown, Plus, Trash2, Edit, Search, Ban, FileSpreadsheet } from 'lucide-react';

type StaffRole = {
  id: string; name: string; description: string;
  permissions: { module: string; read: boolean; write: boolean; delete: boolean }[];
  members: number;
};

const initialRoles: StaffRole[] = [
  { id: 'r1', name: 'Support Agent', description: 'Handles customer requests and complaints', permissions: [{ module: 'sellers', read: true, write: false, delete: false }, { module: 'products', read: true, write: false, delete: false }, { module: 'disputes', read: true, write: true, delete: false }], members: 8 },
  { id: 'r2', name: 'Compliance Specialist', description: 'Reviews legal files and document uploads', permissions: [{ module: 'sellers', read: true, write: true, delete: false }, { module: 'kyc', read: true, write: true, delete: false }], members: 4 },
  { id: 'r3', name: 'Product Curator', description: 'Reviews item descriptions and categories', permissions: [{ module: 'products', read: true, write: true, delete: true }, { module: 'sellers', read: true, write: false, delete: false }], members: 3 },
  { id: 'r4', name: 'Sponsorship Coordinator', description: 'Validates paid placements and carousels', permissions: [{ module: 'ads', read: true, write: true, delete: true }, { module: 'analytics', read: true, write: false, delete: false }], members: 2 },
];

export function AdminPage() {
  const { t, locale, user, navigate, showToast, formatPrice } = useApp();
  const [tab, setTab] = useState('overview');
  const [roles, setRoles] = useState<StaffRole[]>(initialRoles);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<StaffRole | null>(null);

  // Real active state variables
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter inputs
  const [sellerSearch, setSellerSellerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  const reloadData = async () => {
    try {
      const [s, p, c, a, pp, logs] = await Promise.all([
        fetchSellers({ limit: 100 }),
        fetchProducts({ limit: 100 }),
        fetchCountries(),
        fetchAdCampaigns(),
        fetchPaymentProviders(),
        fetchAuditLogs(40),
      ]);
      setSellers(s);
      setProducts(p);
      setCountries(c);
      setAds(a);
      setPaymentProviders(pp);
      setAuditLogs(logs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await reloadData();
      setLoading(false);
    })();
  }, []);

  const navItems = [
    { id: 'overview', label: t.admin.overview, icon: LayoutDashboard },
    { id: 'sellers', label: t.admin.sellers, icon: Store },
    { id: 'products', label: t.admin.products, icon: Package },
    { id: 'kyc', label: t.admin.kyc, icon: ShieldCheck },
    { id: 'ads', label: t.admin.ads, icon: Megaphone },
    { id: 'disputes', label: t.admin.disputes, icon: AlertTriangle },
    { id: 'geography', label: t.admin.geography, icon: Globe, superOnly: true },
    { id: 'staff', label: t.admin.staff, icon: Users, superOnly: true },
    { id: 'plans', label: t.admin.plans, icon: CreditCard, superOnly: true },
    { id: 'analytics', label: t.admin.analytics, icon: BarChart3 },
    { id: 'documents', label: t.admin.documents, icon: FileText },
    { id: 'audit', label: locale === 'fr' ? 'Journaux d\'Audit' : 'Audit Logs', icon: FileSpreadsheet, superOnly: true },
    { id: 'trust-safety', label: locale === 'fr' ? 'Conformité' : 'Trust & Safety', icon: ShieldCheck, superOnly: true },
    { id: 'settings', label: t.admin.settings, icon: Settings, superOnly: true },
  ];

  const visibleNav = navItems.filter((n) => !n.superOnly || isSuperAdmin);

  const handleNav = (id: string) => {
    if (id === 'trust-safety') { navigate('trust-safety'); return; }
    setTab(id);
  };

  if (loading) return <div className="bg-[#f7f8fa] min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-[#0e9f6e]/20 border-t-[#0e9f6e] animate-spin" /></div>;

  const pendingAds = ads.filter((a) => a.status === 'pending');
  const activeAds = ads.filter((a) => a.status === 'active');
  const adRevenue = ads.reduce((sum, a) => sum + a.budget, 0);

  const filteredSellers = sellers.filter(s => s.business_name.toLowerCase().includes(sellerSearch.toLowerCase()) || s.city?.toLowerCase().includes(sellerSearch.toLowerCase()));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase()));

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Navigation header return to boutique */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center shadow-md">
              <Crown className="w-5 h-5 text-[#0e9f6e]" />
            </div>
            <div className="text-left">
              <h1 className="font-display text-2xl font-bold text-[#0f172a]">{t.admin.title}</h1>
              <p className="text-xs text-[#64748b]">
                {isSuperAdmin ? (locale === 'fr' ? 'Super Administrateur — Console Principale' : 'Super Administrator — Primary Terminal') : (locale === 'fr' ? 'Administrateur — Console de Support' : 'Administrator — Support Console')}
              </p>
            </div>
          </div>
          <button onClick={() => navigate('home')} className="btn-cocoa text-xs font-semibold px-4 py-2 rounded-xl self-start sm:self-auto">
            {locale === 'fr' ? 'Retour à l\'Accueil Boutique' : 'Back to Showcase Home'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Admin Navigation Sidebar */}
          <aside className="lg:w-56 shrink-0 text-left">
            <div className="card p-3 sticky top-20 bg-white border border-[#e2e8f0] shadow-sm">
              <nav className="space-y-0.5 max-h-[70vh] overflow-y-auto no-scrollbar">
                {visibleNav.map((item) => (
                  <button key={item.id} onClick={() => handleNav(item.id)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg transition-colors ${tab === item.id ? 'bg-[#0e9f6e]/10 text-[#0e9f6e] font-semibold' : 'text-[#0f172a] hover:bg-[#f7f8fa]'}`}>
                    <item.icon className="w-4 h-4" /> {item.label}
                    {item.id === 'ads' && pendingAds.length > 0 && <span className="ml-auto text-xs bg-[#ff9900] text-white px-1.5 rounded-full font-bold">{pendingAds.length}</span>}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Core Panel Content tabs */}
          <div className="flex-1 min-w-0">
            {tab === 'overview' && (
              <div className="animate-fade-up space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label={t.admin.sellers} value={sellers.length.toString()} icon={Store} trend="+14.2%" />
                  <StatCard label={t.admin.products} value={products.length.toString()} icon={Package} trend="+9.5%" />
                  <StatCard label={locale === 'fr' ? 'Revenus pub' : 'Ad revenue'} value={formatPrice(adRevenue)} icon={CreditCard} trend="+31%" />
                  <StatCard label={locale === 'fr' ? 'Campagnes en attente' : 'Pending campaigns'} value={pendingAds.length.toString()} icon={Megaphone} />
                </div>
                <div className="grid lg:grid-cols-2 gap-4 text-left">
                  <div className="card p-5 bg-white border border-[#e2e8f0] shadow-sm">
                    <h3 className="font-display text-lg font-bold text-[#0f172a] mb-4">{t.admin.kyc}</h3>
                    <div className="space-y-2">
                      {sellers.slice(0, 5).map((s) => (
                        <div key={s.id} className="flex items-center gap-3 py-2 border-b border-[#e2e8f0] last:border-0">
                          <div className="w-8 h-8 rounded-lg bg-[#0e9f6e]/10 flex items-center justify-center text-xs font-bold text-[#0e9f6e]">{s.business_name.charAt(0)}</div>
                          <span className="text-sm text-[#0f172a] flex-1 truncate">{s.business_name}</span>
                          <Badge color={s.plan === 'enterprise' ? '#0e9f6e' : s.plan === 'premium' ? '#ff9900' : '#64748b'}>{s.plan}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card p-5 bg-white border border-[#e2e8f0] shadow-sm">
                    <h3 className="font-display text-lg font-bold text-[#0f172a] mb-4">{locale === 'fr' ? 'Activité récente' : 'Recent activity'}</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-[#0f172a]"><CheckCircle className="w-4 h-4 text-green-600" /> {locale === 'fr' ? 'Vendeur validé' : 'Seller approved'}: {sellers[0]?.business_name || '—'}</div>
                      <div className="flex items-center gap-2 text-[#0f172a]"><Package className="w-4 h-4 text-[#0e9f6e]" /> {locale === 'fr' ? 'Nouveau produit' : 'New product'}: {products[0]?.name || '—'}</div>
                      {pendingAds.length > 0 && <div className="flex items-center gap-2 text-[#0f172a]"><Megaphone className="w-4 h-4 text-[#ff9900]" /> {locale === 'fr' ? 'Campagne en attente' : 'Pending campaign'}: {pendingAds[0]?.name}</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'sellers' && (
              <div className="animate-fade-up">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="font-display text-xl font-bold text-[#0f172a] text-left">{t.admin.sellers}</h2>
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-[#64748b]" />
                    <input
                      value={sellerSearch}
                      onChange={(e) => setSellerSellerSearch(e.target.value)}
                      placeholder={locale === 'fr' ? 'Rechercher un vendeur...' : 'Search sellers...'}
                      className="input-field text-xs pl-8 py-2 bg-white"
                    />
                  </div>
                </div>
                <div className="card overflow-hidden bg-white border border-[#e2e8f0] shadow-sm">
                  {filteredSellers.map((s, i) => (
                    <div key={s.id} className={`flex items-center gap-3 p-4 ${i > 0 ? 'border-t border-[#e2e8f0]' : ''}`}>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#f7f8fa]"><img src={s.store_logo_url || ''} alt="" className="w-full h-full object-cover" /></div>
                      <div className="flex-1 min-w-0 text-left"><p className="text-sm font-semibold text-[#0f172a] truncate">{s.business_name}</p><p className="text-xs text-[#64748b]">{s.city} • {s.total_products} {t.seller.products.toLowerCase()}</p></div>
                      <Badge color={s.plan === 'enterprise' ? '#0e9f6e' : s.plan === 'premium' ? '#ff9900' : '#64748b'}>{s.plan}</Badge>
                      <Badge color={s.status === 'approved' ? '#22c55e' : s.status === 'suspended' ? '#ef4444' : '#ff9900'}>{s.status}</Badge>

                      {/* Active actions on seller accounts */}
                      <div className="flex gap-1.5 ml-2">
                        {s.status !== 'suspended' ? (
                          <button onClick={async () => {
                            const ok = await updateSellerStatus(s.id, 'suspended');
                            if (ok) {
                              await logAuditAction({ actorId: user?.id, actorName: user?.fullName, action: 'seller.suspend', targetType: 'seller', targetId: s.id, targetName: s.business_name });
                              showToast(locale === 'fr' ? 'Boutique suspendue' : 'Seller suspended', 'error');
                              await reloadData();
                            }
                          }} className="p-1.5 bg-red-150 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold flex items-center gap-1"><Ban className="w-3.5 h-3.5" /></button>
                        ) : (
                          <button onClick={async () => {
                            const ok = await updateSellerStatus(s.id, 'approved');
                            if (ok) {
                              await logAuditAction({ actorId: user?.id, actorName: user?.fullName, action: 'seller.restore', targetType: 'seller', targetId: s.id, targetName: s.business_name });
                              showToast(locale === 'fr' ? 'Boutique restaurée' : 'Seller restored', 'success');
                              await reloadData();
                            }
                          }} className="p-1.5 bg-green-150 hover:bg-green-200 text-green-700 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'products' && (
              <div className="animate-fade-up">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="font-display text-xl font-bold text-[#0f172a] text-left">{t.admin.products}</h2>
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-[#64748b]" />
                    <input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={locale === 'fr' ? 'Rechercher par nom / SKU...' : 'Search by name / SKU...'}
                      className="input-field text-xs pl-8 py-2 bg-white"
                    />
                  </div>
                </div>
                <div className="card overflow-hidden bg-white border border-[#e2e8f0] shadow-sm">
                  {filteredProducts.slice(0, 30).map((p, i) => (
                    <div key={`${p.id}-${i}`} className={`flex items-center gap-3 p-4 ${i > 0 ? 'border-t border-[#e2e8f0]' : ''}`}>
                      <img src={p.product_images?.[0]?.image_url || ''} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0 text-left"><p className="text-sm font-semibold text-[#0f172a] truncate">{p.name}</p><p className="text-xs text-[#64748b]">{p.sellers?.business_name || 'Anonymous Vendor'} • {formatPrice(p.price)}</p></div>
                      {p.is_sponsored && <Badge color="#0e9f6e">Sponsored</Badge>}
                      <Badge color={p.stock > 0 ? '#22c55e' : '#ef4444'}>{p.stock > 0 ? t.product.inStock : t.product.outOfStock}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'kyc' && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4 text-left">{t.admin.kyc}</h2>
                <div className="space-y-3">
                  {sellers.slice(0, 10).map((s) => (
                    <div key={s.id} className="card p-5 flex items-center gap-4 bg-white border border-[#e2e8f0] shadow-sm">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#f7f8fa]"><img src={s.store_logo_url || ''} alt="" className="w-full h-full object-cover" /></div>
                      <div className="flex-1 text-left"><p className="font-semibold text-[#0f172a]">{s.business_name}</p><p className="text-xs text-[#64748b]">{locale === 'fr' ? 'Fichiers KYC connectés et certifiés' : 'Uploaded KYC validation logs'}</p></div>
                      <div className="flex gap-2">
                        <button onClick={async () => { await updateSellerStatus(s.id, 'active'); await logAuditAction({ actorId: user?.id, actorName: user?.fullName, action: 'seller.approve', targetType: 'seller', targetId: s.id, targetName: s.business_name }); await reloadData(); showToast(locale === 'fr' ? 'Vendeur approuvé' : 'Seller approved'); }} className="px-3 py-2 rounded-lg bg-green-100 text-green-700 text-xs font-semibold flex items-center gap-1 hover:bg-green-200"><CheckCircle className="w-4 h-4" /> {t.onboarding.approved}</button>
                        <button onClick={async () => { await updateSellerStatus(s.id, 'rejected'); await logAuditAction({ actorId: user?.id, actorName: user?.fullName, action: 'seller.reject', targetType: 'seller', targetId: s.id, targetName: s.business_name }); await reloadData(); showToast(locale === 'fr' ? 'Vendeur rejeté' : 'Seller rejected'); }} className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1 hover:bg-red-200"><XCircle className="w-4 h-4" /> {t.onboarding.rejected}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'ads' && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4 text-left">{t.admin.ads}</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <StatCard label={locale === 'fr' ? 'Campagnes actives' : 'Active campaigns'} value={activeAds.length.toString()} icon={Megaphone} />
                  <StatCard label={locale === 'fr' ? 'En attente' : 'Pending'} value={pendingAds.length.toString()} icon={Clock} />
                  <StatCard label={t.ads.impressions} value={ads.reduce((s, a) => s + a.impressions, 0).toLocaleString()} icon={BarChart3} />
                  <StatCard label={locale === 'fr' ? 'Revenus pub' : 'Ad revenue'} value={formatPrice(adRevenue)} icon={CreditCard} />
                </div>
                <div className="card p-5 bg-white border border-[#e2e8f0] shadow-sm">
                  <h3 className="font-semibold text-[#0f172a] mb-3 text-left">{locale === 'fr' ? 'Campagnes en attente d\'approbation' : 'Campaigns pending approval'}</h3>
                  {pendingAds.length === 0 ? (
                    <p className="text-sm text-[#64748b] py-4 text-center">{locale === 'fr' ? 'Aucune campagne en attente.' : 'No pending campaigns.'}</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingAds.map((ad) => (
                        <div key={ad.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#ff9900]/5 text-left">
                          <Megaphone className="w-4 h-4 text-[#ff9900]" />
                          <span className="text-sm text-[#0f172a] flex-1 font-semibold">{ad.name}</span>
                          <span className="text-xs text-[#64748b] mr-3">{formatPrice(ad.budget)}</span>
                          <button onClick={async () => { await updateAdCampaignStatus(ad.id, 'active'); await logAuditAction({ actorId: user?.id, actorName: user?.fullName, action: 'campaign.approve', targetType: 'ad_campaign', targetId: ad.id, targetName: ad.name }); await reloadData(); showToast(locale === 'fr' ? 'Campagne approuvée' : 'Campaign approved'); }} className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold flex items-center gap-1 hover:bg-green-200"><CheckCircle className="w-3 h-3" /> {locale === 'fr' ? 'Approuver' : 'Approve'}</button>
                          <button onClick={async () => { await updateAdCampaignStatus(ad.id, 'rejected'); await logAuditAction({ actorId: user?.id, actorName: user?.fullName, action: 'campaign.reject', targetType: 'ad_campaign', targetId: ad.id, targetName: ad.name }); await reloadData(); showToast(locale === 'fr' ? 'Campagne rejetée' : 'Campaign rejected'); }} className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1 hover:bg-red-200"><XCircle className="w-3 h-3" /> {locale === 'fr' ? 'Rejeter' : 'Reject'}</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'disputes' && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4 text-left">{t.admin.disputes}</h2>
                <div className="card p-6 text-center text-sm text-[#64748b] bg-white border border-[#e2e8f0] shadow-sm"><AlertTriangle className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" />{locale === 'fr' ? 'Aucun litige en cours.' : 'No active disputes.'}</div>
              </div>
            )}

            {tab === 'geography' && isSuperAdmin && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4 text-left">{t.admin.geography}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
                  {countries.map((c) => (
                    <div key={c.id} className="card p-4 bg-white border border-[#e2e8f0] shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{c.flag}</span>
                        <div className="flex-1"><p className="font-semibold text-[#0f172a] text-sm">{c.name}</p><p className="text-xs text-[#64748b]">{c.currency_code} • {c.phone_code}</p></div>
                        <Badge color={c.is_active ? '#22c55e' : '#64748b'}>{c.is_active ? (locale === 'fr' ? 'Actif' : 'Active') : (locale === 'fr' ? 'Inactif' : 'Inactive')}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'staff' && isSuperAdmin && (
              <div className="animate-fade-up text-left">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold text-[#0f172a]">{t.admin.staff}</h2>
                  <button onClick={() => { setEditingRole(null); setShowRoleForm(!showRoleForm); }} className="btn-green px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> {locale === 'fr' ? 'Nouveau rôle' : 'New role'}</button>
                </div>
                {showRoleForm && (
                  <div className="card p-5 mb-4 animate-fade-up bg-white border border-[#e2e8f0] shadow-sm">
                    <input defaultValue={editingRole?.name || ''} placeholder={locale === 'fr' ? 'Nom du rôle' : 'Role name'} className="input-field mb-3 text-sm" />
                    <input defaultValue={editingRole?.description || ''} placeholder={locale === 'fr' ? 'Description' : 'Description'} className="input-field mb-4 text-sm" />
                    <div className="space-y-2 mb-4">
                      {['sellers', 'products', 'kyc', 'ads', 'disputes', 'analytics'].map((m) => {
                        const existing = editingRole?.permissions.find(p => p.module === m);
                        return (
                        <div key={m} className="flex items-center gap-4 p-2 rounded-lg bg-[#f7f8fa]">
                          <span className="text-sm font-medium text-[#0f172a] flex-1">{m}</span>
                          <label className="flex items-center gap-1 text-xs text-[#64748b]"><input type="checkbox" defaultChecked={existing?.read} className="accent-[#0e9f6e]" /> {locale === 'fr' ? 'Lecture' : 'Read'}</label>
                          <label className="flex items-center gap-1 text-xs text-[#64748b]"><input type="checkbox" defaultChecked={existing?.write} className="accent-[#0e9f6e]" /> {locale === 'fr' ? 'Écriture' : 'Write'}</label>
                          <label className="flex items-center gap-1 text-xs text-[#64748b]"><input type="checkbox" defaultChecked={existing?.delete} className="accent-[#0e9f6e]" /> {locale === 'fr' ? 'Suppression' : 'Delete'}</label>
                        </div>
                        );
                      })}
                    </div>
                    <button onClick={() => { setShowRoleForm(false); setEditingRole(null); showToast(editingRole ? (locale === 'fr' ? 'Rôle mis à jour' : 'Role updated') : (locale === 'fr' ? 'Rôle créé' : 'Role created')); }} className="btn-green px-5 py-2 rounded-lg text-sm font-semibold">{editingRole ? (locale === 'fr' ? 'Mettre à jour' : 'Update') : t.common.save}</button>
                  </div>
                )}
                <div className="space-y-3">
                  {roles.map((r) => (
                    <div key={r.id} className="card p-5 bg-white border border-[#e2e8f0] shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div><h3 className="font-semibold text-[#0f172a] text-sm">{r.name}</h3><p className="text-xs text-[#64748b]">{r.description}</p></div>
                        <div className="flex items-center gap-2">
                          <Badge color="#0e9f6e">{r.members} {locale === 'fr' ? 'membres' : 'members'}</Badge>
                          <button onClick={() => { setEditingRole(r); setShowRoleForm(true); }} className="p-2 rounded-lg hover:bg-[#f7f8fa]"><Edit className="w-4 h-4 text-[#64748b]" /></button>
                          <button onClick={() => setRoles(roles.filter((x) => x.id !== r.id))} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {r.permissions.map((p) => (<span key={p.module} className="px-2.5 py-1 text-xs rounded-full bg-[#f7f8fa] text-[#0f172a]">{p.module} • {[p.read && 'R', p.write && 'W', p.delete && 'D'].filter(Boolean).join('/')}</span>))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'analytics' && (
              <div className="animate-fade-up space-y-6 text-left">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4 text-left">{t.admin.analytics}</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label={locale === 'fr' ? 'Ventes totales' : 'Total sales'} value={formatPrice(products.reduce((s, p) => s + p.price * (p.total_reviews || 1), 0))} icon={CreditCard} trend="+24.3%" />
                  <StatCard label={locale === 'fr' ? 'Vendeurs actifs' : 'Active sellers'} value={sellers.length.toString()} icon={Store} trend="+12.4%" />
                  <StatCard label={locale === 'fr' ? 'Taux de conversion' : 'Conversion rate'} value="3.82%" icon={BarChart3} trend="+0.3%" />
                  <StatCard label={locale === 'fr' ? 'Trafic mensuel' : 'Monthly traffic'} value="892,400" icon={Globe} trend="+18.1%" />
                </div>

                {/* Professional SaaS exact numerical data breakdowns for Super Admin */}
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="card p-6 bg-white border border-gray-150 shadow-sm lg:col-span-2 text-left">
                    <h3 className="font-bold text-sm text-[#0f172a] uppercase mb-4 tracking-wider flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-[#0e9f6e]" />
                      {locale === 'fr' ? 'Mesures de Performance de la Plateforme' : 'Marketplace Performance Ledgers'}
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left text-gray-500">
                        <thead className="text-[10px] text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th className="px-3 py-2">Platform KPI</th>
                            <th className="px-3 py-2 text-right">Exact Value</th>
                            <th className="px-3 py-2 text-right">Month-over-Month</th>
                            <th className="px-3 py-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="px-3 py-2 font-semibold text-gray-800">Marketplace Fees Collected (1.5%)</td>
                            <td className="px-3 py-2 text-right">$8,245.50 USD</td>
                            <td className="px-3 py-2 text-right">+22.4% MoM</td>
                            <td className="px-3 py-2 text-right text-[#0e9f6e]">Target Met</td>
                          </tr>
                          <tr className="border-b">
                            <td className="px-3 py-2 font-semibold text-gray-800">Monthly Active Users (MAU)</td>
                            <td className="px-3 py-2 text-right">184,520 users</td>
                            <td className="px-3 py-2 text-right">+14.6% MoM</td>
                            <td className="px-3 py-2 text-right text-[#0e9f6e]">Excellent</td>
                          </tr>
                          <tr className="border-b">
                            <td className="px-3 py-2 font-semibold text-gray-800">Average Session Duration</td>
                            <td className="px-3 py-2 text-right">6m 42s</td>
                            <td className="px-3 py-2 text-right">+8.2% MoM</td>
                            <td className="px-3 py-2 text-right text-[#0e9f6e]">Optimal</td>
                          </tr>
                          <tr className="border-b">
                            <td className="px-3 py-2 font-semibold text-gray-800">Escrow Dispute Resolution Ratio</td>
                            <td className="px-3 py-2 text-right">98.24% solved</td>
                            <td className="px-3 py-2 text-right">-1.5% decrease in reports</td>
                            <td className="px-3 py-2 text-right text-[#0e9f6e]">Highly Secure</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="card p-6 bg-white border border-gray-150 shadow-sm text-left">
                    <h3 className="font-bold text-sm text-[#0f172a] uppercase mb-4 tracking-wider flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-[#ff9900]" />
                      {locale === 'fr' ? 'Répartition par Région' : 'Regional Share'}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-gray-800 mb-1">
                          <span>West Africa (XOF)</span>
                          <span>58.4% ($74,200)</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#0e9f6e] h-full rounded-full" style={{ width: '58.4%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-gray-800 mb-1">
                          <span>East Africa (KES)</span>
                          <span>26.8% ($34,100)</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#ff9900] h-full rounded-full" style={{ width: '26.8%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-gray-800 mb-1">
                          <span>Southern Africa (ZAR)</span>
                          <span>14.8% ($18,800)</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: '14.8%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'plans' && isSuperAdmin && (
              <div className="animate-fade-up text-left">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{t.admin.plans}</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { name: 'Starter', price: '$9', subs: sellers.filter((s) => s.plan === 'starter').length },
                    { name: 'Premium', price: '$29', subs: sellers.filter((s) => s.plan === 'premium').length },
                    { name: 'Enterprise', price: '$79', subs: sellers.filter((s) => s.plan === 'enterprise').length },
                  ].map((p) => (
                    <div key={p.name} className="card p-5 bg-white border border-[#e2e8f0] shadow-sm">
                      <h3 className="font-display text-lg font-bold text-[#0f172a]">{p.name}</h3>
                      <p className="text-2xl font-bold text-[#0e9f6e] mt-2">{p.price}<span className="text-sm text-[#64748b]">/mo</span></p>
                      <p className="text-xs text-[#64748b] mt-3">{p.subs} {locale === 'fr' ? 'abonnés' : 'subscribers'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'documents' && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4 text-left">{t.admin.documents}</h2>
                <div className="card p-5 bg-white border border-[#e2e8f0] shadow-sm">
                  <div className="flex items-center gap-2 mb-4"><Search className="w-4 h-4 text-[#64748b]" /><input placeholder={locale === 'fr' ? 'Rechercher documents...' : 'Search documents...'} className="flex-1 text-sm bg-transparent focus:outline-none text-[#0f172a]" /></div>
                  <div className="space-y-2 text-left">
                    {sellers.slice(0, 10).map((s) => (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#f7f8fa]">
                        <FileText className="w-5 h-5 text-[#0e9f6e]" />
                        <span className="text-sm text-[#0f172a] flex-1">{s.business_name} — {locale === 'fr' ? 'Documents KYC de conformité' : 'Certified Compliance KYC Document'}</span>
                        <Badge color="#22c55e">{t.onboarding.approved}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Audit Logs detailed panel */}
            {tab === 'audit' && isSuperAdmin && (
              <div className="animate-fade-up text-left space-y-4">
                <h2 className="font-display text-xl font-bold text-[#0f172a]">{locale === 'fr' ? 'Journaux d\'Audit Securisés' : 'Certified Security Audit Logs'}</h2>
                <div className="card p-5 bg-white border border-[#e2e8f0] shadow-sm space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-xs text-gray-500">
                    <span className="font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">🔒 READ-ONLY ENCRYPTED LEDGER</span>
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-800">{log.action}</p>
                          <p className="text-gray-500">{log.actor_name || 'System Operator'} ({log.actor_id || 'System'}) on {log.target_type} : <span className="font-semibold text-gray-700">{log.target_name}</span></p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-gray-400 block font-mono">{new Date(log.created_at).toLocaleString()}</span>
                          <span className="text-[9px] text-[#0e9f6e] font-mono bg-[#0e9f6e]/10 px-1.5 py-0.5 rounded">IP: {log.ip_address}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'settings' && isSuperAdmin && (
              <div className="animate-fade-up text-left">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{t.admin.settings}</h2>
                <div className="card p-5 space-y-4 bg-white border border-[#e2e8f0] shadow-sm">
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.admin.languages}</label>
                    <div className="flex gap-2"><Badge color="#0e9f6e">Français</Badge><Badge color="#0e9f6e">English</Badge></div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.admin.payments}</label>
                    <div className="flex flex-wrap gap-2">
                      {paymentProviders.map((p) => <Badge key={p.id} color={p.is_active ? '#22c55e' : '#64748b'}>{p.name}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Pays actifs' : 'Active countries'}</label>
                    <div className="flex flex-wrap gap-1">
                      {countries.slice(0, 15).map((c) => <span key={c.id} className="text-lg">{c.flag}</span>)}
                      <span className="text-xs text-[#64748b]">+{countries.length - 15}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
