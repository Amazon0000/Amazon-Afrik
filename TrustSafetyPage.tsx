import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/store';
import {
  fetchComplianceSellers, fetchAuditLogs, fetchComplianceReports,
  fetchComplianceCases, fetchStoreHealthScores, fetchSellerDocuments,
  updateSellerCompliance, updateSellerDocument, updateComplianceReport,
  updateComplianceCase, logAuditAction,
} from '@/lib/db';
import type { ComplianceSeller, AuditLog, ComplianceReport, ComplianceCase, StoreHealthScore, SellerDocument } from '@/lib/db';
import { Badge } from '@/components/ui';
import {
  ShieldCheck, Store, FileText, AlertTriangle, BarChart3, ScrollText, Search,
  CheckCircle, XCircle, Clock, Ban, Snowflake, RotateCcw, Flag, Eye, FileSearch,
  Activity, TrendingUp, ChevronRight, X, ZoomIn,
  AlertOctagon, Gavel,
} from 'lucide-react';

type Tab = 'overview' | 'verification' | 'documents' | 'reports' | 'cases' | 'health' | 'audit';

export function TrustSafetyPage() {
  const { locale, user, navigate } = useApp();
  const [tab, setTab] = useState<Tab>('overview');
  const [sellers, setSellers] = useState<ComplianceSeller[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [cases, setCases] = useState<ComplianceCase[]>([]);
  const [healthScores, setHealthScores] = useState<StoreHealthScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<ComplianceSeller | null>(null);
  const [sellerDocs, setSellerDocs] = useState<SellerDocument[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [confirmAction, setConfirmAction] = useState<{ type: string; seller: ComplianceSeller } | null>(null);
  const [docViewer, setDocViewer] = useState<SellerDocument | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, l, r, c, h] = await Promise.all([
          fetchComplianceSellers(),
          fetchAuditLogs(200),
          fetchComplianceReports(),
          fetchComplianceCases(),
          fetchStoreHealthScores(),
        ]);
        setSellers(s); setLogs(l); setReports(r); setCases(c); setHealthScores(h);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const reloadSellers = async () => {
    const s = await fetchComplianceSellers();
    setSellers(s);
  };

  const handleViewSeller = async (seller: ComplianceSeller) => {
    setSelectedSeller(seller);
    const docs = await fetchSellerDocuments(seller.id);
    setSellerDocs(docs);
  };

  const handleSellerAction = async (type: string, seller: ComplianceSeller, reason?: string) => {
    const updates: Record<string, unknown> = {};
    const prevStatus = seller.compliance_status || seller.status;

    if (type === 'approve') { updates.compliance_status = 'approved'; updates.status = 'active'; }
    else if (type === 'reject') { updates.compliance_status = 'rejected'; updates.status = 'rejected'; }
    else if (type === 'suspend') { updates.compliance_status = 'suspended'; updates.status = 'suspended'; updates.suspended_reason = reason || 'Policy violation'; updates.suspended_at = new Date().toISOString(); }
    else if (type === 'reactivate') { updates.compliance_status = 'approved'; updates.status = 'active'; updates.suspended_reason = null; updates.suspended_at = null; }
    else if (type === 'ban') { updates.compliance_status = 'banned'; updates.status = 'banned'; updates.suspended_reason = reason || 'Permanent ban'; updates.suspended_at = new Date().toISOString(); }
    else if (type === 'freeze') { updates.status = 'frozen'; }
    else if (type === 'unfreeze') { updates.status = 'active'; }
    else if (type === 'strike') { updates.strikes_count = (seller.strikes_count || 0) + 1; }

    const ok = await updateSellerCompliance(seller.id, updates);
    if (ok) {
      await logAuditAction({
        actorId: user?.id || null,
        actorName: user?.fullName || 'Admin',
        action: `seller.${type}`,
        targetType: 'seller',
        targetId: seller.id,
        targetName: seller.business_name,
        previousValue: { compliance_status: prevStatus },
        newValue: updates,
        reason: reason || undefined,
      });
      await reloadSellers();
      if (selectedSeller?.id === seller.id) {
        const updated = { ...seller, ...updates } as ComplianceSeller;
        setSelectedSeller(updated);
      }
    }
    setConfirmAction(null);
  };

  const handleDocAction = async (doc: SellerDocument, action: string, notes?: string) => {
    const updates: Record<string, unknown> = {};
    if (action === 'approve') updates.status = 'approved';
    else if (action === 'reject') updates.status = 'rejected';
    else if (action === 'flag') { updates.status = 'flagged'; updates.flagged_reason = notes || 'Suspicious'; }
    else if (action === 'request') updates.status = 'resubmit';
    if (notes) updates.admin_notes = notes;
    updates.reviewed_by = user?.id || null;
    updates.reviewed_at = new Date().toISOString();

    const ok = await updateSellerDocument(doc.id, updates);
    if (ok) {
      await logAuditAction({
        actorId: user?.id || null,
        actorName: user?.fullName || 'Admin',
        action: `document.${action}`,
        targetType: 'seller_document',
        targetId: doc.id,
        targetName: doc.doc_type,
        reason: notes || undefined,
      });
      if (selectedSeller) {
        const docs = await fetchSellerDocuments(selectedSeller.id);
        setSellerDocs(docs);
      }
    }
    setDocViewer(null);
  };

  const handleReportAction = async (reportId: string, status: string) => {
    const ok = await updateComplianceReport(reportId, status);
    if (ok) {
      await logAuditAction({
        actorId: user?.id || null,
        actorName: user?.fullName || 'Admin',
        action: `report.${status}`,
        targetType: 'compliance_report',
        targetId: reportId,
      });
      const r = await fetchComplianceReports();
      setReports(r);
    }
  };

  const handleCaseAction = async (caseId: string, status: string) => {
    const ok = await updateComplianceCase(caseId, { status });
    if (ok) {
      await logAuditAction({
        actorId: user?.id || null,
        actorName: user?.fullName || 'Admin',
        action: `case.${status}`,
        targetType: 'compliance_case',
        targetId: caseId,
      });
      const c = await fetchComplianceCases();
      setCases(c);
    }
  };

  // Computed metrics
  const metrics = useMemo(() => {
    const pending = sellers.filter(s => s.compliance_status === 'pending').length;
    const flagged = sellers.filter(s => s.compliance_status === 'suspended' || s.compliance_status === 'banned').length;
    const openReports = reports.filter(r => r.status === 'open' || r.status === 'under_review').length;
    const openCases = cases.filter(c => c.status === 'open' || c.status === 'under_review').length;
    const flaggedHealth = healthScores.filter(h => h.flagged_for_review).length;
    const criticalHealth = healthScores.filter(h => h.health_status === 'critical').length;
    const totalActions = logs.length;
    const today = new Date().toISOString().slice(0, 10);
    const actionsToday = logs.filter(l => l.created_at.slice(0, 10) === today).length;
    return { pending, flagged, openReports, openCases, flaggedHealth, criticalHealth, totalActions, actionsToday };
  }, [sellers, reports, cases, healthScores, logs]);

  const filteredSellers = useMemo(() => {
    let result = sellers;
    if (filterStatus !== 'all') result = result.filter(s => (s.compliance_status || s.status) === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.business_name?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.registration_number?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [sellers, filterStatus, search]);

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(l =>
      l.action?.toLowerCase().includes(q) ||
      l.actor_name?.toLowerCase().includes(q) ||
      l.target_name?.toLowerCase().includes(q) ||
      l.target_type?.toLowerCase().includes(q)
    );
  }, [logs, search]);

  const navItems: { id: Tab; label: string; icon: typeof ShieldCheck; badge?: number }[] = [
    { id: 'overview', label: locale === 'fr' ? 'Vue d\'ensemble' : 'Overview', icon: BarChart3 },
    { id: 'verification', label: locale === 'fr' ? 'Vérification vendeurs' : 'Seller Verification', icon: Store, badge: metrics.pending },
    { id: 'documents', label: locale === 'fr' ? 'Documents' : 'Documents', icon: FileSearch },
    { id: 'reports', label: locale === 'fr' ? 'Signalements' : 'Reports', icon: AlertTriangle, badge: metrics.openReports },
    { id: 'cases', label: locale === 'fr' ? 'Cas' : 'Cases', icon: Gavel, badge: metrics.openCases },
    { id: 'health', label: locale === 'fr' ? 'Santé boutique' : 'Store Health', icon: Activity, badge: metrics.flaggedHealth },
    { id: 'audit', label: locale === 'fr' ? 'Journaux d\'audit' : 'Audit Logs', icon: ScrollText },
  ];

  if (loading) {
    return (
      <div className="bg-[#f7f8fa] min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#0e9f6e]/20 border-t-[#0e9f6e] animate-spin" />
      </div>
    );
  }

  const riskColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return '#64748b';
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#0e9f6e';
    if (score >= 30) return '#3b82f6';
    return '#22c55e';
  };

  const healthColor = (status: string | null | undefined) => {
    if (!status) return '#64748b';
    if (status === 'excellent') return '#22c55e';
    if (status === 'good') return '#0e9f6e';
    if (status === 'average') return '#0e9f6e';
    if (status === 'poor') return '#f97316';
    if (status === 'critical') return '#ef4444';
    return '#64748b';
  };

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="premium-card mb-6 rounded-[26px] p-4 sm:p-5 bg-gradient-to-r from-[#f8fbfa] via-white to-[#eefaf4]">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('admin')} className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center hover:scale-105 transition-transform soft-glow" title={locale === 'fr' ? 'Retour au dashboard' : 'Back to dashboard'}>
              <ChevronRight className="w-5 h-5 text-[#0e9f6e] rotate-180" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center soft-glow">
              <ShieldCheck className="w-5 h-5 text-[#0e9f6e]" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-[#0f172a]">{locale === 'fr' ? 'Centre de Conformité' : 'Trust & Safety Center'}</h1>
              <p className="text-xs text-[#64748b]">{locale === 'fr' ? 'Protéger les clients, prévenir la fraude, maintenir la confiance' : 'Protect buyers, prevent fraud, maintain trust'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <div className="premium-card p-3 sticky top-20 rounded-2xl bg-white/90">
              <nav className="space-y-0.5">
                {navItems.map((item) => (
                  <button key={item.id} onClick={() => setTab(item.id)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg transition-colors ${tab === item.id ? 'bg-[#0e9f6e]/10 text-[#0e9f6e] font-semibold' : 'text-[#0f172a] hover:bg-[#f7f8fa]'}`}>
                    <item.icon className="w-4 h-4" /> {item.label}
                    {item.badge !== undefined && item.badge > 0 && <span className="ml-auto text-xs bg-[#0e9f6e] text-white px-1.5 rounded-full font-bold">{item.badge}</span>}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* OVERVIEW */}
            {tab === 'overview' && (
              <div className="animate-fade-up space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard label={locale === 'fr' ? 'Vérifications en attente' : 'Pending Verifications'} value={metrics.pending} icon={Clock} color="#0e9f6e" />
                  <MetricCard label={locale === 'fr' ? 'Signalements ouverts' : 'Open Reports'} value={metrics.openReports} icon={AlertTriangle} color="#ef4444" />
                  <MetricCard label={locale === 'fr' ? 'Cas ouverts' : 'Open Cases'} value={metrics.openCases} icon={Gavel} color="#f97316" />
                  <MetricCard label={locale === 'fr' ? 'Boutiques signalées' : 'Flagged Stores'} value={metrics.flaggedHealth} icon={Flag} color="#ef4444" />
                  <MetricCard label={locale === 'fr' ? 'Vendeurs suspendus' : 'Suspended Sellers'} value={metrics.flagged} icon={Ban} color="#64748b" />
                  <MetricCard label={locale === 'fr' ? 'Santé critique' : 'Critical Health'} value={metrics.criticalHealth} icon={AlertOctagon} color="#ef4444" />
                  <MetricCard label={locale === 'fr' ? 'Actions totales' : 'Total Actions'} value={metrics.totalActions} icon={Activity} color="#0e9f6e" />
                  <MetricCard label={locale === 'fr' ? 'Actions aujourd\'hui' : 'Actions Today'} value={metrics.actionsToday} icon={TrendingUp} color="#0e9f6e" />
                </div>

                {/* Risk distribution */}
                <div className="premium-card p-5 bg-white/90 rounded-2xl">
                  <h3 className="font-display text-lg font-bold text-[#0f172a] mb-4">{locale === 'fr' ? 'Distribution des risques' : 'Risk Distribution'}</h3>
                  <div className="space-y-3">
                    {[
                      { label: locale === 'fr' ? 'Faible' : 'Low', color: '#22c55e', count: sellers.filter(s => (s.risk_score || 0) < 30).length },
                      { label: locale === 'fr' ? 'Moyen' : 'Medium', color: '#3b82f6', count: sellers.filter(s => (s.risk_score || 0) >= 30 && (s.risk_score || 0) < 60).length },
                      { label: locale === 'fr' ? 'Élevé' : 'High', color: '#0e9f6e', count: sellers.filter(s => (s.risk_score || 0) >= 60 && (s.risk_score || 0) < 80).length },
                      { label: locale === 'fr' ? 'Critique' : 'Critical', color: '#ef4444', count: sellers.filter(s => (s.risk_score || 0) >= 80).length },
                    ].map(r => {
                      const pct = sellers.length > 0 ? (r.count / sellers.length) * 100 : 0;
                      return (
                        <div key={r.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-[#0f172a]">{r.label}</span>
                            <span className="text-xs text-[#64748b]">{r.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#f7f8fa] overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: r.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent audit activity */}
                <div className="premium-card p-5 bg-white/90 rounded-2xl">
                  <h3 className="font-display text-lg font-bold text-[#0f172a] mb-4">{locale === 'fr' ? 'Activité récente' : 'Recent Activity'}</h3>
                  <div className="space-y-2">
                    {logs.slice(0, 8).map((l) => (
                      <div key={l.id} className="flex items-center gap-3 py-2 border-b border-[#e2e8f0] last:border-0">
                        <div className="w-8 h-8 rounded-lg bg-[#0e9f6e]/10 flex items-center justify-center shrink-0">
                          <Activity className="w-4 h-4 text-[#0e9f6e]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0f172a] truncate">{l.action.replace(/\./g, ' → ')}</p>
                          <p className="text-xs text-[#64748b]">{l.actor_name || 'System'} • {l.target_name || ''}</p>
                        </div>
                        <span className="text-xs text-[#64748b] shrink-0">{new Date(l.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {logs.length === 0 && <p className="text-sm text-[#64748b] text-center py-4">{locale === 'fr' ? 'Aucune activité' : 'No activity'}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* VERIFICATION QUEUE */}
            {tab === 'verification' && (
              <div className="animate-fade-up">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={locale === 'fr' ? 'Rechercher vendeur, entreprise, téléphone...' : 'Search seller, business, phone...'} className="input-field pl-9" />
                  </div>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field cursor-pointer sm:w-48">
                    <option value="all">{locale === 'fr' ? 'Tous les statuts' : 'All statuses'}</option>
                    <option value="pending">{locale === 'fr' ? 'En attente' : 'Pending'}</option>
                    <option value="approved">{locale === 'fr' ? 'Approuvé' : 'Approved'}</option>
                    <option value="rejected">{locale === 'fr' ? 'Rejeté' : 'Rejected'}</option>
                    <option value="suspended">{locale === 'fr' ? 'Suspendu' : 'Suspended'}</option>
                    <option value="banned">{locale === 'fr' ? 'Banni' : 'Banned'}</option>
                  </select>
                </div>

                {filteredSellers.length === 0 ? (
                  <div className="card p-8 text-center text-sm text-[#64748b] bg-white">
                    <Store className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" />
                    {locale === 'fr' ? 'Aucun vendeur trouvé' : 'No sellers found'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSellers.map((s) => (
                      <div key={s.id} className="premium-card p-4 bg-white/90 rounded-2xl">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#f7f8fa] shrink-0">
                            {s.store_logo_url ? <img src={s.store_logo_url} alt="" className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-[#64748b]/40 m-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-[#0f172a]">{s.business_name}</p>
                              <Badge color={s.plan === 'enterprise' ? '#0e9f6e' : s.plan === 'premium' ? '#0e9f6e' : '#64748b'}>{s.plan}</Badge>
                              <Badge color={{ pending: '#0e9f6e', approved: '#22c55e', rejected: '#ef4444', suspended: '#64748b', banned: '#0f172a' }[s.compliance_status || s.status || 'pending'] || '#64748b'}>{s.compliance_status || s.status}</Badge>
                            </div>
                            <p className="text-xs text-[#64748b] mt-0.5">{s.city} • {s.total_products} {locale === 'fr' ? 'produits' : 'products'} • {locale === 'fr' ? 'Inscrit' : 'Joined'} {s.joined_year || (s.created_at ? new Date(s.created_at).getFullYear() : '—')}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-[#64748b]">{locale === 'fr' ? 'Risque' : 'Risk'}:</span>
                                <div className="w-16 h-1.5 rounded-full bg-[#f7f8fa] overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${s.risk_score || 0}%`, background: riskColor(s.risk_score) }} />
                                </div>
                                <span className="text-xs font-bold" style={{ color: riskColor(s.risk_score) }}>{s.risk_score?.toFixed(0) || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-[#64748b]">{locale === 'fr' ? 'Santé' : 'Health'}:</span>
                                <span className="text-xs font-bold" style={{ color: healthColor(s.health_status) }}>{s.health_status || 'average'}</span>
                              </div>
                              {(s.strikes_count || 0) > 0 && <span className="text-xs text-[#0e9f6e] font-semibold">{s.strikes_count} {locale === 'fr' ? 'avert.' : 'strike(s)'}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => handleViewSeller(s)} className="px-3 py-2 rounded-lg text-xs font-medium border border-[#e2e8f0] text-[#0f172a] hover:bg-[#f7f8fa] flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {locale === 'fr' ? 'Détails' : 'Details'}</button>
                            {s.compliance_status === 'pending' && (
                              <>
                                <button onClick={() => setConfirmAction({ type: 'approve', seller: s })} className="px-3 py-2 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {locale === 'fr' ? 'Approuver' : 'Approve'}</button>
                                <button onClick={() => setConfirmAction({ type: 'reject', seller: s })} className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> {locale === 'fr' ? 'Rejeter' : 'Reject'}</button>
                              </>
                            )}
                            {s.compliance_status === 'approved' && (
                              <button onClick={() => setConfirmAction({ type: 'suspend', seller: s })} className="px-3 py-2 rounded-lg text-xs font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200 flex items-center gap-1"><Ban className="w-3.5 h-3.5" /> {locale === 'fr' ? 'Suspendre' : 'Suspend'}</button>
                            )}
                            {(s.compliance_status === 'suspended' || s.status === 'suspended') && (
                              <button onClick={() => setConfirmAction({ type: 'reactivate', seller: s })} className="px-3 py-2 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> {locale === 'fr' ? 'Réactiver' : 'Reactivate'}</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SELLER DETAIL DRAWER */}
            {selectedSeller && (
              <>
                <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelectedSeller(null)} />
                <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white z-50 overflow-y-auto animate-fade-up">
                  <div className="sticky top-0 bg-white border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#f7f8fa]">
                        {selectedSeller.store_logo_url ? <img src={selectedSeller.store_logo_url} alt="" className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-[#64748b]/40 m-2.5" />}
                      </div>
                      <div>
                        <h2 className="font-display text-lg font-semibold text-[#0f172a]">{selectedSeller.business_name}</h2>
                        <p className="text-xs text-[#64748b]">{selectedSeller.city} • {selectedSeller.plan}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedSeller(null)} className="p-2 rounded-lg hover:bg-[#f7f8fa]"><X className="w-5 h-5 text-[#64748b]" /></button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Business info */}
                    <Section title={locale === 'fr' ? 'Informations commerciales' : 'Business Information'}>
                      <DataRow label={locale === 'fr' ? 'Nom commercial' : 'Business name'} value={selectedSeller.business_name} />
                      <DataRow label={locale === 'fr' ? 'Type' : 'Type'} value={selectedSeller.business_type || '—'} />
                      <DataRow label={locale === 'fr' ? 'Numéro de registre' : 'Registration number'} value={selectedSeller.registration_number || '—'} />
                      <DataRow label={locale === 'fr' ? 'Numéro TVA' : 'VAT number'} value={selectedSeller.vat_number || '—'} />
                      <DataRow label={locale === 'fr' ? 'Téléphone' : 'Phone'} value={selectedSeller.phone || '—'} />
                      <DataRow label={locale === 'fr' ? 'Ville' : 'City'} value={selectedSeller.city || '—'} />
                    </Section>

                    {/* Verification status */}
                    <Section title={locale === 'fr' ? 'Vérifications' : 'Verifications'}>
                      <div className="grid grid-cols-3 gap-3">
                        <VerifyBadge label={locale === 'fr' ? 'Téléphone' : 'Phone'} verified={!!selectedSeller.phone_verified} />
                        <VerifyBadge label={locale === 'fr' ? 'Email' : 'Email'} verified={!!selectedSeller.email_verified} />
                        <VerifyBadge label={locale === 'fr' ? 'Banque' : 'Bank'} verified={!!selectedSeller.bank_verified} />
                      </div>
                    </Section>

                    {/* Bank info */}
                    <Section title={locale === 'fr' ? 'Informations bancaires' : 'Bank Information'}>
                      <DataRow label={locale === 'fr' ? 'Banque' : 'Bank'} value={selectedSeller.bank_name || '—'} />
                      <DataRow label="IBAN" value={selectedSeller.bank_iban || '—'} />
                      <DataRow label="SWIFT" value={selectedSeller.bank_swift || '—'} />
                      <DataRow label={locale === 'fr' ? 'Mobile Money' : 'Mobile Money'} value={selectedSeller.mobile_money_number || '—'} />
                    </Section>

                    {/* Documents */}
                    <Section title={locale === 'fr' ? 'Documents' : 'Documents'}>
                      {sellerDocs.length === 0 ? (
                        <p className="text-sm text-[#64748b] py-3">{locale === 'fr' ? 'Aucun document' : 'No documents'}</p>
                      ) : (
                        <div className="space-y-2">
                          {sellerDocs.map((doc) => (
                            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#f7f8fa]">
                              <FileText className="w-5 h-5 text-[#0e9f6e] shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#0f172a] capitalize">{doc.doc_type.replace(/_/g, ' ')}</p>
                                <p className="text-xs text-[#64748b]">{doc.file_name || 'Document'} • {doc.status}</p>
                              </div>
                              <Badge color={doc.status === 'approved' ? '#22c55e' : doc.status === 'rejected' ? '#ef4444' : doc.status === 'flagged' ? '#0e9f6e' : '#64748b'}>{doc.status}</Badge>
                              <button onClick={() => setDocViewer(doc)} className="p-2 rounded-lg hover:bg-white"><ZoomIn className="w-4 h-4 text-[#64748b]" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>

                    {/* Store photos */}
                    <Section title={locale === 'fr' ? 'Photos du magasin' : 'Store Photos'}>
                      <div className="grid grid-cols-3 gap-2">
                        {(selectedSeller.store_photos || []).map((url, i) => (
                          <div key={i} className="aspect-square rounded-lg overflow-hidden bg-[#f7f8fa]"><img src={url} alt="" className="w-full h-full object-cover" /></div>
                        ))}
                        {(selectedSeller.warehouse_photos || []).map((url, i) => (
                          <div key={`w${i}`} className="aspect-square rounded-lg overflow-hidden bg-[#f7f8fa]"><img src={url} alt="" className="w-full h-full object-cover" /></div>
                        ))}
                        {(!selectedSeller.store_photos?.length && !selectedSeller.warehouse_photos?.length) && <p className="text-sm text-[#64748b] col-span-3 py-3">{locale === 'fr' ? 'Aucune photo' : 'No photos'}</p>}
                      </div>
                    </Section>

                    {/* Enforcement actions */}
                    <Section title={locale === 'fr' ? 'Actions d\'application' : 'Enforcement Actions'}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedSeller.compliance_status === 'approved' && (
                          <ActionBtn icon={Ban} label={locale === 'fr' ? 'Suspendre' : 'Suspend'} color="orange" onClick={() => setConfirmAction({ type: 'suspend', seller: selectedSeller })} />
                        )}
                        {selectedSeller.compliance_status === 'suspended' && (
                          <ActionBtn icon={RotateCcw} label={locale === 'fr' ? 'Réactiver' : 'Reactivate'} color="green" onClick={() => setConfirmAction({ type: 'reactivate', seller: selectedSeller })} />
                        )}
                        <ActionBtn icon={Snowflake} label={locale === 'fr' ? 'Geler' : 'Freeze'} color="blue" onClick={() => setConfirmAction({ type: 'freeze', seller: selectedSeller })} />
                        <ActionBtn icon={Ban} label={locale === 'fr' ? 'Bannir' : 'Ban'} color="red" onClick={() => setConfirmAction({ type: 'ban', seller: selectedSeller })} />
                        <ActionBtn icon={AlertTriangle} label={locale === 'fr' ? 'Avertir' : 'Strike'} color="orange" onClick={() => setConfirmAction({ type: 'strike', seller: selectedSeller })} />
                      </div>
                    </Section>
                  </div>
                </div>
              </>
            )}

            {/* DOCUMENT REVIEW */}
            {tab === 'documents' && (
              <div className="animate-fade-up">
                <div className="card p-5 bg-white mb-4">
                  <h3 className="font-semibold text-[#0f172a] mb-3">{locale === 'fr' ? 'Tous les documents' : 'All Documents'}</h3>
                  <p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Sélectionnez un vendeur pour examiner ses documents' : 'Select a seller to review their documents'}</p>
                </div>
                <div className="space-y-3">
                  {sellers.map((s) => (
                    <button key={s.id} onClick={() => handleViewSeller(s)} className="premium-card p-4 bg-white/90 w-full text-left flex items-center gap-3 hover:border-[#0e9f6e] transition-colors rounded-2xl">
                      <FileSearch className="w-5 h-5 text-[#0e9f6e]" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#0f172a]">{s.business_name}</p>
                        <p className="text-xs text-[#64748b]">{s.city} • {s.compliance_status || s.status}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#64748b]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* REPORTS */}
            {tab === 'reports' && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-semibold text-[#0f172a] mb-4">{locale === 'fr' ? 'Signalements clients' : 'Customer Reports'}</h2>
                {reports.length === 0 ? (
                  <div className="card p-8 text-center text-sm text-[#64748b] bg-white">
                    <AlertTriangle className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" />
                    {locale === 'fr' ? 'Aucun signalement' : 'No reports'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((r) => (
                      <div key={r.id} className="premium-card p-4 bg-white/90 rounded-2xl">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-[#0f172a] capitalize">{r.report_type}</span>
                              <Badge color={r.status === 'open' ? '#ef4444' : r.status === 'under_review' ? '#0e9f6e' : r.status === 'resolved' ? '#22c55e' : '#64748b'}>{r.status.replace(/_/g, ' ')}</Badge>
                            </div>
                            <p className="text-xs text-[#64748b] mt-1">{r.target_type} • {r.target_name || r.target_id?.slice(0, 8)}</p>
                            {r.description && <p className="text-sm text-[#0f172a] mt-2">{r.description}</p>}
                            <p className="text-xs text-[#64748b] mt-1">{r.reporter_name || 'Anonymous'} • {new Date(r.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {r.status === 'open' && <button onClick={() => handleReportAction(r.id, 'under_review')} className="px-3 py-2 rounded-lg text-xs font-medium bg-[#0e9f6e]/10 text-[#0e9f6e] hover:bg-[#0e9f6e]/20">{locale === 'fr' ? 'Examiner' : 'Review'}</button>}
                            {(r.status === 'open' || r.status === 'under_review') && <button onClick={() => handleReportAction(r.id, 'resolved')} className="px-3 py-2 rounded-lg text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200">{locale === 'fr' ? 'Résoudre' : 'Resolve'}</button>}
                            {r.status !== 'closed' && <button onClick={() => handleReportAction(r.id, 'closed')} className="px-3 py-2 rounded-lg text-xs font-medium border border-[#e2e8f0] text-[#64748b]">{locale === 'fr' ? 'Fermer' : 'Close'}</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CASES */}
            {tab === 'cases' && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-semibold text-[#0f172a] mb-4">{locale === 'fr' ? 'Cas de conformité' : 'Compliance Cases'}</h2>
                {cases.length === 0 ? (
                  <div className="card p-8 text-center text-sm text-[#64748b] bg-white">
                    <Gavel className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" />
                    {locale === 'fr' ? 'Aucun cas' : 'No cases'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cases.map((c) => (
                      <div key={c.id} className="premium-card p-4 bg-white/90 rounded-2xl">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#0f172a]/5 flex items-center justify-center shrink-0">
                            <Gavel className="w-5 h-5 text-[#0f172a]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-[#0f172a]">{c.case_number}</span>
                              <Badge color={c.status === 'open' ? '#ef4444' : c.status === 'under_review' ? '#0e9f6e' : c.status === 'resolved' ? '#22c55e' : '#64748b'}>{c.status.replace(/_/g, ' ')}</Badge>
                              <Badge color={c.priority === 'high' ? '#ef4444' : c.priority === 'normal' ? '#3b82f6' : '#64748b'}>{c.priority}</Badge>
                              {c.ai_risk_level && <Badge color={c.ai_risk_level === 'critical' ? '#ef4444' : c.ai_risk_level === 'high' ? '#0e9f6e' : '#3b82f6'}>AI: {c.ai_risk_level}</Badge>}
                            </div>
                            <p className="text-xs text-[#64748b] mt-1">{c.seller_name || '—'} • {new Date(c.created_at).toLocaleDateString()}</p>
                            {c.internal_notes && <p className="text-sm text-[#0f172a] mt-2">{c.internal_notes}</p>}
                            {c.resolution && <p className="text-xs text-green-600 mt-1">{locale === 'fr' ? 'Résolu' : 'Resolved'}: {c.resolution}</p>}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {c.status === 'open' && <button onClick={() => handleCaseAction(c.id, 'under_review')} className="px-3 py-2 rounded-lg text-xs font-medium bg-[#0e9f6e]/10 text-[#0e9f6e]">{locale === 'fr' ? 'Examiner' : 'Review'}</button>}
                            {(c.status === 'open' || c.status === 'under_review') && <button onClick={() => handleCaseAction(c.id, 'resolved')} className="px-3 py-2 rounded-lg text-xs font-medium bg-green-100 text-green-700">{locale === 'fr' ? 'Résoudre' : 'Resolve'}</button>}
                            {c.status !== 'closed' && <button onClick={() => handleCaseAction(c.id, 'closed')} className="px-3 py-2 rounded-lg text-xs font-medium border border-[#e2e8f0] text-[#64748b]">{locale === 'fr' ? 'Fermer' : 'Close'}</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STORE HEALTH */}
            {tab === 'health' && (
              <div className="animate-fade-up">
                <h2 className="font-display text-xl font-semibold text-[#0f172a] mb-4">{locale === 'fr' ? 'Santé des boutiques' : 'Store Health Scores'}</h2>
                {healthScores.length === 0 ? (
                  <div className="card p-8 text-center text-sm text-[#64748b] bg-white">
                    <Activity className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" />
                    {locale === 'fr' ? 'Aucun score calculé' : 'No scores calculated'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {healthScores.map((h) => {
                      const seller = sellers.find(s => s.id === h.seller_id);
                      return (
                        <div key={h.id} className="premium-card p-5 bg-white/90 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className="relative w-14 h-14 shrink-0">
                              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                <circle cx="28" cy="28" r="24" fill="none" stroke="#f7f8fa" strokeWidth="4" />
                                <circle cx="28" cy="28" r="24" fill="none" stroke={healthColor(h.health_status)} strokeWidth="4" strokeDasharray={`${(h.health_score / 100) * 150.8} 150.8`} strokeLinecap="round" />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#0f172a]">{h.health_score.toFixed(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-[#0f172a]">{seller?.business_name || h.seller_id.slice(0, 8)}</p>
                                {h.flagged_for_review && <Badge color="#ef4444">{locale === 'fr' ? 'Signalé' : 'Flagged'}</Badge>}
                              </div>
                              <Badge color={healthColor(h.health_status)}>{h.health_status}</Badge>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
                                <ScoreItem label={locale === 'fr' ? 'Vérif.' : 'Verify'} value={h.verification_score} />
                                <ScoreItem label={locale === 'fr' ? 'Commandes' : 'Orders'} value={h.order_completion_score} />
                                <ScoreItem label={locale === 'fr' ? 'Notes' : 'Rating'} value={h.rating_score} />
                                <ScoreItem label={locale === 'fr' ? 'Profil' : 'Profile'} value={h.profile_completeness_score} />
                                <ScoreItem label={locale === 'fr' ? 'Remb.' : 'Refund'} value={h.refund_rate_score} />
                                <ScoreItem label={locale === 'fr' ? 'Plaintes' : 'Complaints'} value={h.complaint_rate_score} />
                                <ScoreItem label={locale === 'fr' ? 'Réponse' : 'Response'} value={h.response_time_score} />
                                <ScoreItem label={locale === 'fr' ? 'Conformité' : 'Compliance'} value={h.compliance_score} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* AUDIT LOGS */}
            {tab === 'audit' && (
              <div className="animate-fade-up">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={locale === 'fr' ? 'Rechercher action, acteur, cible...' : 'Search action, actor, target...'} className="input-field pl-9" />
                  </div>
                </div>
                <div className="premium-card overflow-hidden bg-white/90 rounded-2xl">
                  {filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[#64748b]">
                      <ScrollText className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" />
                      {locale === 'fr' ? 'Aucun journal d\'audit' : 'No audit logs'}
                    </div>
                  ) : (
                    filteredLogs.slice(0, 100).map((l, i) => (
                      <div key={l.id} className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-[#e2e8f0]' : ''}`}>
                        <div className="w-8 h-8 rounded-lg bg-[#0e9f6e]/10 flex items-center justify-center shrink-0">
                          <Activity className="w-4 h-4 text-[#0e9f6e]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0f172a]">{l.action.replace(/\./g, ' → ')}</p>
                          <p className="text-xs text-[#64748b]">
                            {l.actor_name || 'System'} → {l.target_type || ''} • {l.target_name || ''}
                            {l.reason && ` • ${l.reason}`}
                          </p>
                        </div>
                        <span className="text-xs text-[#64748b] shrink-0">{new Date(l.created_at).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRM ACTION MODAL */}
      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          locale={locale}
          onConfirm={(reason) => handleSellerAction(confirmAction.type, confirmAction.seller, reason)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* DOCUMENT VIEWER MODAL */}
      {docViewer && (
        <DocViewerModal
          doc={docViewer}
          locale={locale}
          onAction={(action, notes) => handleDocAction(docViewer, action, notes)}
          onClose={() => setDocViewer(null)}
        />
      )}
    </div>
  );
}

// ============ SUB COMPONENTS ============

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Clock; color: string }) {
  return (
    <div className="premium-card p-4 bg-white/90 rounded-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#0f172a]">{value}</p>
          <p className="text-xs text-[#64748b]">{label}</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-[#0f172a] uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#e2e8f0] last:border-0">
      <span className="text-sm text-[#64748b]">{label}</span>
      <span className="text-sm font-medium text-[#0f172a]">{value}</span>
    </div>
  );
}

function VerifyBadge({ label, verified }: { label: string; verified: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 p-3 rounded-xl ${verified ? 'bg-green-50' : 'bg-[#f7f8fa]'}`}>
      {verified ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-[#64748b]/40" />}
      <span className="text-xs font-medium text-[#0f172a]">{label}</span>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, color, onClick }: { icon: typeof Ban; label: string; color: string; onClick: () => void }) {
  const colors: Record<string, string> = {
    green: 'bg-green-100 text-green-700 hover:bg-green-200',
    red: 'bg-red-100 text-red-700 hover:bg-red-200',
    orange: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
    blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  };
  return (
    <button onClick={onClick} className={`px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${colors[color]}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

function ScoreItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="text-[#64748b]">{label}</span>
      <div className="flex items-center gap-1">
        <div className="w-12 h-1 rounded-full bg-[#f7f8fa] overflow-hidden">
          <div className="h-full rounded-full bg-[#0e9f6e]" style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
        <span className="font-bold text-[#0f172a]">{value.toFixed(0)}</span>
      </div>
    </div>
  );
}

function ConfirmModal({ action, locale, onConfirm, onCancel }: {
  action: { type: string; seller: ComplianceSeller };
  locale: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const needsReason = action.type === 'suspend' || action.type === 'ban' || action.type === 'strike';

  const labels: Record<string, { fr: string; en: string }> = {
    approve: { fr: 'Approuver ce vendeur', en: 'Approve this seller' },
    reject: { fr: 'Rejeter ce vendeur', en: 'Reject this seller' },
    suspend: { fr: 'Suspendre ce vendeur', en: 'Suspend this seller' },
    reactivate: { fr: 'Réactiver ce vendeur', en: 'Reactivate this seller' },
    ban: { fr: 'Bannir ce vendeur', en: 'Ban this seller' },
    freeze: { fr: 'Geler cette boutique', en: 'Freeze this store' },
    unfreeze: { fr: 'Dégeler cette boutique', en: 'Unfreeze this store' },
    strike: { fr: 'Donner un avertissement', en: 'Issue a strike' },
  };
  const label = labels[action.type] || { fr: action.type, en: action.type };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fade-up">
        <h3 className="font-display text-lg font-bold text-[#0f172a] mb-2">{locale === 'fr' ? label.fr : label.en}</h3>
        <p className="text-sm text-[#64748b] mb-4">{action.seller.business_name}</p>
        {needsReason && (
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="input-field mb-4" rows={3} placeholder={locale === 'fr' ? 'Raison (obligatoire)' : 'Reason (required)'} />
        )}
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-lg text-sm font-medium border border-[#e2e8f0] text-[#0f172a]">{locale === 'fr' ? 'Annuler' : 'Cancel'}</button>
          <button onClick={() => onConfirm(reason || undefined)} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#0f172a] text-white">{locale === 'fr' ? 'Confirmer' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}

function DocViewerModal({ doc, locale, onAction, onClose }: {
  doc: SellerDocument;
  locale: string;
  onAction: (action: string, notes?: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState(doc.admin_notes || '');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-fade-up">
        <div className="sticky top-0 bg-white border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between z-10">
          <h3 className="font-display text-lg font-bold text-[#0f172a] capitalize">{doc.doc_type.replace(/_/g, ' ')}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#f7f8fa]"><X className="w-5 h-5 text-[#64748b]" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="rounded-xl overflow-hidden bg-[#f7f8fa] flex items-center justify-center min-h-[300px]">
            {doc.file_url ? <img src={doc.file_url} alt={doc.doc_type} className="max-h-[400px] object-contain" /> : <FileText className="w-16 h-16 text-[#64748b]/30" />}
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Notes internes' : 'Internal Notes'}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" rows={3} placeholder={locale === 'fr' ? 'Notes administrateur...' : 'Admin notes...'} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onAction('approve', notes)} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {locale === 'fr' ? 'Approuver' : 'Approve'}</button>
            <button onClick={() => onAction('reject', notes)} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1.5"><XCircle className="w-4 h-4" /> {locale === 'fr' ? 'Rejeter' : 'Reject'}</button>
            <button onClick={() => onAction('flag', notes)} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200 flex items-center gap-1.5"><Flag className="w-4 h-4" /> {locale === 'fr' ? 'Signaler' : 'Flag'}</button>
            <button onClick={() => onAction('request', notes)} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1.5"><RotateCcw className="w-4 h-4" /> {locale === 'fr' ? 'Remplacer' : 'Request New'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
