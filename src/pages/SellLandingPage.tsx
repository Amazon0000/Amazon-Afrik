import { useApp } from '@/lib/store';
import { Logo } from '@/components/Logo';
import { ArrowRight, CheckCircle, TrendingUp, Globe, Shield, Wallet, Users, Package, Truck, Star, ChevronDown, Megaphone, ShoppingBag, Store, Sparkles, Quote, Award } from 'lucide-react';
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
    { icon: Megaphone, title: locale === 'fr' ? 'Publicités Intégrées' : 'Built-in Advertising', desc: locale === 'fr' ? 'Promouvez vos produits avec Zando Ads et atteignez plus de clients.' : 'Promote your products with Zando Ads and reach more customers.' },
  ];

  const steps = [
    { num: 1, title: locale === 'fr' ? 'Créez votre compte' : 'Create your account', desc: locale === 'fr' ? 'Inscrivez-vous gratuitement avec votre e-mail. Aucune carte requise.' : 'Sign up for free with your email. No card required.', icon: Store },
    { num: 2, title: locale === 'fr' ? 'Sélectionnez votre pays' : 'Select your country', desc: locale === 'fr' ? 'Choisissez parmi les 54 pays africains.' : 'Choose from all 54 African countries.', icon: Globe },
    { num: 3, title: locale === 'fr' ? 'Vérifiez votre identité (KYC)' : 'Verify your identity (KYC)', desc: locale === 'fr' ? 'Téléversez vos documents légaux : pièce d\'identité, certificat d\'entreprise, photos du magasin.' : 'Upload legal documents: ID, business certificate, store photos.', icon: Shield },
    { num: 4, title: locale === 'fr' ? 'Configurez votre boutique' : 'Set up your store', desc: locale === 'fr' ? 'Logo, bannière, description, réseaux sociaux et moyen de paiement.' : 'Logo, banner, description, social links and payment method.', icon: ShoppingBag },
    { num: 5, title: locale === 'fr' ? 'Configurez votre paiement' : 'Configure your payment', desc: locale === 'fr' ? 'Mobile Money, Paystack, Flutterwave, Stripe, PayPal ou virement. Les acheteurs paient directement chez vous.' : 'Mobile Money, Paystack, Flutterwave, Stripe, PayPal or bank transfer. Buyers pay directly to you.', icon: Wallet },
    { num: 6, title: locale === 'fr' ? 'Commencez à vendre' : 'Start selling', desc: locale === 'fr' ? 'Ajoutez vos produits, lancez vos publicités, recevez vos premières commandes.' : 'Add products, launch ads, receive your first orders.', icon: Package },
  ];

  const testimonials = [
    { name: 'Awa Koné', business: 'Maison Baoulé', city: 'Abidjan', text: locale === 'fr' ? 'Zando a transformé mon business. Je vends maintenant dans 5 pays africains et reçois mes paiements directement.' : 'Zando transformed my business. I now sell in 5 African countries and receive payments directly.', rating: 5 },
    { name: 'Kwame Mensah', business: 'Accra Tech Hub', city: 'Accra', text: locale === 'fr' ? 'Le paiement direct sans commission change tout. Mes marges sont beaucoup meilleures.' : 'Direct payment without commission changes everything. My margins are much better.', rating: 5 },
    { name: 'Fatou Diallo', business: 'Dakar Fashion', city: 'Dakar', text: locale === 'fr' ? 'L\'onboarding est professionnel et rapide. J\'ai été validée en 24h et j\'ai eu 14 jours gratuits.' : 'The onboarding is professional and fast. I was approved in 24h and got 14 days free.', rating: 5 },
  ];

  const faqs = [
    { q: locale === 'fr' ? 'Combien coûte la vente sur Zando ?' : 'How much does it cost to sell on Zando?', a: locale === 'fr' ? 'La création de compte est gratuite et vous bénéficiez de 14 jours d\'essai gratuit. Après, choisissez un abonnement : Starter ($9/mois), Premium ($29/mois) ou Enterprise ($79/mois). Aucune commission sur les ventes.' : 'Account creation is free and you get a 14-day free trial. After that, choose a subscription: Starter ($9/month), Premium ($29/month) or Enterprise ($79/month). No commission on sales.' },
    { q: locale === 'fr' ? 'Comment suis-je payé ?' : 'How do I get paid?', a: locale === 'fr' ? 'Le client paie directement sur votre compte via Mobile Money, Paystack, Flutterwave, Stripe, PayPal ou virement bancaire. L\'argent va directement chez vous, sans intermédiaire.' : 'The customer pays directly to your account via Mobile Money, Paystack, Flutterwave, Stripe, PayPal or bank transfer. The money goes directly to you, no intermediary.' },
    { q: locale === 'fr' ? 'Qui gère la livraison ?' : 'Who handles delivery?', a: locale === 'fr' ? 'Vous gérez vous-même la livraison de vos produits. Vous choisissez vos modes de livraison (standard, express, point relais, local, international).' : 'You handle delivery of your products yourself. You choose your delivery methods (standard, express, pickup point, local, international).' },
    { q: locale === 'fr' ? 'Quels documents sont nécessaires ?' : 'What documents are needed?', a: locale === 'fr' ? 'Pièce d\'identité (recto/verso + selfie), certificat d\'entreprise, licence commerciale et photo du magasin. Le tout téléversable en ligne pendant l\'onboarding.' : 'ID card (front/back + selfie), company certificate, business license and store photo. All uploadable online during onboarding.' },
    { q: locale === 'fr' ? 'Puis-je vendre dans plusieurs pays ?' : 'Can I sell in multiple countries?', a: locale === 'fr' ? 'Oui, vous pouvez configurer la livraison internationale et vendre dans tous les pays africains.' : 'Yes, you can configure international shipping and sell across all African countries.' },
    { q: locale === 'fr' ? 'Que se passe-t-il après les 14 jours gratuits ?' : 'What happens after the 14-day free trial?', a: locale === 'fr' ? 'Après 14 jours, un abonnement est requis pour continuer à vendre. Si vous ne payez pas, vos produits disparaissent automatiquement de la plateforme.' : 'After 14 days, a subscription is required to continue selling. If you don\'t subscribe, your products are automatically hidden from the platform.' },
  ];

  return (
    <div className="motif-bg min-h-screen">
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
      <section className="motif-dark py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#0e9f6e] blur-3xl" />
          <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-[#0e9f6e] blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0e9f6e]/15 text-[#0e9f6e] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> {locale === 'fr' ? '14 jours gratuits — sans carte' : '14 days free — no card required'}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            {locale === 'fr' ? 'Vendez en Afrique.' : 'Sell in Africa.'}<br />
            {locale === 'fr' ? 'Développez votre business.' : 'Grow your business.'}
          </h1>
          <p className="text-lg text-[#f7f8fa]/70 mb-8 max-w-xl mx-auto">
            {locale === 'fr' ? 'Rejoignez des milliers de vendeurs professionnels sur la marketplace premium d\'Afrique. Paiement direct, sans commission.' : 'Join thousands of professional sellers on Africa\'s premium marketplace. Direct payment, no commission.'}
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
            <div key={i} className="card p-6 hover:shadow-lg transition-shadow">
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
              <div key={s.num} className="flex items-start gap-4 card p-5 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#0e9f6e]/10 flex items-center justify-center shrink-0">
                  <s.icon className="w-5 h-5 text-[#0e9f6e]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0f172a] text-white text-xs font-bold flex items-center justify-center">{s.num}</span>
                    <h3 className="font-semibold text-[#0f172a]">{s.title}</h3>
                  </div>
                  <p className="text-sm text-[#64748b] mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-3xl font-bold text-[#0f172a] text-center mb-10">
          {locale === 'fr' ? 'Ils vendent déjà sur Zando' : 'They already sell on Zando'}
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map((tm, i) => (
            <div key={i} className="card p-6">
              <Quote className="w-8 h-8 text-[#0e9f6e]/30 mb-3" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: tm.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-[#0e9f6e] text-[#0e9f6e]" />)}
              </div>
              <p className="text-sm text-[#0f172a] mb-4 leading-relaxed">"{tm.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0e9f6e]/15 flex items-center justify-center text-sm font-bold text-[#0e9f6e]">{tm.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-semibold text-[#0f172a]">{tm.name}</p>
                  <p className="text-xs text-[#64748b]">{tm.business} • {tm.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold text-[#0f172a] mb-2">
            {locale === 'fr' ? 'Nos tarifs' : 'Our pricing'}
          </h2>
          <p className="text-sm text-[#64748b]">
            {locale === 'fr' ? '14 jours gratuits pour tous les plans. Aucune carte requise.' : '14 days free for all plans. No card required.'}
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { name: 'Starter', price: '$9', features: ['10 products', 'Standard visibility', 'Mobile Money + Paystack', locale === 'fr' ? '1 membre staff' : '1 staff member'], highlight: false },
            { name: 'Premium', price: '$29', features: ['100 products', 'Marketing tools', 'Zando Ads access', 'Advanced analytics', locale === 'fr' ? '5 membres staff' : '5 staff members'], highlight: true },
            { name: 'Enterprise', price: '$79', features: ['Unlimited products', 'Free 7-day featured ad', 'Priority support', 'Premium placement', locale === 'fr' ? '20 membres staff' : '20 staff members'], highlight: false },
          ].map((p) => (
            <div key={p.name} className={'card p-6 relative ' + (p.highlight ? 'ring-2 ring-[#0e9f6e] shadow-xl' : '')}>
              {p.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold rounded-full bg-[#0e9f6e] text-white">{locale === 'fr' ? 'POPULAIRE' : 'POPULAR'}</span>}
              <h3 className="font-display text-xl font-bold text-[#0f172a]">{p.name}</h3>
              <p className="text-3xl font-bold text-[#0e9f6e] mt-2">{p.price}<span className="text-sm text-[#64748b]">/mo</span></p>
              <p className="text-xs text-[#0e9f6e] font-semibold mt-1">{locale === 'fr' ? '14 jours gratuits' : '14 days free'}</p>
              <ul className="mt-4 space-y-2">
                {p.features.map((f, i) => <li key={i} className="flex items-center gap-2 text-sm text-[#0f172a]"><CheckCircle className="w-4 h-4 text-[#0e9f6e] shrink-0" /> {f}</li>)}
              </ul>
              <button onClick={() => navigate('onboarding', { plan: p.name.toLowerCase() })} className={'w-full mt-5 py-2.5 rounded-lg text-sm font-semibold ' + (p.highlight ? 'btn-gold' : 'btn-cocoa')}>{t.plans.choose}</button>
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
                <ChevronDown className={'w-4 h-4 text-[#64748b] transition-transform ' + (openFaq === i ? 'rotate-180' : '')} />
              </button>
              {openFaq === i && <div className="px-4 pb-4 text-sm text-[#64748b] animate-fade-up">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="motif-dark py-16 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-[#0e9f6e] blur-3xl" />
        </div>
        <div className="max-w-2xl mx-auto relative">
          <Award className="w-12 h-12 text-[#0e9f6e] mx-auto mb-4" />
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            {locale === 'fr' ? 'Prêt à commencer ?' : 'Ready to start?'}
          </h2>
          <p className="text-[#f7f8fa]/70 mb-6">
            {locale === 'fr' ? 'Rejoignez Zando aujourd\'hui. Onboarding professionnel en 9 étapes. 14 jours gratuits.' : 'Join Zando today. Professional 9-step onboarding. 14 days free.'}
          </p>
          <button onClick={() => navigate('onboarding')} className="btn-gold px-8 py-4 rounded-xl font-semibold text-lg inline-flex items-center gap-2">
            {t.home.ctaSell} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
