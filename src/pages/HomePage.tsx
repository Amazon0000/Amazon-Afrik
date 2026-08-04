import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { ProductCard } from '@/components/Cards';
import { SectionTitle } from '@/components/ui';
import { ShieldCheck, CreditCard, Truck, Globe, ArrowRight, Sparkles, TrendingUp, Star, Store, MapPin, Clock, Zap, Tag, Gift, Award, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Seller } from '@/lib/db';
import * as Icons from 'lucide-react';

export function HomePage() {
  const { t, navigate, geo, locale, products, loadingProducts, categories, countries } = useApp();

  const deals = products.filter((p) => p.old_price);
  const newArrivals = [...products].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10);
  const topRated = [...products].sort((a, b) => b.rating - a.rating).slice(0, 10);
  const trending = [...products].sort((a, b) => b.total_reviews - a.total_reviews).slice(0, 10);
  const localProducts = products.filter((p) => p.country_id === geo.countryId);

  // Guarantee minimum 10 products for the hero slides with real title and buy buttons
  const heroSlides = products.length >= 10 ? products.slice(0, 10) : [...products, ...products, ...products].slice(0, 10);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    if (heroSlides.length === 0) return;
    const timer = setInterval(() => setHeroIdx((i) => (i + 1) % heroSlides.length), 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const featuredCategories = categories.filter((c) => c.is_featured && !c.parent_id);
  const sellers = [...new Map(products.map((p) => [p.sellers?.id, p.sellers]).filter(([, s]) => s) as [string, typeof products[0]['sellers']][]).values()].map((s) => s!) as Seller[];

  if (loadingProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-[#0e9f6e]/20 border-t-[#0e9f6e] animate-spin" />
          <p className="text-sm text-[#64748b]">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  const prevSlide = () => {
    setHeroIdx((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const nextSlide = () => {
    setHeroIdx((prev) => (prev + 1) % heroSlides.length);
  };

  return (
    <div className="bg-[#f7f8fa]">
      {/* High-Fidelity 10+ Product Hero Slider with individual Titles and Buy Direct triggers */}
      <section className="relative bg-white border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative h-[320px] sm:h-[420px] lg:h-[480px] rounded-2xl overflow-hidden my-4 shadow-sm border border-[#0f172a]/5">
            {heroSlides.map((p, i) => (
              <div key={`${p.id}-${i}`} className={`absolute inset-0 transition-all duration-1000 transform ${i === heroIdx ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-12 scale-95 pointer-events-none'}`}>
                <img src={p.product_images?.[0]?.image_url} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent" />
                <div className="relative h-full flex flex-col justify-center max-w-xl px-6 sm:px-12">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0e9f6e]/10 mb-3 w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-[#0e9f6e]" />
                    <span className="text-[10px] font-bold text-[#0e9f6e] uppercase tracking-wider">{t.home.heroTag} — {locale === 'fr' ? 'Exclusivité' : 'Exclusives'} ({i + 1}/10)</span>
                  </span>

                  {/* Real product name displayed clearly inside slide */}
                  <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0f172a] mb-2 leading-tight tracking-tight drop-shadow-sm">
                    {p.name}
                  </h1>

                  <p className="text-xs sm:text-sm text-[#64748b] mb-4 max-w-md line-clamp-2">
                    {p.description || t.home.heroSubtitle}
                  </p>

                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-xl sm:text-2xl font-bold text-[#0e9f6e]">
                      {p.price ? `$${p.price.toFixed(2)}` : ''}
                    </span>
                    {p.old_price && (
                      <span className="text-xs sm:text-sm text-[#64748b] line-through">
                        ${p.old_price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Dual buttons - including direct Buy Button pointing directly to the product detail view */}
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => navigate('product', { id: p.id })} className="btn-green px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-md">
                      <ShoppingBag className="w-4 h-4" /> {locale === 'fr' ? 'Acheter maintenant' : 'Buy Now'}
                    </button>
                    <button onClick={() => navigate('catalog')} className="px-5 py-3 rounded-xl font-semibold bg-white border border-[#e2e8f0] text-[#0f172a] hover:bg-[#f7f8fa] transition-colors">
                      {locale === 'fr' ? 'Parcourir tout' : 'Browse All'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Slider arrows */}
            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 border border-[#0f172a]/15 flex items-center justify-center hover:bg-white transition-all shadow-sm">
              <ChevronLeft className="w-5 h-5 text-[#0f172a]" />
            </button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 border border-[#0f172a]/15 flex items-center justify-center hover:bg-white transition-all shadow-sm">
              <ChevronRight className="w-5 h-5 text-[#0f172a]" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-[#0f172a]/10 backdrop-blur-md px-3 py-1.5 rounded-full">
              {heroSlides.map((_, i) => (
                <button key={i} onClick={() => setHeroIdx(i)} className={`h-1.5 rounded-full transition-all ${i === heroIdx ? 'bg-[#0e9f6e] w-6' : 'bg-[#0f172a]/30 w-1.5'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-[#e2e8f0] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: ShieldCheck, label: t.home.trust1 },
              { icon: CreditCard, label: t.home.trust2 },
              { icon: Truck, label: t.home.trust3 },
              { icon: Globe, label: t.home.trust4 },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0e9f6e]/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-[#0e9f6e]" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#0f172a]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 py-8">

        {/* Sleek, ultra-thin horizontally scrollable Countries Carousel Section */}
        <section className="bg-white rounded-2xl p-4 sm:p-6 border border-[#e2e8f0] shadow-sm">
          <SectionTitle title={locale === 'fr' ? 'Explorer par pays' : 'Explore by Country'} subtitle={locale === 'fr' ? 'Accès direct aux marchés régionaux' : 'Direct access to regional markets'} />
          <div className="relative mt-4">
            <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-1 snap-x">
              {countries.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate('catalog', { country: c.id })}
                  className="snap-start flex items-center gap-2 px-4 py-2 rounded-full border border-[#0f172a]/10 hover:border-[#0e9f6e] hover:bg-[#0e9f6e]/5 transition-all bg-white shrink-0 shadow-sm"
                >
                  <span className="text-xl shrink-0">{c.flag}</span>
                  <span className="text-xs font-bold text-[#0f172a] whitespace-nowrap">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Flash Deals */}
        {deals.length > 0 && (
          <section className="card p-5 bg-gradient-to-br from-[#ff9900]/5 to-[#0e9f6e]/5 border-[#ff9900]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#ff9900]" />
                <h2 className="font-display text-xl font-bold text-[#0f172a]">{t.home.dealsTitle}</h2>
              </div>
              <button onClick={() => navigate('catalog')} className="text-sm font-semibold text-[#0e9f6e] hover:underline flex items-center gap-1">{t.home.shopNow} <ArrowRight className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {deals.map((p) => (
                <div key={p.id} className="w-40 sm:w-44 shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        {featuredCategories.length > 0 && (
          <section>
            <SectionTitle title={t.home.categoriesTitle} action={<button onClick={() => navigate('catalog')} className="text-sm font-semibold text-[#0e9f6e] hover:underline flex items-center gap-1">{t.home.ctaBrowse} <ArrowRight className="w-4 h-4" /></button>} />
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {featuredCategories.map((c) => {
                const Icon = (Icons as unknown as Record<string, React.ElementType>)[c.icon || ''] || Icons.Tag;
                return (
                  <button key={c.id} onClick={() => navigate('catalog', { category: c.id })} className="card p-5 flex flex-col items-center gap-2 min-w-[110px] hover:border-[#0e9f6e] transition-all">
                    <div className="w-12 h-12 rounded-xl bg-[#0e9f6e]/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-[#0e9f6e]" />
                    </div>
                    <span className="text-sm font-medium text-[#0f172a] whitespace-nowrap">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Trending */}
        <section>
          <SectionTitle title={t.home.trendingProducts} action={<button onClick={() => navigate('catalog')} className="text-sm font-semibold text-[#0e9f6e] hover:underline flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {t.home.ctaBrowse}</button>} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {trending.slice(0, 10).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* Best Sellers */}
        <section>
          <SectionTitle title={t.home.bestSellers} action={<button onClick={() => navigate('catalog', { sort: 'rating' })} className="text-sm font-semibold text-[#0e9f6e] hover:underline flex items-center gap-1"><Award className="w-4 h-4" /> {t.home.ctaBrowse}</button>} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {topRated.slice(0, 10).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* New Arrivals */}
        <section>
          <SectionTitle title={t.home.newArrivals} action={<button onClick={() => navigate('catalog', { sort: 'newest' })} className="text-sm font-semibold text-[#0e9f6e] hover:underline flex items-center gap-1"><Clock className="w-4 h-4" /> {t.home.ctaBrowse}</button>} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {newArrivals.slice(0, 10).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* Products Near You */}
        {localProducts.length > 0 && (
          <section>
            <SectionTitle title={t.home.productsNearYou} subtitle={`${countries.find((c) => c.id === geo.countryId)?.flag} ${countries.find((c) => c.id === geo.countryId)?.name}`} action={<button onClick={() => navigate('sellers', { other: '1' })} className="text-sm font-semibold text-[#0e9f6e] hover:underline">{t.home.viewOtherCountries}</button>} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {localProducts.slice(0, 10).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Featured Vendors */}
        {sellers.length > 0 && (
          <section>
            <SectionTitle title={t.home.featuredSellers} action={<button onClick={() => navigate('sellers')} className="text-sm font-semibold text-[#0e9f6e] hover:underline flex items-center gap-1"><Store className="w-4 h-4" /> {t.nav.sellers}</button>} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sellers.slice(0, 6).map((s) => (
                <div key={s.id} onClick={() => navigate('seller', { id: s.id })} className="card overflow-hidden cursor-pointer group bg-white">
                  <div className="relative h-24 overflow-hidden bg-[#0f172a]">
                    <img src={s.store_banner_url || ''} alt="" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/60 to-transparent" />
                    {s.is_official && <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded bg-[#0e9f6e] text-white">Official</span>}
                  </div>
                  <div className="p-4 -mt-8 relative">
                    <div className="w-12 h-12 rounded-xl border-2 border-[#0e9f6e] overflow-hidden bg-white shadow-lg">
                      <img src={s.store_logo_url || ''} alt="" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="mt-2 font-semibold text-sm text-[#0f172a]">{s.business_name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#64748b]">
                      <Star className="w-3 h-3 fill-[#ff9900] text-[#ff9900]" /> {s.rating} ({s.total_reviews})
                      <span className="ml-auto flex items-center gap-0.5"><MapPin className="w-3 h-3" />{s.city}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommended */}
        <section>
          <SectionTitle title={t.home.recommendedForYou} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.slice(0, 10).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* Coupons & Gift Cards banner */}
        <section className="grid sm:grid-cols-2 gap-4">
          <div className="card p-6 bg-gradient-to-br from-[#ff9900]/10 to-transparent border-[#ff9900]/20">
            <Tag className="w-8 h-8 text-[#ff9900] mb-3" />
            <h3 className="font-display text-lg font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Coupons & Codes Promo' : 'Coupons & Promo Codes'}</h3>
            <p className="text-sm text-[#64748b] mb-4">{locale === 'fr' ? 'Économisez sur vos achats avec nos coupons exclusifs.' : 'Save on your purchases with exclusive coupons.'}</p>
            <button onClick={() => navigate('catalog')} className="btn-green px-5 py-2.5 rounded-lg text-sm font-semibold">{t.home.shopNow}</button>
          </div>
          <div className="card p-6 bg-gradient-to-br from-[#0e9f6e]/10 to-transparent border-[#0e9f6e]/20">
            <Gift className="w-8 h-8 text-[#0e9f6e] mb-3" />
            <h3 className="font-display text-lg font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Cartes Cadeaux' : 'Gift Cards'}</h3>
            <p className="text-sm text-[#64748b] mb-4">{locale === 'fr' ? 'Offrez la liberté de choisir avec une carte cadeau Zando.' : 'Give the freedom of choice with a Zando gift card.'}</p>
            <button onClick={() => navigate('catalog')} className="btn-cocoa px-5 py-2.5 rounded-lg text-sm font-semibold">{t.home.shopNow}</button>
          </div>
        </section>

        {/* Sell CTA */}
        <section>
          <div className="motif-dark rounded-2xl p-8 sm:p-12 text-center">
            <Store className="w-12 h-12 text-[#0e9f6e] mx-auto mb-4" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">{t.home.ctaSell}</h2>
            <p className="text-sm text-white/70 max-w-md mx-auto mb-6">{t.onboarding.subtitle}</p>
            <button onClick={() => navigate('sell')} className="btn-green px-8 py-3.5 rounded-xl font-semibold inline-flex items-center gap-2">
              {t.home.ctaSell} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
