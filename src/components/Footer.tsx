import { useApp } from '@/lib/store';
import { Logo } from './Logo';
import { ShieldCheck, Truck, Globe, Headphones } from 'lucide-react';

type FooterLink = { label: string; page: string; params?: Record<string, string> };

export function Footer() {
  const { t, navigate, locale } = useApp();

  const sections: { title: string; items: FooterLink[] }[] = [
    {
      title: locale === 'fr' ? 'Zando' : 'Zando',
      items: [
        { label: t.nav.becomeSeller, page: 'sell' },
        { label: t.nav.sellers, page: 'sellers' },
        { label: t.nav.plans, page: 'plans' },
        { label: t.nav.ads, page: 'ads' },
        { label: locale === 'fr' ? 'Carrières' : 'Careers', page: 'info', params: { k: 'careers' } },
      ],
    },
    {
      title: locale === 'fr' ? 'Aide' : 'Help',
      items: [
        { label: locale === 'fr' ? "Centre d'aide" : 'Help Center', page: 'info', params: { k: 'help' } },
        { label: locale === 'fr' ? 'Suivi de commande' : 'Track Order', page: 'delivery' },
        { label: locale === 'fr' ? 'Retours' : 'Returns', page: 'info', params: { k: 'returns' } },
        { label: locale === 'fr' ? 'Livraison' : 'Shipping', page: 'info', params: { k: 'shipping' } },
        { label: locale === 'fr' ? 'Modes de paiement' : 'Payment Methods', page: 'info', params: { k: 'payment-methods' } },
        { label: locale === 'fr' ? 'Contact' : 'Contact', page: 'info', params: { k: 'contact' } },
      ],
    },
    {
      title: locale === 'fr' ? 'À propos' : 'About',
      items: [
        { label: locale === 'fr' ? 'À propos de Zando' : 'About Zando', page: 'info', params: { k: 'about' } },
        { label: locale === 'fr' ? 'Comment vendre' : 'How to Sell', page: 'info', params: { k: 'sell-guide' } },
      ],
    },
    {
      title: locale === 'fr' ? 'Légal' : 'Legal',
      items: [
        { label: locale === 'fr' ? "Conditions d'utilisation" : 'Terms of Use', page: 'info', params: { k: 'terms' } },
        { label: locale === 'fr' ? 'Confidentialité' : 'Privacy', page: 'info', params: { k: 'privacy' } },
        { label: locale === 'fr' ? 'Cookies' : 'Cookies', page: 'info', params: { k: 'cookies' } },
        { label: locale === 'fr' ? 'Mentions légales' : 'Legal Notice', page: 'info', params: { k: 'legal-notice' } },
      ],
    },
  ];

  return (
    <footer className="bg-white border-t border-[#e2e8f0] mt-12">
      {/* Trust bar */}
      <div className="border-b border-[#e2e8f0] bg-gradient-to-r from-[#f7f8fa] via-white to-[#f0faf5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, title: locale === 'fr' ? 'Vendeurs Vérifiés' : 'Verified Sellers', desc: locale === 'fr' ? 'KYC strict pour tous' : 'Strict KYC for all' },
              { icon: Truck, title: locale === 'fr' ? 'Livraison Vendeur' : 'Seller Delivery', desc: locale === 'fr' ? 'Livré par le vendeur' : 'Delivered by seller' },
              { icon: Globe, title: locale === 'fr' ? '54 Pays' : '54 Countries', desc: locale === 'fr' ? "Toute l'Afrique" : 'All of Africa' },
              { icon: Headphones, title: locale === 'fr' ? 'Support 24/7' : '24/7 Support', desc: locale === 'fr' ? 'Assistance dédiée' : 'Dedicated support' },
            ].map((item, i) => (
              <div key={i} className="premium-card flex items-center gap-3 rounded-2xl p-3">
                <div className="w-10 h-10 rounded-xl bg-[#0e9f6e]/10 flex items-center justify-center shrink-0 soft-glow">
                  <item.icon className="w-5 h-5 text-[#0e9f6e]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0f172a]">{item.title}</p>
                  <p className="text-xs text-[#64748b]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Logo size={32} />
            <p className="text-xs text-[#64748b] mt-3 max-w-xs">{locale === 'fr' ? "La marketplace premium pour l'Afrique. Achetez et vendez en toute confiance." : 'The premium marketplace for Africa. Buy and sell with confidence.'}</p>
            <div className="mt-4 space-y-1">
              <a href="mailto:cs@liafrik.com" className="block text-xs text-[#64748b] hover:text-[#0e9f6e] transition-colors">cs@liafrik.com</a>
              <a href="mailto:zando@liafrik.com" className="block text-xs text-[#64748b] hover:text-[#0e9f6e] transition-colors">zando@liafrik.com</a>
              <a href="mailto:support@liafrik.com" className="block text-xs text-[#64748b] hover:text-[#0e9f6e] transition-colors">support@liafrik.com</a>
            </div>
          </div>
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-[#0f172a] mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <button onClick={() => navigate(item.page, item.params)} className="text-xs text-[#64748b] hover:text-[#0e9f6e] transition-colors text-left">
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#64748b]">© 2026 Zando. {locale === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}</p>
          <div className="flex items-center gap-4 text-xs text-[#64748b]">
            <span>🇨🇮 🇸🇳 🇳🇬 🇰🇪 🇬🇭 🇿🇦</span>
            <span>FR / EN</span>
            <span>USD / XOF / NGN</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
