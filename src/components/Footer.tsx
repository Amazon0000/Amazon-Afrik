import { useApp } from '@/lib/store';
import { useState } from 'react';
import { Logo } from './Logo';
import { submitContactMessage } from '@/lib/db';
import { Linkedin, Twitter, Instagram, Facebook, ArrowUp, Mail, Phone, Clock, Loader2 } from 'lucide-react';

type FooterLink = { label: string; page: string; params?: Record<string, string> };

export function Footer() {
  const { t, navigate, locale, showToast, user } = useApp();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.message) {
      showToast(locale === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill in all fields', 'error');
      return;
    }
    setSending(true);
    const ok = await submitContactMessage(form);
    setSending(false);
    if (ok) {
      showToast(locale === 'fr' ? 'Message envoyé — nous vous répondrons rapidement' : 'Message sent — we\u2019ll reply soon');
      setForm({ firstName: '', lastName: '', email: '', message: '' });
    } else {
      showToast(locale === 'fr' ? "Erreur lors de l'envoi" : 'Error sending message', 'error');
    }
  };

  const quickLinks: FooterLink[] = [
    { label: locale === 'fr' ? 'Boutique' : 'Shop', page: 'catalog' },
    { label: locale === 'fr' ? 'Racheter' : 'Buy Again', page: user ? 'account' : 'login', params: user ? { tab: 'orders' } : undefined },
    { label: locale === 'fr' ? "Centre d'aide" : 'Help Center', page: 'info', params: { k: 'help' } },
    { label: locale === 'fr' ? 'FAQ' : 'FAQ', page: 'info', params: { k: 'help' } },
    { label: locale === 'fr' ? 'Mon compte' : 'My Account', page: user ? 'account' : 'login' },
  ];
  const marketingLinks: FooterLink[] = [
    { label: t.nav.becomeSeller, page: 'sell' },
    { label: locale === 'fr' ? "Programme d'affiliation" : 'Affiliate Program', page: 'affiliate' },
    { label: locale === 'fr' ? 'À propos' : 'About Us', page: 'info', params: { k: 'about' } },
    { label: locale === 'fr' ? "Conditions d'utilisation" : 'Terms & Conditions', page: 'info', params: { k: 'terms' } },
    { label: locale === 'fr' ? 'Confidentialité' : 'Privacy Policy', page: 'info', params: { k: 'privacy' } },
    { label: locale === 'fr' ? 'Support & retours' : 'Support & Feedback', page: 'info', params: { k: 'returns' } },
  ];
  const shoppingLinks: FooterLink[] = [
    { label: locale === 'fr' ? 'Mon panier' : 'My Cart', page: 'cart' },
    { label: locale === 'fr' ? 'Ma liste de souhaits' : 'Wishlist', page: user ? 'account' : 'login', params: user ? { tab: 'wishlist' } : undefined },
    { label: locale === 'fr' ? 'Mes commandes' : 'My Orders', page: user ? 'account' : 'login', params: user ? { tab: 'orders' } : undefined },
  ];

  const socials = [
    { icon: Linkedin, url: 'https://linkedin.com' },
    { icon: Twitter, url: 'https://twitter.com' },
    { icon: Instagram, url: 'https://instagram.com' },
    { icon: Facebook, url: 'https://facebook.com' },
  ];

  return (
    <footer className="relative bg-[#141414] text-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pr-16 sm:pr-20 py-10">
        {/* Contact block */}
        <div className="mb-10">
          <Logo size={30} variant="light" />
          <div className="flex items-center gap-2 mt-5 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#ff7a00]" />
            <h3 className="text-lg font-bold">{locale === 'fr' ? "Besoin d'aide ? Contactez-nous" : 'Need Help? Contact Us'}</h3>
          </div>
          <div className="max-w-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder={locale === 'fr' ? 'Prénom' : 'First Name'} className="bg-[#272626] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff7a00]" />
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder={locale === 'fr' ? 'Nom' : 'Last Name'} className="bg-[#272626] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff7a00]" />
            </div>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={locale === 'fr' ? 'Adresse e-mail' : 'Email Address'} className="w-full bg-[#272626] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff7a00]" />
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={locale === 'fr' ? 'Message' : 'Message'} rows={4} className="w-full bg-[#272626] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff7a00] resize-none" />
            <button onClick={send} disabled={sending} className="bg-[#ff7a00] hover:bg-[#e06c00] text-white text-sm font-bold px-6 py-2.5 rounded-full flex items-center gap-2 transition-colors disabled:opacity-60">
              {sending && <Loader2 className="w-4 h-4 animate-spin" />} {locale === 'fr' ? 'Envoyer' : 'Send Message'}
            </button>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-8 border-t border-white/10">
          <div>
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">{locale === 'fr' ? 'Liens rapides' : 'Quick Links'}</h4>
            <ul className="space-y-2">
              {quickLinks.map((l) => (
                <li key={l.label}><button onClick={() => navigate(l.page, l.params)} className="text-sm text-white/80 hover:text-[#ff7a00] transition-colors text-left">{l.label}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">{locale === 'fr' ? 'Marketing' : 'Marketing Links'}</h4>
            <ul className="space-y-2">
              {marketingLinks.map((l) => (
                <li key={l.label}><button onClick={() => navigate(l.page, l.params)} className="text-sm text-white/80 hover:text-[#ff7a00] transition-colors text-left">{l.label}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">{locale === 'fr' ? 'Achats' : 'Shopping'}</h4>
            <ul className="space-y-2">
              {shoppingLinks.map((l) => (
                <li key={l.label}><button onClick={() => navigate(l.page, l.params)} className="text-sm text-white/80 hover:text-[#ff7a00] transition-colors text-left">{l.label}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">{locale === 'fr' ? 'Nous contacter' : 'Contact Us On'}</h4>
            <div className="space-y-3 text-sm text-white/80">
              <div>
                <p className="flex items-center gap-1.5 font-semibold text-white"><Mail className="w-3.5 h-3.5" /> Email</p>
                <a href="mailto:support@liafrik.com" className="hover:text-[#ff7a00] transition-colors">support@liafrik.com</a>
              </div>
              <div>
                <p className="flex items-center gap-1.5 font-semibold text-white"><Phone className="w-3.5 h-3.5" /> {locale === 'fr' ? 'Appelez-nous' : 'Call us'}</p>
                <p>+1 844-ZANDO</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 font-semibold text-white"><Clock className="w-3.5 h-3.5" /> {locale === 'fr' ? 'Horaires' : 'Business Hours'}</p>
                <p>{locale === 'fr' ? 'Lun - Ven : 8h - 18h' : 'Mon - Fri: 8 AM - 6 PM'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical social sidebar, orange, right edge */}
      <div className="hidden sm:flex flex-col absolute top-6 right-0 bottom-6 w-14 bg-[#ff7a00] rounded-l-2xl items-center py-4 gap-3">
        {socials.map((s, i) => (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-black flex items-center justify-center hover:bg-black/70 transition-colors">
            <s.icon className="w-4 h-4 text-white" />
          </a>
        ))}
      </div>

      {/* Scroll to top */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="absolute left-4 sm:left-6 bottom-16 w-10 h-10 rounded-full bg-[#ff7a00] hover:bg-[#e06c00] flex items-center justify-center transition-colors shadow-lg" aria-label="Scroll to top">
        <ArrowUp className="w-4.5 h-4.5 text-white" />
      </button>

      {/* Bottom bar */}
      <div className="border-t border-white/10 pr-16 sm:pr-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/50">© 2026 Zando Marketplace. {locale === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}</p>
          <p className="text-xs text-white/50">FR / EN · USD / XOF / NGN</p>
        </div>
      </div>
    </footer>
  );
}
