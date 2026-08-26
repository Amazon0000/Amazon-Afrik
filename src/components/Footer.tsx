import { useApp } from '@/lib/store';
import { Logo } from './Logo';
import { ShieldCheck, Percent, Headphones } from 'lucide-react';

type FooterLink = { label: string; page: string; params?: Record<string, string> };

export function Footer() {
  const { t, navigate, locale } = useApp();

  const sections: { title: string; items: FooterLink[] }[] = [
    {
      title: 'Zando',
      items: [
        { label: t.nav.becomeSeller, page: 'sell' },
        { label: t.nav.sellers, page: 'sellers' },
        { label: t.nav.plans, page: 'plans' },
        { label: t.nav.ads, page: 'ads' },
      ],
    },
    {
      title: locale === 'fr' ? 'Aide' : 'Help',
      items: [
        { label: locale === 'fr' ? "Centre d'aide" : 'Help Center', page: 'info', params: { k: 'help' } },
        { label: locale === 'fr' ? 'Suivi de commande' : 'Track Order', page: 'delivery' },
        { label: locale === 'fr' ? 'Retours & livraison' : 'Returns & Shipping', page: 'info', params: { k: 'returns' } },
        { label: locale === 'fr' ? 'Contact' : 'Contact', page: 'info', params: { k: 'contact' } },
      ],
    },
    {
      title: locale === 'fr' ? 'Légal' : 'Legal',
      items: [
        { label: locale === 'fr' ? "Conditions d'utilisation" : 'Terms of Use', page: 'info', params: { k: 'terms' } },
        { label: locale === 'fr' ? 'Confidentialité' : 'Privacy', page: 'info', params: { k: 'privacy' } },
        { label: locale === 'fr' ? 'Cookies' : 'Cookies', page: 'info', params: { k: 'cookies' } },
      ],
    },
  ];

  const trustItems = [
    { icon: Percent, title: locale === 'fr' ? '0% Commission' : '0% Commission', desc: locale === 'fr' ? 'Payé directement par vos clients' : 'Paid directly by your customers' },
    { icon: ShieldCheck, title: locale === 'fr' ? 'Vendeurs vérifiés' : 'Verified sellers', desc: locale === 'fr' ? 'KYC strict pour tous' : 'Strict KYC for all' },
    { icon: Headphones, title: locale === 'fr' ? 'Support 24/7' : '24/7 support', desc: locale === 'fr' ? 'Assistance dédiée' : 'Dedicated support' },
  ];

  return (
    <footer className="bg-white border-t border-[#e2e8f0] mt-12">
      {/* Trust bar */}
      <div className="border-b border-[#e2e8f0] bg-gradient-to-r from-[#f7f3ee] via-white to-[#f7f3ee]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-[#d4af37]" />
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
            <p className="text-xs text-[#64748b] mt-3 max-w-xs">{locale === 'fr' ? "La marketplace premium pour l'Afrique. 0% commission — vos ventes sont payées directement par vos clients." : 'The premium marketplace for Africa. 0% commission — your sales are paid directly by your customers.'}</p>
            <a href="mailto:support@liafrik.com" className="block text-xs text-[#64748b] hover:text-[#d4af37] transition-colors mt-3">support@liafrik.com</a>
          </div>
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-[#0f172a] mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <button onClick={() => navigate(item.page, item.params)} className="text-xs text-[#64748b] hover:text-[#d4af37] transition-colors text-left">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#64748b]">© 2026 Zando. {locale === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}</p>
          <p className="text-xs text-[#64748b]">FR / EN · USD / XOF / NGN</p>
        </div>
      </div>
    </footer>
  );
}
