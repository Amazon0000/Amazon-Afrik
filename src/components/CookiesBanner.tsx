import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { Cookie, X } from 'lucide-react';

export function CookiesBanner() {
  const { locale } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('zando-cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('zando-cookie-consent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('zando-cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] animate-fade-up">
      <div className="max-w-4xl mx-auto m-4 p-5 rounded-2xl bg-[#0f172a] shadow-2xl border border-white/10">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 text-[#d4af37]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white mb-1">
              {locale === 'fr' ? 'Nous utilisons des cookies' : 'We use cookies'}
            </h3>
            <p className="text-xs text-white/60 leading-relaxed">
              {locale === 'fr'
                ? 'Zando utilise des cookies pour améliorer votre expérience, mémoriser votre langue et votre devise, et analyser le trafic. Vous pouvez accepter ou refuser.'
                : 'Zando uses cookies to improve your experience, remember your language and currency, and analyze traffic. You can accept or decline.'}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <button onClick={decline} className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-medium text-white/70 border border-white/20 hover:bg-white/10 transition-colors">
              {locale === 'fr' ? 'Refuser' : 'Decline'}
            </button>
            <button onClick={accept} className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#d4af37] text-[#0f172a] hover:bg-[#d4af37]/90 transition-colors">
              {locale === 'fr' ? 'Accepter' : 'Accept'}
            </button>
            <button onClick={decline} className="p-2.5 rounded-lg text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
