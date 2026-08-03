import { useState, useRef, useEffect } from 'react';
import { Menu, X, Search, ShoppingBag, Globe, ChevronDown, User as UserIcon, Store, Shield, LayoutDashboard, LogOut, Heart, Package, MapPin, Bell, MessageSquare, ChevronRight } from 'lucide-react';
import { useApp } from '@/lib/store';
import { Logo } from './Logo';
import { searchSuggestions, type Seller } from '@/lib/db';

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
  { label: 'African Products', cat: 'textiles' },
  { label: 'Official Stores', key: 'stores' },
  { label: 'Brands', key: 'brands' },
  { label: 'Gift Cards', key: 'gift' },
  { label: 'Sell on Zando', key: 'sell' },
  { label: 'Support', key: 'support' },
];

export function Header() {
  const { t, locale, setLocale, navigate, user, logout, cartCount, geo, setGeo, wishlist, countries, currencies, currencyCode, setCurrencyCode, products, categories } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const sellers = products.map((p) => p.sellers).filter(Boolean) as Seller[];
  const suggestions = searchSuggestions(products, sellers, categories, search);

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

  const go = (p: string) => { navigate(p); setMobileOpen(false); setMegaOpen(false); };

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

  return (
    <header className="sticky top-0 z-50 safe-top bg-white border-b border-[#e2e8f0]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Left: burger + logo */}
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg hover:bg-[#f7f8fa]">
              {mobileOpen ? <X className="w-5 h-5 text-[#0f172a]" /> : <Menu className="w-5 h-5 text-[#0f172a]" />}
            </button>
            <button onClick={() => go('home')}><Logo size={32} /></button>
          </div>

          {/* Deliver to */}
          <button onClick={() => go('account')} className="hidden xl:flex flex-col items-start text-left px-2 py-1 rounded-lg hover:bg-[#f7f8fa]">
            <span className="text-[10px] text-[#64748b] flex items-center gap-1"><MapPin className="w-3 h-3" /> {locale === 'fr' ? 'Livrer à' : 'Deliver to'}</span>
            <span className="text-xs font-semibold text-[#0f172a]">{currentCountry?.flag} {currentCountry?.name}</span>
          </button>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-2 relative" ref={searchRef}>
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="flex items-center w-full rounded-lg border-2 border-[#e2e8f0] bg-white overflow-hidden focus-within:border-[#0e9f6e] transition-colors">
                <select className="hidden sm:block px-2 py-2.5 text-xs text-[#64748b] border-r border-[#e2e8f0] bg-[#f7f8fa] focus:outline-none cursor-pointer">
                  <option>All</option>
                  {categories.filter((c) => !c.parent_id).slice(0, 8).map((c) => <option key={c.id}>{c.name}</option>)}
                </select>
                <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)}
                  placeholder={t.common.searchPlaceholder} className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none text-[#0f172a]" />
                <button type="submit" className="px-4 py-2.5 bg-[#0e9f6e] hover:bg-[#0c8a5f] transition-colors">
                  <Search className="w-5 h-5 text-white" />
                </button>
              </div>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#e2e8f0] rounded-lg shadow-xl animate-fade-up z-50 max-h-80 overflow-y-auto">
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase text-[#64748b]">{locale === 'fr' ? 'Suggestions' : 'Suggestions'}</p>
                {suggestions.map((s) => (
                  <button key={s} onClick={() => { setSearch(s); navigate('catalog', { q: s }); setShowSuggestions(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f7f8fa] transition-colors text-left">
                    <Search className="w-3.5 h-3.5 text-[#64748b]" /> {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5">
            {/* Language */}
            <button onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')} className="hidden sm:flex items-center gap-1 px-2 py-2 text-xs font-medium rounded-lg hover:bg-[#f7f8fa] text-[#0f172a]">
              <Globe className="w-4 h-4" /> {locale.toUpperCase()}
            </button>
            {/* Currency */}
            <select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)}
              className="hidden sm:block px-2 py-2 text-xs rounded-lg border border-[#e2e8f0] bg-white text-[#0f172a] focus:outline-none focus:border-[#0e9f6e] cursor-pointer">
              {currencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
            {/* Country */}
            <select value={geo.countryId} onChange={(e) => setGeo({ countryId: e.target.value })}
              className="hidden sm:block px-2 py-2 text-xs rounded-lg border border-[#e2e8f0] bg-white text-[#0f172a] focus:outline-none focus:border-[#0e9f6e] cursor-pointer max-w-[90px]">
              {countries.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
            </select>
            {/* Notifications */}
            <button onClick={() => navigate('account')} className="hidden sm:block p-2 rounded-lg hover:bg-[#f7f8fa] relative">
              <Bell className="w-5 h-5 text-[#0f172a]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ff9900]" />
            </button>
            {/* Messages */}
            <button onClick={() => navigate('account')} className="hidden sm:block p-2 rounded-lg hover:bg-[#f7f8fa]">
              <MessageSquare className="w-5 h-5 text-[#0f172a]" />
            </button>
            {/* Wishlist */}
            <button onClick={() => go('account')} className="relative p-2 rounded-lg hover:bg-[#f7f8fa]">
              <Heart className="w-5 h-5 text-[#0f172a]" />
              {wishlist.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold flex items-center justify-center rounded-full bg-[#ff9900] text-white">{wishlist.length}</span>}
            </button>
            {/* Orders */}
            <button onClick={() => go('account')} className="hidden sm:block p-2 rounded-lg hover:bg-[#f7f8fa]" title={t.nav.orders}>
              <Package className="w-5 h-5 text-[#0f172a]" />
            </button>
            {/* Cart */}
            <button onClick={() => go('cart')} className="relative p-2 rounded-lg hover:bg-[#f7f8fa]">
              <ShoppingBag className="w-5 h-5 text-[#0f172a]" />
              {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold flex items-center justify-center rounded-full bg-[#0e9f6e] text-white">{cartCount}</span>}
            </button>
            {/* User */}
            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[#f7f8fa]">
                  <div className="w-7 h-7 rounded-full bg-[#0e9f6e] flex items-center justify-center text-white text-xs font-bold">{user.fullName.charAt(0).toUpperCase()}</div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748b] hidden sm:block" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-[#e2e8f0] rounded-lg shadow-xl z-50 p-2 animate-fade-up">
                      <div className="px-3 py-2 border-b border-[#e2e8f0] mb-1">
                        <p className="text-sm font-semibold text-[#0f172a]">{user.fullName}</p>
                        <p className="text-xs text-[#64748b]">{user.email}</p>
                      </div>
                      <MenuItem icon={UserIcon} label={t.nav.account} onClick={() => { go('account'); setUserMenuOpen(false); }} />
                      <MenuItem icon={Package} label={t.nav.orders} onClick={() => { go('account'); setUserMenuOpen(false); }} />
                      {user.role === 'seller' && <MenuItem icon={LayoutDashboard} label={t.nav.sellerCenter} onClick={() => { go('seller-center'); setUserMenuOpen(false); }} />}
                      {(user.role === 'admin' || user.role === 'superadmin') && <MenuItem icon={Shield} label={t.nav.admin} onClick={() => { go('admin'); setUserMenuOpen(false); }} />}
                      {user.role === 'customer' && <MenuItem icon={Store} label={t.nav.becomeSeller} onClick={() => { go('sell'); setUserMenuOpen(false); }} />}
                      <div className="border-t border-[#e2e8f0] mt-1 pt-1">
                        <MenuItem icon={LogOut} label={t.nav.logout} onClick={() => { logout(); setUserMenuOpen(false); }} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1">
                <button onClick={() => go('login')} className="px-2.5 py-2 text-xs font-medium text-[#0f172a] hover:text-[#0e9f6e]">{t.nav.login}</button>
                <button onClick={() => go('signup')} className="btn-green px-3 py-2 text-xs rounded-lg">{t.nav.signup}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mega Navigation Bar */}
      <div className="hidden lg:flex items-center border-t border-[#e2e8f0] h-10 relative">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-0.5 overflow-x-auto no-scrollbar w-full">
          <button onClick={() => setMegaOpen(!megaOpen)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] transition-colors shrink-0">
            <Menu className="w-4 h-4" /> {t.home.categoriesTitle}
          </button>
          {MEGA_CATEGORIES.slice(0, 10).map((item) => (
            <button key={item.label} onClick={() => handleMegaNav(item)} className="px-2.5 py-1.5 text-sm text-[#0f172a] hover:text-[#0e9f6e] whitespace-nowrap transition-colors">
              {item.label}
            </button>
          ))}
          <button onClick={() => go('sell')} className="px-2.5 py-1.5 text-sm font-semibold text-[#ff9900] hover:text-[#e88b00] whitespace-nowrap transition-colors shrink-0">
            {t.nav.becomeSeller}
          </button>
        </div>

        {/* Mega dropdown */}
        {megaOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMegaOpen(false)} />
            <div className="absolute top-full left-0 right-0 bg-white border-t border-[#e2e8f0] shadow-xl z-50 animate-fade-up max-h-[70vh] overflow-y-auto">
              <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-1">
                  {MEGA_CATEGORIES.map((item) => (
                    <button key={item.label} onClick={() => handleMegaNav(item)}
                      className="flex items-center justify-between px-2 py-2 text-sm text-[#0f172a] rounded-lg hover:bg-[#f7f8fa] hover:text-[#0e9f6e] transition-colors text-left group">
                      {item.label}
                      <ChevronRight className="w-3.5 h-3.5 text-[#64748b]/40 group-hover:text-[#0e9f6e] transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#e2e8f0] bg-white animate-fade-up max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            <form onSubmit={handleSearch} className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.common.searchPlaceholder} className="input-field pl-9" />
            </form>
            <div className="grid grid-cols-2 gap-1">
              {MEGA_CATEGORIES.map((item) => (
                <button key={item.label} onClick={() => handleMegaNav(item)} className="text-left px-3 py-2 text-sm text-[#0f172a] rounded-lg hover:bg-[#f7f8fa]">{item.label}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-[#e2e8f0]">
              <button onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')} className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e2e8f0] text-[#0f172a]"><Globe className="w-4 h-4 inline mr-1" /> {locale.toUpperCase()}</button>
              {!user && <button onClick={() => go('login')} className="flex-1 btn-cocoa px-3 py-2 text-sm rounded-lg">{t.nav.login}</button>}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[#0f172a] rounded-lg hover:bg-[#f7f8fa] transition-colors">
      <Icon className="w-4 h-4 text-[#64748b]" /> {label}
    </button>
  );
}
