import { Star, MapPin, BadgeCheck, Crown, Award } from 'lucide-react';
import { useApp } from '@/lib/store';

export function SellerBadge({ plan }: { plan: 'starter' | 'premium' | 'enterprise' }) {
  const Icon = plan === 'enterprise' ? Crown : plan === 'premium' ? Award : BadgeCheck;
  const color = plan === 'enterprise' ? '#0e9f6e' : plan === 'premium' ? '#ff9900' : '#64748b';
  return <Icon className="w-4 h-4" style={{ color }} />;
}

export function Rating({ value, reviews, size = 14 }: { value: number; reviews?: number; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 fill-[#ff9900] text-[#ff9900]" style={{ width: size, height: size }} />
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
      {country?.flag} {cityName ? `${cityName}, ` : ''}{country?.name}
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
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0e9f6e]/10 flex items-center justify-center">
        <Star className="w-8 h-8 text-[#0e9f6e]/40" />
      </div>
      <p className="text-[#64748b]">{message}</p>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string; icon: React.ElementType; trend?: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#0e9f6e]/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#0e9f6e]" />
        </div>
        {trend && <span className="text-xs font-semibold text-[#0e9f6e]">{trend}</span>}
      </div>
      <p className="text-2xl font-bold text-[#0f172a]">{value}</p>
      <p className="text-xs text-[#64748b] mt-0.5">{label}</p>
    </div>
  );
}

export function Badge({ children, color = '#0e9f6e' }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full" style={{ background: `${color}15`, color }}>
      {children}
    </span>
  );
}
