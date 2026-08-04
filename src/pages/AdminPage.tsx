import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { fetchSellers, fetchProducts, fetchCountries, fetchAdCampaigns, fetchPaymentProviders, fetchOrders, fetchComplianceReports, updateSellerStatus, updateAdCampaignStatus, logAuditAction } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import type { Seller, Product, Country, AdCampaign, PaymentProvider, Order, ComplianceReport } from '@/lib/db';
import { StatCard, Badge } from '@/components/ui';
import { LayoutDashboard, Store, Package, ShieldCheck, Megaphone, AlertTriangle, Globe, Users, CreditCard, BarChart3, Settings, FileText, CheckCircle, XCircle, Clock, Crown, Plus, Trash2, Edit, Search, ChevronRight, ArrowLeft, UserPlus, MessageSquare, ToggleLeft, ToggleRight, PackageCheck, ShoppingBag, TrendingUp, DollarSign, Eye } from 'lucide-react';

type StaffRole = {
  id: string; name: string; description: string;
  permissions: { module: string; read: boolean; write: boolean; delete: boolean }[];
  members: number;
};

const initialRoles: StaffRole[] = [
  { id: 'r1', name: 'Support', description: 'Customer support agents', permissions: [{ module: 'sellers', read: true, write: false, delete: false }, { module: 'products', read: true, write: false, delete: false }, { module: 'disputes', read: true, write: true, delete: false }], members: 8 },
  { id: 'r2', name: 'KYC Verifier', description: 'Verify seller documents', permissions: [{ module: 'sellers', read: true, write: true, delete: false }, { module: 'kyc', read: true, write: true, delete: false }], members: 4 },
  { id: 'r3', name: 'Product Moderator', description: 'Moderate product listings', permissions: [{ module: 'products', read: true, write: true, delete: true }, { module: 'sellers', read: true, write: false, delete: false }], members: 3 },
  { id: 'r4', name: 'Ads Manager', description: 'Manage ad slots and campaigns', permissions: [{ module: 'ads', read: true, write: true, delete: true }, { module: 'analytics', read: true, write: false, delete: false }], members: 2 },
];

