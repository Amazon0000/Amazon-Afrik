import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { applyForAffiliate, fetchMyAffiliateAccount, fetchAffiliateReferrals, updateAffiliatePayoutDetails } from '@/lib/db';
import type { Affiliate, AffiliateReferral } from '@/lib/db';
import { Users, DollarSign, Link2, Copy, CheckCircle, Clock, XCircle, Megaphone, TrendingUp, Wallet, Loader2 } from 'lucide-react';

const PAYOUT_OPTIONS = ['PayUnit', 'Flutterwave', 'Paystack', 'PayPal', 'Stripe', 'Wise', 'Mobile Money', 'Virement bancaire / Bank transfer'];

export function AffiliatePage() {
  const { t, locale, user, navigate, showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [copied, setCopied] = useState(false);

  const [applyForm, setApplyForm] = useState({ fullName: user?.fullName || '', email: user?.email || '', audience: '' });
  const [submitting, setSubmitting] = useState(false);

  const [payoutForm, setPayoutForm] = useState({ provider: PAYOUT_OPTIONS[0], accountIdentifier: '' });
  const [savingPayout, setSavingPayout] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const acc = await fetchMyAffiliateAccount(user.id);
      setAccount(acc);
      if (acc) {
        setReferrals(await fetchAffiliateReferrals(acc.id));
        setPayoutForm({ provider: acc.payout_provider || PAYOUT_OPTIONS[0], accountIdentifier: acc.payout_account_identifier || '' });
      }
      setLoading(false);
    })();
  }, [user]);

  const submitApplication = async () => {
    if (!user) { navigate('login'); return; }
    if (!applyForm.fullName || !applyForm.email) { showToast(locale === 'fr' ? 'Nom et email requis' : 'Name and email required', 'error'); return; }
    setSubmitting(true);
    const id = await applyForAffiliate({ userId: user.id, fullName: applyForm.fullName, email: applyForm.email, audienceDescription: applyForm.audience });
    setSubmitting(false);
    if (id) {
      const acc = await fetchMyAffiliateAccount(user.id);
      setAccount(acc);
      showToast(locale === 'fr' ? 'Candidature envoyée — en attente de validation' : 'Application submitted — pending review');
    } else {
      showToast(locale === 'fr' ? 'Erreur lors de la candidature' : 'Error submitting application', 'error');
    }
  };

  const savePayout = async () => {
    if (!account || !payoutForm.accountIdentifier) return;
    setSavingPayout(true);
    const ok = await updateAffiliatePayoutDetails(account.id, payoutForm.provider, payoutForm.accountIdentifier);
    setSavingPayout(false);
    if (ok) {
      setAccount({ ...account, payout_provider: payoutForm.provider, payout_account_identifier: payoutForm.accountIdentifier });
      showToast(locale === 'fr' ? 'Moyen de paiement enregistré' : 'Payout method saved');
    }
  };

  const referralLink = account ? `${window.location.origin}${window.location.pathname}?ref=${account.referral_code}` : '';
  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="motif-bg min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#3d1f00] animate-spin" /></div>;

  // Not signed up as an affiliate yet — marketing page + application form.
  if (!account) {
    return (
      <div className="motif-bg min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-[#3d1f00]/10 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8 text-[#3d1f00]" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0f172a]">{locale === 'fr' ? 'Programme d\u2019affiliation Zando' : 'Zando Affiliate Program'}</h1>
            <p className="text-sm text-[#64748b] mt-3 max-w-lg mx-auto">
              {locale === 'fr'
                ? 'Recommandez de nouveaux vendeurs sur Zando et touchez une commission sur les abonnements qu\u2019ils souscrivent — versée par Zando, jamais prélevée sur leurs ventes.'
                : 'Refer new sellers to Zando and earn a commission on the subscriptions they take out — paid by Zando, never deducted from their sales.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <div className="card p-5 bg-white text-center">
              <Link2 className="w-6 h-6 text-[#3d1f00] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0f172a]">{locale === 'fr' ? 'Votre lien unique' : 'Your unique link'}</p>
              <p className="text-xs text-[#64748b] mt-1">{locale === 'fr' ? 'Partagez-le partout' : 'Share it anywhere'}</p>
            </div>
            <div className="card p-5 bg-white text-center">
              <Users className="w-6 h-6 text-[#3d1f00] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0f172a]">{locale === 'fr' ? 'Vendeurs référés' : 'Referred sellers'}</p>
              <p className="text-xs text-[#64748b] mt-1">{locale === 'fr' ? 'Suivez vos parrainages' : 'Track your referrals'}</p>
            </div>
            <div className="card p-5 bg-white text-center">
              <DollarSign className="w-6 h-6 text-[#3d1f00] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0f172a]">{locale === 'fr' ? "Jusqu'à 20% de commission" : 'Up to 20% commission'}</p>
              <p className="text-xs text-[#64748b] mt-1">{locale === 'fr' ? "Sur l'abonnement du vendeur" : "On the seller's subscription"}</p>
            </div>
          </div>

          {!user ? (
            <div className="card p-8 bg-white text-center">
              <p className="text-sm text-[#64748b] mb-4">{locale === 'fr' ? 'Connectez-vous pour postuler au programme d\u2019affiliation.' : 'Sign in to apply to the affiliate program.'}</p>
              <button onClick={() => navigate('login')} className="btn-gold px-6 py-3 rounded-full font-semibold">{t.nav.login}</button>
            </div>
          ) : (
            <div className="card p-6 sm:p-8 bg-white">
              <h2 className="font-display text-lg font-bold text-[#0f172a] mb-4">{locale === 'fr' ? 'Postuler' : 'Apply now'}</h2>
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? 'Nom complet' : 'Full name'}</label>
                    <input value={applyForm.fullName} onChange={(e) => setApplyForm({ ...applyForm, fullName: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">Email</label>
                    <input value={applyForm.email} onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? 'Décrivez votre audience (réseaux sociaux, blog, communauté...)' : 'Describe your audience (social media, blog, community...)'}</label>
                  <textarea value={applyForm.audience} onChange={(e) => setApplyForm({ ...applyForm, audience: e.target.value })} rows={4} className="input-field resize-none" placeholder={locale === 'fr' ? 'Ex : Instagram @moncompte, 15k abonnés, niche e-commerce Afrique...' : 'E.g. Instagram @myaccount, 15k followers, e-commerce niche...'} />
                </div>
                <button onClick={submitApplication} disabled={submitting} className="btn-gold px-6 py-3 rounded-full font-semibold flex items-center gap-2 disabled:opacity-50">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} {locale === 'fr' ? 'Envoyer ma candidature' : 'Submit application'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Application pending review.
  if (account.status === 'pending') {
    return (
      <div className="motif-bg min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 max-w-md text-center bg-white">
          <Clock className="w-10 h-10 text-[#e06c00] mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-[#0f172a] mb-2">{locale === 'fr' ? 'Candidature en cours de révision' : 'Application under review'}</h2>
          <p className="text-sm text-[#64748b]">{locale === 'fr' ? "L'équipe Zando examine votre candidature d'affilié. Vous recevrez une notification dès qu'elle sera traitée." : "The Zando team is reviewing your affiliate application. You'll be notified once it's processed."}</p>
        </div>
      </div>
    );
  }

  if (account.status === 'rejected' || account.status === 'suspended') {
    return (
      <div className="motif-bg min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 max-w-md text-center bg-white">
          <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-[#0f172a] mb-2">{account.status === 'rejected' ? (locale === 'fr' ? 'Candidature refusée' : 'Application rejected') : (locale === 'fr' ? 'Compte suspendu' : 'Account suspended')}</h2>
          {account.rejection_reason && <p className="text-sm text-[#64748b]">{account.rejection_reason}</p>}
        </div>
      </div>
    );
  }

  // Approved — real dashboard.
  const converted = referrals.filter((r) => r.status === 'converted');
  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a] mb-6">{locale === 'fr' ? "Tableau de bord Affilié" : 'Affiliate Dashboard'}</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="card p-4 bg-white">
            <Users className="w-5 h-5 text-[#3d1f00] mb-2" />
            <p className="text-xl font-bold text-[#0f172a]">{referrals.length}</p>
            <p className="text-xs text-[#64748b]">{locale === 'fr' ? 'Vendeurs référés' : 'Referred sellers'}</p>
          </div>
          <div className="card p-4 bg-white">
            <TrendingUp className="w-5 h-5 text-[#3d1f00] mb-2" />
            <p className="text-xl font-bold text-[#0f172a]">{converted.length}</p>
            <p className="text-xs text-[#64748b]">{locale === 'fr' ? 'Convertis (payants)' : 'Converted (paid)'}</p>
          </div>
          <div className="card p-4 bg-white">
            <DollarSign className="w-5 h-5 text-[#3d1f00] mb-2" />
            <p className="text-xl font-bold text-[#0f172a]">${account.total_earned.toFixed(2)}</p>
            <p className="text-xs text-[#64748b]">{locale === 'fr' ? 'Total gagné' : 'Total earned'}</p>
          </div>
          <div className="card p-4 bg-white">
            <Wallet className="w-5 h-5 text-[#3d1f00] mb-2" />
            <p className="text-xl font-bold text-[#0f172a]">${(account.total_earned - account.total_paid).toFixed(2)}</p>
            <p className="text-xs text-[#64748b]">{locale === 'fr' ? 'En attente de paiement' : 'Pending payout'}</p>
          </div>
        </div>

        <div className="card p-5 bg-white mb-6">
          <h2 className="font-display text-lg font-bold text-[#0f172a] mb-3">{locale === 'fr' ? 'Votre lien de parrainage' : 'Your referral link'}</h2>
          <div className="flex gap-2">
            <input readOnly value={referralLink} className="input-field font-mono text-xs flex-1" />
            <button onClick={copyLink} className="btn-cocoa px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0">
              {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? (locale === 'fr' ? 'Copié' : 'Copied') : (locale === 'fr' ? 'Copier' : 'Copy')}
            </button>
          </div>
          <p className="text-xs text-[#64748b] mt-2">{locale === 'fr' ? `Code : ${account.referral_code} · Commission : ${account.commission_rate}% sur le premier abonnement payant` : `Code: ${account.referral_code} · Commission: ${account.commission_rate}% on the first paid subscription`}</p>
        </div>

        <div className="card p-5 bg-white mb-6">
          <h2 className="font-display text-lg font-bold text-[#0f172a] mb-3">{locale === 'fr' ? 'Moyen de paiement' : 'Payout method'}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={payoutForm.provider} onChange={(e) => setPayoutForm({ ...payoutForm, provider: e.target.value })} className="input-field">
              {PAYOUT_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input value={payoutForm.accountIdentifier} onChange={(e) => setPayoutForm({ ...payoutForm, accountIdentifier: e.target.value })} placeholder={locale === 'fr' ? 'Identifiant / numéro de compte' : 'Account identifier'} className="input-field" />
          </div>
          <button onClick={savePayout} disabled={savingPayout} className="btn-cocoa px-5 py-2 rounded-full text-xs font-semibold mt-3 disabled:opacity-50">{locale === 'fr' ? 'Enregistrer' : 'Save'}</button>
        </div>

        <div className="card overflow-hidden bg-white">
          <h2 className="font-display text-lg font-bold text-[#0f172a] p-5 pb-0">{locale === 'fr' ? 'Vendeurs référés' : 'Referred sellers'}</h2>
          {referrals.length === 0 ? (
            <p className="text-sm text-[#64748b] text-center py-10">{locale === 'fr' ? 'Aucun vendeur référé pour le moment — partagez votre lien !' : 'No referred sellers yet — share your link!'}</p>
          ) : (
            <div className="divide-y divide-[#e2e8f0] mt-3">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0f172a] truncate">{r.sellers?.business_name || r.referred_seller_id}</p>
                    <p className="text-xs text-[#64748b]">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  {r.status === 'converted' ? (
                    <span className="text-xs font-bold text-[#3d1f00]">+${r.commission_amount.toFixed(2)}</span>
                  ) : (
                    <span className="text-xs text-[#94a3b8]">{locale === 'fr' ? 'En attente' : 'Pending'}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
