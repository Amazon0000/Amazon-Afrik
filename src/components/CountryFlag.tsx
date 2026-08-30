import { useState } from 'react';
import { Globe2 } from 'lucide-react';

// Real, accurate circular SVG flags (not the simplified/inconsistent unicode
// emoji renderings, which some platforms — Windows notably — don't render as
// flags at all). hatscripts/circle-flags is open-source (MIT), free, served
// off GitHub Pages, and uses plain ISO 3166-1 alpha-2 codes.
// https://github.com/HatScripts/circle-flags
export function CountryFlag({ countryId, size = 24, className = '' }: { countryId: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const code = countryId?.toLowerCase();

  if (!code || failed) {
    return (
      <span
        style={{ width: size, height: size }}
        className={`inline-flex items-center justify-center rounded-full bg-[#f7f8fa] border border-[#e2e8f0] shrink-0 ${className}`}
      >
        <Globe2 style={{ width: size * 0.6, height: size * 0.6 }} className="text-[#94a3b8]" />
      </span>
    );
  }

  return (
    <img
      src={`https://hatscripts.github.io/circle-flags/flags/${code}.svg`}
      alt={countryId}
      style={{ width: size, height: size }}
      className={`inline-block rounded-full shrink-0 object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
