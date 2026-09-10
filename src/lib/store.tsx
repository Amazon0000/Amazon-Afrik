import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { type Dict, type Locale, dictionaries } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { Country, Currency, Category, Product } from '@/lib/db';
import { recordAffiliateClick } from '@/lib/db';

type GeoSelection = {
  countryId: string;
  cityId?: string;
  cityName?: string;
};

type User = {
  id: string;
  email: string;
  fullName: string;
  role: 'customer' | 'seller' | 'admin' | 'superadmin';
  sellerId?: string;
  sellerPlan?: 'free' | 'starter' | 'premium' | 'enterprise';
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
  setPageMeta: (title: string, description?: string) => void;
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
  formatPrice: (amount: number, sourceCurrencyCode?: string) => string;
  products: Product[];
  loadingProducts: boolean;
  loadingReference: boolean;
  referenceError: string | null;
};

const AppContext = createContext<AppState | null>(null);

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asUserRole(value: unknown): NonNullable<User>['role'] | undefined {
  return value === 'customer' || value === 'seller' || value === 'admin' || value === 'superadmin' ? value : undefined;
}

function asSellerPlan(value: unknown): NonNullable<User>['sellerPlan'] | undefined {
  return value === 'free' || value === 'starter' || value === 'premium' || value === 'enterprise' ? value : undefined;
}

