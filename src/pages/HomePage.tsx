import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { ProductCard } from '@/components/Cards';
import { Countdown } from '@/components/ui';
import { fetchActiveFlashDeals, type FlashDeal } from '@/lib/db';
import { ArrowRight, Sparkles, TrendingUp, Store, MapPin, Zap, Tag, Gift, Award, Megaphone, ChevronLeft, ChevronRight, Star, Flame } from 'lucide-react';

export function HomePage() {
  const { t, navigate, geo, locale, products, loadingProducts, categories, countries } = useApp();
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>([]);

  useEffect(() => {
    fetchActiveFlashDeals().then(setFlashDeals);
  }, []);

  const sponsored = products.filter((p) => p.is_sponsored);
  const deals = products.filter((p) => p.old_price);
  const topRated = [...products].sort((a, b) => b.rating - a.rating).slice(0, 10);
  const trending = [...products].sort((a, b) => b.total_reviews - a.total_reviews).slice(0, 10);
  const localProducts = products.filter((p) => p.country_id === geo.countryId);

  const heroSlides = sponsored.slice(0, 5).length > 0 ? sponsored.slice(0, 5) : products.slice(0, 5);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    if (heroSlides.length === 0) return;
    const timer = setInterval(() => setHeroIdx((i) => (i + 1) % heroSlides.length), 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const sellers = [...new Map(
    products
      .map((p) => [p.sellers?.id, p.sellers] as [string | undefined, typeof p.sellers])
      .filter((entry): entry is [string, NonNullable<typeof entry[1]>] => Boolean(entry[1] && entry[0]))
  ).values()];

  if (loadingProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eaeded]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-[#d4af37]/20 border-t-[#d4af37] animate-spin" />
          <p className="text-sm text-gray-500">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  const goCategory = (catId: string) => navigate('catalog', { category: catId });

  return (
    <div className="bg-[#eaeded] min-h-screen pb-12 font-sans">
      {/* Hero Banner Carousel (Amazon style: full width fading down) */}
      <section className="relative w-full bg-[#eaeded] h-[220px] sm:h-[350px] md:h-[420px] lg:h-[550px] overflow-hidden select-none">
        {heroSlides.map((p, i) => (
          <div key={p.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === heroIdx ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <img src={p.product_images?.[0]?.image_url} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
            {/* Linear overlay to white left, and fade to light gray bottom */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#eaeded] via-[#eaeded]/65 to-transparent" />

            {/* Minimal overlay text/badge */}
            <div className="absolute top-8 left-6 md:top-16 md:left-12 max-w-lg bg-black/35 backdrop-blur-sm p-4 md:p-6 rounded-lg text-white border border-white/10 hidden sm:block">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#d4af37] text-black text-xs font-black uppercase tracking-wide mb-2.5">
                <Sparkles className="w-3 h-3" /> {locale === 'fr' ? 'Sponsorisé' : 'Sponsored'}
              </span>
              <h2 className="text-xl md:text-3xl font-extrabold leading-tight">{p.name}</h2>
              <p className="text-sm text-gray-200 mt-2 line-clamp-2">{p.description}</p>
              <button onClick={() => navigate('product', { id: p.id })} className="mt-4 bg-[#ffd814] text-black border border-[#a88734] hover:bg-[#f7ca00] px-4 py-2 text-xs font-bold rounded-md">
                {t.home.shopNow}
              </button>
            </div>
          </div>
        ))}

        {/* Carousel buttons */}
        {heroSlides.length > 1 && (
          <>
            <button onClick={() => setHeroIdx((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
              className="absolute left-2 top-1/3 -translate-y-1/2 p-2 rounded hover:outline hover:outline-1 hover:outline-black text-black bg-white/30 hover:bg-white/70 transition-all">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={() => setHeroIdx((prev) => (prev + 1) % heroSlides.length)}
              className="absolute right-2 top-1/3 -translate-y-1/2 p-2 rounded hover:outline hover:outline-1 hover:outline-black text-black bg-white/30 hover:bg-white/70 transition-all">
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </section>

      {/* Amazon Overlapping Card Deck Grid */}
      <div className="max-w-[1500px] mx-auto px-4 -mt-20 sm:-mt-28 md:-mt-40 lg:-mt-56 relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

        {/* Card 1: 4-Quadrant Top Categories */}
        <div className="card p-5 flex flex-col justify-between h-[420px] bg-white border border-gray-300">
          <div>
            <h3 className="text-[19px] font-black text-gray-900 leading-tight mb-4">{locale === 'fr' ? 'Explorer nos catégories' : 'Explore categories'}</h3>
            <div className="grid grid-cols-2 gap-3">
              {categories.slice(0, 4).map((cat) => (
                <button key={cat.id} onClick={() => goCategory(cat.id)} className="text-left group cursor-pointer focus:outline-none">
                  <div className="aspect-square bg-gray-100 rounded overflow-hidden border border-gray-200 group-hover:opacity-85 transition-opacity">
                    <img src={products.find(p => p.category_id === cat.id)?.product_images?.[0]?.image_url || 'https://images.pexels.com/photos/999283/pexels-photo-999283.jpeg?auto=compress&cs=tinysrgb&w=300'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 mt-1 block group-hover:text-[#b8932a] truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => navigate('catalog')} className="text-xs font-bold text-[#007185] hover:text-[#c45500] hover:underline text-left mt-3">
            {locale === 'fr' ? 'Parcourir tout le catalogue' : 'See all categories'}
          </button>
        </div>

        {/* Card 2: Today's High-Value Deal */}
        <div className="card p-5 flex flex-col justify-between h-[420px] bg-white border border-gray-300">
          {deals.length > 0 ? (
            <>
              <div>
                <h3 className="text-[19px] font-black text-gray-900 leading-tight mb-2">{t.home.dealsTitle}</h3>
                <span className="inline-block bg-[#cc0c39] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm mb-2 uppercase">
                  {locale === 'fr' ? 'Offre Spéciale' : 'Limited time deal'}
                </span>
                <div className="aspect-video w-full rounded overflow-hidden border border-gray-200 bg-gray-50 mb-3 cursor-pointer" onClick={() => navigate('product', { id: deals[0].id })}>
                  <img src={deals[0].product_images?.[0]?.image_url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
                <p className="text-xs font-bold text-gray-900 line-clamp-1">{deals[0].name}</p>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-xl font-bold text-[#b12704]">${deals[0].price}</span>
                  <span className="text-xs text-gray-400 line-through">${deals[0].old_price}</span>
                </div>
              </div>
              <button onClick={() => navigate('catalog', { sort: 'priceLow' })} className="text-xs font-bold text-[#007185] hover:text-[#c45500] hover:underline text-left">
                {locale === 'fr' ? 'Toutes les offres à bas prix' : 'See all deals'}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Zap className="w-12 h-12 text-[#d4af37]" />
              <p className="text-sm font-bold text-gray-500 mt-2">No deals right now</p>
            </div>
          )}
        </div>

        {/* Card 3: Featured Store Spotlight */}
        <div className="card p-5 flex flex-col justify-between h-[420px] bg-white border border-gray-300">
          {sellers.length > 0 ? (
            <>
              <div>
                <h3 className="text-[19px] font-black text-gray-900 leading-tight mb-4">{locale === 'fr' ? 'Boutique Vedette' : 'Featured Seller'}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <img src={sellers[0].store_logo_url || ''} alt="" className="w-12 h-12 rounded border border-gray-200 object-cover" />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1">
                      {sellers[0].business_name}
                      {sellers[0].is_official && <Star className="w-3 h-3 fill-[#d4af37] text-[#d4af37]" />}
                    </h4>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {sellers[0].city}</span>
                  </div>
                </div>
                <div className="aspect-video w-full rounded overflow-hidden border border-gray-200 bg-gray-50 mb-2 cursor-pointer" onClick={() => navigate('seller', { id: sellers[0].id })}>
                  <img src={sellers[0].store_banner_url || ''} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mt-2 leading-tight">{sellers[0].description}</p>
              </div>
              <button onClick={() => navigate('seller', { id: sellers[0].id })} className="text-xs font-bold text-[#007185] hover:text-[#c45500] hover:underline text-left">
                {locale === 'fr' ? 'Visiter cette boutique' : 'Visit store page'}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Store className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>

        {/* Card 4: Become a Seller Prompt (Amazon Style) */}
        <div className="card p-5 flex flex-col justify-between h-[420px] bg-white border border-gray-300">
          <div>
            <h3 className="text-[19px] font-black text-gray-900 leading-tight mb-2">{locale === 'fr' ? 'Gagnez de l\'argent' : 'Make Money with Us'}</h3>
            <p className="text-xs text-gray-500 mb-4">{locale === 'fr' ? 'Rejoignez notre réseau de marchands vérifiés.' : 'Register as a professional merchant and expand your business.'}</p>
            <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center mb-4">
              <Store className="w-8 h-8 text-[#d4af37] mx-auto mb-1.5" />
              <span className="text-xs font-black text-gray-800">{locale === 'fr' ? 'Zando Onboarding' : 'Zando Onboarding'}</span>
              <p className="text-[10px] text-gray-500 mt-1">{locale === 'fr' ? 'Zéro commission sur vos paiements mobiles !' : 'Zero commission on your localized pay!'}</p>
            </div>
            <button onClick={() => navigate('sell')} className="w-full btn-gold py-2 rounded font-bold text-center">
              {t.home.ctaSell}
            </button>
          </div>
          <button onClick={() => navigate('plans')} className="text-xs font-bold text-[#007185] hover:text-[#c45500] hover:underline text-left">
            {locale === 'fr' ? 'Voir tous les plans de vente' : 'View our pricing plans'}
          </button>
        </div>
      </div>

      {/* Main product ribbons */}
      <div className="max-w-[1500px] mx-auto px-4 space-y-6">

        {/* ribbon: Flash Deals (real, time-limited, countdown) */}
        {flashDeals.length > 0 && (
          <section className="rounded-sm p-5 text-white" style={{ background: 'linear-gradient(135deg, #3d1f00, #5a3010)' }}>
            <div className="flex items-center justify-between mb-3.5 border-b border-white/15 pb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#d4af37]" />
                <h2 className="text-[20px] font-black">{locale === 'fr' ? 'Ventes Flash' : 'Flash Deals'}</h2>
              </div>
              <button onClick={() => navigate('catalog')} className="text-xs font-bold text-[#d4af37] hover:underline flex items-center gap-0.5">
                {t.home.shopNow} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2.5 snap-x">
              {flashDeals.map((deal) => (
                <button key={deal.id} onClick={() => deal.products && navigate('product', { slug: deal.products.slug })} className="w-44 shrink-0 snap-start text-left">
                  <div className="bg-white rounded-lg overflow-hidden">
                    <div className="relative">
                      <img src={deal.products?.product_images?.[0]?.image_url || ''} alt={deal.products?.name} className="w-full h-32 object-cover" />
                      <span className="absolute top-1.5 left-1.5 bg-[#d4af37] text-[#2a1400] text-[10px] font-black px-1.5 py-0.5 rounded">-{deal.discount_percent}%</span>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs text-[#0f172a] font-medium truncate">{deal.products?.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-sm font-bold text-[#3d1f00]">${deal.deal_price.toFixed(2)}</span>
                        <span className="text-[10px] text-[#64748b] line-through">${deal.products?.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-[#b8932a]">
                        <Zap className="w-3 h-3" /> <Countdown endsAt={deal.ends_at} />
                      </div>
                      {deal.stock_limit && (
                        <div className="mt-1.5 h-1.5 rounded-full bg-[#f0f4f8] overflow-hidden">
                          <div className="h-full bg-[#d4af37]" style={{ width: `${Math.min(100, (deal.claimed_count / deal.stock_limit) * 100)}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ribbon: Today's Deals (Horizontal slider format) */}
        {deals.length > 0 && (
          <section className="bg-white p-5 border border-gray-300 rounded-sm">
            <div className="flex items-center justify-between mb-3.5 border-b border-gray-200 pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#d4af37]" />
                <h2 className="text-[20px] font-black text-gray-900">{t.home.dealsTitle}</h2>
              </div>
              <button onClick={() => navigate('catalog')} className="text-xs font-bold text-[#007185] hover:text-[#c45500] hover:underline flex items-center gap-0.5">
                {t.home.shopNow} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2.5 snap-x">
              {deals.map((p) => (
                <div key={p.id} className="w-44 shrink-0 snap-start">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ribbon: Trending Products */}
        <section className="bg-white p-5 border border-gray-300 rounded-sm">
          <div className="flex items-center justify-between mb-3.5 border-b border-gray-200 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#b8932a]" />
              <h2 className="text-[20px] font-black text-gray-900">{t.home.trendingProducts}</h2>
            </div>
            <button onClick={() => navigate('catalog', { sort: 'popular' })} className="text-xs font-bold text-[#007185] hover:text-[#c45500] hover:underline">
              {t.home.ctaBrowse}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trending.slice(0, 10).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* ribbon: Sponsored Products Strip (Promotional layout) */}
        {sponsored.length > 0 && (
          <section className="bg-white p-5 border border-gray-300 rounded-sm">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="w-4 h-4 text-[#d4af37]" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{locale === 'fr' ? 'Sponsorisé par Zando Ads' : 'Sponsored by Zando Ads'}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {sponsored.slice(0, 4).map((p) => {
                const discount = p.old_price && p.old_price > p.price ? Math.round(((p.old_price - p.price) / p.old_price) * 100) : 0;
                return (
                  <div key={p.id} onClick={() => navigate('product', { id: p.id })} className="border border-gray-200 p-3 rounded hover:border-gray-300 transition-colors cursor-pointer bg-gray-50 group">
                    <div className="aspect-square rounded overflow-hidden bg-white mb-2 relative">
                      <img src={p.product_images?.[0]?.image_url || ''} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {discount > 0 && <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[9px] font-bold rounded-sm bg-[#cc0c39] text-white">-{discount}%</span>}
                    </div>
                    <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.sellers?.business_name}</p>
                    <p className="text-sm font-black text-[#b12704] mt-1">${p.price}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ribbon: Best Sellers */}
        <section className="bg-white p-5 border border-gray-300 rounded-sm">
          <div className="flex items-center justify-between mb-3.5 border-b border-gray-200 pb-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <h2 className="text-[20px] font-black text-gray-900">{t.home.bestSellers}</h2>
            </div>
            <button onClick={() => navigate('catalog', { sort: 'rating' })} className="text-xs font-bold text-[#007185] hover:text-[#c45500] hover:underline">
              {t.home.ctaBrowse}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topRated.slice(0, 10).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* ribbon: Products Near You (Local Target geo) */}
        {localProducts.length > 0 && (
          <section className="bg-white p-5 border border-gray-300 rounded-sm">
            <div className="flex items-center justify-between mb-3.5 border-b border-gray-200 pb-2">
              <div>
                <h2 className="text-[20px] font-black text-gray-900">{t.home.productsNearYou}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {countries.find((c) => c.id === geo.countryId)?.flag} {countries.find((c) => c.id === geo.countryId)?.name}
                </p>
              </div>
              <button onClick={() => navigate('sellers')} className="text-xs font-bold text-[#007185] hover:text-[#c45500] hover:underline">
                {t.home.viewOtherCountries}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {localProducts.slice(0, 10).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* ribbon: Recommended for You */}
        <section className="bg-white p-5 border border-gray-300 rounded-sm">
          <div className="flex items-center justify-between mb-3.5 border-b border-gray-200 pb-2">
            <h2 className="text-[20px] font-black text-gray-900">{t.home.recommendedForYou}</h2>
            <button onClick={() => navigate('catalog')} className="text-xs font-bold text-[#007185] hover:text-[#c45500] hover:underline">
              {locale === 'fr' ? 'Parcourir tout' : 'View all'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.slice(0, 10).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* Lower promotional columns */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white p-6 border border-gray-300 rounded-sm flex flex-col justify-between">
            <div>
              <Tag className="w-8 h-8 text-[#d4af37] mb-2.5" />
              <h3 className="text-[18px] font-bold text-gray-900 mb-1">{locale === 'fr' ? 'Coupons & Codes Promo' : 'Coupons & Promo Codes'}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{locale === 'fr' ? 'Économisez sur vos achats avec nos coupons exclusifs.' : 'Save on your purchases with exclusive coupons.'}</p>
            </div>
            <button onClick={() => navigate('catalog')} className="btn-cocoa w-fit px-5 text-xs py-2">{t.home.shopNow}</button>
          </div>
          <div className="bg-white p-6 border border-gray-300 rounded-sm flex flex-col justify-between">
            <div>
              <Gift className="w-8 h-8 text-[#007185] mb-2.5" />
              <h3 className="text-[18px] font-bold text-gray-900 mb-1">{locale === 'fr' ? 'Cartes Cadeaux Zando' : 'Zando Gift Cards'}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{locale === 'fr' ? 'Offrez la liberté de choisir avec une carte cadeau.' : 'Give the freedom of choice with a Zando gift card.'}</p>
            </div>
            <button onClick={() => navigate('catalog')} className="btn-cocoa w-fit px-5 text-xs py-2">{t.home.shopNow}</button>
          </div>
        </section>

      </div>
    </div>
  );
}
