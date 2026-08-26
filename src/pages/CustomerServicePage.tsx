import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Logo } from '@/components/Logo';
import {
  Headphones, Package, Truck, RotateCcw, CreditCard, ShieldCheck, User,
  ChevronRight, Search, Mail, Clock, MapPin,
  FileText, Lock, AlertTriangle, Gift, Store,
  ChevronDown, ArrowRight,
} from 'lucide-react';

type CSArticle = { id: string; title: string; desc: string; icon: typeof Package };

export function CustomerServicePage() {
  const { t, locale, navigate } = useApp();
  const [search, setSearch] = useState('');
  const [openArticle, setOpenArticle] = useState<string | null>(null);

  const categories: { title: string; items: CSArticle[] }[] = [
    {
      title: locale === 'fr' ? 'Commandes & Livraison' : 'Orders & Delivery',
      items: [
        { id: 'track-order', title: locale === 'fr' ? 'Suivre ma commande' : 'Track my order', desc: locale === 'fr' ? 'Suivez votre colis en temps réel avec votre numéro de commande' : 'Track your package in real time with your order number', icon: Package },
        { id: 'delivery-times', title: locale === 'fr' ? 'Délais de livraison' : 'Delivery times', desc: locale === 'fr' ? 'Combien de temps prend la livraison ?' : 'How long does delivery take?', icon: Truck },
        { id: 'change-address', title: locale === 'fr' ? 'Modifier mon adresse de livraison' : 'Change my delivery address', desc: locale === 'fr' ? 'Comment modifier l\'adresse après commande' : 'How to change address after ordering', icon: MapPin },
        { id: 'delivery-fees', title: locale === 'fr' ? 'Frais de livraison' : 'Delivery fees', desc: locale === 'fr' ? 'Comment sont calculés les frais de livraison ?' : 'How are delivery fees calculated?', icon: CreditCard },
      ],
    },
    {
      title: locale === 'fr' ? 'Retours & Remboursements' : 'Returns & Refunds',
      items: [
        { id: 'return-policy', title: locale === 'fr' ? 'Politique de retours' : 'Return policy', desc: locale === 'fr' ? 'Comment retourner un produit sous 7 jours' : 'How to return a product within 7 days', icon: RotateCcw },
        { id: 'refund-status', title: locale === 'fr' ? 'Statut de mon remboursement' : 'My refund status', desc: locale === 'fr' ? 'Vérifier le statut de votre remboursement' : 'Check your refund status', icon: CreditCard },
        { id: 'damaged-product', title: locale === 'fr' ? 'Produit endommagé reçu' : 'Received damaged product', desc: locale === 'fr' ? 'Que faire si le produit est endommagé ?' : 'What to do if product is damaged?', icon: AlertTriangle },
      ],
    },
    {
      title: locale === 'fr' ? 'Paiements' : 'Payments',
      items: [
        { id: 'payment-methods', title: locale === 'fr' ? 'Modes de paiement acceptés' : 'Accepted payment methods', desc: locale === 'fr' ? 'Mobile Money, cartes, virement, COD' : 'Mobile Money, cards, bank transfer, COD', icon: CreditCard },
        { id: 'payment-failed', title: locale === 'fr' ? 'Mon paiement a échoué' : 'My payment failed', desc: locale === 'fr' ? 'Que faire en cas d\'échec de paiement ?' : 'What to do if payment fails?', icon: AlertTriangle },
        { id: 'payment-security', title: locale === 'fr' ? 'Sécurité des paiements' : 'Payment security', desc: locale === 'fr' ? 'Comment Zando sécurise vos paiements' : 'How Zando secures your payments', icon: Lock },
      ],
    },
    {
      title: locale === 'fr' ? 'Compte & Sécurité' : 'Account & Security',
      items: [
        { id: 'change-password', title: locale === 'fr' ? 'Modifier mon mot de passe' : 'Change my password', desc: locale === 'fr' ? 'Comment changer votre mot de passe' : 'How to change your password', icon: Lock },
        { id: 'account-settings', title: locale === 'fr' ? 'Paramètres du compte' : 'Account settings', desc: locale === 'fr' ? 'Gérer vos informations personnelles' : 'Manage your personal information', icon: User },
        { id: 'privacy', title: locale === 'fr' ? 'Confidentialité et données' : 'Privacy and data', desc: locale === 'fr' ? 'Comment nous protégeons vos données' : 'How we protect your data', icon: ShieldCheck },
      ],
    },
    {
      title: locale === 'fr' ? 'Vendre sur Zando' : 'Selling on Zando',
      items: [
        { id: 'become-seller', title: locale === 'fr' ? 'Devenir vendeur' : 'Become a seller', desc: locale === 'fr' ? 'Comment ouvrir une boutique sur Zando' : 'How to open a store on Zando', icon: Store },
        { id: 'seller-guide', title: locale === 'fr' ? 'Guide du vendeur' : 'Seller guide', desc: locale === 'fr' ? 'Tout savoir pour réussir sur Zando' : 'Everything to succeed on Zando', icon: FileText },
        { id: 'run-ads', title: locale === 'fr' ? 'Lancer des publicités' : 'Run ads', desc: locale === 'fr' ? 'Promouvoir vos produits avec Zando Ads' : 'Promote your products with Zando Ads', icon: Gift },
      ],
    },
  ];

  const filtered = search
    ? categories.map((c) => ({ ...c, items: c.items.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase())) })).filter((c) => c.items.length > 0)
    : categories;

  const articleContent: Record<string, string> = {
    'track-order': locale === 'fr'
      ? 'Pour suivre votre commande : 1) Allez dans "Mon compte > Mes commandes", 2) Cliquez sur "Suivre" pour voir le statut en temps réel. Vous pouvez aussi utiliser la page de suivi avec votre numéro de commande (ex: ORD-123456).'
      : 'To track your order: 1) Go to "My Account > My Orders", 2) Click "Track" to see real-time status. You can also use the tracking page with your order number (e.g., ORD-123456).',
    'return-policy': locale === 'fr'
      ? 'Vous disposez de 7 jours après réception pour retourner un produit. Le produit doit être dans son état d\'origine avec emballage. Allez dans "Mes commandes" > "Retourner" et indiquez la raison. Le vendeur vous contactera pour organiser la reprise.'
      : 'You have 7 days after receipt to return a product. The product must be in its original condition with packaging. Go to "My Orders" > "Return" and indicate the reason. The seller will contact you to arrange pickup.',
  };

  return (
    <div className="motif-bg min-h-screen">
      <header className="sticky top-0 z-50 safe-top bg-[#0f172a]" style={{ backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('home')}><Logo size={40} variant="light" /></button>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('login')} className="text-sm font-medium text-[#f7f8fa] hover:text-[#ff7a00]">{t.nav.login}</button>
            <button onClick={() => navigate('cart')} className="text-sm font-medium text-[#f7f8fa] hover:text-[#ff7a00]">{locale === 'fr' ? 'Panier' : 'Cart'}</button>
          </div>
        </div>
      </header>

      {/* Hero search */}
      <section className="motif-dark py-12 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            {locale === 'fr' ? "Service Client Zando" : 'Zando Customer Service'}
          </h1>
          <p className="text-sm text-[#f7f8fa]/70 mb-6">
            {locale === 'fr' ? "Nous sommes là pour vous aider 24/7" : 'We are here to help 24/7'}
          </p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={locale === 'fr' ? "Recherchez une question..." : 'Search a question...'} className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a00]" />
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 relative">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Package, label: locale === 'fr' ? 'Suivre commande' : 'Track order', action: () => navigate('delivery') },
            { icon: RotateCcw, label: locale === 'fr' ? 'Retourner produit' : 'Return product', action: () => navigate('info', { k: 'returns' }) },
            { icon: Headphones, label: locale === 'fr' ? 'Contacter support' : 'Contact support', action: () => navigate('info', { k: 'contact' }) },
            { icon: Store, label: locale === 'fr' ? 'Vendre sur Zando' : 'Sell on Zando', action: () => navigate('sell') },
          ].map((q, i) => (
            <button key={i} onClick={q.action} className="card p-4 flex flex-col items-center gap-2 hover:shadow-lg transition-shadow bg-white">
              <div className="w-10 h-10 rounded-xl bg-[#ff7a00]/10 flex items-center justify-center">
                <q.icon className="w-5 h-5 text-[#ff7a00]" />
              </div>
              <span className="text-xs font-semibold text-[#0f172a]">{q.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Help categories */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-8">
          {filtered.map((cat) => (
            <div key={cat.title}>
              <h2 className="font-display text-lg font-bold text-[#0f172a] mb-3 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-[#ff7a00]" /> {cat.title}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {cat.items.map((item) => (
                  <div key={item.id}>
                    <button onClick={() => setOpenArticle(openArticle === item.id ? null : item.id)} className="card p-4 w-full text-left hover:shadow-md transition-shadow bg-white">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#ff7a00]/10 flex items-center justify-center shrink-0">
                          <item.icon className="w-4 h-4 text-[#ff7a00]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#0f172a]">{item.title}</p>
                          <p className="text-xs text-[#64748b] mt-0.5">{item.desc}</p>
                        </div>
                        <ChevronDown className={'w-4 h-4 text-[#64748b] transition-transform shrink-0 ' + (openArticle === item.id ? 'rotate-180' : '')} />
                      </div>
                    </button>
                    {openArticle === item.id && (
                      <div className="card p-4 mt-1 animate-fade-up bg-[#f7f8fa]">
                        <p className="text-sm text-[#0f172a] leading-relaxed">{articleContent[item.id] || (locale === 'fr' ? 'Contenu détaillé disponible. Contactez notre équipe support pour plus d\'informations.' : 'Detailed content available. Contact our support team for more information.')}</p>
                        <button onClick={() => navigate('info', { k: 'contact' })} className="text-xs font-semibold text-[#ff7a00] hover:underline flex items-center gap-1 mt-2">
                          {locale === 'fr' ? 'Contacter le support' : 'Contact support'} <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact methods */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="font-display text-xl font-bold text-[#0f172a] mb-4">{locale === 'fr' ? 'Contactez-nous' : 'Contact us'}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card p-5 bg-white">
            <Mail className="w-8 h-8 text-[#ff7a00] mb-3" />
            <h3 className="font-semibold text-sm text-[#0f172a] mb-1">{locale === 'fr' ? 'Email' : 'Email'}</h3>
            <a href="mailto:cs@liafrik.com" className="text-xs text-[#ff7a00] hover:underline">cs@liafrik.com</a>
            <p className="text-xs text-[#64748b] mt-1">{locale === 'fr' ? 'Réponse sous 24h' : 'Reply within 24h'}</p>
          </div>
          <div className="card p-5 bg-white">
            <Headphones className="w-8 h-8 text-[#ff7a00] mb-3" />
            <h3 className="font-semibold text-sm text-[#0f172a] mb-1">{locale === 'fr' ? 'Support technique' : 'Technical support'}</h3>
            <a href="mailto:support@liafrik.com" className="text-xs text-[#ff7a00] hover:underline">support@liafrik.com</a>
            <p className="text-xs text-[#64748b] mt-1">{locale === 'fr' ? '24/7' : '24/7'}</p>
          </div>
          <div className="card p-5 bg-white">
            <Clock className="w-8 h-8 text-[#ff7a00] mb-3" />
            <h3 className="font-semibold text-sm text-[#0f172a] mb-1">{locale === 'fr' ? 'Disponibilité' : 'Availability'}</h3>
            <p className="text-xs text-[#64748b]">{locale === 'fr' ? '24h/24, 7j/7, 365 jours' : '24/7, 365 days'}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
