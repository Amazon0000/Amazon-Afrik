import { useState, useRef, useEffect, useMemo } from 'react';
import { Menu, X, Search, ShoppingBag, Globe, ChevronDown, User as UserIcon, Store, Shield, LayoutDashboard, LogOut, Package, MapPin, ChevronRight, Headphones, Trash2, ShoppingCart } from 'lucide-react';
import { useApp } from '@/lib/store';
import { Logo } from './Logo';
import { searchSuggestions } from '@/lib/db';

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
  const { t, locale, setLocale, navigate, user, logout, cart, cartCount, updateCartQty, removeFromCart, geo, countries, products, categories } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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

  const go = (p: string) => { navigate(p); setMobileOpen(false); setMegaOpen(false); setCartDrawerOpen(false); };

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
    <header className="sticky top-0 z-50 bg-[#3d1f00] text-white font-sans">
      {/* Top Navbar */}
      <div className="max-w-[1500px] mx-auto px-4 py-1.5 flex items-center justify-between gap-3 text-sm">
        {/* Left: Logo & Deliver To */}
        <div className="flex items-center gap-4">
          <button onClick={() => go('home')} className="flex items-center hover:outline hover:outline-1 hover:outline-white px-2 py-1 rounded-sm transition-all text-white">
            <Logo size={28} variant="light" />
          </button>

          {/* Deliver to */}
          <button onClick={() => go('account')} className="hidden lg:flex flex-col items-start hover:outline hover:outline-1 hover:outline-white px-2.5 py-1 rounded-sm transition-all text-left">
            <span className="text-[11px] text-[#cccccc] font-normal leading-none flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-white shrink-0" />
              {locale === 'fr' ? 'Livrer à' : 'Deliver to'}
            </span>
            <span className="text-[13px] font-bold text-white mt-0.5 ml-4 leading-none">
              {currentCountry?.flag} {currentCountry?.name}
            </span>
          </button>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-4xl relative" ref={searchRef}>
          <form onSubmit={handleSearch} className="flex w-full">
            <div className="flex items-center w-full rounded-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#0e9f6e] transition-shadow">
              <select className="hidden md:block px-3 py-2 text-xs text-[#555] border-r border-[#ddd] bg-[#f3f3f3] hover:bg-[#dadada] focus:outline-none cursor-pointer font-sans h-10 shrink-0">
                <option>All</option>
                {categories.filter((c) => !c.parent_id).slice(0, 8).map((c) => <option key={c.id}>{c.name}</option>)}
              </select>
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)}
                placeholder={t.common.searchPlaceholder} className="flex-1 px-3 py-2 text-[14px] bg-transparent focus:outline-none text-[#0f172a] h-10 font-sans" />
              <button type="submit" className="px-5 bg-[#0e9f6e] hover:bg-[#0a7d54] transition-colors h-10 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5 text-white" />
              </button>
            </div>
          </form>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#dddddd] rounded shadow-lg animate-fade-up z-50 max-h-80 overflow-y-auto text-[#0f172a]">
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
        <div className="flex items-center gap-2 shrink-0">
          {/* Language toggle */}
          <button onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')} className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-sm hover:outline hover:outline-1 hover:outline-white transition-all text-xs font-bold text-white">
            <Globe className="w-4 h-4 text-white" />
            <span>{locale.toUpperCase()}</span>
            <ChevronDown className="w-3 h-3 text-[#cccccc]" />
          </button>

          {/* User Sign In Account & Lists */}
          {user ? (
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex flex-col items-start leading-none px-2.5 py-1.5 rounded-sm hover:outline hover:outline-1 hover:outline-white transition-all text-left text-white">
                <span className="text-[11px] text-[#cccccc] font-normal leading-none flex items-center gap-1">
                  Hello, {user.fullName.split(' ')[0]}
                  <ChevronDown className="w-3 h-3 text-[#cccccc] inline" />
                </span>
                <span className="text-[13px] font-bold text-white mt-1 leading-none">Account & Lists</span>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-[#dddddd] rounded shadow-xl z-50 p-2 text-[#0f172a] animate-fade-up">
                    <div className="px-3 py-2.5 border-b border-[#eee] mb-1">
                      <p className="text-xs text-[#565959]">{locale === 'fr' ? 'Votre compte :' : 'Your account:'}</p>
                      <p className="text-sm font-bold text-[#0f172a] truncate">{user.fullName}</p>
                      <p className="text-xs text-[#565959] truncate">{user.email}</p>
                    </div>
                    <MenuItem icon={UserIcon} label={t.nav.account} onClick={() => { go('account'); setUserMenuOpen(false); }} />
                    <MenuItem icon={Package} label={t.nav.orders} onClick={() => { go('account'); setUserMenuOpen(false); }} />
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
            <button onClick={() => go('login')} className="flex flex-col items-start leading-none px-2.5 py-1.5 rounded-sm hover:outline hover:outline-1 hover:outline-white transition-all text-left text-white">
              <span className="text-[11px] text-[#cccccc] font-normal leading-none">Hello, Sign in</span>
              <span className="text-[13px] font-bold text-white mt-1 leading-none flex items-center gap-0.5">Account & Lists <ChevronDown className="w-3 h-3 text-[#cccccc]" /></span>
            </button>
          )}

          {/* Returns & Orders */}
          <button onClick={() => go('account')} className="hidden sm:flex flex-col items-start px-2.5 py-1.5 rounded-sm hover:outline hover:outline-1 hover:outline-white transition-all text-left text-white">
            <span className="text-[11px] text-[#cccccc] font-normal leading-none">{locale === 'fr' ? 'Retours' : 'Returns'}</span>
            <span className="text-[13px] font-bold text-white mt-1 leading-none">& Orders</span>
          </button>

          {/* Cart with slider drawer trigger */}
          <button onClick={() => setCartDrawerOpen(true)} className="relative flex items-end gap-1 px-2.5 py-1.5 rounded-sm hover:outline hover:outline-1 hover:outline-white transition-all text-white">
            <div className="relative flex items-center">
              <ShoppingBag className="w-7 h-7 text-white" />
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-5 text-xs font-bold flex items-center justify-center rounded-full bg-[#0e9f6e] text-white">
                {cartCount}
              </span>
            </div>
            <span className="hidden md:inline text-[13px] font-bold leading-none mb-1">Cart</span>
          </button>
        </div>
      </div>

      {/* Subheader Bar */}
      <div className="bg-[#2a1400] text-white">
        <div className="max-w-[1500px] mx-auto px-4 h-10 flex items-center justify-between text-xs sm:text-sm font-medium overflow-hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button onClick={() => setMegaOpen(!megaOpen)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm hover:outline hover:outline-1 hover:outline-white font-bold shrink-0 text-white">
              <Menu className="w-4 h-4" /> All
            </button>
            {MEGA_CATEGORIES.slice(0, 11).map((item) => (
              <button key={item.label} onClick={() => handleMegaNav(item)} className="px-3 py-1.5 rounded-sm hover:outline hover:outline-1 hover:outline-white whitespace-nowrap transition-all text-white font-normal">
                {item.label}
              </button>
            ))}
            <button onClick={() => go('sell')} className="px-3 py-1.5 rounded-sm hover:outline hover:outline-1 hover:outline-white font-bold text-[#12b77e] whitespace-nowrap transition-all shrink-0">
              {t.nav.becomeSeller}
            </button>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 text-[#12b77e] font-bold px-3 shrink-0">
            <span className="text-xs font-normal text-white/70">Verified Sellers Worldwide</span>
          </div>
        </div>
      </div>

      {/* Mega full-width dropdown menu */}
      {megaOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 transition-opacity" onClick={() => setMegaOpen(false)} />
          <div className="absolute top-full left-0 right-0 bg-white border-t border-[#dddddd] shadow-2xl z-50 animate-fade-up max-h-[75vh] overflow-y-auto text-[#0f172a]">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#eee]">
                <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2"><Store className="w-5 h-5 text-[#0e9f6e]" /> {t.home.categoriesTitle}</h3>
                <button onClick={() => setMegaOpen(false)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-2">
                {MEGA_CATEGORIES.map((item) => (
                  <button key={item.label} onClick={() => handleMegaNav(item)}
                    className="flex items-center justify-between px-2 py-1.5 rounded text-sm text-[#0f172a] hover:bg-[#f3f3f3] hover:text-[#0e9f6e] transition-colors text-left group">
                    <span className="truncate">{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#bbb] group-hover:text-[#0e9f6e] transition-colors shrink-0" />
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
                <ShoppingCart className="w-5 h-5 text-[#0e9f6e]" />
                <h2 className="text-base font-bold text-[#0f172a]">{locale === 'fr' ? 'Votre Panier Zando' : 'Your Zando Cart'}</h2>
                <span className="text-xs bg-[#0e9f6e] text-white px-2 py-0.5 rounded-full font-bold">{cartCount}</span>
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
                      <h4 className="text-xs font-bold text-[#0f172a] line-clamp-2 leading-tight hover:text-[#0e9f6e] cursor-pointer" onClick={() => { setCartDrawerOpen(false); navigate('product', { id: item.productId }); }}>
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
                <div className="text-[11px] text-green-700 font-bold bg-green-50 p-2 rounded border border-green-200 flex items-center gap-1">
                  <CheckCircleIcon className="w-4 h-4 shrink-0" />
                  <span>Your order qualifies for free Delivery by the seller!</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => go('checkout')} className="flex-1 btn-green font-bold text-xs py-3 rounded-lg shadow transition-transform active:scale-95 text-white">
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
