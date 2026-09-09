import { useApp } from '@/lib/store';
import { Check, Crown, Award, Star, Zap, Gift } from 'lucide-react';

// Canonical prices in USD — single source of truth, mirrored server-side in
// supabase/functions/subscription-create-payment (never trust a client-sent
// price) and in fetchPlatformRevenue's PLAN_PRICE_USD in src/lib/db.ts.
// Free is permanent (1 active product max); every paid tier includes a
// 14-day free trial before the first real charge.
const PLAN_PRICE_USD: Record<'free' | 'starter' | 'premium' | 'enterprise', number> = {
  free: 0, starter: 9, premium: 29, enterprise: 79,
};

export function PlansPage() {
  const { t, navigate, user, locale, formatPrice, currencyCode } = useApp();

  const plans = [
    {
      id: 'free' as const, name: locale === 'fr' ? 'Gratuit' : 'Free', icon: Gift, color: '#64748b',
      features: locale === 'fr'
        ? ['1 produit actif', 'Boutique en ligne', 'Paiement direct via votre PSP']
        : ['1 active product', 'Online storefront', 'Direct payment via your PSP'],
      highlight: false, permanent: true,
    },
    {
      id: 'starter' as const, name: t.plans.starter, icon: Star, color: '#0284c7',
      features: t.plans.starterFeatures, highlight: false, permanent: false,
    },
    {
      id: 'premium' as const, name: t.plans.premium, icon: Award, color: '#ff7a00',
      features: t.plans.premiumFeatures, highlight: true, permanent: false,
    },
    {
      id: 'enterprise' as const, name: t.plans.enterprise, icon: Crown, color: '#0f172a',
      features: t.plans.enterpriseFeatures, highlight: false, permanent: false,
    },
  ];

  // Free: no payment, no trial — permanent, lands directly in Seller
  // Center. Paid tiers: real checkout through the central PSP, starting
  // with a 14-day free trial — the plan/billing is applied only after the
  // trial ends and (for renewal) a webhook confirms payment, never granted
  // client-side here.
  const choose = (planId: 'free' | 'starter' | 'premium' | 'enterprise') => {
    if (!user) {
      navigate('signup', { plan: planId });
      return;
    }
    if (planId === 'free') {
      navigate('seller-center', { tab: 'subscription' });
      return;
    }
    navigate('seller-center', { tab: 'subscription', plan: planId });
  };

  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-[#0f172a]">{t.plans.title}</h1>
          <p className="text-sm text-[#64748b] mt-2">{t.plans.subtitle}</p>
          <p className="text-xs text-[#64748b] mt-1">{locale === 'fr' ? 'Le plan gratuit est permanent. Chaque plan payant inclut 14 jours d\u2019essai gratuit.' : 'The free plan is permanent. Every paid plan includes a 14-day free trial.'}</p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`card p-7 relative ${plan.highlight ? 'ring-2 ring-[#ff7a00] shadow-2xl scale-[1.02]' : ''}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full bg-[#ff7a00] text-[#0f172a]">
                  {locale === 'fr' ? 'Populaire' : 'Popular'}
                </span>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${plan.color}15` }}>
                  <plan.icon className="w-6 h-6" style={{ color: plan.color }} />
                </div>
                <h3 className="font-display text-xl font-bold text-[#0f172a]">{plan.name}</h3>
              </div>
              <div className="mb-2">
                {PLAN_PRICE_USD[plan.id] === 0 ? (
                  <span className="text-4xl font-bold text-[#0f172a]">{locale === 'fr' ? 'Gratuit' : 'Free'}</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-[#0f172a]">{formatPrice(PLAN_PRICE_USD[plan.id])}</span>
                    <span className="text-sm text-[#64748b]"> {t.plans.perMonth}</span>
                    {currencyCode !== 'USD' && (
                      <p className="text-xs text-[#64748b] mt-1">≈ ${PLAN_PRICE_USD[plan.id]} USD</p>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-[#64748b] mb-6 h-4">
                {plan.permanent ? (locale === 'fr' ? 'Accès permanent' : 'Permanent access') : (locale === 'fr' ? 'Essai gratuit de 14 jours' : '14-day free trial')}
              </p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#0f172a]">
                    <Check className="w-4 h-4 text-[#ff7a00] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => choose(plan.id)}
                disabled={user?.sellerPlan === plan.id}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${user?.sellerPlan === plan.id ? 'bg-[#0f172a]/10 text-[#64748b] cursor-default' : plan.highlight ? 'btn-gold' : 'btn-cocoa'}`}
              >
                {user?.sellerPlan === plan.id ? t.plans.current : t.plans.choose}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-[#ff7a00]/20">
            <Zap className="w-4 h-4 text-[#ff7a00]" />
            <span className="text-xs text-[#64748b]">{locale === 'fr' ? '0% commission sur vos ventes — Zando se rémunère uniquement via les abonnements et la publicité. Votre paiement va directement à votre PSP.' : '0% commission on your sales — Zando earns only through subscriptions and advertising. Your payment goes directly to your PSP.'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
