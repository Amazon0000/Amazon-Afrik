import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import {
  fetchProducts, fetchAdvertisingPlans, fetchAdvertisingPlacements,
  createDraftCampaign, initiateAdvertisingPayment, cancelAdvertisingCampaign,
  fetchSellerCampaignsDetailed,
} from '@/lib/db';
import type { Product, AdvertisingPlan, AdvertisingPlacement, AdCampaign } from '@/lib/db';
import { StatCard } from '@/components/ui';
import { Megaphone, MousePointerClick, Eye, Target, Plus, ChevronRight, Check, CreditCard, Smartphone, Landmark, Loader2, X } from 'lucide-react';

type WizardStep = 'product' | 'plan' | 'placement' | 'payment' | 'recap';

const PROVIDER_META: Record<'stripe' | 'flutterwave' | 'payunit', { label: string; icon: typeof CreditCard; hint: { fr: string; en: string } }> = {
  stripe: { label: 'Stripe', icon: CreditCard, hint: { fr: 'Carte bancaire internationale', en: 'International card payment' } },
  flutterwave: { label: 'Flutterwave', icon: Smartphone, hint: { fr: 'Carte, Mobile Money, virement (Afrique)', en: 'Card, Mobile Money, transfer (Africa)' } },
  payunit: { label: 'PayUnit', icon: Landmark, hint: { fr: 'MTN MoMo, Orange Money (Cameroun)', en: 'MTN MoMo, Orange Money (Cameroon)' } },
};