function asSellerStatus(value: unknown): NonNullable<User>['sellerStatus'] | undefined {
  return value === 'pending' || value === 'approved' || value === 'rejected' || value === 'suspended' ? value : undefined;
}

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
  // Parse the current URL (?p=page&key=val...) so a real navigation, a
  // shared link, or a browser refresh lands on the right screen instead of
  // always resetting to home. This pairs with the pushState calls added to
  // navigate() below — together they're what make individual pages
  // crawlable, shareable, and back/forward-button-friendly.
  const parseLocation = (): { page: string; params: Record<string, string> } => {
    const sp = new URLSearchParams(window.location.search);
    const p = sp.get('p') || 'home';
    const parsedParams: Record<string, string> = {};
    sp.forEach((v, k) => { if (k !== 'p') parsedParams[k] = v; });
    return { page: p, params: parsedParams };
  };
  const [page, setPage] = useState(() => parseLocation().page);
  const [params, setParams] = useState<Record<string, string>>(() => parseLocation().params);

  // Keep state in sync with the browser's own back/forward navigation.
  useEffect(() => {
    const onPopState = () => {
      const loc = parseLocation();
      setPage(loc.page);
      setParams(loc.params);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Capture ?ref=CODE on first load (referral link from an affiliate) and
  // remember it for up to 30 days — attributed only once, at seller signup.
  // Also records the real click itself (server-side resolved) — this is
  // the top of the funnel that was previously untracked entirely; only
  // eventual seller signups/conversions were ever counted.
  useEffect(() => {
    const urlRef = new URLSearchParams(window.location.search).get('ref');
    if (urlRef) {
      localStorage.setItem('zando-referral-code', urlRef.toUpperCase());
      localStorage.setItem('zando-referral-captured-at', Date.now().toString());
      recordAffiliateClick(urlRef);
    }
  }, []);
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
  const [currencyManual, setCurrencyManual] = useState<boolean>(() => localStorage.getItem('zando-currency-manual') === 'true');
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

  // Currency follows the selected country automatically — unless the user
  // has explicitly picked a currency themselves, in which case that choice
  // sticks even if they later change their delivery country.
  useEffect(() => {
    if (currencyManual || countries.length === 0) return;
    const country = countries.find((c) => c.id === geo.countryId);
    if (country?.currency_code && country.currency_code !== currencyCode) {
      setCurrencyCodeState(country.currency_code);
    }
  }, [geo.countryId, countries, currencyManual]);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  // Auth state — pour les vendeurs, sellerId/sellerPlan/sellerStatus
  // viennent de la VRAIE table `sellers`, jamais des métadonnées
  // auth.users (qui ne contiennent que ce qui était connu au moment du
  // signUp() et ne sont jamais mises à jour ensuite — ex: seller_id n'y
  // est jamais écrit). Bug critique corrigé : avant ce correctif, sellerId
  // redevenait undefined à chaque connexion/rafraîchissement de page (même
  // pour un vendeur déjà approuvé), ce qui cassait la création de produit
  // (retombait sur user.id, une clé étrangère invalide côté `sellers`).
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event: string, session: { user?: { id: string; email?: string; user_metadata?: Record<string, unknown> } } | null) => {
      if (session?.user) {
        const u = session.user;
        const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
        const fullName = asString(meta.full_name) || asString(meta.name) || asString(u.email?.split('@')[0]) || 'User';
        const role = asUserRole(meta.role) || 'customer';

        if (role === 'seller') {
          supabase.from('sellers').select('id, plan, status').eq('user_id', u.id).maybeSingle().then(({ data: sellerRow }: { data: { id: string; plan: string; status: string } | null }) => {
            setUserState({
              id: u.id,
              email: u.email || '',
              fullName,
              role,
              sellerId: sellerRow?.id,
              sellerPlan: asSellerPlan(sellerRow?.plan) || asSellerPlan(meta.seller_plan),
              sellerStatus: asSellerStatus(sellerRow?.status) || asSellerStatus(meta.seller_status),
            });
          });
        } else {
          setUserState({
            id: u.id,
            email: u.email || '',
            fullName,
            role,
            sellerId: undefined,
            sellerPlan: asSellerPlan(meta.seller_plan),
            sellerStatus: asSellerStatus(meta.seller_status),
          });
        }
      } else if (event !== 'INITIAL_SESSION') {
        setUserState(null);
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
    setParams({});
    window.history.pushState({ page: 'home', params: {} }, '', window.location.pathname);
  }, []);

  const navigate = (p: string, navParams?: Record<string, string>) => {
    setPage(p);
    setParams(navParams || {});
    const sp = new URLSearchParams();
    if (p !== 'home') sp.set('p', p);
    Object.entries(navParams || {}).forEach(([k, v]) => { if (v) sp.set(k, v); });
    const qs = sp.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.pushState({ page: p, params: navParams || {} }, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Baseline per-page-type title (every screen was previously stuck on the
  // same static <title> from index.html regardless of what was shown).
  // Pages that load specific content (a product name, a seller name) call
  // setPageMeta() themselves once that data arrives, overriding this with
  // something more specific and useful for SEO/sharing.
  useEffect(() => {
    const titles: Record<string, string> = {
      home: 'Zando — Marketplace Mondiale Premium',
      catalog: 'Shop — Zando',
      product: 'Product — Zando',
      seller: 'Store — Zando',
      sellers: 'All Stores — Zando',
      cart: 'Cart — Zando',
      checkout: 'Checkout — Zando',
      account: 'My Account — Zando',
      'seller-center': 'Seller Center — Zando',
      plans: 'Seller Plans — Zando',
      admin: 'Admin — Zando',
      login: 'Log In — Zando',
      signup: 'Sign Up — Zando',
      sell: 'Sell on Zando',
      'trust-safety': 'Trust & Safety — Zando',
      affiliate: 'Affiliate Program — Zando',
    };
    document.title = titles[page] || 'Zando';
  }, [page]);

  const setPageMeta = (title: string, description?: string) => {
    document.title = `${title} — Zando`;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description.slice(0, 160));
    }
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

  const setCurrencyCode = (c: string) => {
    setCurrencyCodeState(c);
    setCurrencyManual(true);
    localStorage.setItem('zando-currency-manual', 'true');
  };

  // Real conversion: converts an amount, in its OWN source currency (a
  // product may be priced in something other than USD — see
  // products.currency_code), into the user's selected display currency,
  // via USD as the common cross-rate base (exchange_rate convention: USD
  // value of one unit of that currency). Defaults to USD for anything
  // that doesn't carry its own currency (subscription plans, ad pricing,
  // etc.), so every existing call site keeps working unchanged.
  // Falls back to raw display if a currency isn't loaded/known — never
  // silently mis-converts.
  const formatPrice = (amount: number, sourceCurrencyCode: string = 'USD'): string => {
    const currency = currencies.find((c) => c.code === currencyCode);
    const sourceCurrency = currencies.find((c) => c.code === sourceCurrencyCode);
    const usdAmount = sourceCurrency ? amount * sourceCurrency.exchange_rate : amount;
    if (!currency || currency.code === 'USD') return `$${usdAmount.toFixed(2)}`;
    const localAmount = usdAmount / currency.exchange_rate;
    const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR', 'XOF', 'XAF', 'GNF', 'RWF', 'UGX', 'TZS', 'CDF', 'DJF', 'BIF', 'KMF'];
    const decimals = noDecimalCurrencies.includes(currency.code) ? 0 : 2;
    const formatted = localAmount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return `${currency.symbol}${formatted}`;
  };

  return (
    <AppContext.Provider value={{
      locale, setLocale, t: dictionaries[locale],
      geo, setGeo, user, setUser, logout,
      page, params, navigate, setPageMeta,
      cart, addToCart, removeFromCart, updateCartQty, clearCart, cartCount,
      wishlist, toggleWishlist,
      toasts, showToast, dismissToast,
      countries, currencies, categories, currencyCode, setCurrencyCode, formatPrice,
      products, loadingProducts,
      loadingReference, referenceError,
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
