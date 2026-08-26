import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { fetchSellers } from '@/lib/db';
import type { Seller } from '@/lib/db';
import { SellerCard } from '@/components/Cards';
import { EmptyState } from '@/components/ui';

export function SellersPage() {
  const { t, geo, params, locale } = useApp();
  const [showOther, setShowOther] = useState(!!params.other);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await fetchSellers({ limit: 50 });
        setSellers(all);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = showOther ? sellers : sellers.filter((s) => s.country_id === geo.countryId);

  if (loading) return <div className="motif-bg min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-[#ff7a00]/20 border-t-[#ff7a00] animate-spin" /></div>;

  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-3xl font-bold text-[#0f172a] mb-2">{t.nav.sellers}</h1>
        <p className="text-sm text-[#64748b] mb-6">{showOther ? (locale === 'fr' ? 'Tous les vendeurs' : 'All sellers') : (locale === 'fr' ? `Vendeurs dans votre pays` : 'Sellers in your country')}</p>
        <div className="flex gap-2 mb-6">
          <button onClick={() => setShowOther(false)} className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${!showOther ? 'btn-cocoa' : 'border border-[#0f172a]/15 text-[#0f172a]'}`}>{locale === 'fr' ? 'Mon pays' : 'My country'}</button>
          <button onClick={() => setShowOther(true)} className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${showOther ? 'btn-cocoa' : 'border border-[#0f172a]/15 text-[#0f172a]'}`}>{t.home.viewOtherCountries}</button>
        </div>
        {filtered.length === 0 ? <EmptyState message={t.catalog.noResults} /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => <SellerCard key={s.id} seller={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
