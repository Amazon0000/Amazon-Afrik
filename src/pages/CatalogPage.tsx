import { useState, useMemo, useEffect } from 'react';import { useApp } from '@/lib/store';
import { fetchProducts } from '@/lib/db';
import type { Product } from '@/lib/db';
import { ProductCard } from '@/components/Cards';
import { EmptyState } from '@/components/ui';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';

export function CatalogPage() {
  const { t, params, geo, setGeo, locale, categories, countries } = useApp();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(params.sort || 'popular');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(params.category || '');
  const [showOtherCountries, setShowOtherCountries] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [cityFilter, setCityFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const prods = await fetchProducts({
          countryId: showOtherCountries ? undefined : geo.countryId,
          categoryId: categoryFilter || undefined,
          search: params.q || undefined,
          sort: sortBy,
          minPrice: priceMin ? parseFloat(priceMin) : undefined,
          maxPrice: priceMax ? parseFloat(priceMax) : undefined,
          limit: 50,
        });
        setProducts(prods);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [geo.countryId, categoryFilter, sortBy, showOtherCountries, params.q, priceMin, priceMax]);

  const filtered = useMemo(() => {
    let result = products;
    if (minRating > 0) result = result.filter((p) => p.rating >= minRating);
    if (inStockOnly) result = result.filter((p) => p.stock > 0);
    if (cityFilter) result = result.filter((p) => p.sellers?.city === cityFilter);
    if (currencyFilter) result = result.filter((p) => p.currency_code === currencyFilter);
    if (deliveryFilter === 'fast') result = result.filter((p) => p.sellers?.city === geo.cityId);
    return result;
  }, [products, minRating, inStockOnly, cityFilter, currencyFilter, deliveryFilter, geo.cityId]);

  const rootCategories = categories.filter((c) => !c.parent_id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const subCategories = categories.filter((c) => c.parent_id === categoryFilter).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const availableCurrencies = useMemo(() => {
    const codes = new Set(products.map((p) => p.currency_code));
    return Array.from(codes).sort();
  }, [products]);
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    products.forEach((p) => { if (p.sellers?.city) cities.add(p.sellers.city); });
    return Array.from(cities).sort();
  }, [products]);

  const clearFilters = () => {
    setCategoryFilter('');
    setPriceMin('');
    setPriceMax('');
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('popular');
    setCityFilter('');
    setCurrencyFilter('');
    setDeliveryFilter('');
  };

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-[#0f172a] uppercase tracking-wide mb-2">{t.catalog.category}</label>
        <div className="flex flex-wrap gap-2">
          {rootCategories.map((c) => (
            <button key={c.id} onClick={() => setCategoryFilter(categoryFilter === c.id ? '' : c.id)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${categoryFilter === c.id ? 'bg-[#0f172a] text-[#ff7a00] border-[#0f172a]' : 'border-[#0f172a]/15 text-[#0f172a] hover:border-[#ff7a00]'}`}>
              {c.name}
            </button>
          ))}
        </div>
        {subCategories.length > 0 && (
          <div className="mt-2 pl-2 border-l-2 border-[#ff7a00]/20">
            <label className="block text-[10px] font-semibold text-[#64748b] uppercase mb-1.5 mt-2">{t.catalog.subcategory}</label>
            <div className="flex flex-wrap gap-1.5">
              {subCategories.map((sc) => (
                <button key={sc.id} onClick={() => setCategoryFilter(categoryFilter === sc.id ? (subCategories.length > 0 ? sc.parent_id || '' : '') : sc.id)}
                  className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${categoryFilter === sc.id ? 'bg-[#ff7a00] text-white border-[#ff7a00]' : 'border-[#e2e8f0] text-[#64748b] hover:border-[#ff7a00]'}`}>
                  {sc.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#0f172a] uppercase tracking-wide mb-2">{t.catalog.priceRange}</label>
        <div className="flex items-center gap-2">
          <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="0" className="input-field text-sm" />
          <span className="text-[#64748b]">—</span>
          <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="∞" className="input-field text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#0f172a] uppercase tracking-wide mb-2">{t.catalog.rating}</label>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((r) => (
            <button key={r} onClick={() => setMinRating(r)} 
              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${minRating === r ? 'bg-[#0f172a] text-[#ff7a00] border-[#0f172a]' : 'border-[#e2e8f0] text-[#0f172a] hover:border-[#ff7a00]'}`}>
              {r === 0 ? (locale === 'fr' ? 'Tous' : 'All') : `${r}+`}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="w-4 h-4 accent-[#ff7a00]" />
        <span className="text-sm text-[#0f172a]">{t.catalog.inStock}</span>
      </label>
      <div>
        <label className="block text-xs font-semibold text-[#0f172a] uppercase tracking-wide mb-2">{t.catalog.city}</label>
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="input-field text-sm">
          <option value="">{locale === 'fr' ? 'Toutes les villes' : 'All cities'}</option>
          {availableCities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#0f172a] uppercase tracking-wide mb-2">{t.common.currency}</label>
        <div className="flex flex-wrap gap-2">
          {availableCurrencies.map((c) => (
            <button key={c} onClick={() => setCurrencyFilter(currencyFilter === c ? '' : c)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${currencyFilter === c ? 'bg-[#0f172a] text-[#ff7a00] border-[#0f172a]' : 'border-[#0f172a]/15 text-[#0f172a] hover:border-[#ff7a00]'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#0f172a] uppercase tracking-wide mb-2">{locale === 'fr' ? 'Délai de livraison' : 'Delivery time'}</label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'fast', label: locale === 'fr' ? 'Rapide (ma ville)' : 'Fast (my city)' },
            ].map((d) => (
              <button key={d.id} onClick={() => setDeliveryFilter(deliveryFilter === d.id ? '' : d.id)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${deliveryFilter === d.id ? 'bg-[#0f172a] text-[#ff7a00] border-[#0f172a]' : 'border-[#0f172a]/15 text-[#0f172a] hover:border-[#ff7a00]'}`}>
                {d.label}
              </button>
            ))}
        </div>
      </div>
      <div>
        {/* Country moved to top bar */}
      </div>
      <button onClick={clearFilters} className="w-full btn-cocoa py-2.5 rounded-lg text-sm font-medium">{t.catalog.clearFilters}</button>
    </div>
  );

  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#0f172a]">{params.q ? `"${params.q}"` : t.catalog.title}</h1>
            <p className="text-sm text-[#64748b] mt-1">{loading ? t.common.loading : `${filtered.length} ${t.catalog.results}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-[#0f172a]/15 text-[#0f172a]">
              <SlidersHorizontal className="w-4 h-4" /> {t.catalog.filters}
            </button>
            <div className="relative">
              <select value={showOtherCountries ? 'all' : geo.countryId} onChange={(e) => { if (e.target.value === 'all') setShowOtherCountries(true); else { setShowOtherCountries(false); setGeo({ countryId: e.target.value }); } }} className="appearance-none pl-7 pr-7 py-1.5 text-xs rounded-lg border border-[#0f172a]/10 bg-[#f7f8fa] text-[#64748b] focus:outline-none focus:border-[#ff7a00] cursor-pointer">
                <option value="all">{locale === 'fr' ? 'Tous les pays' : 'All countries'}</option>
                {countries.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
              </select>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none">{countries.find((c) => c.id === geo.countryId)?.flag || '🌐'}</span>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#64748b] pointer-events-none" />
            </div>
            <div className="relative">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-[#0f172a]/15 bg-white text-[#0f172a] focus:outline-none focus:border-[#ff7a00] cursor-pointer">
                <option value="popular">{t.catalog.sortPopular}</option>
                <option value="newest">{t.catalog.sortNewest}</option>
                <option value="rating">{t.catalog.sortRating}</option>
                <option value="priceLow">{t.catalog.sortPriceLow}</option>
                <option value="priceHigh">{t.catalog.sortPriceHigh}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <aside className={`fixed lg:sticky inset-0 lg:inset-auto top-0 lg:top-20 z-50 lg:z-0 w-72 lg:w-64 shrink-0 bg-[#f7f8fa] lg:bg-transparent overflow-y-auto transition-transform ${showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="p-4 lg:p-0 pt-20 lg:pt-0">
              <div className="flex items-center justify-between lg:hidden mb-4">
                <h2 className="font-bold text-[#0f172a]">{t.catalog.filters}</h2>
                <button onClick={() => setShowFilters(false)}><X className="w-5 h-5 text-[#0f172a]" /></button>
              </div>
              <FilterPanel />
            </div>
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="text-center py-16"><div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-[#ff7a00]/20 border-t-[#ff7a00] animate-spin" /><p className="text-sm text-[#64748b]">{t.common.loading}</p></div>
            ) : filtered.length === 0 ? (
              <EmptyState message={t.catalog.noResults} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
