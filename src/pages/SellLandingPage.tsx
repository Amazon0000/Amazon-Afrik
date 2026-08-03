import { useApp } from '@/lib/store';
import { Logo } from '@/components/Logo';
import { ArrowRight, CheckCircle, TrendingUp, Globe, Shield, Wallet, Users, Package, Truck, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function SellLandingPage() {
  const { t, navigate, locale } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const benefits = [
    { icon: TrendingUp, title: locale === 'fr' ? 'Croissance Garantie' : 'Guaranteed Growth', desc: locale === 'fr' ? 'Accédez à des millions de clients à travers l\'Afrique.' : 'Reach millions of customers across Africa.' },
    { icon: Wallet, title: locale === 'fr' ? 'Paiement Direct' : 'Direct Payment', desc: locale === 'fr' ? 'Recevez votre argent directement, sans commission sur les ventes.' : 'Get paid directly, no commission on sales.' },
    { icon: Truck, title: locale === 'fr' ? 'Livraison Autonome' : 'Self-Delivery', desc: locale === 'fr' ? 'Vous gérez vos propres livraisons et votre logistique.' : 'You manage your own deliveries and logistics.' },
    { icon: Shield, title: locale === 'fr' ? 'Sécurité & Confiance' : 'Security & Trust', desc: locale === 'fr' ? 'KYC strict et système anti-fraude pour protéger votre boutique.' : 'Strict KYC and anti-fraud system to protect your store.' },
    { icon: Globe, title: locale === 'fr' ? 'Multi-Pays' : 'Multi-Country', desc: locale === 'fr' ? 'Vendez dans tous les pays africains depuis une seule plateforme.' : 'Sell across all African countries from one platform.' },
    { icon: Users, title: locale === 'fr' ? 'Support Dédié' : 'Dedicated Support', desc: locale === 'fr' ? 'Une équipe support disponible pour vous accompagner.' : 'A dedicated support team available to help you.' },
  ];

  const steps = [
    { num: 1, title: locale === 'fr' ? 'Créez votre compte' : 'Create your account', desc: locale === 'fr' ? 'Inscrivez-vous avec votre e-mail et vérifiez votre téléphone.' : 'Sign up with your email and verify your phone.' },
    { num: 2, title: locale === 'fr' ? 'Sélectionnez votre pays' : 'Select your country', desc: locale === 'fr' ? 'Choisissez parmi les 54 pays africains.' : 'Choose from all 54 African countries.' },
    { num: 3, title: locale === 'fr' ? 'Vérifiez votre identité' : 'Verify your identity', desc: locale === 'fr' ? 'Téléversez vos documents légaux et KYC.' : 'Upload your legal and KYC documents.' },
    { num: 4, title: locale === 'fr' ? 'Configurez votre boutique' : 'Set up your store', desc: locale === 'fr' ? 'Logo, bannière, description et réseaux sociaux.' : 'Logo, banner, description and social networks.' },
    { num: 5, title: locale === 'fr' ? 'Commencez à vendre' : 'Start selling', desc: locale === 'fr' ? 'Ajoutez vos produits et recevez vos premières commandes.' : 'Add your products and receive your first orders.' },
  ];

  const faqs = [
    { q: locale === 'fr' ? 'Combien coûte la vente sur Zando ?' : 'How much does it cost to sell on Zando?', a: locale === 'fr' ? 'La création de compte est gratuite. Vous choisissez un abonnement: Starter ($9/mois), Premium ($29/mois) ou Enterprise ($79/mois). Aucune commission sur les ventes.' : 'Account creation is free. You choose a subscription: Starter ($9/month), Premium ($29/month) or Enterprise ($79/month). No commission on sales.' },
    { q: locale === 'fr' ? 'Comment suis-je payé ?' : 'How do I get paid?', a: locale === 'fr' ? 'Le client paie directement sur votre compte via Mobile Money, Paystack, Flutterwave, M-Pesa ou carte bancaire. L\'argent va directement chez vous.' : 'The customer pays directly to your account via Mobile Money, Paystack, Flutterwave, M-Pesa or bank card. The money goes directly to you.' },
    { q: locale === 'fr' ? 'Qui gère la livraison ?' : 'Who handles delivery?', a: locale === 'fr' ? 'Vous gérez vous-même la livraison de vos produits. Vous choisissez vos modes de livraison (standard, express, point relais, local).' : 'You handle delivery of your products yourself. You choose your delivery methods (standard, express, pickup point, local).' },
    { q: locale === 'fr' ? 'Quels documents sont nécessaires ?' : 'What documents are needed?', a: locale === 'fr' ? 'Pièce d\'identité, certificat d\'entreprise, licence commerciale et photo du magasin. Le tout téléversable en ligne.' : 'ID card, company certificate, business license and store photo. All uploadable online.' },
    { q: locale === 'fr' ? 'Puis-je vendre dans plusieurs pays ?' : 'Can I sell in multiple countries?', a: locale === 'fr' ? 'Oui, vous pouvez configurer la livraison internationale et vendre dans tous les pays africains.' : 'Yes, you can configure international shipping and sell across all African countries.' },
  ];

  return (
    <div className="motif-bg min-h-screen">
      {/* Nav bar */}
      <header className="sticky top-0 z-50 safe-top bg-[#0f172a]" style={{ backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('home')}><Logo size={40} /></button>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('login')} className="text-sm font-medium text-[#f7f8fa] hover:text-[#0e9f6e]">{t.nav.login}</button>
            <button onClick={() => navigate('onboarding')} className="btn-gold px-5 py-2.5 rounded-lg text-sm font-semibold">{t.home.ctaSell}</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="motif-dark py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            {locale === 'fr' ? 'Vendez en Afrique. Développez votre business.' : 'Sell in Africa. Grow your business.'}
          </h1>
          <p className="text-lg text-[#f7f8fa]/70 mb-8 max-w-xl mx-auto">
            {locale === 'fr' ? 'Rejoignez des milliers de vendeurs professionnels sur la marketplace n°1 d\'Afrique. Paiement direct, sans commission.' : 'Join thousands of professional sellers on Africa\'s #1 marketplace. Direct payment, no commission.'}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => navigate('onboarding')} className="btn-gold px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-2">
              {locale === 'fr' ? 'Commencer à vendre' : 'Start selling'} <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('plans')} className="px-8 py-4 rounded-xl font-semibold text-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors">
              {locale === 'fr' ? 'Voir les tarifs' : 'See pricing'}
            </button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-[#f7f8fa]/60">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 2,400+ {locale === 'fr' ? 'vendeurs' : 'sellers'}</span>
            <span className="flex items-center gap-1"><Package className="w-4 h-4" /> 18,000+ {locale === 'fr' ? 'produits' : 'products'}</span>
            <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> 54 {locale === 'fr' ? 'pays' : 'countries'}</span>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-3xl font-bold text-[#0f172a] text-center mb-10">
          {locale === 'fr' ? 'Pourquoi vendre sur Zando ?' : 'Why sell on Zando?'}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="card p-6">
              <div className="w-12 h-12 rounded-xl bg-[#0e9f6e]/10 flex items-center justify-center mb-4">
                <b.icon className="w-6 h-6 text-[#0e9f6e]" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#0f172a] mb-2">{b.title}</h3>
              <p className="text-sm text-[#64748b]">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white/50 border-y border-[#0e9f6e]/20 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-[#0f172a] text-center mb-10">
            {locale === 'fr' ? 'Comment ça marche' : 'How it works'}
          </h2>
          <div className="space-y-4">
            {steps.map((s) => (
              <div key={s.num} className="flex items-start gap-4 card p-5">
                <div className="w-10 h-10 rounded-full bg-[#0e9f6e] text-[#0f172a] font-bold flex items-center justify-center shrink-0">{s.num}</div>
                <div>
                  <h3 className="font-semibold text-[#0f172a]">{s.title}</h3>
                  <p className="text-sm text-[#64748b] mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing summary */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-3xl font-bold text-[#0f172a] text-center mb-10">
          {locale === 'fr' ? 'Nos tarifs' : 'Our pricing'}
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { name: 'Starter', price: '$9', features: ['10 products', 'Standard visibility', 'No free ads'] },
            { name: 'Premium', price: '$29', features: ['100 products', 'Marketing tools', 'Access to Zando Ads', 'Advanced analytics'], highlight: true },
            { name: 'Enterprise', price: '$79', features: ['Unlimited products', 'Free 7-day featured ad', 'Priority support', 'Premium placement'] },
          ].map((p) => (
            <div key={p.name} className={`card p-6 ${p.highlight ? 'ring-2 ring-[#0e9f6e] shadow-xl' : ''}`}>
              <h3 className="font-display text-xl font-bold text-[#0f172a]">{p.name}</h3>
              <p className="text-3xl font-bold text-[#0e9f6e] mt-2">{p.price}<span className="text-sm text-[#64748b]">/mo</span></p>
              <ul className="mt-4 space-y-2">
                {p.features.map((f, i) => <li key={i} className="flex items-center gap-2 text-sm text-[#0f172a]"><CheckCircle className="w-4 h-4 text-[#0e9f6e]" /> {f}</li>)}
              </ul>
              <button onClick={() => navigate('onboarding')} className={`w-full mt-5 py-2.5 rounded-lg text-sm font-semibold ${p.highlight ? 'btn-gold' : 'btn-cocoa'}`}>{t.plans.choose}</button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-3xl font-bold text-[#0f172a] text-center mb-10">FAQ</h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="card overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
                <span className="font-semibold text-[#0f172a] text-sm">{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-[#64748b] transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && <div className="px-4 pb-4 text-sm text-[#64748b] animate-fade-up">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="motif-dark py-16 text-center px-4">
        <h2 className="font-display text-3xl font-bold text-white mb-4">
          {locale === 'fr' ? 'Prêt à commencer ?' : 'Ready to start?'}
        </h2>
        <p className="text-[#f7f8fa]/70 mb-6">{locale === 'fr' ? 'Rejoignez Zando aujourd\'hui. Onboarding en 12 étapes.' : 'Join Zando today. 12-step onboarding.'}</p>
        <button onClick={() => navigate('onboarding')} className="btn-gold px-8 py-4 rounded-xl font-semibold text-lg inline-flex items-center gap-2">
          {t.home.ctaSell} <ArrowRight className="w-5 h-5" />
        </button>
      </section>
    </div>
  );
}
