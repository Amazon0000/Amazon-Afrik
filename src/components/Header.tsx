import { useState, useRef, useEffect, useMemo } from 'react';
import { Menu, X, Search, ShoppingBag, Globe, ChevronDown, User as UserIcon, Store, Shield, LayoutDashboard, LogOut, Package, MapPin, ChevronRight, Headphones, Trash2, ShoppingCart, Heart, Bell, ShoppingBasket, Check, Loader2 } from 'lucide-react';
import { useApp } from '@/lib/store';
import { Logo } from './Logo';
import { searchSuggestions, fetchNotifications, fetchUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, fetchCitiesForCountry, type AppNotification } from '@/lib/db';

const MEGA_CATEGORIES = [
  { label: "Today's Deals", key: 'deals' },
  { label: 'Flash Sales', key: 'flash' },
  { label: 'Best Sellers', key: 'best' },
  { label: 'New Arrivals', key: 'new' },
  { label: 'Electronics', cat: 'electronics' },
  { label: 'Fashion', cat: 'fashion' },
  { label: 'Beauty', cat: 'beauty' },
  { label: 'Health', cat: 'health-wellness' },
  { label: 'Phones', cat: 'electronics' },
  { label: 'Computers', cat: 'electronics' },
  { label: 'Gaming', cat: 'electronics' },
  { label: 'Home & Kitchen', cat: 'home' },
  { label: 'Furniture', cat: 'home' },
  { label: 'Sports', cat: 'sports' },
  { label: 'Automotive', cat: 'electronics' },
  { label: 'Baby', cat: 'fashion' },
  { label: 'Books', cat: 'food-grocery' },
  { label: 'Jewelry', cat: 'jewelry' },
  { label: 'Luxury', cat: 'jewelry' },
  { label: 'Groceries', cat: 'food-grocery' },
  { label: 'Industrial', cat: 'electronics' },
  { label: 'Office', cat: 'electronics' },
  { label: 'Pet Supplies', cat: 'home' },
  { label: 'Garden', cat: 'home' },
  { label: 'Musical Instruments', cat: 'art-crafts' },
  { label: 'Arts', cat: 'art-crafts' },
  { label: 'Handmade', cat: 'art-crafts' },
  { label: 'Global Marketplace', cat: 'textiles' },
  { label: 'Official Stores', key: 'stores' },
  { label: 'Brands', key: 'brands' },
  { label: 'Gift Cards', key: 'gift' },
  { label: 'Sell on Zando', key: 'sell' },
  { label: 'Support', key: 'support' },
];

