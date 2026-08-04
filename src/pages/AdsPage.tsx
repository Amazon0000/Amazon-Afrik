import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { categories } from '@/lib/data';
import { StatCard } from '@/components/ui';
import { Megaphone, MousePointerClick, Eye, Target, Plus, Gift, Search, Sparkles, ChevronLeft, BarChart3, TrendingUp, HelpCircle, Check } from 'lucide-react';

type Campaign = {
  id: string;
  name: string;
  countries: string[];
  cities: string[];
  category: string;
  duration: number;
  budget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  status: 'active' | 'ended' | 'pending';
};

const WORLD_TARGET_COUNTRIES = [
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
];

const mockCampaigns: Campaign[] = [
  { id: 'c1', name: 'Soldes d\'Été Wax', countries: ['CI', 'SN'], cities: ['Abidjan', 'Dakar'], category: 'fashion', duration: 7, budget: 150, impressions: 38400, clicks: 1420, conversions: 114, status: 'active' },
  { id: 'c2', name: 'Colliers Akan Gold Campaign', countries: ['CI', 'FR'], cities: ['Abidjan', 'Paris'], category: 'jewelry', duration: 14, budget: 350, impressions: 84900, clicks: 3120, conversions: 247, status: 'active' },
  { id: 'c3', name: 'Masques Artisanaux Teranga', countries: ['SN', 'US'], cities: ['Dakar', 'New York'], category: 'art', duration: 5, budget: 90, impressions: 16500, clicks: 490, conversions: 38, status: 'ended' },
];

