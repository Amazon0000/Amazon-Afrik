import { useApp } from '@/lib/store';
import { Globe2 } from 'lucide-react';

// Carrousel de pays en défilement automatique continu ("running") — données
// 100% réelles issues de la table `countries` (~192 pays au total : 54
// africains + tout le reste du monde, migrations 021 + 032). La liste est
// dupliquée une fois pour permettre une boucle CSS parfaitement continue ;
// le défilement se met en pause au survol pour rester cliquable.
export function CountryCarousel() {
  const { countries, locale, geo, setGeo, navigate } = useApp();

  const activeCountries = countries.filter((c) => c.is_active);
  if (activeCountries.length === 0) return null;

  const handleSelect = (countryId: string) => {
    setGeo({ countryId });
    navigate('catalog', { country: countryId });
  };

  const renderFlags = (keyPrefix: string) => activeCountries.map((c) => (
    <button
      key={`${keyPrefix}-${c.id}`}
      onClick={() => handleSelect(c.id)}
      className="flex flex-col items-center gap-2 shrink-0 group"
      title={c.name}
    >
      <div className={
        'w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full border-2 transition-all bg-white shadow-sm overflow-hidden ' +
        (geo.countryId === c.id ? 'border-[#ff7a00] ring-2 ring-[#ff7a00]/20' : 'border-[#e2e8f0] group-hover:border-[#ff7a00]/50')
      }>
        <img src={`https://hatscripts.github.io/circle-flags/flags/${c.id.toLowerCase()}.svg`} alt={c.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      </div>
      <span className="text-[11px] font-medium text-[#64748b] group-hover:text-[#0f172a] max-w-[76px] truncate text-center">
        {c.name}
      </span>
    </button>
  ));

  return (
    <section className="max-w-[1500px] mx-auto px-4 py-10">
      <div className="flex items-center gap-2.5 mb-5 px-4">
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

      <div className="relative overflow-hidden mask-fade-x">
        <div className="flex gap-5 country-marquee w-max">
          {renderFlags('a')}
          {renderFlags('b')}
        </div>
      </div>
    </section>
  );
}
