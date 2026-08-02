import { useState, useMemo, useEffect } from 'react';import { useApp } from '@/lib/store';
import { fetchProducts } from '@/lib/db';
import type { Product } from '@/lib/db';
import { ProductCard } from '@/components/Cards';
import { EmptyState } from '@/components/ui';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';

export function CatalogPage() {
  const { t, params, geo, locale, categories, countries } = useApp();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(params.sort || 'popular');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(params.category || '');
  const [showOtherCountries, setShowOtherCountries] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
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
    return result;
  }, [products, minRating, inStockOnly]);

  const rootCategories = categories.filter((c) => !c.parent_id);

  const clearFilters = () => {
    setCategoryFilter('');
    setPriceMin('');
    setPriceMax('');
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('popular');
  };

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-[#0f172a] uppercase tracking-wide mb-2">{t.catalog.category}</label>
        <div className="flex flex-wrap gap-2">
          {rootCategories.map((c) => (
            <button key={c.id} onClick={() => setCategoryFilter(categoryFilter === c.id ? '' : c.id)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${categoryFilter === c.id ? 'bg-[#0f172a] text-[#0e9f6e] border-[#0f172a]' : 'border-[#0f172a]/15 text-[#0f172a] hover:border-[#0e9f6e]'}`}>
              {c.name}
            </button>
          ))}
        </div>
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
              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${minRating === r ? 'bg-[#0f172a] text-[#0e9f6e] border-[#0f172a]' : 'border-[#e2e8f0] text-[#0f172a] hover:border-[#0e9f6e]'}`}>
              {r === 0 ? (locale === 'fr' ? 'Tous' : 'All') : `${r}+`}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="w-4 h-4 accent-[#0e9f6e]" />
        <span className="text-sm text-[#0f172a]">{t.catalog.inStock}</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={showOtherCountries} onChange={(e) => setShowOtherCountries(e.target.checked)} className="w-4 h-4 accent-[#0e9f6e]" />
        <span className="text-sm text-[#0f172a]">{t.home.viewOtherCountries}</span>
      </label>
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
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-[#0f172a]/15 bg-white text-[#0f172a] focus:outline-none focus:border-[#0e9f6e] cursor-pointer">
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
              <div className="text-center py-16"><div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-[#0e9f6e]/20 border-t-[#0e9f6e] animate-spin" /><p className="text-sm text-[#64748b]">{t.common.loading}</p></div>
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