export function AdminPage() {
  const { t, locale, user, navigate, showToast } = useApp();
  const [tab, setTab] = useState('overview');
  const [roles, setRoles] = useState<StaffRole[]>(initialRoles);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<StaffRole | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [superAdmins, setSuperAdmins] = useState<{ id: string; email: string; full_name: string | null; is_active: boolean }[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [reviewsEnabled, setReviewsEnabled] = useState(true);
  const [reviewsConfirmedOnly, setReviewsConfirmedOnly] = useState(true);
  const [productApprovalRequired, setProductApprovalRequired] = useState(true);
  const [guestCheckoutEnabled, setGuestCheckoutEnabled] = useState(true);

  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => {
    (async () => {
      try {
        const [s, p, c, a, pp] = await Promise.all([
          fetchSellers({ limit: 50 }),
          fetchProducts({ limit: 50 }),
          fetchCountries(),
          fetchAdCampaigns(),
          fetchPaymentProviders(),
        ]);
        setSellers(s); setProducts(p); setCountries(c); setAds(a); setPaymentProviders(pp);
        const [ords, reports] = await Promise.all([
          fetchOrders(),
          fetchComplianceReports(),
        ]);
        setOrders(ords); setComplianceReports(reports);
        const { data: sa } = await supabase.from('super_admins').select('*').eq('is_active', true);
        if (sa) setSuperAdmins(sa as typeof superAdmins);
        const { data: settings } = await supabase.from('platform_settings').select('key, value');
        if (settings) {
          for (const row of settings) {
            const val = (row.value as { value?: unknown }).value;
            if (row.key === 'reviews_enabled') setReviewsEnabled(val as boolean);
            if (row.key === 'reviews_confirmed_buyers_only') setReviewsConfirmedOnly(val as boolean);
            if (row.key === 'product_approval_required') setProductApprovalRequired(val as boolean);
            if (row.key === 'guest_checkout_enabled') setGuestCheckoutEnabled(val as boolean);
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const navItems = [
    { id: 'overview', label: t.admin.overview, icon: LayoutDashboard },
    { id: 'orders', label: locale === 'fr' ? 'Commandes' : 'Orders', icon: ShoppingBag },
    { id: 'sellers', label: t.admin.sellers, icon: Store },
    { id: 'products', label: t.admin.products, icon: Package },
    { id: 'product-approval', label: locale === 'fr' ? 'Approbation produits' : 'Product Approval', icon: PackageCheck, superOnly: true },
    { id: 'kyc', label: t.admin.kyc, icon: ShieldCheck },
    { id: 'ads', label: t.admin.ads, icon: Megaphone },
    { id: 'disputes', label: t.admin.disputes, icon: AlertTriangle },
    { id: 'payouts', label: locale === 'fr' ? 'Paiements vendeurs' : 'Seller payouts', icon: DollarSign, superOnly: true },
    { id: 'geography', label: t.admin.geography, icon: Globe, superOnly: true },
    { id: 'staff', label: t.admin.staff, icon: Users, superOnly: true },
    { id: 'plans', label: t.admin.plans, icon: CreditCard, superOnly: true },
    { id: 'analytics', label: t.admin.analytics, icon: BarChart3 },
    { id: 'documents', label: t.admin.documents, icon: FileText },
    { id: 'trust-safety', label: locale === 'fr' ? 'Conformité' : 'Trust & Safety', icon: ShieldCheck, superOnly: true },
    { id: 'super-admins', label: locale === 'fr' ? 'Super Admins' : 'Super Admins', icon: Crown, superOnly: true },
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
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const openReports = complianceReports.filter((r) => r.status === 'open');
  const filteredSellers = sellerFilter === 'all' ? sellers : sellers.filter((s) => s.status === sellerFilter);
  const pendingSellers = sellers.filter((s) => s.status === 'pending');
  const pendingProducts = products.filter((p) => !(p as Record<string, unknown>).approval_status || (p as Record<string, unknown>).approval_status === 'pending');

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="premium-card mb-6 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0f172a] flex items-center justify-center soft-glow"><Crown className="w-5 h-5 text-[#0e9f6e]" /></div>
            <div><h1 className="font-display text-2xl font-bold text-[#0f172a]">{t.admin.title}</h1><p className="text-xs text-[#64748b]">{isSuperAdmin ? (locale === 'fr' ? 'Super Admin — accès total' : 'Super Admin — full access') : (locale === 'fr' ? 'Admin — accès limité' : 'Admin — limited access')}</p></div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-56 shrink-0">
            <div className="premium-card p-3 sticky top-20 rounded-2xl bg-white/90">
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

          <div className="flex-1 min-w-0">
            {/* Breadcrumb */}
            {tab !== 'overview' && (
              <div className="flex items-center gap-2 mb-4 animate-fade-up">
                <button onClick={() => setTab('overview')} className="text-xs text-[#64748b] hover:text-[#0e9f6e] flex items-center gap-1 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> {t.admin.overview}
                </button>
                <ChevronRight className="w-3 h-3 text-[#cbd5e1]" />
                <span className="text-xs font-semibold text-[#0f172a]">{visibleNav.find((n) => n.id === tab)?.label || tab}</span>
              </div>
            )}
            {tab === 'overview' && (
              <div className="animate-fade-up space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label={locale === 'fr' ? 'Revenu total' : 'Total revenue'} value={`${totalRevenue.toFixed(0)}`} icon={DollarSign} trend={orders.length > 0 ? `+${orders.length}` : ''} />
                  <StatCard label={locale === 'fr' ? 'Commandes' : 'Orders'} value={orders.length.toString()} icon={ShoppingBag} trend={pendingOrders.length > 0 ? `${pendingOrders.length} ${locale === 'fr' ? 'en attente' : 'pending'}` : ''} />
                  <StatCard label={t.admin.sellers} value={sellers.length.toString()} icon={Store} trend={pendingSellers.length > 0 ? `${pendingSellers.length} ${locale === 'fr' ? 'en attente' : 'pending'}` : ''} />
                  <StatCard label={t.admin.products} value={products.length.toString()} icon={Package} trend={pendingProducts.length > 0 ? `${pendingProducts.length} ${locale === 'fr' ? 'en attente' : 'pending'}` : ''} />
                </div>
                <div className="grid lg:grid-cols-3 gap-4">
                  <div className="premium-card p-5 bg-white/90 rounded-2xl">
                    <h3 className="font-display text-sm font-bold text-[#0f172a] mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-[#ff9900]" /> {locale === 'fr' ? "File d'approbation" : 'Approval queue'}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#ff9900]/5"><span className="text-xs text-[#0f172a]">{locale === 'fr' ? 'Vendeurs en attente' : 'Pending sellers'}</span><Badge color="#ff9900">{pendingSellers.length}</Badge></div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#ff9900]/5"><span className="text-xs text-[#0f172a]">{locale === 'fr' ? 'Produits en attente' : 'Pending products'}</span><Badge color="#ff9900">{pendingProducts.length}</Badge></div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#ff9900]/5"><span className="text-xs text-[#0f172a]">{locale === 'fr' ? 'Campagnes en attente' : 'Pending campaigns'}</span><Badge color="#ff9900">{pendingAds.length}</Badge></div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-red-50"><span className="text-xs text-[#0f172a]">{locale === 'fr' ? 'Litiges ouverts' : 'Open disputes'}</span><Badge color="#ef4444">{openReports.length}</Badge></div>
                    </div>
                  </div>
                  <div className="premium-card p-5 bg-white/90 rounded-2xl">
                    <h3 className="font-display text-sm font-bold text-[#0f172a] mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#0e9f6e]" /> {locale === 'fr' ? 'Dernières commandes' : 'Latest orders'}</h3>
                    <div className="space-y-2">
                      {orders.slice(0, 5).map((o) => (
                        <div key={o.id} className="flex items-center gap-2 py-1.5 border-b border-[#e2e8f0] last:border-0">
                          <span className="text-xs font-mono text-[#64748b]">{o.tracking_id || o.id.slice(0, 8)}</span>
                          <span className="text-xs text-[#0f172a] flex-1 truncate">{o.sellers?.business_name || '—'}</span>
                          <span className="text-xs font-semibold text-[#0f172a]">${Number(o.total).toFixed(0)}</span>
                          <Badge color={o.status === 'delivered' ? '#22c55e' : o.status === 'pending' ? '#ff9900' : '#64748b'}>{o.status}</Badge>
                        </div>
                      ))}
                      {orders.length === 0 && <p className="text-xs text-[#64748b] text-center py-4">{locale === 'fr' ? 'Aucune commande' : 'No orders yet'}</p>}
                    </div>
                  </div>
                  <div className="premium-card p-5 bg-white/90 rounded-2xl">
                    <h3 className="font-display text-sm font-bold text-[#0f172a] mb-3 flex items-center gap-2"><Store className="w-4 h-4 text-[#0e9f6e]" /> {locale === 'fr' ? 'Top vendeurs' : 'Top sellers'}</h3>
                    <div className="space-y-2">
                      {sellers.slice(0, 5).map((s) => (
                        <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-[#e2e8f0] last:border-0">
                          <div className="w-6 h-6 rounded bg-[#0e9f6e]/10 flex items-center justify-center text-xs font-bold text-[#0e9f6e]">{s.business_name.charAt(0)}</div>
                          <span className="text-xs text-[#0f172a] flex-1 truncate">{s.business_name}</span>
                          <span className="text-xs text-[#64748b]">{s.total_products} {locale === 'fr' ? 'prod' : 'prod'}</span>
                          <Badge color={s.plan === 'enterprise' ? '#0e9f6e' : s.plan === 'premium' ? '#ff9900' : '#64748b'}>{s.plan}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'orders' && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{locale === 'fr' ? 'Gestion des commandes' : 'Orders Management'}</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <StatCard label={locale === 'fr' ? 'Total' : 'Total'} value={orders.length.toString()} icon={ShoppingBag} />
                  <StatCard label={locale === 'fr' ? 'En attente' : 'Pending'} value={pendingOrders.length.toString()} icon={Clock} />
                  <StatCard label={locale === 'fr' ? 'Livrées' : 'Delivered'} value={deliveredOrders.length.toString()} icon={CheckCircle} />
                  <StatCard label={locale === 'fr' ? 'Revenu' : 'Revenue'} value={`${totalRevenue.toFixed(0)}`} icon={DollarSign} />
                </div>
                <div className="card overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#f7f8fa] text-xs text-[#64748b] uppercase">
                        <tr>
                          <th className="text-left px-4 py-3">{locale === 'fr' ? 'Suivi' : 'Tracking'}</th>
                          <th className="text-left px-4 py-3">{locale === 'fr' ? 'Vendeur' : 'Seller'}</th>
                          <th className="text-left px-4 py-3">{locale === 'fr' ? 'Total' : 'Total'}</th>
                          <th className="text-left px-4 py-3">{locale === 'fr' ? 'Paiement' : 'Payment'}</th>
                          <th className="text-left px-4 py-3">{locale === 'fr' ? 'Statut' : 'Status'}</th>
                          <th className="text-left px-4 py-3">{locale === 'fr' ? 'Date' : 'Date'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 30).map((o) => (
                          <tr key={o.id} className="border-t border-[#e2e8f0] hover:bg-[#f7f8fa]">
                            <td className="px-4 py-3 font-mono text-xs text-[#64748b]">{o.tracking_id || o.id.slice(0, 8)}</td>
                            <td className="px-4 py-3 text-[#0f172a] truncate max-w-32">{o.sellers?.business_name || '—'}</td>
                            <td className="px-4 py-3 font-semibold text-[#0f172a]">${Number(o.total).toFixed(2)}</td>
                            <td className="px-4 py-3 text-xs text-[#64748b]">{o.payment_method || '—'}</td>
                            <td className="px-4 py-3"><Badge color={o.status === 'delivered' ? '#22c55e' : o.status === 'pending' ? '#ff9900' : o.status === 'cancelled' ? '#ef4444' : '#64748b'}>{o.status}</Badge></td>
                            <td className="px-4 py-3 text-xs text-[#64748b]">{new Date(o.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {orders.length === 0 && <p className="text-sm text-[#64748b] text-center py-8">{locale === 'fr' ? 'Aucune commande pour le moment.' : 'No orders yet.'}</p>}
                </div>
              </div>
            )}

            {tab === 'sellers' && (
              <div className="animate-fade-up">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold text-[#0f172a]">{t.admin.sellers}</h2>
                  <div className="flex gap-1.5">
                    {['all', 'pending', 'approved', 'rejected', 'suspended'].map((f) => (
                      <button key={f} onClick={() => setSellerFilter(f)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${sellerFilter === f ? 'bg-[#0f172a] text-white' : 'bg-[#f7f8fa] text-[#64748b] hover:bg-[#e2e8f0]'}`}>{f === 'all' ? (locale === 'fr' ? 'Tous' : 'All') : f}</button>
                    ))}
                  </div>
                </div>
                <div className="card overflow-hidden bg-white">
                  {filteredSellers.map((s, i) => (
                    <div key={s.id} className={`flex items-center gap-3 p-4 ${i > 0 ? 'border-t border-[#e2e8f0]' : ''}`}>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#f7f8fa] shrink-0"><img src={s.store_logo_url || ''} alt="" className="w-full h-full object-cover" /></div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[#0f172a] truncate">{s.business_name}</p><p className="text-xs text-[#64748b]">{s.city} • {s.total_products} {t.seller.products.toLowerCase()} • {locale === 'fr' ? 'Note' : 'Rating'}: {s.rating.toFixed(1)}</p></div>
                      <Badge color={s.plan === 'enterprise' ? '#0e9f6e' : s.plan === 'premium' ? '#ff9900' : '#64748b'}>{s.plan}</Badge>
                      <Badge color={s.status === 'approved' ? '#22c55e' : s.status === 'pending' ? '#ff9900' : s.status === 'rejected' ? '#ef4444' : '#64748b'}>{s.status}</Badge>
                      {s.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={async () => { await updateSellerStatus(s.id, 'approved'); await logAuditAction({ actorId: user?.id, actorName: user?.fullName, action: 'seller.approve', targetType: 'seller', targetId: s.id, targetName: s.business_name }); setSellers(sellers.map(x => x.id === s.id ? { ...x, status: 'approved' as const } : x)); showToast(locale === 'fr' ? 'Vendeur approuv\u00e9' : 'Seller approved'); }} className="p-2 rounded-lg bg-green-100 hover:bg-green-200"><CheckCircle className="w-4 h-4 text-green-700" /></button>
                          <button onClick={async () => { await updateSellerStatus(s.id, 'rejected'); await logAuditAction({ actorId: user?.id, actorName: user?.fullName, action: 'seller.reject', targetType: 'seller', targetId: s.id, targetName: s.business_name }); setSellers(sellers.map(x => x.id === s.id ? { ...x, status: 'rejected' as const } : x)); showToast(locale === 'fr' ? 'Vendeur rejet\u00e9' : 'Seller rejected'); }} className="p-2 rounded-lg bg-red-100 hover:bg-red-200"><XCircle className="w-4 h-4 text-red-700" /></button>
                        </div>
                      )}
                      {s.status === 'approved' && (
                        <button onClick={async () => { await updateSellerStatus(s.id, 'suspended'); await logAuditAction({ actorId: user?.id, actorName: user?.fullName, action: 'seller.suspend', targetType: 'seller', targetId: s.id, targetName: s.business_name }); setSellers(sellers.map(x => x.id === s.id ? { ...x, status: 'suspended' as const } : x)); showToast(locale === 'fr' ? 'Vendeur suspendu' : 'Seller suspended'); }} className="p-2 rounded-lg hover:bg-red-50"><AlertTriangle className="w-4 h-4 text-red-500" /></button>
                      )}
                    </div>
                  ))}
                  {filteredSellers.length === 0 && <p className="text-sm text-[#64748b] text-center py-8">{locale === 'fr' ? 'Aucun vendeur.' : 'No sellers.'}</p>}
                </div>
              </div>
            )}

            {tab === 'products' && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{t.admin.products}</h2>
                <div className="card overflow-hidden bg-white">
                  {products.slice(0, 20).map((p, i) => (
                    <div key={p.id} className={`flex items-center gap-3 p-4 ${i > 0 ? 'border-t border-[#e2e8f0]' : ''}`}>
                      <img src={p.product_images?.[0]?.image_url || ''} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[#0f172a] truncate">{p.name}</p><p className="text-xs text-[#64748b]">{p.sellers?.business_name} • ${p.price}</p></div>
                      {p.is_sponsored && <Badge color="#0e9f6e">Sponsored</Badge>}
                      <Badge color={p.stock > 0 ? '#22c55e' : '#ef4444'}>{p.stock > 0 ? t.product.inStock : t.product.outOfStock}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'product-approval' && isSuperAdmin && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{locale === 'fr' ? 'Approbation des produits' : 'Product Approval'}</h2>
                <div className="card p-4 mb-4 bg-[#ff9900]/5 flex items-center gap-3">
                  <PackageCheck className="w-5 h-5 text-[#ff9900]" />
                  <p className="text-sm text-[#0f172a]">{locale === 'fr' ? 'Les produits doivent être approuvés avant d\u00eatre mis en ligne. Approuvez ou rejetez les produits ci-dessous.' : 'Products must be approved before going live. Approve or reject products below.'}</p>
                </div>
                <div className="space-y-3">
                  {products.filter((p) => !(p as Record<string, unknown>).approval_status || (p as Record<string, unknown>).approval_status === 'pending').slice(0, 20).map((p) => (
                    <div key={p.id} className="card p-4 flex items-center gap-4 bg-white">
                      <img src={p.product_images?.[0]?.image_url || ''} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0f172a] truncate">{p.name}</p>
                        <p className="text-xs text-[#64748b]">{p.sellers?.business_name} • ${p.price} • {p.sellers?.city}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={async () => { await supabase.from('products').update({ approval_status: 'approved' }).eq('id', p.id); await logAuditAction({ actorId: user?.id, actorName: user?.fullName, action: 'product.approve', targetType: 'product', targetId: p.id, targetName: p.name }); setProducts(products.map(x => x.id === p.id ? { ...x, ...{ approval_status: 'approved' } } as Product : x)); showToast(locale === 'fr' ? 'Produit approuvé' : 'Product approved'); }} className="px-3 py-2 rounded-lg bg-green-100 text-green-700 text-xs font-semibold flex items-center gap-1 hover:bg-green-200"><CheckCircle className="w-4 h-4" /> {locale === 'fr' ? 'Approuver' : 'Approve'}</button>
                        <button onClick={async () => { await supabase.from('products').update({ approval_status: 'rejected' }).eq('id', p.id); await logAuditAction({ actorId: user?.id, actorName: user?.fullName, action: 'product.reject', targetType: 'product', targetId: p.id, targetName: p.name }); setProducts(products.map(x => x.id === p.id ? { ...x, ...{ approval_status: 'rejected' } } as Product : x)); showToast(locale === 'fr' ? 'Produit rejeté' : 'Product rejected'); }} className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1 hover:bg-red-200"><XCircle className="w-4 h-4" /> {locale === 'fr' ? 'Rejeter' : 'Reject'}</button>
                      </div>
                    </div>
                  ))}
                  {products.filter((p) => !(p as Record<string, unknown>).approval_status || (p as Record<string, unknown>).approval_status === 'pending').length === 0 && (
                    <div className="card p-8 text-center bg-white"><PackageCheck className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" /><p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Aucun produit en attente d\u00e0 approbation.' : 'No products pending approval.'}</p></div>
                  )}
                </div>
              </div>
            )}

            {tab === 'super-admins' && isSuperAdmin && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{locale === 'fr' ? 'Gestion des Super Admins' : 'Super Admin Management'}</h2>
                <div className="card p-5 mb-4 bg-white">
                  <h3 className="font-semibold text-[#0f172a] mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4 text-[#0e9f6e]" /> {locale === 'fr' ? 'Ajouter un Super Admin' : 'Add Super Admin'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <input value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} placeholder={locale === 'fr' ? 'Nom complet' : 'Full name'} className="input-field" />
                    <input value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} placeholder="email@example.com" className="input-field" />
                    <button onClick={async () => {
                      if (!newAdminEmail) { showToast(locale === 'fr' ? 'Email requis' : 'Email required', 'error'); return; }
                      const { data, error } = await supabase.from('super_admins').insert({ email: newAdminEmail, full_name: newAdminName || null, added_by: user?.id }).select('*').single();
                      if (error) { showToast(error.message, 'error'); return; }
                      if (data) setSuperAdmins([...superAdmins, data as typeof superAdmins[0]]);
                      setNewAdminEmail(''); setNewAdminName('');
                      showToast(locale === 'fr' ? 'Super Admin ajouté' : 'Super Admin added');
                    }} className="btn-green px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> {locale === 'fr' ? 'Ajouter' : 'Add'}</button>
                  </div>
                </div>
                <div className="space-y-2">
                  {superAdmins.map((sa) => (
                    <div key={sa.id} className="card p-4 flex items-center gap-3 bg-white">
                      <div className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center"><Crown className="w-5 h-5 text-[#0e9f6e]" /></div>
                      <div className="flex-1"><p className="text-sm font-semibold text-[#0f172a]">{sa.full_name || sa.email}</p><p className="text-xs text-[#64748b]">{sa.email}</p></div>
                      <Badge color="#0e9f6e">{locale === 'fr' ? 'Actif' : 'Active'}</Badge>
                      {sa.email !== 'vincentnogue2@gmail.com' && sa.email !== 'vincentnogue@yahoo.com' && (
                        <button onClick={async () => { await supabase.from('super_admins').update({ is_active: false }).eq('id', sa.id); setSuperAdmins(superAdmins.filter((x) => x.id !== sa.id)); showToast(locale === 'fr' ? 'Super Admin retiré' : 'Super Admin removed'); }} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'kyc' && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{t.admin.kyc}</h2>
                <div className="space-y-3">
                  {sellers.slice(0, 5).map((s) => (
                    <div key={s.id} className="card p-5 flex items-center gap-4 bg-white">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#f7f8fa]"><img src={s.store_logo_url || ''} alt="" className="w-full h-full object-cover" /></div>
                      <div className="flex-1"><p className="font-semibold text-[#0f172a]">{s.business_name}</p><p className="text-xs text-[#64748b]">{locale === 'fr' ? 'Documents vérifiés' : 'Documents verified'}</p></div>
                      <div className="flex gap-2">
                        <button onClick={async () => { await updateSellerStatus(s.id, 'active'); await logAuditAction({ actorId: user?.id, actorName: user?.fullName, action: 'seller.approve', targetType: 'seller', targetId: s.id, targetName: s.business_name }); setSellers(sellers.map(x => x.id === s.id ? { ...x, status: 'approved' as const } : x)); showToast(locale === 'fr' ? 'Vendeur approuvé' : 'Seller approved'); }} className="px-3 py-2 rounded-lg bg-green-100 text-green-700 text-xs font-semibold flex items-center gap-1 hover:bg-green-200"><CheckCircle className="w-4 h-4" /> {t.onboarding.approved}</button>
                        <button onClick={async () => { await updateSellerStatus(s.id, 'rejected'); await logAuditAction({ actorId: user?.id, actorName: user?.fullName, action: 'seller.reject', targetType: 'seller', targetId: s.id, targetName: s.business_name }); setSellers(sellers.map(x => x.id === s.id ? { ...x, status: 'rejected' as const } : x)); showToast(locale === 'fr' ? 'Vendeur rejeté' : 'Seller rejected'); }} className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1 hover:bg-red-200"><XCircle className="w-4 h-4" /> {t.onboarding.rejected}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'ads' && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{t.admin.ads}</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <StatCard label={locale === 'fr' ? 'Campagnes actives' : 'Active campaigns'} value={activeAds.length.toString()} icon={Megaphone} />
                  <StatCard label={locale === 'fr' ? 'En attente' : 'Pending'} value={pendingAds.length.toString()} icon={Clock} />
                  <StatCard label={t.ads.impressions} value={ads.reduce((s, a) => s + a.impressions, 0).toLocaleString()} icon={BarChart3} />
                  <StatCard label={locale === 'fr' ? 'Revenus pub' : 'Ad revenue'} value={`$${adRevenue.toFixed(0)}`} icon={CreditCard} />
                </div>
                <div className="card p-5 bg-white">
                  <h3 className="font-semibold text-[#0f172a] mb-3">{locale === 'fr' ? 'Campagnes en attente d\'approbation' : 'Campaigns pending approval'}</h3>
                  {pendingAds.length === 0 ? (
                    <p className="text-sm text-[#64748b] py-4 text-center">{locale === 'fr' ? 'Aucune campagne en attente.' : 'No pending campaigns.'}</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingAds.map((ad) => (
                        <div key={ad.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#ff9900]/5">
                          <Megaphone className="w-4 h-4 text-[#ff9900]" />
                          <span className="text-sm text-[#0f172a] flex-1">{ad.name}</span>
                          <span className="text-xs text-[#64748b]">${ad.budget}</span>
                          <button onClick={async () => { await updateAdCampaignStatus(ad.id, 'active'); await logAuditAction({ actorId: user?.id, actorName: user?.fullName, action: 'campaign.approve', targetType: 'ad_campaign', targetId: ad.id, targetName: ad.name }); setAds(ads.map(x => x.id === ad.id ? { ...x, status: 'active' } : x)); showToast(locale === 'fr' ? 'Campagne approuvée' : 'Campaign approved'); }} className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold flex items-center gap-1 hover:bg-green-200"><CheckCircle className="w-3 h-3" /> {locale === 'fr' ? 'Approuver' : 'Approve'}</button>
                          <button onClick={async () => { await updateAdCampaignStatus(ad.id, 'rejected'); await logAuditAction({ actorId: user?.id, actorName: user?.fullName, action: 'campaign.reject', targetType: 'ad_campaign', targetId: ad.id, targetName: ad.name }); setAds(ads.map(x => x.id === ad.id ? { ...x, status: 'rejected' } : x)); showToast(locale === 'fr' ? 'Campagne rejetée' : 'Campaign rejected'); }} className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1 hover:bg-red-200"><XCircle className="w-3 h-3" /> {locale === 'fr' ? 'Rejeter' : 'Reject'}</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'disputes' && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{t.admin.disputes}</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <StatCard label={locale === 'fr' ? 'Total signalements' : 'Total reports'} value={complianceReports.length.toString()} icon={AlertTriangle} />
                  <StatCard label={locale === 'fr' ? 'Ouverts' : 'Open'} value={openReports.length.toString()} icon={Clock} />
                  <StatCard label={locale === 'fr' ? 'R\u00e9solus' : 'Resolved'} value={complianceReports.filter((r) => r.status === 'resolved' || r.status === 'closed').length.toString()} icon={CheckCircle} />
                  <StatCard label={locale === 'fr' ? 'En cours' : 'In progress'} value={complianceReports.filter((r) => r.status === 'investigating').length.toString()} icon={Eye} />
                </div>
                <div className="space-y-3">
                  {complianceReports.slice(0, 20).map((r) => (
                    <div key={r.id} className="card p-4 flex items-start gap-3 bg-white">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${r.status === 'open' ? 'bg-red-50' : 'bg-[#0e9f6e]/10'}`}><AlertTriangle className={`w-5 h-5 ${r.status === 'open' ? 'text-red-500' : 'text-[#0e9f6e]'}`} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0f172a]">{r.report_type} • {r.target_name || r.target_type}</p>
                        <p className="text-xs text-[#64748b] mt-0.5">{r.reason || r.description || '—'}</p>
                        <p className="text-xs text-[#64748b] mt-1">{new Date(r.created_at).toLocaleDateString()} • {r.reporter_name || 'Anonymous'}</p>
                      </div>
                      <Badge color={r.status === 'open' ? '#ef4444' : r.status === 'investigating' ? '#ff9900' : '#22c55e'}>{r.status}</Badge>
                      {r.status === 'open' && (
                        <button onClick={async () => { await supabase.from('compliance_reports').update({ status: 'investigating' }).eq('id', r.id); setComplianceReports(complianceReports.map(x => x.id === r.id ? { ...x, status: 'investigating' } : x)); showToast(locale === 'fr' ? 'Signalement en cours de traitement' : 'Report under investigation'); }} className="px-3 py-1.5 rounded-lg bg-[#0f172a] text-white text-xs font-semibold">{locale === 'fr' ? 'Traiter' : 'Handle'}</button>
                      )}
                    </div>
                  ))}
                  {complianceReports.length === 0 && <div className="card p-8 text-center bg-white"><AlertTriangle className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" /><p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Aucun litige en cours.' : 'No active disputes.'}</p></div>}
                </div>
              </div>
            )}

            {tab === 'payouts' && isSuperAdmin && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{locale === 'fr' ? 'Paiements vendeurs' : 'Seller Payouts'}</h2>
                <div className="card p-5 mb-4 bg-[#0e9f6e]/5 flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-[#0e9f6e]" />
                  <p className="text-sm text-[#0f172a]">{locale === 'fr' ? 'Gérez les demandes de paiement des vendeurs. Les paiements sont envoyés directement sur le compte configuré par le vendeur.' : 'Manage seller payout requests. Payments are sent directly to the seller\'s configured account.'}</p>
                </div>
                <PayoutsTab />
              </div>
            )}

            {tab === 'geography' && isSuperAdmin && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{t.admin.geography}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {countries.map((c) => (
                    <div key={c.id} className="card p-4 bg-white">
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
              <div className="animate-fade-up">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold text-[#0f172a]">{t.admin.staff}</h2>
                  <button onClick={() => { setEditingRole(null); setShowRoleForm(!showRoleForm); }} className="btn-green px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> {locale === 'fr' ? 'Nouveau rôle' : 'New role'}</button>
                </div>
                {showRoleForm && (
                  <div className="card p-5 mb-4 animate-fade-up bg-white">
                    <input defaultValue={editingRole?.name || ''} placeholder={locale === 'fr' ? 'Nom du rôle' : 'Role name'} className="input-field mb-3" />
                    <input defaultValue={editingRole?.description || ''} placeholder={locale === 'fr' ? 'Description' : 'Description'} className="input-field mb-4" />
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
                    <div key={r.id} className="card p-5 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div><h3 className="font-semibold text-[#0f172a]">{r.name}</h3><p className="text-xs text-[#64748b]">{r.description}</p></div>
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
              <div className="animate-fade-up space-y-6">
                <h2 className="font-display text-xl font-bold text-[#0f172a]">{t.admin.analytics}</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label={locale === 'fr' ? 'Revenu total' : 'Total revenue'} value={`${totalRevenue.toFixed(0)}`} icon={DollarSign} />
                  <StatCard label={locale === 'fr' ? 'Commandes' : 'Orders'} value={orders.length.toString()} icon={ShoppingBag} />
                  <StatCard label={locale === 'fr' ? 'Vendeurs actifs' : 'Active sellers'} value={sellers.filter((s) => s.status === 'approved').length.toString()} icon={Store} />
                  <StatCard label={locale === 'fr' ? 'Produits actifs' : 'Active products'} value={products.length.toString()} icon={Package} />
                </div>
                <div className="grid lg:grid-cols-2 gap-4">
                  <div className="card p-5 bg-white">
                    <h3 className="font-display text-sm font-bold text-[#0f172a] mb-4">{locale === 'fr' ? 'R\u00e9partition par plan' : 'Distribution by plan'}</h3>
                    <div className="space-y-3">
                      {['starter', 'premium', 'enterprise'].map((plan) => {
                        const count = sellers.filter((s) => s.plan === plan).length;
                        const pct = sellers.length > 0 ? (count / sellers.length) * 100 : 0;
                        return (
                          <div key={plan}>
                            <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-[#0f172a] capitalize">{plan}</span><span className="text-[#64748b]">{count}</span></div>
                            <div className="h-2 rounded-full bg-[#f7f8fa] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: plan === 'enterprise' ? '#0e9f6e' : plan === 'premium' ? '#ff9900' : '#64748b' }} /></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="card p-5 bg-white">
                    <h3 className="font-display text-sm font-bold text-[#0f172a] mb-4">{locale === 'fr' ? 'Statut des commandes' : 'Order status breakdown'}</h3>
                    <div className="space-y-3">
                      {['pending', 'confirmed', 'delivered', 'cancelled'].map((st) => {
                        const count = orders.filter((o) => o.status === st).length;
                        const pct = orders.length > 0 ? (count / orders.length) * 100 : 0;
                        return (
                          <div key={st}>
                            <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-[#0f172a] capitalize">{st}</span><span className="text-[#64748b]">{count}</span></div>
                            <div className="h-2 rounded-full bg-[#f7f8fa] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: st === 'delivered' ? '#22c55e' : st === 'pending' ? '#ff9900' : st === 'cancelled' ? '#ef4444' : '#64748b' }} /></div>
                          </div>
                        );
                      })}
                      {orders.length === 0 && <p className="text-xs text-[#64748b] text-center py-4">{locale === 'fr' ? 'Aucune donn\u00e9e' : 'No data'}</p>}
                    </div>
                  </div>
                </div>
                <div className="card p-5 bg-white">
                  <h3 className="font-display text-sm font-bold text-[#0f172a] mb-4">{locale === 'fr' ? 'Top pays par produits' : 'Top countries by products'}</h3>
                  <div className="space-y-2">
                    {countries.slice(0, 8).map((c) => {
                      const count = products.filter((p) => p.country_id === c.id).length;
                      const pct = products.length > 0 ? (count / products.length) * 100 : 0;
                      return (
                        <div key={c.id} className="flex items-center gap-3">
                          <span className="text-lg">{c.flag}</span>
                          <span className="text-xs text-[#0f172a] w-24 truncate">{c.name}</span>
                          <div className="flex-1 h-2 rounded-full bg-[#f7f8fa] overflow-hidden"><div className="h-full rounded-full bg-[#0e9f6e]" style={{ width: `${pct}%` }} /></div>
                          <span className="text-xs text-[#64748b] w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {tab === 'plans' && isSuperAdmin && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{t.admin.plans}</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { name: 'Starter', price: '$9', subs: sellers.filter((s) => s.plan === 'starter').length },
                    { name: 'Premium', price: '$29', subs: sellers.filter((s) => s.plan === 'premium').length },
                    { name: 'Enterprise', price: '$79', subs: sellers.filter((s) => s.plan === 'enterprise').length },
                  ].map((p) => (
                    <div key={p.name} className="card p-5 bg-white">
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
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{t.admin.documents}</h2>
                <div className="card p-5 bg-white">
                  <div className="flex items-center gap-2 mb-4"><Search className="w-4 h-4 text-[#64748b]" /><input placeholder={locale === 'fr' ? 'Rechercher documents...' : 'Search documents...'} className="flex-1 text-sm bg-transparent focus:outline-none text-[#0f172a]" /></div>
                  <div className="space-y-2">
                    {sellers.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#f7f8fa]">
                        <FileText className="w-5 h-5 text-[#0e9f6e]" />
                        <span className="text-sm text-[#0f172a] flex-1">{s.business_name} — {locale === 'fr' ? 'Documents KYC' : 'KYC Documents'}</span>
                        <Badge color="#22c55e">{t.onboarding.approved}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'settings' && isSuperAdmin && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{t.admin.settings}</h2>
                <div className="space-y-4">
                  {/* Reviews config */}
                  <div className="card p-5 bg-white">
                    <h3 className="font-semibold text-[#0f172a] mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#0e9f6e]" /> {locale === 'fr' ? 'Gestion des avis (Reviews)' : 'Reviews Management'}</h3>
                    <div className="space-y-3">
                      <ToggleRow label={locale === 'fr' ? 'Activer les avis produits' : 'Enable product reviews'} desc={locale === 'fr' ? 'Permettre aux clients de laisser des avis sur les produits' : 'Allow customers to leave reviews on products'} enabled={reviewsEnabled} onToggle={async () => { const v = !reviewsEnabled; setReviewsEnabled(v); await supabase.from('platform_settings').upsert({ key: 'reviews_enabled', value: { value: v } }); showToast(v ? (locale === 'fr' ? 'Avis activés' : 'Reviews enabled') : (locale === 'fr' ? 'Avis désactivés' : 'Reviews disabled')); }} />
                      <ToggleRow label={locale === 'fr' ? 'Acheteurs confirmés uniquement' : 'Confirmed buyers only'} desc={locale === 'fr' ? 'Seuls les acheteurs ayant commandé peuvent laisser un avis' : 'Only buyers who purchased can leave a review'} enabled={reviewsConfirmedOnly} onToggle={async () => { const v = !reviewsConfirmedOnly; setReviewsConfirmedOnly(v); await supabase.from('platform_settings').upsert({ key: 'reviews_confirmed_buyers_only', value: { value: v } }); showToast(locale === 'fr' ? 'Paramètre mis à jour' : 'Setting updated'); }} />
                    </div>
                  </div>
                  {/* Platform config */}
                  <div className="card p-5 bg-white">
                    <h3 className="font-semibold text-[#0f172a] mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-[#0e9f6e]" /> {locale === 'fr' ? 'Configuration plateforme' : 'Platform Configuration'}</h3>
                    <div className="space-y-3">
                      <ToggleRow label={locale === 'fr' ? 'Approbation produits requise' : 'Product approval required'} desc={locale === 'fr' ? 'Les produits doivent être approuvés avant mise en ligne' : 'Products must be approved before going live'} enabled={productApprovalRequired} onToggle={async () => { const v = !productApprovalRequired; setProductApprovalRequired(v); await supabase.from('platform_settings').upsert({ key: 'product_approval_required', value: { value: v } }); showToast(locale === 'fr' ? 'Paramètre mis à jour' : 'Setting updated'); }} />
                      <ToggleRow label={locale === 'fr' ? 'Achat sans compte (Guest checkout)' : 'Guest checkout'} desc={locale === 'fr' ? 'Permettre aux acheteurs de commander sans compte' : 'Allow buyers to checkout without an account'} enabled={guestCheckoutEnabled} onToggle={async () => { const v = !guestCheckoutEnabled; setGuestCheckoutEnabled(v); await supabase.from('platform_settings').upsert({ key: 'guest_checkout_enabled', value: { value: v } }); showToast(locale === 'fr' ? 'Paramètre mis à jour' : 'Setting updated'); }} />
                    </div>
                  </div>
                  {/* Plan staff limits */}
                  <div className="card p-5 bg-white">
                    <h3 className="font-semibold text-[#0f172a] mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-[#0e9f6e]" /> {locale === 'fr' ? 'Limites de staff par plan' : 'Staff limits per plan'}</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[{ plan: 'Starter', limit: 1, color: '#64748b' }, { plan: 'Premium', limit: 5, color: '#ff9900' }, { plan: 'Enterprise', limit: 20, color: '#0e9f6e' }].map((p) => (
                        <div key={p.plan} className="p-3 rounded-xl bg-[#f7f8fa] text-center">
                          <p className="text-sm font-semibold text-[#0f172a]">{p.plan}</p>
                          <p className="text-2xl font-bold" style={{ color: p.color }}>{p.limit}</p>
                          <p className="text-xs text-[#64748b]">{locale === 'fr' ? 'membres max' : 'max members'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Existing settings */}
                  <div className="card p-5 bg-white">
                    <h3 className="font-semibold text-[#0f172a] mb-4">{locale === 'fr' ? 'Général' : 'General'}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.admin.languages}</label>
                        <div className="flex gap-2"><Badge color="#0e9f6e">Français</Badge><Badge color="#0e9f6e">English</Badge></div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.admin.payments}</label>
                        <div className="flex flex-wrap gap-2">{paymentProviders.map((p) => <Badge key={p.id} color={p.is_active ? '#22c55e' : '#64748b'}>{p.name}</Badge>)}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Pays actifs' : 'Active countries'}</label>
                        <div className="flex flex-wrap gap-1">{countries.slice(0, 15).map((c) => <span key={c.id} className="text-lg">{c.flag}</span>)}<span className="text-xs text-[#64748b]">+{countries.length - 15}</span></div>
                      </div>
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

function ToggleRow({ label, desc, enabled, onToggle }: { label: string; desc: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[#f7f8fa]">
      <div>
        <p className="text-sm font-semibold text-[#0f172a]">{label}</p>
        <p className="text-xs text-[#64748b]">{desc}</p>
      </div>
      <button onClick={onToggle} className="shrink-0">
        {enabled ? <ToggleRight className="w-8 h-8 text-[#0e9f6e]" /> : <ToggleLeft className="w-8 h-8 text-[#cbd5e1]" />}
      </button>
    </div>
  );
}

function PayoutsTab() {
  const { locale, showToast } = useApp();
  const [payouts, setPayouts] = useState<{ id: string; seller_id: string; amount: number; status: string; created_at: string; sellers?: { business_name: string } }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('payouts').select('*, sellers(business_name)').order('created_at', { ascending: false }).limit(50);
      setPayouts((data as typeof payouts) || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="card p-8 text-center text-sm text-[#64748b] bg-white">{locale === 'fr' ? 'Chargement...' : 'Loading...'}</div>;

  return (
    <div className="card overflow-hidden bg-white">
      {payouts.length === 0 ? (
        <p className="text-sm text-[#64748b] text-center py-8">{locale === 'fr' ? 'Aucune demande de paiement.' : 'No payout requests.'}</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-[#f7f8fa] text-xs text-[#64748b] uppercase">
            <tr>
              <th className="text-left px-4 py-3">{locale === 'fr' ? 'Vendeur' : 'Seller'}</th>
              <th className="text-left px-4 py-3">{locale === 'fr' ? 'Montant' : 'Amount'}</th>
              <th className="text-left px-4 py-3">{locale === 'fr' ? 'Statut' : 'Status'}</th>
              <th className="text-left px-4 py-3">{locale === 'fr' ? 'Date' : 'Date'}</th>
              <th className="text-left px-4 py-3">{locale === 'fr' ? 'Action' : 'Action'}</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-t border-[#e2e8f0]">
                <td className="px-4 py-3 text-[#0f172a]">{p.sellers?.business_name || '—'}</td>
                <td className="px-4 py-3 font-semibold text-[#0f172a]">${Number(p.amount).toFixed(2)}</td>
                <td className="px-4 py-3"><Badge color={p.status === 'pending' ? '#ff9900' : p.status === 'paid' ? '#22c55e' : '#64748b'}>{p.status}</Badge></td>
                <td className="px-4 py-3 text-xs text-[#64748b]">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {p.status === 'pending' && (
                    <button onClick={async () => { await supabase.from('payouts').update({ status: 'paid' }).eq('id', p.id); setPayouts(payouts.map(x => x.id === p.id ? { ...x, status: 'paid' } : x)); showToast(locale === 'fr' ? 'Paiement effectué' : 'Payout marked as paid'); }} className="px-3 py-1.5 rounded-lg bg-[#0e9f6e] text-white text-xs font-semibold hover:bg-[#0c8a5e]">{locale === 'fr' ? 'Marquer payé' : 'Mark paid'}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
