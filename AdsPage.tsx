import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { fetchAdCampaigns, createAdCampaign, type AdCampaign } from '@/lib/db';
import { StatCard } from '@/components/ui';
import { Megaphone, MousePointerClick, Eye, Target, Plus, Gift, Calculator, ChevronRight } from 'lucide-react';

const PLACEMENT_TYPES = [
  { id: 'search', label: { fr: 'Résultats de recherche', en: 'Search results' }, cpm: 2.5 },
  { id: 'homepage', label: { fr: "Page d'accueil", en: 'Homepage banner' }, cpm: 4.0 },
  { id: 'category', label: { fr: 'Page de catégorie', en: 'Category page' }, cpm: 3.0 },
  { id: 'product', label: { fr: 'Page produit similaire', en: 'Related product page' }, cpm: 2.0 },
];

const REACH_LEVELS = [
  { id: 'local', label: { fr: 'Local (ville)', en: 'Local (city)' }, multiplier: 0.6 },
  { id: 'national', label: { fr: 'National (pays)', en: 'National (country)' }, multiplier: 1.0 },
  { id: 'continental', label: { fr: 'Continental (Afrique)', en: 'Continental (Africa)' }, multiplier: 1.8 },
];

export function AdsPage() {
  const { t, locale, user, navigate, showToast, categories, countries } = useApp();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', country: '', city: '', category: '',
    duration: 7, dailyBudget: 5, placement: 'search', reach: 'national',
  });

  useEffect(() => {
    if (!user?.sellerId && !user?.id) return;
    const sellerId = user.sellerId || user.id;
    fetchAdCampaigns(sellerId).then((data) => { setCampaigns(data); setLoading(false); });
  }, [user]);

  const selectedPlacement = PLACEMENT_TYPES.find((p) => p.id === form.placement) || PLACEMENT_TYPES[0];
  const selectedReach = REACH_LEVELS.find((r) => r.id === form.reach) || REACH_LEVELS[1];

  const dailyBudget = form.dailyBudget;
  const duration = form.duration;
  const effectiveCPM = selectedPlacement.cpm * selectedReach.multiplier;
  const estimatedDailyImpressions = Math.round((dailyBudget / effectiveCPM) * 1000);
  const estimatedTotalImpressions = estimatedDailyImpressions * duration;
  const estimatedClicks = Math.round(estimatedTotalImpressions * 0.032);
  const estimatedConversions = Math.round(estimatedClicks * 0.08);
  const totalCost = dailyBudget * duration;
  const avgCpc = estimatedClicks > 0 ? (totalCost / estimatedClicks) : 0;

  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const activeCount = campaigns.filter((c) => c.status === 'active').length;

  const launch = async () => {
    if (!form.name) { showToast(locale === 'fr' ? 'Nom requis' : 'Name required', 'error'); return; }
    if (!user?.sellerId && !user?.id) return;
    const sellerId = user.sellerId || user.id;
    const id = await createAdCampaign({
      sellerId,
      name: form.name,
      targetCountry: form.country || null,
      targetCity: form.city || null,
      targetCategory: form.category || null,
      budget: totalCost,
      durationDays: duration,
    });
    if (id) {
      const newCampaign: AdCampaign = {
        id, seller_id: sellerId, name: form.name,
        target_country: form.country || null, target_city: form.city || null,
        target_category: form.category || null, budget: totalCost,
        duration_days: duration, impressions: 0, clicks: 0, conversions: 0,
        status: 'pending', created_at: new Date().toISOString(),
      };
      setCampaigns([newCampaign, ...campaigns]);
      setForm({ name: '', country: '', city: '', category: '', duration: 7, dailyBudget: 5, placement: 'search', reach: 'national' });
      setShowForm(false);
      showToast(locale === 'fr' ? "Campagne créée — en attente d'approbation" : 'Campaign created — pending approval');
    } else {
      showToast(locale === 'fr' ? 'Erreur lors de la création' : 'Error creating campaign', 'error');
    }
  };

  const rootCategories = categories.filter((c) => !c.parent_id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <nav className="flex items-center gap-2 text-xs text-[#64748b] mb-6">
          <button onClick={() => navigate('home')} className="hover:text-[#0e9f6e]">Zando</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0f172a] font-medium">{t.ads.title}</span>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[#0f172a]">{t.ads.title}</h1>
            <p className="text-sm text-[#64748b] mt-1">{t.ads.subtitle}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-gold px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t.ads.createCampaign}
          </button>
        </div>

        {user?.sellerPlan === 'enterprise' && (
          <div className="card p-4 mb-6 flex items-center gap-3 bg-[#0e9f6e]/5">
            <Gift className="w-5 h-5 text-[#0e9f6e]" />
            <p className="text-sm text-[#0f172a]">
              {locale === 'fr' ? 'Plan Entreprise : publicité gratuite en avant pendant 7 jours à chaque renouvellement.' : 'Enterprise plan: free featured ad for 7 days on each renewal.'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label={t.ads.impressions} value={totalImpressions.toLocaleString()} icon={Eye} />
          <StatCard label={t.ads.clicks} value={totalClicks.toLocaleString()} icon={MousePointerClick} trend="+12%" />
          <StatCard label={t.ads.conversions} value={totalConversions.toString()} icon={Target} trend="+8%" />
          <StatCard label={t.ads.activeCampaigns} value={activeCount.toString()} icon={Megaphone} />
        </div>

        {showForm && (
          <div className="card p-6 mb-6 animate-fade-up">
            <h3 className="font-display text-lg font-bold text-[#0f172a] mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#0e9f6e]" /> {t.ads.createCampaign}
            </h3>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.ads.campaignName}</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder={locale === 'fr' ? 'Soldes Wax' : 'Wax Sale'} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.ads.targetCountry}</label>
                    <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="input-field">
                      <option value="">—</option>
                      {countries.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.ads.targetCity}</label>
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" placeholder="Abidjan" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.ads.targetCategory}</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                    <option value="">—</option>
                    {rootCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Placement' : 'Placement'}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PLACEMENT_TYPES.map((p) => (
                      <button key={p.id} onClick={() => setForm({ ...form, placement: p.id })}
                        className={'px-3 py-2 rounded-lg text-xs font-medium border transition-all ' + (form.placement === p.id ? 'border-[#0e9f6e] bg-[#0e9f6e]/10 text-[#0e9f6e]' : 'border-[#e2e8f0] text-[#64748b] hover:border-[#0e9f6e]/50')}>
                        {p.label[locale]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Portée' : 'Reach'}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {REACH_LEVELS.map((r) => (
                      <button key={r.id} onClick={() => setForm({ ...form, reach: r.id })}
                        className={'px-3 py-2 rounded-lg text-xs font-medium border transition-all ' + (form.reach === r.id ? 'border-[#0e9f6e] bg-[#0e9f6e]/10 text-[#0e9f6e]' : 'border-[#e2e8f0] text-[#64748b] hover:border-[#0e9f6e]/50')}>
                        {r.label[locale]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Budget quotidien ($)' : 'Daily budget ($)'}</label>
                    <input type="number" value={form.dailyBudget} onChange={(e) => setForm({ ...form, dailyBudget: Math.max(1, parseInt(e.target.value) || 5) })} className="input-field" min={1} max={500} />
                    <div className="flex gap-1 mt-2">
                      {[1, 5, 10, 25, 50].map((v) => (
                        <button key={v} onClick={() => setForm({ ...form, dailyBudget: v })} className={'px-2 py-1 text-[10px] rounded font-medium ' + (form.dailyBudget === v ? 'bg-[#0e9f6e] text-white' : 'bg-[#f7f8fa] text-[#64748b]')}>{'$' + v}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.ads.duration}</label>
                    <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Math.max(1, Math.min(90, parseInt(e.target.value) || 7)) })} className="input-field" min={1} max={90} />
                    <div className="flex gap-1 mt-2">
                      {[3, 7, 14, 30].map((v) => (
                        <button key={v} onClick={() => setForm({ ...form, duration: v })} className={'px-2 py-1 text-[10px] rounded font-medium ' + (form.duration === v ? 'bg-[#0e9f6e] text-white' : 'bg-[#f7f8fa] text-[#64748b]')}>{v}d</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-xl p-5 text-white">
                <h4 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#0e9f6e]" /> {locale === 'fr' ? 'Simulateur de coût' : 'Cost Simulator'}
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs text-white/60">{locale === 'fr' ? 'CPM effectif (coût pour 1000 vues)' : 'Effective CPM (cost per 1000 views)'}</span>
                    <span className="text-sm font-bold text-[#0e9f6e]">${effectiveCPM.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs text-white/60">{locale === 'fr' ? 'Budget quotidien' : 'Daily budget'}</span>
                    <span className="text-sm font-bold">${dailyBudget.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs text-white/60">{locale === 'fr' ? 'Durée' : 'Duration'}</span>
                    <span className="text-sm font-bold">{duration} {locale === 'fr' ? 'jours' : 'days'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs text-white/60">{locale === 'fr' ? 'Vues quotidiennes estimées' : 'Est. daily impressions'}</span>
                    <span className="text-sm font-bold">{estimatedDailyImpressions.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs text-white/60">{locale === 'fr' ? 'Vues totales estimées' : 'Est. total impressions'}</span>
                    <span className="text-sm font-bold">{estimatedTotalImpressions.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs text-white/60">{locale === 'fr' ? 'Clics estimés (CTR ~3.2%)' : 'Est. clicks (CTR ~3.2%)'}</span>
                    <span className="text-sm font-bold">{estimatedClicks.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs text-white/60">{locale === 'fr' ? 'Conversions estimées (~8%)' : 'Est. conversions (~8%)'}</span>
                    <span className="text-sm font-bold">{estimatedConversions}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs text-white/60">{locale === 'fr' ? 'Coût par clic (CPC)' : 'Cost per click (CPC)'}</span>
                    <span className="text-sm font-bold text-[#0e9f6e]">${avgCpc.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-semibold text-white/80">{locale === 'fr' ? 'COÛT TOTAL' : 'TOTAL COST'}</span>
                    <span className="text-2xl font-bold text-[#0e9f6e]">${totalCost.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-white/40 mt-4 leading-relaxed">
                  {locale === 'fr'
                    ? 'Estimations basées sur le CPM du placement, la portée et le budget. Les performances réelles peuvent varier. Paiement en USD.'
                    : 'Estimates based on placement CPM, reach, and budget. Actual performance may vary. Payment in USD.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={launch} className="btn-gold px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                <Megaphone className="w-4 h-4" /> {t.ads.launch} — ${totalCost.toFixed(2)}
              </button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-lg text-sm font-medium border border-[#0f172a]/15 text-[#0f172a]">{t.common.cancel}</button>
            </div>
          </div>
        )}

        <h2 className="font-display text-xl font-semibold text-[#0f172a] mb-4">{t.ads.yourCampaigns}</h2>
        {loading ? (
          <div className="card p-8 text-center text-sm text-[#64748b]">{t.common.loading}</div>
        ) : campaigns.length === 0 ? (
          <div className="card p-8 text-center">
            <Megaphone className="w-12 h-12 text-[#0e9f6e]/30 mx-auto mb-3" />
            <p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Aucune campagne. Créez votre première campagne publicitaire !' : 'No campaigns yet. Create your first ad campaign!'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0e9f6e]/10 flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-[#0e9f6e]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0f172a]">{c.name}</h3>
                      <p className="text-xs text-[#64748b]">
                        {c.target_city || '—'} • {c.duration_days} {locale === 'fr' ? 'jours' : 'days'} • ${c.budget}
                      </p>
                    </div>
                  </div>
                  <span className={'px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ' + (c.status === 'active' ? 'bg-green-100 text-green-700' : c.status === 'pending' ? 'bg-[#0e9f6e]/15 text-[#0e9f6e]' : 'bg-gray-100 text-gray-500')}>
                    {c.status}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 pt-3 border-t border-[#0e9f6e]/10">
                  <div>
                    <p className="text-xs text-[#64748b]">{t.ads.impressions}</p>
                    <p className="font-bold text-[#0f172a]">{c.impressions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b]">{t.ads.clicks}</p>
                    <p className="font-bold text-[#0f172a]">{c.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b]">{t.ads.conversions}</p>
                    <p className="font-bold text-[#0f172a]">{c.conversions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b]">CTR</p>
                    <p className="font-bold text-[#0f172a]">{c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : '0'}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
