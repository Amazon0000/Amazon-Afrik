import { Star, MapPin, BadgeCheck, Crown, Award } from 'lucide-react';
import { useApp } from '@/lib/store';
import { useState, useEffect } from 'react';
import { CountryFlag } from './CountryFlag';

export function Countdown({ endsAt, className = '' }: { endsAt: string; className?: string }) {
  const [remaining, setRemaining] = useState(() => new Date(endsAt).getTime() - Date.now());

  useEffect(() => {
    const timer = setInterval(() => setRemaining(new Date(endsAt).getTime() - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (remaining <= 0) return <span className={className}>00:00:00</span>;

  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');

  return <span className={className}>{h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)}</span>;
}

export function SellerBadge({ plan }: { plan: 'starter' | 'premium' | 'enterprise' }) {
  const Icon = plan === 'enterprise' ? Crown : plan === 'premium' ? Award : BadgeCheck;
  const color = plan === 'enterprise' ? '#ff7a00' : plan === 'premium' ? '#ff7a00' : '#64748b';
  return <Icon className="w-4 h-4" style={{ color }} />;
}

export function Rating({ value, reviews, size = 14 }: { value: number; reviews?: number; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 fill-[#ff7a00] text-[#ff7a00]" style={{ width: size, height: size }} />
      <span className="text-sm font-medium text-[#0f172a]">{value.toFixed(1)}</span>
      {reviews !== undefined && <span className="text-xs text-[#64748b]">({reviews})</span>}
    </div>
  );
}

export function CountryTag({ countryId, cityName }: { countryId: string; cityName?: string }) {
  const { countries } = useApp();
  const country = countries.find((c) => c.id === countryId);
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#64748b]">
      <MapPin className="w-3 h-3" />
      {country && <CountryFlag countryId={country.id} size={14} />} {cityName ? `${cityName}, ` : ''}{country?.name}
    </span>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0f172a]">{title}</h2>
        {subtitle && <p className="text-sm text-[#64748b] mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff7a00]/10 flex items-center justify-center">
        <Star className="w-8 h-8 text-[#ff7a00]/40" />
      </div>
      <p className="text-[#64748b]">{message}</p>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, trend, color = '#ff7a00' }: { label: string; value: string; icon: React.ElementType; trend?: string; color?: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && <span className="text-xs font-semibold" style={{ color }}>{trend}</span>}
      </div>
      <p className="text-2xl font-bold text-[#0f172a]">{value}</p>
      <p className="text-xs text-[#64748b] mt-0.5">{label}</p>
    </div>
  );
}

export function Badge({ children, color = '#ff7a00' }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full" style={{ background: `${color}15`, color }}>
      {children}
    </span>
  );
}
