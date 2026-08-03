import { useApp } from '@/lib/store';
import { Logo } from './Logo';
import { ShieldCheck, Truck, Globe, Headphones } from 'lucide-react';

export function Footer() {
  const { t, navigate, locale } = useApp();

  const links = [
    { title: locale === 'fr' ? 'Zando' : 'Zando', items: [t.nav.becomeSeller, t.nav.sellers, t.nav.plans, t.nav.ads, locale === 'fr' ? 'Carrières' : 'Careers'] },
    { title: locale === 'fr' ? 'Aide' : 'Help', items: [locale === 'fr' ? 'Centre d\'aide' : 'Help Center', locale === 'fr' ? 'Suivi de commande' : 'Track Order', locale === 'fr' ? 'Retours' : 'Returns', locale === 'fr' ? 'Remboursements' : 'Refunds', locale === 'fr' ? 'Livraison' : 'Shipping'] },
    { title: locale === 'fr' ? 'Légal' : 'Legal', items: [locale === 'fr' ? 'Conditions d\'utilisation' : 'Terms of Use', locale === 'fr' ? 'Confidentialité' : 'Privacy', locale === 'fr' ? 'Cookies' : 'Cookies', locale === 'fr' ? 'Mentions légales' : 'Legal Notice'] },
  ];

  return (
    <footer className="bg-white border-t border-[#e2e8f0] mt-12">
      {/* Trust bar */}
      <div className="border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, title: locale === 'fr' ? 'Vendeurs Vérifiés' : 'Verified Sellers', desc: locale === 'fr' ? 'KYC strict pour tous' : 'Strict KYC for all' },
              { icon: Truck, title: locale === 'fr' ? 'Livraison Vendeur' : 'Seller Delivery', desc: locale === 'fr' ? 'Livré par le vendeur' : 'Delivered by seller' },
              { icon: Globe, title: locale === 'fr' ? '54 Pays' : '54 Countries', desc: locale === 'fr' ? 'Toute l\'Afrique' : 'All of Africa' },
              { icon: Headphones, title: locale === 'fr' ? 'Support 24/7' : '24/7 Support', desc: locale === 'fr' ? 'Assistance dédiée' : 'Dedicated support' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0e9f6e]/10 flex items-center justify-center shrink-0">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div>
            <Logo size={32} />
            <p className="text-xs text-[#64748b] mt-3 max-w-xs">{locale === 'fr' ? 'La marketplace premium pour l\'Afrique. Achetez et vendez en toute confiance.' : 'The premium marketplace for Africa. Buy and sell with confidence.'}</p>
          </div>
          {links.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-[#0f172a] mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((item) => {
                  const handleLinkClick = () => {
                    if (item === t.nav.becomeSeller) { navigate('sell'); }
                    else if (item === t.nav.sellers) { navigate('sellers'); }
                    else if (item === t.nav.plans) { navigate('plans'); }
                    else if (item === t.nav.ads) { navigate('ads'); }
                    else if (item === (locale === 'fr' ? "Suivi de commande" : "Track Order")) { navigate('account'); }
                    else { navigate('catalog'); }
                  };
                  return (
                    <li key={item}>
                      <button onClick={handleLinkClick} className="text-xs text-[#64748b] hover:text-[#0e9f6e] transition-colors text-left">{item}</button>
                    </li>
                  );
                })}
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
