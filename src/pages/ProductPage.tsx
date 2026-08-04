import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { fetchProductById, fetchProducts } from '@/lib/db';
import type { Product } from '@/lib/db';
import { ProductCard } from '@/components/Cards';
import { Star, ShoppingCart, Truck, ShieldCheck, Minus, Plus, ChevronRight, Store, Heart, Share2, CheckCircle, MapPin, BadgeCheck, Crown, Award, Search, ArrowLeft } from 'lucide-react';

export function ProductPage() {
  const { t, params, navigate, addToCart, locale, wishlist, toggleWishlist, showToast, user, formatPrice } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const p = await fetchProductById(params.id);
        setProduct(p);
        if (p) {
          const rel = await fetchProducts({ sellerId: p.seller_id, limit: 5 });
          setRelated(rel.filter((r) => r.id !== p.id).slice(0, 4));
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [params.id]);

  if (loading) {
    return <div className="motif-bg min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-[#0e9f6e]/20 border-t-[#0e9f6e] animate-spin" /></div>;
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-[#64748b]">{t.catalog.noResults}</p>
        <button onClick={() => navigate('catalog')} className="mt-4 btn-gold px-6 py-2.5 rounded-lg">{t.home.ctaBrowse}</button>
      </div>
    );
  }

  const seller = product.sellers;
  const country = product.countries;
  const category = product.categories;
  const images = product.product_images || [];
  const variants = product.product_variants || [];
  const specs = product.product_specifications || [];
  const reviews = product.reviews || [];
  const inWishlist = wishlist.includes(product.id);

  const variantTypes = [...new Set(variants.map((v) => v.variant_type))];

  const handleAddToCart = () => { addToCart(product.id, qty, Object.values(selectedVariants).join('-')); showToast(t.common.addedToCart); };
  const handleBuyNow = () => { addToCart(product.id, qty, Object.values(selectedVariants).join('-')); navigate('cart'); };

  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Navigation bar with visible Back trigger */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('catalog')} className="p-2.5 bg-white hover:bg-[#0f172a]/5 rounded-xl border border-[#0f172a]/10 transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4 text-[#0f172a]" />
          </button>
          <nav className="flex items-center gap-2 text-xs text-[#64748b] flex-wrap">
            <button onClick={() => navigate('home')} className="hover:text-[#0e9f6e]">{t.nav.home}</button>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => navigate('catalog')} className="hover:text-[#0e9f6e]">{t.nav.catalog}</button>
            {category && <><ChevronRight className="w-3 h-3" /><span className="text-[#0f172a] font-medium">{category.name}</span></>}
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#0f172a] font-medium">{product.name}</span>
          </nav>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Gallery */}
          <div className="lg:col-span-5">
            <div 
              className="card overflow-hidden rounded-2xl aspect-square bg-[#f7f8fa] relative cursor-zoom-in group"
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => setZoom(false)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
              }}
            >
              <img src={images[activeImage]?.image_url || ''} alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-200"
                style={zoom ? { transform: 'scale(2)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
              />
              <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-white/80 text-xs text-[#64748b] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <Search className="w-3 h-3" /> {locale === 'fr' ? 'Survolez pour zoomer' : 'Hover to zoom'}
              </div>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setActiveImage(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${activeImage === i ? 'border-[#0e9f6e] shadow-md' : 'border-[#e2e8f0] opacity-60 hover:opacity-100'}`}>
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:col-span-4">
            {product.is_sponsored && <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase rounded bg-[#0e9f6e]/20 text-[#64748b] mb-3">{t.catalog.sponsored}</span>}
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a] mb-3">{product.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-[#ff9900] text-[#ff9900]" />
                <span className="text-sm font-medium text-[#0f172a]">{product.rating}</span>
                <span className="text-xs text-[#64748b]/60">({product.total_reviews} {t.product.reviews})</span>
              </div>
              {country && <span className="text-xs text-[#64748b] flex items-center gap-1"><MapPin className="w-3 h-3" />{country.flag} {country.name}</span>}
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-[#0f172a]">{formatPrice(product.price, product.currency_code)}</span>
              {product.old_price && <span className="text-lg text-[#64748b]/50 line-through">{formatPrice(product.old_price, product.currency_code)}</span>}
            </div>

            <div className="flex items-center gap-2 mb-5">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {product.stock > 0 ? `${t.product.inStock} (${product.stock})` : t.product.outOfStock}
              </span>
              {category && <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#0e9f6e]/10 text-[#64748b]">{category.name}</span>}
            </div>

            {/* Variants */}
            {variantTypes.map((vtype) => {
              const opts = variants.filter((v) => v.variant_type === vtype);
              return (
                <div key={vtype} className="mb-5">
                  <label className="block text-xs font-semibold text-[#0f172a] uppercase tracking-wide mb-2">{vtype}</label>
                  <div className="flex flex-wrap gap-2">
                    {opts.map((opt) => {
                      const isSelected = selectedVariants[vtype] === opt.variant_value;
                      return (
                        <button key={opt.id} onClick={() => setSelectedVariants((prev) => ({ ...prev, [vtype]: opt.variant_value }))}
                          className={`px-4 py-2 text-sm rounded-lg border-2 transition-all ${isSelected ? 'border-[#0e9f6e] bg-[#0e9f6e]/10 text-[#0f172a] font-semibold' : 'border-[#0f172a]/15 text-[#0f172a] hover:border-[#0e9f6e]/50'}`}>
                          {opt.variant_value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Quantity + Buy */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-[#0f172a]/15 rounded-xl overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3 hover:bg-[#0f172a]/5"><Minus className="w-4 h-4 text-[#0f172a]" /></button>
                <span className="px-4 font-semibold text-[#0f172a]">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="p-3 hover:bg-[#0f172a]/5"><Plus className="w-4 h-4 text-[#0f172a]" /></button>
              </div>
              <button onClick={handleAddToCart} disabled={product.stock === 0} className="flex-1 btn-gold py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                <ShoppingCart className="w-5 h-5" /> {t.product.addToCart}
              </button>
            </div>
            <button onClick={handleBuyNow} disabled={product.stock === 0} className="w-full btn-cocoa py-3 rounded-xl font-semibold disabled:opacity-50 mb-3">{t.product.buyNow}</button>
            <div className="flex gap-2">
              <button onClick={() => { toggleWishlist(product.id); showToast(inWishlist ? t.common.removedFromWishlist : t.common.addedToWishlist); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#0f172a]/15 text-[#0f172a] hover:bg-[#0f172a]/5 transition-colors text-sm font-medium">
                <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} /> {inWishlist ? t.product.removeFromWishlist : t.product.addToWishlist}
              </button>
              <button onClick={() => {
                const url = window.location.href;
                if (navigator.share) { navigator.share({ title: product.name, url }).catch(() => {}); }
                else { navigator.clipboard.writeText(url); showToast(locale === 'fr' ? 'Lien copié' : 'Link copied'); }
              }} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#0f172a]/15 text-[#0f172a] hover:bg-[#0f172a]/5 transition-colors text-sm font-medium">
                <Share2 className="w-4 h-4" /> {t.product.shareProduct}
              </button>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <div className="card p-5">
              <div className="flex items-start gap-3 mb-3"><Truck className="w-5 h-5 text-[#0e9f6e] mt-0.5" /><div><p className="text-sm font-semibold text-[#0f172a]">{t.product.delivery}</p><p className="text-xs text-[#64748b]">{t.product.deliveryBySeller}</p></div></div>
              <div className="flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-[#0e9f6e] mt-0.5" /><div><p className="text-sm font-semibold text-[#0f172a]">{t.home.trust1}</p><p className="text-xs text-[#64748b]">{t.home.trust2}</p></div></div>
            </div>
            {seller && (
              <div className="card p-5">
                <p className="text-xs font-semibold text-[#64748b] uppercase mb-3">{t.product.soldBy}</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#0e9f6e]">
                    <img src={seller.store_logo_url || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-[#0f172a] text-sm">{seller.business_name}</p>
                      {seller.is_official && <Crown className="w-4 h-4 text-[#0e9f6e]" />}
                      {!seller.is_official && seller.plan === 'premium' && <Award className="w-4 h-4 text-[#64748b]" />}
                      {!seller.is_official && seller.plan === 'starter' && <BadgeCheck className="w-4 h-4 text-[#0f172a]" />}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 fill-[#ff9900] text-[#ff9900]" />
                      <span className="text-xs text-[#0f172a]">{seller.rating}</span>
                      <span className="text-xs text-[#64748b]/60">({seller.total_reviews})</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => navigate('seller', { id: seller.id })} className="w-full btn-cocoa py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                  <Store className="w-4 h-4" /> {t.product.visitStore}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Specs */}
        {specs.length > 0 && (
          <div className="mt-10 card p-6">
            <h3 className="font-display text-lg font-bold text-[#0f172a] mb-4">{t.product.features}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {specs.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-sm text-[#0f172a]">
                  <CheckCircle className="w-4 h-4 text-[#0e9f6e] shrink-0" />
                  <span className="font-medium">{s.spec_name}:</span> {s.spec_value}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mt-6 card p-6">
          <h3 className="font-display text-lg font-bold text-[#0f172a] mb-3">{t.product.description}</h3>
          <p className="text-sm text-[#64748b] leading-relaxed">{product.description}</p>
        </div>

        {/* Reviews */}
        <div className="mt-6 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-lg font-bold text-[#0f172a]">{t.product.reviews} ({product.total_reviews})</h3>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-[#ff9900] text-[#ff9900]" />
              <span className="text-2xl font-bold text-[#0f172a]">{product.rating}</span>
            </div>
          </div>

          {user && (
            <div className="mb-6">
              {!showReviewForm ? (
                <button onClick={() => setShowReviewForm(true)} className="btn-gold px-4 py-2 rounded-lg text-sm font-semibold">
                  {t.product.writeReview}
                </button>
              ) : (
                <div className="card p-4 border border-[#0e9f6e]/20 bg-[#0e9f6e]/5 space-y-3">
                  <h4 className="font-semibold text-sm text-[#0f172a]">{t.product.writeReview}</h4>
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button key={num} onClick={() => setReviewRating(num)} className="p-1">
                          <Star className={`w-6 h-6 ${num <= reviewRating ? 'fill-[#ff9900] text-[#ff9900]' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1">Comment</label>
                    <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3} className="input-field" placeholder="Share your experience..." />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      if (!reviewText.trim()) return;
                      const ok = await import('@/lib/db').then(m => m.createReview({
                        productId: product.id,
                        userId: user.id,
                        authorName: user.fullName,
                        rating: reviewRating,
                        comment: reviewText
                      }));
                      if (ok) {
                        showToast(locale === 'fr' ? 'Avis publié' : 'Review submitted');
                        setShowReviewForm(false);
                        setReviewText('');
                        setReviewRating(5);
                        const p = await fetchProductById(product.id);
                        setProduct(p);
                      } else {
                        showToast('Error submitting review', 'error');
                      }
                    }} className="btn-gold px-4 py-2 rounded-lg text-xs font-semibold">Submit</button>
                    <button onClick={() => setShowReviewForm(false)} className="px-4 py-2 rounded-lg text-xs border border-gray-300 text-gray-700">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="pb-4 border-b border-[#0e9f6e]/10 last:border-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-[#0e9f6e] text-xs font-bold">{review.author_name.charAt(0)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#0f172a]">{review.author_name}</p>
                      {review.is_verified && <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium"><CheckCircle className="w-3 h-3" /> {t.product.verifiedPurchase}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-[#ff9900] text-[#ff9900]' : 'text-[#0f172a]/20'}`} />)}
                      <span className="text-xs text-[#64748b]/60 ml-1">{new Date(review.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-[#64748b] ml-11">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-2xl font-bold text-[#0f172a] mb-5">{t.product.relatedProducts}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
