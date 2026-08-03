import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { type Dict, type Locale, dictionaries } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { Country, Currency, Category, Product } from '@/lib/db';

type GeoSelection = {
  countryId: string;
  cityId?: string;
};

type User = {
  id: string;
  email: string;
  fullName: string;
  role: 'customer' | 'seller' | 'admin' | 'superadmin';
  sellerId?: string;
  sellerPlan?: 'starter' | 'premium' | 'enterprise';
  sellerStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
} | null;

type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' };

type AppState = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
  geo: GeoSelection;
  setGeo: (g: Partial<GeoSelection>) => void;
  user: User;
  setUser: (u: User) => void;
  logout: () => void;
  page: string;
  params: Record<string, string>;
  navigate: (page: string, params?: Record<string, string>) => void;
  cart: { productId: string; qty: number; variation?: string }[];
  addToCart: (productId: string, qty?: number, variation?: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  countries: Country[];
  currencies: Currency[];
  categories: Category[];
  currencyCode: string;
  setCurrencyCode: (c: string) => void;
  products: Product[];
  loadingProducts: boolean;
  loadingReference: boolean;
  referenceError: string | null;
  formatPrice: (p: number) => string;
};

const AppContext = createContext<AppState | null>(null);

function detectCountry(): string {
  const langs = navigator.languages || [navigator.language];
  for (const l of langs) {
    const lower = l.toLowerCase();
    if (lower.includes('fr') || lower.includes('ci') || lower.includes('sn')) return 'CI';
    if (lower.includes('sw') || lower.includes('ke')) return 'KE';
    if (lower.includes('ha') || lower.includes('ng')) return 'NG';
    if (lower.includes('ga') || lower.includes('gh')) return 'GH';
  }
  return 'CI';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => (localStorage.getItem('zando-locale') as Locale) || 'fr');
  const [geo, setGeoState] = useState<GeoSelection>(() => {
    const saved = localStorage.getItem('zando-geo');
    return saved ? JSON.parse(saved) : { countryId: detectCountry() };
  });
  const [user, setUserState] = useState<User>(() => {
    const saved = localStorage.getItem('zando-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [page, setPage] = useState('home');
  const [params, setParams] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<{ productId: string; qty: number; variation?: string }[]>(() => {
    const saved = localStorage.getItem('zando-cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('zando-wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencyCode, setCurrencyCodeState] = useState<string>(() => localStorage.getItem('zando-currency') || 'USD');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingReference, setLoadingReference] = useState(true);
  const [referenceError, setReferenceError] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('zando-locale', locale); document.documentElement.lang = locale; }, [locale]);
  useEffect(() => { localStorage.setItem('zando-geo', JSON.stringify(geo)); }, [geo]);
  useEffect(() => { localStorage.setItem('zando-user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('zando-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('zando-wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem('zando-currency', currencyCode); }, [currencyCode]);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  // Auth state
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};
        setUserState({
          id: u.id,
          email: u.email || '',
          fullName: meta.full_name || meta.name || u.email?.split('@')[0] || 'User',
          role: meta.role || 'customer',
          sellerId: meta.seller_id,
          sellerPlan: meta.seller_plan,
          sellerStatus: meta.seller_status,
        });
      } else if (_event !== 'INITIAL_SESSION') {
        // Real sign-out (not just "no session found on first load with no prior local admin-demo user")
        setUserState((prev) => (prev?.id === 'admin-1' ? prev : null));
      }
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  // Load reference data (countries, currencies, categories)
  useEffect(() => {
    (async () => {
      setLoadingReference(true);
      setReferenceError(null);
      try {
        const [c, cur, cat] = await Promise.all([
          import('@/lib/db').then((m) => m.fetchCountries()),
          import('@/lib/db').then((m) => m.fetchCurrencies()),
          import('@/lib/db').then((m) => m.fetchCategories()),
        ]);
        setCountries(c);
        setCurrencies(cur);
        setCategories(cat);
      } catch (e) {
        console.error('Failed to load reference data', e);
        setReferenceError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoadingReference(false);
      }
    })();
  }, []);

  // Load products
  useEffect(() => {
    (async () => {
      setLoadingProducts(true);
      try {
        const prods = await import('@/lib/db').then((m) => m.fetchProducts({ limit: 50 }));
        setProducts(prods);
      } catch (e) {
        console.error('Failed to load products', e);
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, []);

  const setLocale = (l: Locale) => setLocaleState(l);
  const setGeo = (g: Partial<GeoSelection>) => setGeoState((prev) => ({ ...prev, ...g }));
  const setUser = (u: User) => setUserState(u);
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUserState(null);
    setPage('home');
  }, []);

  const navigate = (p: string, params?: Record<string, string>) => {
    setPage(p);
    setParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };
  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const addToCart = (productId: string, qty = 1, variation?: string) => {
    setCart((prev) => {
      const key = variation ? `${productId}-${variation}` : productId;
      const existing = prev.find((c) => (c.variation ? `${c.productId}-${c.variation}` : c.productId) === key);
      if (existing) return prev.map((c) => (c.variation ? `${c.productId}-${c.variation}` : c.productId) === key ? { ...c, qty: c.qty + qty } : c);
      return [...prev, { productId, qty, variation }];
    });
  };
  const removeFromCart = (productId: string) => setCart((prev) => prev.filter((c) => c.productId !== productId));
  const updateCartQty = (productId: string, qty: number) => setCart((prev) => prev.map((c) => c.productId === productId ? { ...c, qty: Math.max(1, qty) } : c));
  const clearCart = () => setCart([]);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]);
  };

  const setCurrencyCode = (c: string) => setCurrencyCodeState(c);

  const formatPrice = useCallback((priceInUSD: number) => {
    const current = currencies.find((c) => c.code === currencyCode);
    if (!current) return `$${priceInUSD.toFixed(2)}`;
    const converted = priceInUSD * (current.exchange_rate || 1);
    const sym = current.symbol || current.code;
    if (sym === '$' || sym === '£' || sym === '₦') {
      return `${sym}${converted.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    return `${converted.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${sym}`;
  }, [currencies, currencyCode, locale]);

  return (
    <AppContext.Provider value={{
      locale, setLocale, t: dictionaries[locale],
      geo, setGeo, user, setUser, logout,
      page, params, navigate,
      cart, addToCart, removeFromCart, updateCartQty, clearCart, cartCount,
      wishlist, toggleWishlist,
      toasts, showToast, dismissToast,
      countries, currencies, categories, currencyCode, setCurrencyCode,
      products, loadingProducts,
      loadingReference, referenceError,
      formatPrice,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
