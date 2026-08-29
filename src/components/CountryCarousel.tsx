import { useRef } from 'react';
import { useApp } from '@/lib/store';
import { ChevronLeft, ChevronRight, Globe2 } from 'lucide-react';

// Carrousel horizontal de pays — données 100% réelles issues de la table
// `countries` (95 pays au total : 54 africains + 41 internationaux, migration
// 021_global_countries). Aucun pays inventé ou codé en dur ici.
export function CountryCarousel() {
  const { countries, locale, geo, setGeo, navigate } = useApp();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const activeCountries = countries.filter((c) => c.is_active);
  if (activeCountries.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  const handleSelect = (countryId: string) => {
    setGeo({ countryId });
    navigate('catalog', { country: countryId });
  };

  return (
    <section className="max-w-[1500px] mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#ff7a00]/10 flex items-center justify-center shrink-0">
            <Globe2 className="w-4.5 h-4.5 text-[#ff7a00]" />
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#0f172a]">
              {locale === 'fr' ? 'Vendeurs dans le monde entier' : 'Sellers around the world'}
            </h2>
            <p className="text-xs text-[#64748b]">
              {locale === 'fr'
                ? `${activeCountries.length} pays connectés — de l'Afrique au reste du monde`
                : `${activeCountries.length} countries connected — from Africa to the rest of the world`}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => scrollBy(-1)} className="w-9 h-9 rounded-full border border-[#e2e8f0] flex items-center justify-center hover:border-[#ff7a00] hover:text-[#ff7a00] transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scrollBy(1)} className="w-9 h-9 rounded-full border border-[#e2e8f0] flex items-center justify-center hover:border-[#ff7a00] hover:text-[#ff7a00] transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={scrollerRef} className="flex gap-5 overflow-x-auto pb-2 scroll-smooth snap-x" style={{ scrollbarWidth: 'none' }}>
        {activeCountries.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelect(c.id)}
            className="flex flex-col items-center gap-2 shrink-0 snap-start group"
            title={c.name}
          >
            <div className={
              'w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center text-3xl sm:text-[32px] border-2 transition-all bg-white shadow-sm ' +
              (geo.countryId === c.id ? 'border-[#ff7a00] ring-2 ring-[#ff7a00]/20' : 'border-[#e2e8f0] group-hover:border-[#ff7a00]/50')
            }>
              {c.flag}
            </div>
            <span className="text-[11px] font-medium text-[#64748b] group-hover:text-[#0f172a] max-w-[76px] truncate text-center">
              {c.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
