import { useState } from 'react';
import { useApp } from '@/lib/store';
import { countries } from '@/lib/geo';
import { categories } from '@/lib/data';
import { StatCard } from '@/components/ui';
import { Megaphone, MousePointerClick, Eye, Target, Plus, Gift } from 'lucide-react';

type Campaign = {
  id: string;
  name: string;
  country: string;
  city: string;
  category: string;
  duration: number;
  budget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  status: 'active' | 'ended' | 'pending';
};

const mockCampaigns: Campaign[] = [
  { id: 'c1', name: 'Soldes Wax', country: 'ci', city: 'Abidjan', category: 'fashion', duration: 7, budget: 50, impressions: 12400, clicks: 380, conversions: 42, status: 'active' },
  { id: 'c2', name: 'Bijoux Akan', country: 'ci', city: 'Abidjan', category: 'jewelry', duration: 14, budget: 120, impressions: 28900, clicks: 890, conversions: 87, status: 'active' },
  { id: 'c3', name: 'Art Sénoufo', country: 'sn', city: 'Dakar', category: 'art', duration: 5, budget: 30, impressions: 8200, clicks: 210, conversions: 18, status: 'ended' },
];

export function AdsPage() {
  const { t, locale, user } = useApp();
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', country: '', city: '', category: '', duration: 7, budget: 50 });
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['ci']);
  const [placements, setPlacements] = useState({ hero: true, sidebar: false, list: true });

  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const activeCount = campaigns.filter((c) => c.status === 'active').length;

  const launch = () => {
    if (!form.name) return;
    const newCampaign: Campaign = {
      id: `c${Date.now()}`, name: form.name, country: form.country, city: form.city,
      category: form.category, duration: form.duration, budget: form.budget,
      impressions: 0, clicks: 0, conversions: 0, status: 'pending',
    };
    setCampaigns([newCampaign, ...campaigns]);
    setForm({ name: '', country: '', city: '', category: '', duration: 7, budget: 50 });
    setShowForm(false);
  };

  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#0f172a]">{t.ads.title}</h1>
            <p className="text-sm text-[#64748b] mt-1">{t.ads.subtitle}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-gold px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t.ads.createCampaign}
          </button>
        </div>

        {/* Enterprise free ad notice */}
        {user?.sellerPlan === 'enterprise' && (
          <div className="card p-4 mb-6 flex items-center gap-3 bg-[#0e9f6e]/5">
            <Gift className="w-5 h-5 text-[#0e9f6e]" />
            <p className="text-sm text-[#0f172a]">
              {locale === 'fr' ? 'Plan Entreprise : publicité gratuite en avant pendant 7 jours à chaque renouvellement.' : 'Enterprise plan: free featured ad for 7 days on each renewal.'}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label={t.ads.impressions} value={totalImpressions.toLocaleString()} icon={Eye} />
          <StatCard label={t.ads.clicks} value={totalClicks.toLocaleString()} icon={MousePointerClick} trend="+12%" />
          <StatCard label={t.ads.conversions} value={totalConversions.toString()} icon={Target} trend="+8%" />
          <StatCard label={t.ads.activeCampaigns} value={activeCount.toString()} icon={Megaphone} />
        </div>

        {/* Create form */}
        {showForm && (
          <div className="card p-6 mb-6 animate-fade-up">
            <h3 className="font-display text-lg font-bold text-[#0f172a] mb-4">{t.ads.createCampaign}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.ads.campaignName}</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Soldes Wax" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Pays cibles (multiples)' : 'Target Countries (multiple)'}</label>
                <select value="" onChange={(e) => {
                  const val = e.target.value;
                  if (val && !selectedCountries.includes(val)) {
                    setSelectedCountries([...selectedCountries, val]);
                  }
                }} className="input-field">
                  <option value="">—</option>
                  {countries.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                </select>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedCountries.map((code) => {
                    const c = countries.find((x) => x.id.toLowerCase() === code.toLowerCase());
                    return (
                      <span key={code} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0e9f6e]/10 text-[#0e9f6e]">
                        <span>{c?.flag} {c?.name || code.toUpperCase()}</span>
                        <button type="button" onClick={() => setSelectedCountries(selectedCountries.filter((x) => x !== code))} className="text-[#0e9f6e] hover:text-[#0c8a5f] font-bold">×</button>
                      </span>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.ads.targetCity}</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" placeholder="Abidjan" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.ads.targetCategory}</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                  <option value="">—</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name[locale]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.ads.duration}</label>
                <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 7 })} className="input-field" min={1} max={90} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.ads.budget} ($)</label>
                <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: parseInt(e.target.value) || 50 })} className="input-field" min={10} />
              </div>
              <div className="sm:col-span-2 text-left">
                <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Placements publicitaires' : 'Ad Placements'}</label>
                <div className="grid sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#0f172a]/10 cursor-pointer hover:bg-[#0f172a]/5">
                    <input type="checkbox" checked={placements.hero} onChange={(e) => setPlacements({ ...placements, hero: e.target.checked })} className="w-4 h-4 accent-[#0e9f6e]" />
                    <span className="text-xs font-medium text-[#0f172a]">{locale === 'fr' ? 'Bannière d\'accueil Hero' : 'Homepage Hero banner'}</span>
                  </label>
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#0f172a]/10 cursor-pointer hover:bg-[#0f172a]/5">
                    <input type="checkbox" checked={placements.sidebar} onChange={(e) => setPlacements({ ...placements, sidebar: e.target.checked })} className="w-4 h-4 accent-[#0e9f6e]" />
                    <span className="text-xs font-medium text-[#0f172a]">{locale === 'fr' ? 'Barre latérale de recherche' : 'Search Sidebar'}</span>
                  </label>
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#0f172a]/10 cursor-pointer hover:bg-[#0f172a]/5">
                    <input type="checkbox" checked={placements.list} onChange={(e) => setPlacements({ ...placements, list: e.target.checked })} className="w-4 h-4 accent-[#0e9f6e]" />
                    <span className="text-xs font-medium text-[#0f172a]">{locale === 'fr' ? 'Haut de liste sponsorisé' : 'Sponsored Top List'}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Reach Calculator */}
            <div className="mt-6 p-4 rounded-xl bg-[#0e9f6e]/5 border border-[#0e9f6e]/20 grid sm:grid-cols-3 gap-4 text-left">
              <div>
                <p className="text-xs text-[#64748b] font-medium">{locale === 'fr' ? 'Impressions estimées' : 'Est. Impressions'}</p>
                <p className="text-xl font-bold text-[#0f172a] mt-0.5">{(form.budget * form.duration * 240).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b] font-medium">{locale === 'fr' ? 'Clics estimés' : 'Est. Clicks'}</p>
                <p className="text-xl font-bold text-[#0f172a] mt-0.5">{(form.budget * form.duration * 12).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b] font-medium">{locale === 'fr' ? 'Ventes estimées' : 'Est. Conversions'}</p>
                <p className="text-xl font-bold text-[#0f172a] mt-0.5">{(form.budget * form.duration * 1.5).toFixed(0)}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={launch} className="btn-gold px-6 py-2.5 rounded-lg text-sm font-semibold">{t.ads.launch}</button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-lg text-sm font-medium border border-[#0f172a]/15 text-[#0f172a]">{t.common.cancel}</button>
            </div>
          </div>
        )}

        {/* Campaigns list */}
        <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{t.ads.yourCampaigns}</h2>
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
                    <p className="text-xs text-[#64748b]">{c.city} • {categories.find((cat) => cat.id === c.category)?.name[locale] || '—'}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-700' : c.status === 'pending' ? 'bg-[#0e9f6e]/15 text-[#64748b]' : 'bg-gray-100 text-gray-500'}`}>
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
                  <p className="font-bold text-[#0f172a]">{c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : 0}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