export function Header() {
  const { t, locale, setLocale, navigate, user, logout, cart, cartCount, updateCartQty, removeFromCart, geo, setGeo, countries, products, categories, wishlist } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationRegion, setLocationRegion] = useState<string>('all');
  const [locationCities, setLocationCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const sellers = products.map((p) => p.sellers).filter((seller): seller is NonNullable<typeof seller> => Boolean(seller));
  const suggestions = searchSuggestions(products, sellers, categories, search, locale);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) { navigate('catalog', { q: search.trim() }); setShowSuggestions(false); setMobileOpen(false); }
  };

  const go = (p: string, params?: Record<string, string>) => { navigate(p, params); setMobileOpen(false); setMegaOpen(false); setCartDrawerOpen(false); };

  const openLocationPanel = () => {
    setLocationOpen(true);
    if (geo.countryId) {
      setLoadingCities(true);
      fetchCitiesForCountry(geo.countryId).then((cities) => { setLocationCities(cities); setLoadingCities(false); });
    }
  };

  const selectLocationCountry = (countryId: string) => {
    setGeo({ countryId, cityId: undefined, cityName: undefined });
    setLoadingCities(true);
    fetchCitiesForCountry(countryId).then((cities) => { setLocationCities(cities); setLoadingCities(false); });
  };

  const regions = Array.from(new Set(countries.map((c) => c.region).filter(Boolean))).sort();
  const filteredCountries = locationRegion === 'all' ? countries : countries.filter((c) => c.region === locationRegion);

  const handleMegaNav = (item: typeof MEGA_CATEGORIES[0]) => {
    if (item.key === 'sell') { navigate('sell'); setMegaOpen(false); return; }
    if (item.key === 'stores') { navigate('sellers'); setMegaOpen(false); return; }
    if (item.key === 'deals' || item.key === 'flash' || item.key === 'best' || item.key === 'new') {
      navigate('catalog', { sort: item.key === 'new' ? 'newest' : item.key === 'best' ? 'rating' : 'popular' });
      setMegaOpen(false);
      return;
    }
    if (item.cat) {
      const cat = categories.find((c) => c.slug === item.cat);
      if (cat) { navigate('catalog', { category: cat.id }); setMegaOpen(false); return; }
    }
    navigate('catalog');
    setMegaOpen(false);
  };

  const currentCountry = countries.find((c) => c.id === geo.countryId);

  // Cart Drawer product list resolver
  const cartItemsResolved = useMemo(() => {
    return cart.map((cItem) => {
      const prod = products.find((p) => p.id === cItem.productId);
      return {
        ...cItem,
        product: prod,
      };
    }).filter((item) => item.product);
  }, [cart, products]);

  const cartSubtotal = useMemo(() => {
    return cartItemsResolved.reduce((sum, item) => sum + (item.product!.price * item.qty), 0);
  }, [cartItemsResolved]);

  return (
    <header className="sticky top-0 z-50 font-sans">
      {/* Tier 1: dark utility bar */}
      <div className="bg-[#3d1f00] text-white text-xs">
        <div className="max-w-[1500px] mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <button onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')} className="flex items-center gap-1 font-bold hover:opacity-80 transition-opacity shrink-0">
            <Globe className="w-3.5 h-3.5" /> {locale.toUpperCase()} <ChevronDown className="w-3 h-3 opacity-70" />
          </button>
          <div className="hidden sm:block text-white/80 truncate text-center flex-1">
            {locale === 'fr' ? 'Livraison directe par le vendeur, partout dans le monde — 0% commission Zando' : 'Direct seller delivery, worldwide — 0% Zando commission'}
          </div>
          <button onClick={openLocationPanel} className="hidden sm:flex items-center gap-1 font-bold hover:opacity-80 transition-opacity shrink-0">
            <MapPin className="w-3.5 h-3.5" /> {currentCountry?.flag} {geo.cityName ? `${geo.cityName}, ` : ''}{currentCountry?.name} <ChevronDown className="w-3 h-3 opacity-70" />
          </button>
        </div>
      </div>

      {/* Tier 2: white bar — logo, search, actions */}
      <div className="bg-white border-b border-[#e2e8f0] text-[#0f172a]">
        <div className="max-w-[1500px] mx-auto px-4 py-3 flex items-center gap-3 sm:gap-5">
          <button onClick={() => go('home')} className="shrink-0">
            <Logo size={34} variant="dark" />
          </button>

          {/* Search Bar */}
          <div className="flex-1 relative min-w-0" ref={searchRef}>
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="flex items-center w-full rounded-full bg-[#f2f2f2] overflow-hidden focus-within:ring-2 focus-within:ring-[#ff7a00] transition-shadow">
                <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)}
                  placeholder={t.common.searchPlaceholder} className="flex-1 min-w-0 px-4 py-2.5 text-[14px] bg-transparent focus:outline-none text-[#0f172a] h-11" />
                <button type="submit" className="w-11 h-11 bg-[#3d1f00] hover:bg-[#2a1400] transition-colors flex items-center justify-center shrink-0 rounded-full m-0.5">
                  <Search className="w-4.5 h-4.5 text-white" />
                </button>
              </div>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#dddddd] rounded-lg shadow-lg animate-fade-up z-50 max-h-80 overflow-y-auto text-[#0f172a]">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase text-[#565959] border-b border-[#eee] bg-[#f9f9f9]">
                  {locale === 'fr' ? 'SUGGESTIONS' : 'SUGGESTIONS'}
                </p>
                {suggestions.map((s) => (
                  <button key={s} onClick={() => { setSearch(s); navigate('catalog', { q: s }); setShowSuggestions(false); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-[#0f172a] hover:bg-[#f3f3f3] transition-colors text-left font-medium">
                    <Search className="w-3.5 h-3.5 text-[#888888]" /> {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {user && <NotificationBell locale={locale} navigate={navigate} />}

            <button onClick={() => go(user ? 'account' : 'login', user ? { tab: 'wishlist' } : undefined)} className="hidden sm:flex relative w-10 h-10 rounded-full border border-[#e2e8f0] items-center justify-center hover:border-[#3d1f00] transition-colors" title={t.account.wishlist}>
              <Heart className="w-4.5 h-4.5 text-[#3d1f00]" />
              {wishlist.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold flex items-center justify-center rounded-full bg-[#ff7a00] text-white">{wishlist.length}</span>}
            </button>

            {user && (
              <div className="hidden sm:block">
                <NotificationBell locale={locale} navigate={navigate} />
              </div>
            )}

            <button onClick={() => go(user ? 'account' : 'login', user ? { tab: 'orders' } : undefined)} className="hidden sm:flex w-10 h-10 rounded-full border border-[#e2e8f0] items-center justify-center hover:border-[#3d1f00] transition-colors" title={locale === 'fr' ? 'Mes commandes' : 'My Orders'}>
              <ShoppingBasket className="w-4.5 h-4.5 text-[#3d1f00]" />
            </button>

            <button onClick={() => setCartDrawerOpen(true)} className="relative w-10 h-10 rounded-full border border-[#e2e8f0] flex items-center justify-center hover:border-[#3d1f00] transition-colors">
              <ShoppingCart className="w-4.5 h-4.5 text-[#3d1f00]" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold flex items-center justify-center rounded-full bg-[#ff7a00] text-white">{cartCount}</span>}
            </button>

            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="hidden sm:flex items-center gap-1.5 px-2 py-2 rounded-full hover:bg-[#f3f3f3] transition-colors text-left">
                  <span className="text-[13px] font-bold text-[#0f172a]">{locale === 'fr' ? 'Bonjour, ' : 'Hi, '}{user.fullName.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#565959]" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-60 bg-white border border-[#dddddd] rounded-lg shadow-xl z-50 p-2 text-[#0f172a] animate-fade-up">
                      <div className="px-3 py-2.5 border-b border-[#eee] mb-1">
                        <p className="text-xs text-[#565959]">{locale === 'fr' ? 'Votre compte :' : 'Your account:'}</p>
                        <p className="text-sm font-bold text-[#0f172a] truncate">{user.fullName}</p>
                        <p className="text-xs text-[#565959] truncate">{user.email}</p>
                      </div>
                      <MenuItem icon={UserIcon} label={t.nav.account} onClick={() => { go('account'); setUserMenuOpen(false); }} />
                      <MenuItem icon={Package} label={t.nav.orders} onClick={() => { navigate('account', { tab: 'orders' }); setUserMenuOpen(false); }} />
                      <MenuItem icon={Heart} label={t.account.wishlist} onClick={() => { navigate('account', { tab: 'wishlist' }); setUserMenuOpen(false); }} />
                      {user.role === 'seller' && <MenuItem icon={LayoutDashboard} label={t.nav.sellerCenter} onClick={() => { go('seller-center'); setUserMenuOpen(false); }} />}
                      {(user.role === 'admin' || user.role === 'superadmin') && <MenuItem icon={Shield} label={t.nav.admin} onClick={() => { go('admin'); setUserMenuOpen(false); }} />}
                      {user.role === 'customer' && <MenuItem icon={Store} label={t.nav.becomeSeller} onClick={() => { go('sell'); setUserMenuOpen(false); }} />}
                      <MenuItem icon={Headphones} label={locale === 'fr' ? 'Service Client' : 'Customer Service'} onClick={() => { go('customer-service'); setUserMenuOpen(false); }} />
                      <div className="border-t border-[#eee] mt-1.5 pt-1.5">
                        <MenuItem icon={LogOut} label={t.nav.logout} onClick={() => { logout(); setUserMenuOpen(false); }} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => go('signup')} className="hidden md:block text-[13px] font-semibold text-[#0f172a] hover:text-[#ff7a00] transition-colors px-2">{t.nav.signup}</button>
                <button onClick={() => go('login')} className="bg-[#3d1f00] hover:bg-[#2a1400] text-white text-[13px] font-bold px-5 py-2.5 rounded-full flex items-center gap-1.5 transition-colors">
                  <UserIcon className="w-4 h-4" /> {t.nav.login}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tier 3: dark category/nav bar */}
      <div className="bg-[#3d1f00] text-white">
        <div className="max-w-[1500px] mx-auto px-4 h-11 flex items-center justify-between text-sm overflow-hidden">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar h-full">
            <button onClick={() => setMegaOpen(!megaOpen)} className="flex items-center gap-1.5 px-3 h-full font-bold shrink-0 hover:bg-white/10 transition-colors">
              <Menu className="w-4 h-4" /> {locale === 'fr' ? 'Toutes catégories' : 'All Categories'}
            </button>
            <button onClick={() => go('catalog')} className="px-3 h-full whitespace-nowrap hover:bg-white/10 transition-colors shrink-0">{locale === 'fr' ? 'Tous les produits' : 'All Products'}</button>
            <button onClick={() => navigate('catalog', { sort: 'popular' })} className="px-3 h-full whitespace-nowrap hover:bg-white/10 transition-colors shrink-0">{locale === 'fr' ? 'Toutes les offres' : 'All Deals'}</button>
            <button onClick={() => navigate('catalog', { sort: 'newest' })} className="px-3 h-full whitespace-nowrap hover:bg-white/10 transition-colors shrink-0">{locale === 'fr' ? 'Nouveautés' : 'New Arrivals'}</button>
            <button onClick={() => go(user ? 'account' : 'login', user ? { tab: 'orders' } : undefined)} className="px-3 h-full whitespace-nowrap hover:bg-white/10 transition-colors shrink-0">{locale === 'fr' ? 'Racheter' : 'Buy Again'}</button>
          </div>
          <div className="hidden lg:flex items-center gap-1 h-full shrink-0">
            <button onClick={openLocationPanel} className="flex items-center gap-1.5 px-3 h-full hover:bg-white/10 transition-colors"><MapPin className="w-3.5 h-3.5" /> {locale === 'fr' ? 'Acheter par lieu' : 'Shop by Location'}</button>
            <button onClick={() => go('ads')} className="px-3 h-full hover:bg-white/10 transition-colors">{t.nav.ads}</button>
            <button onClick={() => go('sell')} className="px-3 h-full font-bold text-[#ff9633] hover:bg-white/10 transition-colors">{t.nav.becomeSeller}</button>
          </div>
        </div>
      </div>

      {/* Shop by Location panel: region -> country -> city */}
      {locationOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setLocationOpen(false)} />
          <div className="fixed left-1/2 top-20 -translate-x-1/2 z-50 w-[92vw] max-w-2xl bg-white rounded-2xl shadow-2xl animate-fade-up overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
              <h3 className="font-display text-lg font-bold text-[#0f172a] flex items-center gap-2"><MapPin className="w-5 h-5 text-[#3d1f00]" /> {locale === 'fr' ? 'Acheter par lieu' : 'Shop by Location'}</h3>
              <button onClick={() => setLocationOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f3f3f3]"><X className="w-4 h-4 text-[#64748b]" /></button>
            </div>

            <div className="grid sm:grid-cols-3 max-h-[65vh]">
              {/* Region column */}
              <div className="border-r border-[#e2e8f0] overflow-y-auto py-2">
                <p className="px-4 py-1.5 text-[10px] font-bold uppercase text-[#94a3b8]">{locale === 'fr' ? 'Région' : 'Region'}</p>
                <button onClick={() => setLocationRegion('all')} className={`w-full text-left px-4 py-2 text-sm ${locationRegion === 'all' ? 'bg-[#3d1f00]/5 text-[#3d1f00] font-semibold' : 'text-[#0f172a] hover:bg-[#f7f8fa]'}`}>{locale === 'fr' ? 'Toutes les régions' : 'All regions'}</button>
                {regions.map((r) => (
                  <button key={r} onClick={() => setLocationRegion(r)} className={`w-full text-left px-4 py-2 text-sm ${locationRegion === r ? 'bg-[#3d1f00]/5 text-[#3d1f00] font-semibold' : 'text-[#0f172a] hover:bg-[#f7f8fa]'}`}>{r}</button>
                ))}
              </div>

              {/* Country column */}
              <div className="border-r border-[#e2e8f0] overflow-y-auto py-2">
                <p className="px-4 py-1.5 text-[10px] font-bold uppercase text-[#94a3b8]">{locale === 'fr' ? 'Pays' : 'Country'}</p>
                {filteredCountries.map((c) => (
                  <button key={c.id} onClick={() => selectLocationCountry(c.id)} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${geo.countryId === c.id ? 'bg-[#3d1f00]/5 text-[#3d1f00] font-semibold' : 'text-[#0f172a] hover:bg-[#f7f8fa]'}`}>
                    <span>{c.flag}</span> <span className="truncate">{c.name}</span>
                    {geo.countryId === c.id && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                  </button>
                ))}
              </div>

              {/* City column */}
              <div className="overflow-y-auto py-2">
                <p className="px-4 py-1.5 text-[10px] font-bold uppercase text-[#94a3b8]">{locale === 'fr' ? 'Ville' : 'City'}</p>
                <button onClick={() => { setGeo({ cityId: undefined, cityName: undefined }); setLocationOpen(false); go('catalog'); }} className={`w-full text-left px-4 py-2 text-sm ${!geo.cityName ? 'bg-[#3d1f00]/5 text-[#3d1f00] font-semibold' : 'text-[#0f172a] hover:bg-[#f7f8fa]'}`}>{locale === 'fr' ? 'Toutes les villes' : 'All cities'}</button>
                {loadingCities ? (
                  <div className="flex items-center justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-[#94a3b8]" /></div>
                ) : locationCities.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-[#94a3b8]">{locale === 'fr' ? 'Aucun vendeur listé ici pour le moment' : 'No sellers listed here yet'}</p>
                ) : locationCities.map((city) => (
                  <button key={city} onClick={() => { setGeo({ cityName: city }); setLocationOpen(false); go('catalog'); }} className={`w-full text-left px-4 py-2 text-sm ${geo.cityName === city ? 'bg-[#3d1f00]/5 text-[#3d1f00] font-semibold' : 'text-[#0f172a] hover:bg-[#f7f8fa]'}`}>{city}</button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mega full-width dropdown menu */}
      {megaOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 transition-opacity" onClick={() => setMegaOpen(false)} />
          <div className="absolute top-full left-0 right-0 bg-white border-t border-[#dddddd] shadow-2xl z-50 animate-fade-up max-h-[75vh] overflow-y-auto text-[#0f172a]">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#eee]">
                <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2"><Store className="w-5 h-5 text-[#ff7a00]" /> {t.home.categoriesTitle}</h3>
                <button onClick={() => setMegaOpen(false)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-2">
                {MEGA_CATEGORIES.map((item) => (
                  <button key={item.label} onClick={() => handleMegaNav(item)}
                    className="flex items-center justify-between px-2 py-1.5 rounded text-sm text-[#0f172a] hover:bg-[#f3f3f3] hover:text-[#ff7a00] transition-colors text-left group">
                    <span className="truncate">{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#bbb] group-hover:text-[#ff7a00] transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile drawer for screens */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#dddddd] bg-[#2a1400] animate-fade-up py-4 px-4 space-y-2">
          <form onSubmit={handleSearch} className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.common.searchPlaceholder} className="input-field pl-9 bg-white" />
          </form>
          <div className="grid grid-cols-2 gap-1.5">
            {MEGA_CATEGORIES.slice(0, 10).map((item) => (
              <button key={item.label} onClick={() => handleMegaNav(item)} className="text-left px-3 py-2 text-xs text-white rounded hover:bg-[#3d1f00] truncate">{item.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Slide-over interactive Cart Drawer (High Fidelity & Functional) */}
      {cartDrawerOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 z-50 transition-opacity animate-fade-in" onClick={() => setCartDrawerOpen(false)} />

          {/* Slide panel */}
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-white text-[#0f172a] z-50 shadow-2xl flex flex-col h-full animate-fade-up">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#dddddd] flex items-center justify-between bg-[#f3f3f3]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#ff7a00]" />
                <h2 className="text-base font-bold text-[#0f172a]">{locale === 'fr' ? 'Votre Panier Zando' : 'Your Zando Cart'}</h2>
                <span className="text-xs bg-[#ff7a00] text-white px-2 py-0.5 rounded-full font-bold">{cartCount}</span>
              </div>
              <button onClick={() => setCartDrawerOpen(false)} className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-black transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cartItemsResolved.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-semibold text-sm">{t.cart.empty}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.cart.emptyDesc}</p>
                  <button onClick={() => { setCartDrawerOpen(false); navigate('catalog'); }} className="mt-4 btn-gold w-fit px-5 text-xs py-2">{t.cart.continueShopping}</button>
                </div>
              ) : (
                cartItemsResolved.map((item) => (
                  <div key={item.productId} className="flex gap-3 border-b border-[#eee] pb-4 last:border-none">
                    <img src={item.product!.product_images?.[0]?.image_url || ''} alt={item.product!.name} className="w-16 h-16 rounded object-cover border border-gray-200 shrink-0 cursor-pointer" onClick={() => { setCartDrawerOpen(false); navigate('product', { id: item.productId }); }} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#0f172a] line-clamp-2 leading-tight hover:text-[#ff7a00] cursor-pointer" onClick={() => { setCartDrawerOpen(false); navigate('product', { id: item.productId }); }}>
                        {item.product!.name}
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">{item.product!.sellers?.business_name}</p>
                      {item.variation && <span className="inline-block text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 mt-1">{item.variation}</span>}

                      {/* Quantity trigger & remove */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-gray-300 rounded overflow-hidden scale-90 origin-left">
                          <button onClick={() => updateCartQty(item.productId, item.qty - 1)} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold">-</button>
                          <span className="px-3.5 text-xs font-bold text-gray-800">{item.qty}</span>
                          <button onClick={() => updateCartQty(item.productId, item.qty + 1)} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.productId)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors">
                          <Trash2 className="w-3 h-3" />
                          <span>{t.cart.remove}</span>
                        </button>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-[#0f172a]">${(item.product!.price * item.qty).toFixed(0)}</p>
                      <p className="text-[10px] text-gray-400 font-medium">${item.product!.price} ea</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom summary and checkouts */}
            {cartItemsResolved.length > 0 && (
              <div className="p-4 border-t border-[#dddddd] bg-[#fcfcfc] space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">{t.cart.subtotal} :</span>
                  <span className="text-lg font-black text-[#0f172a]">${cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="text-[11px] text-[#e06c00] font-bold bg-[#ff7a00]/10 p-2 rounded border border-[#ff7a00]/30 flex items-center gap-1">
                  <CheckCircleIcon className="w-4 h-4 shrink-0" />
                  <span>Your order qualifies for free Delivery by the seller!</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => go('checkout')} className="flex-1 btn-gold font-bold text-xs py-3 rounded-lg shadow transition-transform active:scale-95">
                    {t.cart.checkout}
                  </button>
                  <button onClick={() => go('cart')} className="flex-1 btn-cocoa text-xs py-3 rounded-lg font-bold">
                    {locale === 'fr' ? 'Voir le panier' : 'View full cart'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[#0f172a] rounded hover:bg-[#f3f3f3] transition-colors text-left font-medium">
      <Icon className="w-4 h-4 text-[#565959]" /> {label}
    </button>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function NotificationBell({ locale, navigate }: { locale: 'fr' | 'en'; navigate: (page: string, params?: Record<string, string>) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetchUnreadNotificationCount().then(setUnread);
    // Rafraîchissement léger périodique — pas de realtime nécessaire ici.
    const interval = setInterval(() => fetchUnreadNotificationCount().then(setUnread), 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleOpen = async () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      const data = await fetchNotifications();
      setItems(data);
    }
  };

  const handleClick = async (n: AppNotification) => {
    if (!n.is_read) { await markNotificationRead(n.id); setUnread((u) => Math.max(0, u - 1)); }
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    if (n.link) { navigate(n.link); setOpen(false); }
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    setUnread(0);
  };

  return (
    <div className="relative">
      <button onClick={toggleOpen} className="relative w-10 h-10 rounded-full border border-[#e2e8f0] flex items-center justify-center hover:border-[#3d1f00] transition-colors" title={locale === 'fr' ? 'Notifications' : 'Notifications'}>
        <Bell className="w-4.5 h-4.5 text-[#3d1f00]" />
        {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold flex items-center justify-center rounded-full bg-[#ff7a00] text-white">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-[#dddddd] rounded-lg shadow-xl z-50 animate-fade-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#eee]">
              <p className="text-sm font-bold text-[#0f172a]">{locale === 'fr' ? 'Notifications' : 'Notifications'}</p>
              {unread > 0 && <button onClick={handleMarkAll} className="text-xs font-semibold text-[#ff7a00] hover:underline">{locale === 'fr' ? 'Tout marquer comme lu' : 'Mark all read'}</button>}
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-[#64748b] text-center py-8">{locale === 'fr' ? 'Aucune notification.' : 'No notifications.'}</p>
            ) : (
              items.map((n) => (
                <button key={n.id} onClick={() => handleClick(n)} className={'w-full text-left px-4 py-3 border-b border-[#f3f3f3] hover:bg-[#f7f8fa] transition-colors ' + (!n.is_read ? 'bg-[#ff7a00]/5' : '')}>
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00] mt-1.5 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0f172a]">{n.title}</p>
                      <p className="text-xs text-[#64748b] mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-[#94a3b8] mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