export function AdsPage() {
  const { t, locale, user, navigate } = useApp();
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form values
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('fashion');
  const [formDuration, setFormDuration] = useState(7);
  const [formBudget, setFormBudget] = useState(25); // Daily budget

  // Placements state
  const [placementHero, setPlacementHero] = useState(true);
  const [placementSidebar, setPlacementSidebar] = useState(false);
  const [placementFeed, setPlacementFeed] = useState(true);

  // Targets state
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['CI', 'SN']);
  const [selectedCities, setSelectedCities] = useState<string[]>(['Abidjan', 'Dakar']);
  const [newCityInput, setNewCityInput] = useState('');

  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const activeCount = campaigns.filter((c) => c.status === 'active').length;

  const filteredTargetCountries = useMemo(() => {
    if (!searchQuery) return WORLD_TARGET_COUNTRIES;
    return WORLD_TARGET_COUNTRIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  // Real Meta-style forecasting calculations
  // Estimations depend on: Daily Budget, Placements selected, Category interest, Target density.
  const forecastingStats = useMemo(() => {
    const totalBudget = formBudget * formDuration;

    // Base multiplier modified by placement checklist
    let placementMultiplier = 1.0;
    if (placementHero) placementMultiplier += 0.5;
    if (placementSidebar) placementMultiplier += 0.2;
    if (placementFeed) placementMultiplier += 0.4;

    // Demographic reach modifier
    const geographicalReachScore = Math.max(1, selectedCountries.length * 0.8 + selectedCities.length * 0.4);

    // Dynamic metrics
    const dailyReachLow = Math.round(formBudget * 180 * placementMultiplier);
    const dailyReachHigh = Math.round(formBudget * 520 * placementMultiplier * geographicalReachScore);

    const estImpressions = Math.round(totalBudget * 420 * placementMultiplier);

    // Category click-through-rate simulation
    let ctrRate = 0.024; // 2.4% avg
    if (formCategory === 'fashion' || formCategory === 'jewelry') ctrRate = 0.038;
    else if (formCategory === 'electronics') ctrRate = 0.032;

    const estClicks = Math.round(estImpressions * ctrRate);

    // Average conversion rate: ~1.8% to 3%
    const estConversions = Math.round(estClicks * 0.021);

    return {
      dailyReachLow,
      dailyReachHigh,
      estImpressions,
      estClicks,
      estConversions,
      ctr: (ctrRate * 100).toFixed(1)
    };
  }, [formBudget, formDuration, placementHero, placementSidebar, placementFeed, selectedCountries, selectedCities, formCategory]);

  const handleAddCountry = (code: string) => {
    if (!selectedCountries.includes(code)) {
      setSelectedCountries([...selectedCountries, code]);
    }
  };

  const handleRemoveCountry = (code: string) => {
    setSelectedCountries(selectedCountries.filter(c => c !== code));
  };

  const handleAddCity = () => {
    const trimmed = newCityInput.trim();
    if (trimmed && !selectedCities.includes(trimmed)) {
      setSelectedCities([...selectedCities, trimmed]);
      setNewCityInput('');
    }
  };

  const handleRemoveCity = (city: string) => {
    setSelectedCities(selectedCities.filter(c => c !== city));
  };

  const handleLaunch = () => {
    if (!formName.trim()) return;

    const newCamp: Campaign = {
      id: `c-${Date.now()}`,
      name: formName,
      countries: selectedCountries,
      cities: selectedCities,
      category: formCategory,
      duration: formDuration,
      budget: formBudget * formDuration,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      status: 'pending'
    };

    setCampaigns([newCamp, ...campaigns]);
    setFormName('');
    setShowForm(false);
  };

  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Back and Breadcrumbs layout header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('seller-center')} className="p-2 bg-white hover:bg-[#0f172a]/5 rounded-xl border border-[#0f172a]/10 transition-colors shadow-sm">
            <ChevronLeft className="w-4 h-4 text-[#0f172a]" />
          </button>
          <div className="text-xs text-[#64748b]">
            <span className="hover:underline cursor-pointer" onClick={() => navigate('home')}>{t.nav.home}</span>
            <span className="mx-1.5">/</span>
            <span className="hover:underline cursor-pointer" onClick={() => navigate('seller-center')}>{t.nav.sellerCenter}</span>
            <span className="mx-1.5">/</span>
            <span className="text-[#0f172a] font-semibold">{locale === 'fr' ? 'Campagnes Publicitaires' : 'Advertising'}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-[#0f172a] tracking-tight">{t.ads.title}</h1>
            <p className="text-sm text-[#64748b] mt-1">{t.ads.subtitle}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-gold px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 self-start sm:self-auto shadow-md">
            <Plus className="w-4 h-4" /> {t.ads.createCampaign}
          </button>
        </div>

        {/* Enterprise free ad notice */}
        {user?.sellerPlan === 'enterprise' && (
          <div className="card p-4 mb-6 flex items-center gap-3 bg-[#0e9f6e]/5 border border-[#0e9f6e]/15">
            <Gift className="w-5 h-5 text-[#0e9f6e] animate-bounce" />
            <p className="text-sm text-[#0f172a]">
              {locale === 'fr' ? 'Plan Entreprise activé : publicité de vitrine gratuite en vedette pendant 7 jours à chaque renouvellement.' : 'Enterprise plan activated: free storefront featured campaign for 7 days on each billing renewal.'}
            </p>
          </div>
        )}

        {/* Real-Time Advertising Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label={t.ads.impressions} value={totalImpressions.toLocaleString()} icon={Eye} />
          <StatCard label={t.ads.clicks} value={totalClicks.toLocaleString()} icon={MousePointerClick} trend="+18%" />
          <StatCard label={t.ads.conversions} value={totalConversions.toString()} icon={Target} trend="+14.2%" />
          <StatCard label={t.ads.activeCampaigns} value={activeCount.toString()} icon={Megaphone} />
        </div>

        {/* Advanced Meta-style Campaign Creator Form */}
        {showForm && (
          <div className="card p-6 mb-8 animate-fade-up border-2 border-[#0e9f6e]/20 shadow-xl bg-white">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#0f172a]/10">
              <Megaphone className="w-5 h-5 text-[#0e9f6e]" />
              <h3 className="font-display text-lg font-bold text-[#0f172a]">{locale === 'fr' ? 'Créateur de Campagne Publicitaire Professionnelle' : 'Professional Ad Campaign Creator'}</h3>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">

              {/* Configuration Inputs */}
              <div className="lg:col-span-2 space-y-5 text-left">

                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.ads.campaignName}</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Campagne Soldes d'Été 2026"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.ads.targetCategory}</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="input-field"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name[locale]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Durée de diffusion' : 'Campaign Duration'}</label>
                    <select
                      value={formDuration}
                      onChange={(e) => setFormDuration(parseInt(e.target.value) || 7)}
                      className="input-field"
                    >
                      <option value="3">3 {locale === 'fr' ? 'jours' : 'days'}</option>
                      <option value="7">7 {locale === 'fr' ? 'jours' : 'days'}</option>
                      <option value="14">14 {locale === 'fr' ? 'jours' : 'days'}</option>
                      <option value="30">30 {locale === 'fr' ? 'jours' : 'days'}</option>
                    </select>
                  </div>
                </div>

                {/* Daily budget selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#0f172a] uppercase">{locale === 'fr' ? 'Budget Quotidien' : 'Daily Budget'}</label>
                    <span className="text-sm font-bold text-[#0e9f6e]">${formBudget} USD / {locale === 'fr' ? 'jour' : 'day'}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={formBudget}
                    onChange={(e) => setFormBudget(parseInt(e.target.value) || 10)}
                    className="w-full h-2 bg-[#0f172a]/10 rounded-lg appearance-none cursor-pointer accent-[#0e9f6e]"
                  />
                  <div className="flex justify-between text-[10px] text-[#64748b] mt-1">
                    <span>$5 USD</span>
                    <span>$100 USD</span>
                    <span>$200 USD</span>
                  </div>
                </div>

                {/* Ad Placement checklist */}
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Emplacements publicitaires' : 'Ad Placements'}</label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${placementHero ? 'border-[#0e9f6e] bg-[#0e9f6e]/5' : 'border-[#0f172a]/10 bg-white hover:bg-[#0f172a]/5'}`}>
                      <input type="checkbox" checked={placementHero} onChange={(e) => setPlacementHero(e.target.checked)} className="w-4 h-4 accent-[#0e9f6e]" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#0f172a]">Homepage Slider</p>
                        <p className="text-[10px] text-[#64748b]">{locale === 'fr' ? 'Très visible' : 'High Visibility'}</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${placementSidebar ? 'border-[#0e9f6e] bg-[#0e9f6e]/5' : 'border-[#0f172a]/10 bg-white hover:bg-[#0f172a]/5'}`}>
                      <input type="checkbox" checked={placementSidebar} onChange={(e) => setPlacementSidebar(e.target.checked)} className="w-4 h-4 accent-[#0e9f6e]" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#0f172a]">Search Sidebar</p>
                        <p className="text-[10px] text-[#64748b]">{locale === 'fr' ? 'Ciblage précis' : 'Precise intent'}</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${placementFeed ? 'border-[#0e9f6e] bg-[#0e9f6e]/5' : 'border-[#0f172a]/10 bg-white hover:bg-[#0f172a]/5'}`}>
                      <input type="checkbox" checked={placementFeed} onChange={(e) => setPlacementFeed(e.target.checked)} className="w-4 h-4 accent-[#0e9f6e]" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#0f172a]">Sponsored Feed</p>
                        <p className="text-[10px] text-[#64748b]">{locale === 'fr' ? 'Plus de clics' : 'More Clicks'}</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Multi-Country and Multi-City targeting */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1">{locale === 'fr' ? 'Pays cibles' : 'Target Countries'}</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#64748b]" />
                      <input
                        type="text"
                        placeholder={locale === 'fr' ? 'Rechercher pays...' : 'Search countries...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field text-xs pl-8 py-2 mb-2"
                      />
                    </div>
                    <div className="border border-[#0f172a]/10 rounded-xl p-2 max-h-[140px] overflow-y-auto bg-white space-y-1">
                      {filteredTargetCountries.map((c) => (
                        <button
                          type="button"
                          key={c.code}
                          onClick={() => handleAddCountry(c.code)}
                          className={`w-full text-left p-1.5 rounded text-xs flex items-center justify-between hover:bg-[#0f172a]/5 transition-colors ${selectedCountries.includes(c.code) ? 'bg-[#0e9f6e]/5 font-semibold text-[#0e9f6e]' : 'text-[#0f172a]'}`}
                        >
                          <span>{c.flag} {c.name}</span>
                          {selectedCountries.includes(c.code) && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                    {/* Selected badge chips */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedCountries.map((code) => {
                        const target = WORLD_TARGET_COUNTRIES.find(x => x.code === code);
                        return (
                          <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0e9f6e]/10 text-[#0e9f6e] text-[10px] font-bold">
                            <span>{target?.flag} {code}</span>
                            <button type="button" onClick={() => handleRemoveCountry(code)} className="hover:text-red-600 font-extrabold">×</button>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1">{locale === 'fr' ? 'Villes cibles' : 'Target Cities'}</label>
                    <div className="flex gap-1.5 mb-2">
                      <input
                        type="text"
                        placeholder="e.g. Abidjan, Nairobi..."
                        value={newCityInput}
                        onChange={(e) => setNewCityInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCity(); } }}
                        className="input-field text-xs py-2"
                      />
                      <button
                        type="button"
                        onClick={handleAddCity}
                        className="btn-green text-xs font-semibold px-3 py-2 rounded-xl"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-[140px] overflow-y-auto">
                      {selectedCities.map((city) => (
                        <span key={city} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ff9900]/10 text-[#ff9900] text-[10px] font-bold">
                          <span>{city}</span>
                          <button type="button" onClick={() => handleRemoveCity(city)} className="hover:text-red-600 font-extrabold">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Dynamic Meta-style Simulator Forecasting Card */}
              <div className="bg-[#0f172a] text-white rounded-2xl p-5 border border-[#e2e8f0]/10 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                    <p className="font-semibold text-xs text-white/60 tracking-wider uppercase flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-[#ff9900]" />
                      {locale === 'fr' ? 'Estimation des résultats' : 'Forecasting Simulator'}
                    </p>
                    <HelpCircle className="w-4 h-4 text-white/40" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-white/50 uppercase font-semibold">{locale === 'fr' ? 'Portée Quotidienne Estimée' : 'Estimated Daily Reach'}</p>
                      <p className="text-xl font-black text-[#ff9900] tracking-tight mt-0.5">
                        {forecastingStats.dailyReachLow.toLocaleString()} - {forecastingStats.dailyReachHigh.toLocaleString()} <span className="text-xs font-medium text-white/60">{locale === 'fr' ? 'utilisateurs' : 'users'}</span>
                      </p>
                      <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-[#ff9900] h-full rounded-full animate-pulse" style={{ width: '65%' }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                      <div>
                        <p className="text-[10px] text-white/50 uppercase font-semibold">{locale === 'fr' ? 'Impressions Totale' : 'Total Impressions'}</p>
                        <p className="text-lg font-bold mt-0.5">{forecastingStats.estImpressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/50 uppercase font-semibold">{locale === 'fr' ? 'Taux de Clic (CTR)' : 'Ad Click Rate'}</p>
                        <p className="text-lg font-bold text-[#0e9f6e] mt-0.5">{forecastingStats.ctr}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                      <div>
                        <p className="text-[10px] text-white/50 uppercase font-semibold">{locale === 'fr' ? 'Estimation des Clics' : 'Estimated Clicks'}</p>
                        <p className="text-lg font-bold mt-0.5">{forecastingStats.estClicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/50 uppercase font-semibold">{locale === 'fr' ? 'Ventes Estimées' : 'Est. Conversions'}</p>
                        <p className="text-lg font-bold text-[#0e9f6e] mt-0.5">
                          {forecastingStats.estConversions.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/10 text-left">
                    <p className="text-[10px] text-white/70 leading-relaxed">
                      {locale === 'fr' ? '💡 Ce calculateur reproduit précisément les estimations de portée basées sur l\'intensité d\'exposition, le budget cumulé de' : '💡 This simulator outputs professional reach calculations based on cumulative total budget of'} <strong>${(formBudget * formDuration)} USD</strong>.
                    </p>
                  </div>
                </div>

                <div className="pt-6">
                  <div className="flex gap-2">
                    <button onClick={handleLaunch} className="flex-1 btn-gold py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> {t.ads.launch}
                    </button>
                    <button onClick={() => setShowForm(false)} className="px-4 py-3 rounded-xl text-xs font-semibold border border-white/20 hover:bg-white/5">
                      {t.common.cancel}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Campaigns list */}
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#ff9900]" />
          <h2 className="font-display text-xl font-bold text-[#0f172a]">{t.ads.yourCampaigns}</h2>
        </div>

        <div className="space-y-4">
          {campaigns.map((c) => (
            <div key={c.id} className="card p-5 bg-white border border-[#0f172a]/10 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0e9f6e]/10 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5 text-[#0e9f6e]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#0f172a]">{c.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[#64748b]">
                        {categories.find((cat) => cat.id === c.category)?.name[locale] || 'Fashion'}
                      </span>
                      <span className="text-[10px] text-[#64748b]/40">•</span>
                      <span className="text-[10px] text-[#64748b] truncate max-w-[200px]">
                        {c.countries.join(', ')} ({c.cities.join(', ')})
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full self-start sm:self-auto ${c.status === 'active' ? 'bg-green-100 text-green-700' : c.status === 'pending' ? 'bg-[#0e9f6e]/15 text-[#0e9f6e]' : 'bg-gray-100 text-gray-500'}`}>
                  {c.status}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-[#0f172a]/10">
                <div>
                  <p className="text-[10px] text-[#64748b] uppercase font-bold">{t.ads.impressions}</p>
                  <p className="text-base font-extrabold text-[#0f172a]">{c.impressions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#64748b] uppercase font-bold">{t.ads.clicks}</p>
                  <p className="text-base font-extrabold text-[#0f172a]">{c.clicks.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#64748b] uppercase font-bold">{t.ads.conversions}</p>
                  <p className="text-base font-extrabold text-[#0f172a]">{c.conversions}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#64748b] uppercase font-bold">CTR</p>
                  <p className="text-base font-extrabold text-[#0f172a]">{c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : 0}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