export function AdsPage() {
  const { t, locale, user, navigate, showToast } = useApp();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<AdvertisingPlan[]>([]);
  const [placements, setPlacements] = useState<AdvertisingPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState<WizardStep>('product');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedPlacementId, setSelectedPlacementId] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'flutterwave' | 'payunit'>('stripe');
  const [submitting, setSubmitting] = useState(false);

  const sellerId = user?.sellerId || '';

  const reload = async () => {
    if (!sellerId) { setLoading(false); return; }
    const [prods, camps, adPlans, adPlacements] = await Promise.all([
      fetchProducts({ sellerId, limit: 100 }),
      fetchSellerCampaignsDetailed(sellerId),
      fetchAdvertisingPlans(),
      fetchAdvertisingPlacements(),
    ]);
    setProducts(prods);
    setCampaigns(camps);
    setPlans(adPlans);
    setPlacements(adPlacements);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const availablePlacements = placements.filter((pl) => selectedPlan?.allowed_placements?.includes(pl.id));

  const resetWizard = () => {
    setStep('product'); setSelectedProductId(''); setSelectedPlanId('');
    setSelectedPlacementId(''); setSelectedProvider('stripe'); setShowWizard(false);
  };

  const goNext = () => {
    if (step === 'product' && !selectedProductId) {
      showToast(locale === 'fr' ? 'Sélectionnez un produit' : 'Select a product', 'error'); return;
    }
    if (step === 'plan' && !selectedPlanId) {
      showToast(locale === 'fr' ? 'Sélectionnez une formule' : 'Select a plan', 'error'); return;
    }
    if (step === 'placement' && !selectedPlacementId) {
      showToast(locale === 'fr' ? 'Sélectionnez un emplacement' : 'Select a placement', 'error'); return;
    }
    const order: WizardStep[] = ['product', 'plan', 'placement', 'payment', 'recap'];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  };
  const goBack = () => {
    const order: WizardStep[] = ['product', 'plan', 'placement', 'payment', 'recap'];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  };

  const confirmAndPay = async () => {
    if (!selectedProduct || !selectedPlan || !selectedPlacementId || !sellerId) return;
    setSubmitting(true);
    try {
      const campaignId = await createDraftCampaign({
        sellerId,
        productId: selectedProduct.id,
        planId: selectedPlan.id,
        placementId: selectedPlacementId,
        price: selectedPlan.price,
        currencyCode: selectedPlan.currency_code,
        name: `${selectedPlan.name} — ${selectedProduct.name}`.slice(0, 120),
      });
      if (!campaignId) {
        showToast(locale === 'fr' ? 'Erreur lors de la création de la campagne' : 'Error creating campaign', 'error');
        setSubmitting(false); return;
      }
      const returnUrl = `${window.location.origin}${window.location.pathname}#ads-return`;
      const result = await initiateAdvertisingPayment({ campaignId, provider: selectedProvider, returnUrl });
      if ('error' in result) {
        showToast(result.error, 'error');
        setSubmitting(false); return;
      }
      // Redirection réelle vers la page de paiement du provider — la
      // campagne reste 'pending' tant que le webhook n'a pas confirmé le paiement.
      window.location.href = result.redirectUrl;
    } catch (e) {
      console.error(e);
      showToast(locale === 'fr' ? 'Erreur inattendue' : 'Unexpected error', 'error');
      setSubmitting(false);
    }
  };

  const handleCancel = async (campaignId: string) => {
    const ok = await cancelAdvertisingCampaign(campaignId);
    if (ok) { showToast(locale === 'fr' ? 'Campagne annulée' : 'Campaign cancelled'); reload(); }
    else showToast(locale === 'fr' ? "Impossible d'annuler cette campagne" : 'Could not cancel this campaign', 'error');
  };

  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const activeCount = campaigns.filter((c) => c.status === 'active').length;

  const statusLabel = (c: AdCampaign) => {
    if (c.payment_status === 'pending') return locale === 'fr' ? 'En attente de paiement' : 'Awaiting payment';
    if (c.payment_status === 'failed') return locale === 'fr' ? 'Paiement échoué' : 'Payment failed';
    if (c.payment_status === 'refunded') return locale === 'fr' ? 'Remboursée' : 'Refunded';
    if (c.status === 'active') return locale === 'fr' ? 'Active' : 'Active';
    if (c.status === 'paused') return locale === 'fr' ? 'Suspendue' : 'Paused';
    if (c.status === 'expired') return locale === 'fr' ? 'Expirée' : 'Expired';
    if (c.status === 'cancelled') return locale === 'fr' ? 'Annulée' : 'Cancelled';
    return c.status;
  };
  const statusColor = (c: AdCampaign) => {
    if (c.status === 'active') return 'bg-[#ff7a00]/15 text-[#e06c00]';
    if (c.payment_status === 'pending') return 'bg-amber-100 text-amber-700';
    if (c.payment_status === 'failed' || c.status === 'cancelled') return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-500';
  };

  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <nav className="flex items-center gap-2 text-xs text-[#64748b] mb-6">
          <button onClick={() => navigate('home')} className="hover:text-[#ff7a00]">Zando</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0f172a] font-medium">{t.ads.title}</span>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#0f172a]">{t.ads.title}</h1>
            <p className="text-sm text-[#64748b] mt-1">
              {locale === 'fr'
                ? "Payez pour mettre vos produits en avant. Zando ne prend aucune commission sur vos ventes — la publicité est un service séparé et optionnel."
                : 'Pay to feature your products. Zando takes no commission on your sales — advertising is a separate, optional service.'}
            </p>
          </div>
          <button onClick={() => { resetWizard(); setShowWizard(true); }} className="btn-gold px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t.ads.createCampaign}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label={t.ads.impressions} value={totalImpressions.toLocaleString()} icon={Eye} color="#0284c7" />
          <StatCard label={t.ads.clicks} value={totalClicks.toLocaleString()} icon={MousePointerClick} color="#7c3aed" />
          <StatCard label={t.ads.conversions} value={totalConversions.toString()} icon={Target} color="#3d1f00" />
          <StatCard label={t.ads.activeCampaigns} value={activeCount.toString()} icon={Megaphone} color="#ff7a00" />
        </div>

        {showWizard && (
          <div className="card p-6 mb-6 animate-fade-up relative">
            <button onClick={resetWizard} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[#f7f8fa]"><X className="w-4 h-4 text-[#64748b]" /></button>
            <h3 className="font-display text-lg font-bold text-[#0f172a] mb-1 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#ff7a00]" /> {t.ads.createCampaign}
            </h3>
            <div className="flex items-center gap-1.5 mb-6 mt-3">
              {(['product', 'plan', 'placement', 'payment', 'recap'] as WizardStep[]).map((s, i) => (
                <div key={s} className={'h-1.5 flex-1 rounded-full ' + (['product', 'plan', 'placement', 'payment', 'recap'].indexOf(step) >= i ? 'bg-[#ff7a00]' : 'bg-[#e2e8f0]')} />
              ))}
            </div>

            {step === 'product' && (
              <div>
                <p className="text-xs font-semibold text-[#0f172a] uppercase mb-3">{locale === 'fr' ? '1. Choisissez un produit' : '1. Choose a product'}</p>
                {products.length === 0 ? (
                  <p className="text-sm text-[#64748b]">{locale === 'fr' ? "Vous n'avez pas encore de produit approuvé." : "You don't have any approved product yet."}</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                    {products.map((p) => (
                      <button key={p.id} onClick={() => setSelectedProductId(p.id)}
                        className={'flex items-center gap-3 p-3 rounded-xl border text-left transition-all ' + (selectedProductId === p.id ? 'border-[#ff7a00] bg-[#ff7a00]/5' : 'border-[#e2e8f0] hover:border-[#ff7a00]/50')}>
                        <img src={p.product_images?.[0]?.image_url || ''} className="w-12 h-12 rounded-lg object-cover bg-[#f7f8fa]" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0f172a] truncate">{p.name}</p>
                          <p className="text-xs text-[#64748b]">${p.price}</p>
                        </div>
                        {selectedProductId === p.id && <Check className="w-4 h-4 text-[#ff7a00] ml-auto shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 'plan' && (
              <div>
                <p className="text-xs font-semibold text-[#0f172a] uppercase mb-3">{locale === 'fr' ? '2. Choisissez une formule' : '2. Choose a plan'}</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {plans.map((plan) => (
                    <button key={plan.id} onClick={() => { setSelectedPlanId(plan.id); setSelectedPlacementId(''); }}
                      className={'p-4 rounded-xl border text-left transition-all ' + (selectedPlanId === plan.id ? 'border-[#ff7a00] bg-[#ff7a00]/5' : 'border-[#e2e8f0] hover:border-[#ff7a00]/50')}>
                      <p className="font-semibold text-[#0f172a]">{plan.name}</p>
                      <p className="text-xs text-[#64748b] mt-1">{plan.duration_days} {locale === 'fr' ? 'jours' : 'days'}</p>
                      <p className="text-xl font-bold text-[#ff7a00] mt-2">{plan.currency_code} {plan.price}</p>
                      {plan.description && <p className="text-xs text-[#64748b] mt-1">{plan.description}</p>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'placement' && (
              <div>
                <p className="text-xs font-semibold text-[#0f172a] uppercase mb-3">{locale === 'fr' ? '3. Choisissez un emplacement' : '3. Choose a placement'}</p>
                <div className="grid sm:grid-cols-3 gap-2">
                  {availablePlacements.map((pl) => (
                    <button key={pl.id} onClick={() => setSelectedPlacementId(pl.id)}
                      className={'px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ' + (selectedPlacementId === pl.id ? 'border-[#ff7a00] bg-[#ff7a00]/10 text-[#ff7a00]' : 'border-[#e2e8f0] text-[#64748b] hover:border-[#ff7a00]/50')}>
                      {pl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div>
                <p className="text-xs font-semibold text-[#0f172a] uppercase mb-3">{locale === 'fr' ? '4. Moyen de paiement' : '4. Payment method'}</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {(Object.keys(PROVIDER_META) as Array<'stripe' | 'flutterwave' | 'payunit'>).map((key) => {
                    const meta = PROVIDER_META[key];
                    const Icon = meta.icon;
                    return (
                      <button key={key} onClick={() => setSelectedProvider(key)}
                        className={'p-4 rounded-xl border text-left transition-all ' + (selectedProvider === key ? 'border-[#ff7a00] bg-[#ff7a00]/5' : 'border-[#e2e8f0] hover:border-[#ff7a00]/50')}>
                        <Icon className="w-5 h-5 text-[#ff7a00] mb-2" />
                        <p className="font-semibold text-[#0f172a] text-sm">{meta.label}</p>
                        <p className="text-xs text-[#64748b] mt-1">{meta.hint[locale]}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#64748b] mt-3">
                  {locale === 'fr'
                    ? 'Ce paiement va sur le compte marchand Zando (revenu publicitaire de la marketplace) — jamais sur votre propre PSP.'
                    : "This payment goes to Zando's merchant account (marketplace ad revenue) — never to your own PSP."}
                </p>
              </div>
            )}

            {step === 'recap' && selectedProduct && selectedPlan && (
              <div>
                <p className="text-xs font-semibold text-[#0f172a] uppercase mb-3">{locale === 'fr' ? '5. Récapitulatif' : '5. Summary'}</p>
                <div className="bg-[#0f172a] rounded-xl p-5 text-white space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs text-white/60">{locale === 'fr' ? 'Produit' : 'Product'}</span>
                    <span className="text-sm font-semibold">{selectedProduct.name}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs text-white/60">{locale === 'fr' ? 'Formule' : 'Plan'}</span>
                    <span className="text-sm font-semibold">{selectedPlan.name} ({selectedPlan.duration_days}j)</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs text-white/60">{locale === 'fr' ? 'Emplacement' : 'Placement'}</span>
                    <span className="text-sm font-semibold">{placements.find((p) => p.id === selectedPlacementId)?.name}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs text-white/60">{locale === 'fr' ? 'Paiement via' : 'Payment via'}</span>
                    <span className="text-sm font-semibold">{PROVIDER_META[selectedProvider].label}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-semibold text-white/80">TOTAL</span>
                    <span className="text-2xl font-bold text-[#ff7a00]">{selectedPlan.currency_code} {selectedPlan.price}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {step !== 'product' && (
                <button onClick={goBack} className="px-5 py-2.5 rounded-full text-sm font-medium border border-[#0f172a]/15 text-[#0f172a]">
                  {locale === 'fr' ? 'Retour' : 'Back'}
                </button>
              )}
              {step !== 'recap' ? (
                <button onClick={goNext} className="btn-gold px-6 py-2.5 rounded-full text-sm font-semibold ml-auto">
                  {locale === 'fr' ? 'Continuer' : 'Continue'}
                </button>
              ) : (
                <button onClick={confirmAndPay} disabled={submitting} className="btn-gold px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 ml-auto disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                  {locale === 'fr' ? 'Payer et lancer' : 'Pay and launch'}
                </button>
              )}
            </div>
          </div>
        )}

        <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{t.ads.yourCampaigns}</h2>
        {loading ? (
          <div className="card p-8 text-center text-sm text-[#64748b]">{t.common.loading}</div>
        ) : campaigns.length === 0 ? (
          <div className="card p-8 text-center">
            <Megaphone className="w-12 h-12 text-[#ff7a00]/30 mx-auto mb-3" />
            <p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Aucune campagne. Créez votre première campagne publicitaire !' : 'No campaigns yet. Create your first ad campaign!'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img src={c.products?.product_images?.[0]?.image_url || ''} className="w-10 h-10 rounded-xl object-cover bg-[#ff7a00]/10" />
                    <div>
                      <h3 className="font-semibold text-[#0f172a]">{c.products?.name || c.name}</h3>
                      <p className="text-xs text-[#64748b]">
                        {c.advertising_plans?.name || '—'} • {c.currency_code} {c.price ?? c.budget}
                        {c.expires_at && c.status === 'active' ? ` • ${locale === 'fr' ? 'expire le' : 'expires'} ${new Date(c.expires_at).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={'px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ' + statusColor(c)}>
                    {statusLabel(c)}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 pt-3 border-t border-[#ff7a00]/10">
                  <div>
                    <p className="text-xs text-[#64748b]">{t.ads.impressions}</p>
                    <p className="font-bold text-[#0f172a]">{c.impressions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b]">{t.ads.clicks}</p>
                    <p className="font-bold text-[#0f172a]">{c.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b]">CTR</p>
                    <p className="font-bold text-[#0f172a]">{c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : '0'}%</p>
                  </div>
                  <div className="flex items-center justify-end">
                    {c.payment_status === 'pending' && (
                      <button onClick={() => handleCancel(c.id)} className="text-xs font-semibold text-red-600 hover:underline">
                        {locale === 'fr' ? 'Annuler' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
