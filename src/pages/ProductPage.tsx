import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { fetchProductById, fetchProducts, createReview } from '@/lib/db';
import type { Product } from '@/lib/db';
import { ProductCard } from '@/components/Cards';
import { Star, ShoppingCart, ChevronRight, Heart, CheckCircle, MapPin, Search, Lock, Megaphone } from 'lucide-react';

export function ProductPage() {
  const { t, params, navigate, addToCart, locale, wishlist, toggleWishlist, showToast, user } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Custom review submission states to ensure it's fully real & functional
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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
    return (
      <div className="bg-[#eaeded] min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#ff9900]/20 border-t-[#ff9900] animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center bg-white border border-gray-300 mt-6 rounded-sm">
        <p className="text-gray-500 font-sans">{t.catalog.noResults}</p>
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

  const handleAddToCart = () => {
    addToCart(product.id, qty, Object.values(selectedVariants).join('-'));
    showToast(t.common.addedToCart);
  };

  const handleBuyNow = () => {
    addToCart(product.id, qty, Object.values(selectedVariants).join('-'));
    navigate('cart');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast(locale === 'fr' ? 'Vezillez vous connecter pour laisser un avis.' : 'Please login to write a review.', 'error');
      navigate('login');
      return;
    }
    if (!newReviewComment.trim()) return;

    setSubmittingReview(true);
    const ok = await createReview({
      productId: product.id,
      userId: user.id,
      authorName: user.fullName,
      rating: newReviewRating,
      comment: newReviewComment,
    });

    setSubmittingReview(false);
    if (ok) {
      showToast(locale === 'fr' ? 'Avis publié avec succès !' : 'Review published successfully!');
      setNewReviewComment('');
      // Reload product to show the newly added review
      const p = await fetchProductById(product.id);
      setProduct(p);
    } else {
      showToast(locale === 'fr' ? 'Erreur lors de la publication' : 'Error publishing review', 'error');
    }
  };

  return (
    <div className="bg-white min-h-screen pb-16 font-sans">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-4">
        {/* Amazon style Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-5 flex-wrap font-sans">
          <button onClick={() => navigate('home')} className="hover:text-[#e47911] hover:underline font-normal">{t.nav.home}</button>
          <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
          <button onClick={() => navigate('catalog')} className="hover:text-[#e47911] hover:underline font-normal">{t.nav.catalog}</button>
          {category && (
            <>
              <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="text-gray-700 font-medium truncate max-w-[150px]">{category.name}</span>
            </>
          )}
          <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* 3-Column Amazon Layout */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">

          {/* COLUMN 1: Image Gallery & Zoom (Span 5) */}
          <div className="lg:col-span-5 flex flex-col md:flex-row gap-3">
            {/* Left side thumbnails strip on large screens */}
            {images.length > 1 && (
              <div className="flex md:flex-col gap-2 order-2 md:order-1 overflow-x-auto no-scrollbar md:h-[400px] shrink-0">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onMouseEnter={() => setActiveImage(i)}
                    onClick={() => setActiveImage(i)}
                    className={`w-11 h-11 rounded border transition-all shrink-0 bg-gray-50 p-0.5 ${activeImage === i ? 'border-[#e47911] ring-1 ring-[#e47911]' : 'border-gray-300 hover:border-[#e47911]'}`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Large active photo with hover magnifying zoom */}
            <div className="flex-1 order-1 md:order-2">
              <div
                className="border border-[#e7e7e7] rounded-sm overflow-hidden aspect-square bg-[#fbfbfb] relative cursor-zoom-in group"
                onMouseEnter={() => setZoom(true)}
                onMouseLeave={() => setZoom(false)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
                }}
              >
                <img
                  src={images[activeImage]?.image_url || ''}
                  alt={product.name}
                  className="w-full h-full object-contain p-4 transition-transform duration-100"
                  style={zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
                />
                {!zoom && (
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-1 rounded bg-black/60 text-[10px] text-white flex items-center gap-1 font-bold pointer-events-none">
                    <Search className="w-3.5 h-3.5" />
                    <span>{locale === 'fr' ? 'SURVOLEZ POUR ZOOMER' : 'ROLL OVER TO ZOOM'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 2: Product Central Details & Bullets (Span 4) */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              {product.is_sponsored && (
                <span className="inline-block px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-gray-100 text-gray-500 border border-gray-200 mb-2">
                  Sponsored
                </span>
              )}
              <h1 className="text-[20px] md:text-[24px] font-normal leading-tight text-gray-900 font-sans">
                {product.name}
              </h1>

              {/* Store / Brand reference link */}
              {seller && (
                <div className="mt-1 pb-2 border-b border-gray-200">
                  <button onClick={() => navigate('seller', { id: seller.id })} className="text-xs text-[#007185] hover:text-[#c45500] hover:underline font-bold">
                    {locale === 'fr' ? `Boutique : ${seller.business_name}` : `Brand: ${seller.business_name}`}
                  </button>
                </div>
              )}
            </div>

            {/* Ratings summary */}
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 text-sm">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`w-4 h-4 ${starIdx <= Math.round(product.rating) ? 'fill-[#de7921] text-[#de7921]' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-900">{product.rating}</span>
              <span className="text-xs text-gray-400">|</span>
              <a href="#reviews" className="text-xs text-[#007185] hover:text-[#c45500] hover:underline">
                {product.total_reviews} {locale === 'fr' ? 'évaluations' : 'ratings'}
              </a>
            </div>

            {/* Dynamic Price Box */}
            <div className="pb-4 border-b border-gray-200">
              <div className="text-sm text-gray-500 flex items-center gap-1.5">
                {locale === 'fr' ? 'Prix conseillé :' : 'List Price:'}
                {product.old_price && <span className="line-through">${product.old_price}</span>}
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[28px] font-light text-gray-900 leading-none">$</span>
                <span className="text-[28px] font-black text-gray-900 leading-none">{Math.floor(product.price)}</span>
                <span className="text-[14px] font-bold text-gray-900 align-super">.00</span>

                {product.old_price && (
                  <span className="text-xs text-[#cc0c39] font-bold ml-2 bg-[#cc0c39]/10 px-2 py-0.5 rounded-sm">
                    {locale === 'fr' ? `Économisez ${Math.round(((product.old_price - product.price) / product.old_price) * 100)}%` : `Save ${Math.round(((product.old_price - product.price) / product.old_price) * 100)}%`}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                All prices include local VAT where applicable. Transaction settles directly with the merchant.
              </p>
            </div>

            {/* Custom Variants Selector */}
            {variantTypes.map((vtype) => {
              const opts = variants.filter((v) => v.variant_type === vtype);
              return (
                <div key={vtype} className="pb-3 border-b border-gray-200">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">{vtype}:</label>
                  <div className="flex flex-wrap gap-2">
                    {opts.map((opt) => {
                      const isSelected = selectedVariants[vtype] === opt.variant_value;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedVariants((prev) => ({ ...prev, [vtype]: opt.variant_value }))}
                          className={`px-3.5 py-1.5 text-xs font-medium rounded-sm border transition-all ${isSelected ? 'border-[#e47911] bg-[#fdf8f4] ring-1 ring-[#e47911]' : 'border-gray-300 hover:border-gray-500'}`}
                        >
                          {opt.variant_value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Bullet Specifications list (Amazon Classic style) */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">{locale === 'fr' ? 'À propos de cet article' : 'About this item'}</h3>
              <ul className="space-y-1.5 list-disc list-inside text-xs text-gray-700 leading-relaxed">
                {specs.map((s) => (
                  <li key={s.id} className="text-gray-800">
                    <span className="font-bold text-gray-900">{s.spec_name}:</span> {s.spec_value}
                  </li>
                ))}
                <li>{locale === 'fr' ? '100% fabriqué et expédié d\'Afrique.' : '100% sourced and distributed directly in Africa.'}</li>
                <li>{locale === 'fr' ? 'Soutenez les artisans et vendeurs régionaux via Zando.' : 'Direct support to localized regional SaaS merchants.'}</li>
                <li>{locale === 'fr' ? 'Livré et garanti directement par le vendeur.' : 'Sellers guarantee active, verified physical courier dropoff.'}</li>
              </ul>
            </div>
          </div>

          {/* COLUMN 3: Amazon Buy Box Card (Span 3) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="border border-gray-300 rounded p-4 bg-white space-y-4">

              {/* Product Price & Currency conversion reference */}
              <div>
                <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                <p className="text-xs text-green-700 font-bold mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Free Shipping included</span>
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">Delivered by the professional seller directly.</p>
              </div>

              {/* Geo country delivery target indicator */}
              <div className="flex items-start gap-1.5 text-xs text-gray-700 pt-2 border-t border-gray-100">
                <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-[#007185]">
                    {locale === 'fr' ? 'Livraison vers' : 'Deliver to'} {country?.flag} {country?.name}
                  </span>
                </div>
              </div>

              {/* Stock Status indicator */}
              <div className="pt-2 border-t border-gray-100">
                {product.stock > 0 ? (
                  <div>
                    <span className="text-[17px] text-[#007600] font-bold">In Stock</span>
                    {product.stock <= 5 && (
                      <p className="text-xs text-[#cc0c39] font-bold mt-0.5">
                        Only {product.stock} left in stock - order soon.
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-[17px] text-[#cc0c39] font-bold uppercase">{t.product.outOfStock}</span>
                )}
              </div>

              {/* Quantity selector */}
              {product.stock > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Qty:</span>
                  <select
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value))}
                    className="border border-gray-300 rounded bg-[#f0f2f2] hover:bg-[#e3e6e6] p-1.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#e47911]"
                  >
                    {Array.from({ length: Math.min(10, product.stock) }, (_, i) => i + 1).map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Buy actions block */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="w-full btn-gold py-2 text-xs font-bold rounded-full flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow"
                >
                  <ShoppingCart className="w-4 h-4" /> {t.product.addToCart}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="w-full btn-green py-2 text-xs font-bold rounded-full text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow"
                >
                  {t.product.buyNow}
                </button>
              </div>

              {/* Security transaction guarantee */}
              <div className="flex items-center gap-1.5 text-[11px] text-[#565959] pt-2 border-t border-gray-100">
                <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Secure transaction</span>
              </div>

              {/* Shipping info */}
              <div className="text-[11px] space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Ships from:</span>
                  <span className="font-bold text-gray-800">{seller?.business_name || 'Merchant'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sold by:</span>
                  <span className="font-bold text-[#007185] hover:underline cursor-pointer" onClick={() => navigate('seller', { id: seller?.id || '' })}>
                    {seller?.business_name || 'Merchant'}
                  </span>
                </div>
              </div>

              {/* Wishlist toggle */}
              <button
                onClick={() => {
                  toggleWishlist(product.id);
                  showToast(inWishlist ? t.common.removedFromWishlist : t.common.addedToWishlist);
                }}
                className="w-full py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50 flex items-center justify-center gap-1.5 font-bold text-gray-700 transition-colors"
              >
                <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-[#cc0c39] text-[#cc0c39]' : 'text-gray-400'}`} />
                <span>{inWishlist ? t.product.removeFromWishlist : t.product.addToWishlist}</span>
              </button>

            </div>

            {/* Merchant detail snapshot card */}
            {seller && (
              <div className="border border-gray-300 rounded p-4 bg-gray-50 text-xs text-gray-600 space-y-2">
                <p className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">MERCHANT REPUTATION</p>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded overflow-hidden border border-gray-200 bg-white">
                    <img src={seller.store_logo_url || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{seller.business_name}</h4>
                    <div className="flex items-center gap-0.5 mt-0.5 text-[10px]">
                      <Star className="w-3.5 h-3.5 fill-[#de7921] text-[#de7921]" />
                      <span className="font-bold text-gray-800">{seller.rating}</span>
                      <span>({seller.total_reviews} reviews)</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('seller', { id: seller?.id || '' })}
                  className="w-full bg-white hover:bg-gray-100 border border-gray-300 py-1.5 rounded text-xs font-bold text-gray-700 transition-colors mt-2"
                >
                  Visit Storefront
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Detailed Product Description */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">{t.product.description}</h3>
          <p className="text-sm text-gray-700 leading-relaxed max-w-4xl">{product.description}</p>
        </div>

        {/* Technical specifications table */}
        {specs.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t.product.features}</h3>
            <div className="max-w-2xl border border-gray-200 rounded overflow-hidden bg-white">
              <table className="w-full text-xs">
                <tbody>
                  {specs.map((s, idx) => (
                    <tr key={s.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 font-bold text-gray-700 border-r border-gray-100 w-1/3">{s.spec_name}</td>
                      <td className="px-4 py-3 text-gray-900">{s.spec_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CUSTOMER REVIEWS & FORM SECTION */}
        <div id="reviews" className="mt-12 border-t border-gray-200 pt-8 grid lg:grid-cols-12 gap-8">

          {/* Left Summary block */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">{locale === 'fr' ? 'Commentaires client' : 'Customer reviews'}</h3>

            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`w-5 h-5 ${starIdx <= Math.round(product.rating) ? 'fill-[#de7921] text-[#de7921]' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-base font-bold text-gray-900">{product.rating} out of 5</span>
            </div>

            <p className="text-xs text-gray-400 leading-normal">
              {product.total_reviews} global ratings. Customer feedback is strictly verified against active seller mobile money transactions.
            </p>

            {/* Write a review form */}
            <div className="border border-gray-200 rounded p-4 bg-gray-50 space-y-3.5">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-[#e47911]" />
                <span>{locale === 'fr' ? 'Laisser une évaluation' : 'Review this product'}</span>
              </h4>
              <p className="text-[11px] text-gray-500 leading-snug">
                Share your thoughts with other customers. Only buyers with confirmed deliveries can post.
              </p>

              <form onSubmit={handleReviewSubmit} className="space-y-3">
                {/* Rating selection */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600 mr-1.5">Rating:</span>
                  {[1, 2, 3, 4, 5].map((sVal) => (
                    <button
                      key={sVal}
                      type="button"
                      onClick={() => setNewReviewRating(sVal)}
                      className="focus:outline-none transition-transform active:scale-125"
                    >
                      <Star className={`w-5 h-5 ${sVal <= newReviewRating ? 'fill-[#de7921] text-[#de7921]' : 'text-gray-200'}`} />
                    </button>
                  ))}
                </div>

                {/* Comment area */}
                <textarea
                  rows={3}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder={locale === 'fr' ? 'Écrire votre commentaire...' : 'Write your comment here...'}
                  className="w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#e47911] bg-white text-black"
                />

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full btn-cocoa py-2 rounded text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submittingReview ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 border-t-black animate-spin" />
                  ) : (
                    <span>{locale === 'fr' ? 'Soumettre' : 'Submit Review'}</span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right reviews stream */}
          <div className="lg:col-span-8 space-y-4">
            <h4 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">Top reviews from Africa</h4>

            {reviews.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-6">No reviews written yet. Be the first to review this product!</p>
            ) : (
              <div className="space-y-5">
                {reviews.map((review) => (
                  <div key={review.id} className="pb-5 border-b border-gray-100 last:border-none animate-fade-in">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-xs font-black">
                        {review.author_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-gray-900">{review.author_name}</p>
                          {review.is_verified && (
                            <span className="flex items-center gap-0.5 text-[9px] text-[#c45500] font-bold bg-[#c45500]/5 px-1 rounded-sm border border-[#c45500]/10">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-[#de7921] text-[#de7921]' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-400">
                            Reviewed on {new Date(review.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed pl-10">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Related Items recommendation shelf */}
        {related.length > 0 && (
          <div className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-black text-gray-900 mb-4">{t.product.relatedProducts}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
