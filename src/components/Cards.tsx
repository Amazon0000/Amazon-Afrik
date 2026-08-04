import { Star, MapPin, Heart } from 'lucide-react';
import { useApp } from '@/lib/store';
import type { Product, Seller } from '@/lib/db';

export function ProductCard({ product }: { product: Product }) {
  const { t, navigate, wishlist, toggleWishlist, showToast, formatPrice } = useApp();
  const inWishlist = wishlist.includes(product.id);
  const country = product.countries;
  const seller = product.sellers;
  const img = product.product_images?.[0]?.image_url || '';
  const discount = product.old_price ? Math.round((1 - product.price / product.old_price) * 100) : 0;

  return (
    <div onClick={() => navigate('product', { id: product.id })} className="card overflow-hidden cursor-pointer group flex flex-col relative bg-white">
      <div className="relative aspect-square overflow-hidden bg-[#f7f8fa]">
        <img src={img} alt={product.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {product.is_sponsored && <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold uppercase rounded bg-[#0e9f6e]/10 text-[#0e9f6e]">{t.catalog.sponsored}</span>}
        {discount > 0 && <span className="absolute top-2 right-2 px-2 py-1 text-[10px] font-bold rounded bg-[#ff9900] text-white">-{discount}%</span>}
        <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); showToast(inWishlist ? t.common.removedFromWishlist : t.common.addedToWishlist); }}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center shadow-md hover:scale-110 transition-transform">
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-[#64748b]'}`} />
        </button>
        {product.stock === 0 && <div className="absolute inset-0 bg-[#0f172a]/30 flex items-center justify-center"><span className="px-3 py-1 text-xs font-bold rounded bg-white text-[#0f172a]">{t.product.outOfStock}</span></div>}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-[#0f172a] line-clamp-2 leading-snug">{product.name}</h3>
        {seller && <button onClick={(e) => { e.stopPropagation(); navigate('seller', { id: seller.id }); }} className="text-xs text-[#64748b] hover:text-[#0e9f6e] transition-colors text-left mt-0.5 truncate">{seller.business_name}</button>}
        <div className="flex items-center gap-1 mt-1.5">
          <Star className="w-3.5 h-3.5 fill-[#ff9900] text-[#ff9900]" />
          <span className="text-xs font-medium text-[#0f172a]">{product.rating}</span>
          <span className="text-xs text-[#64748b]/60">({product.total_reviews})</span>
          {country && <span className="ml-auto text-xs text-[#64748b]/60">{country.flag}</span>}
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-lg font-bold text-[#0f172a]">{formatPrice(product.price, product.currency_code)}</span>
          {product.old_price && <span className="text-xs text-[#64748b]/50 line-through">{formatPrice(product.old_price, product.currency_code)}</span>}
        </div>
      </div>
    </div>
  );
}

export function SellerCard({ seller }: { seller: Seller }) {
  const { navigate, t } = useApp();
  return (
    <div onClick={() => navigate('seller', { id: seller.id })} className="card overflow-hidden cursor-pointer group bg-white">
      <div className="relative h-28 overflow-hidden bg-[#0f172a]">
        <img src={seller.store_banner_url || ''} alt={seller.business_name} loading="lazy" className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/60 to-transparent" />
        {seller.is_official && <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded bg-[#0e9f6e] text-white">Official</span>}
      </div>
      <div className="p-4 -mt-10 relative">
        <div className="w-16 h-16 rounded-2xl border-2 border-[#0e9f6e] overflow-hidden bg-white shadow-lg">
          <img src={seller.store_logo_url || ''} alt={seller.business_name} loading="lazy" className="w-full h-full object-cover" />
        </div>
        <h3 className="mt-3 font-semibold text-[#0f172a]">{seller.business_name}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-[#64748b]">
          <Star className="w-3 h-3 fill-[#ff9900] text-[#ff9900]" /> <span>{seller.rating}</span>
          <span>({seller.total_reviews})</span>
          <span className="ml-auto flex items-center gap-0.5"><MapPin className="w-3 h-3" />{seller.city}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-[#64748b]">{seller.total_products} {t.seller.products.toLowerCase()}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: seller.plan === 'enterprise' ? '#0e9f6e15' : seller.plan === 'premium' ? '#ff990015' : '#64748b15', color: seller.plan === 'enterprise' ? '#0e9f6e' : seller.plan === 'premium' ? '#ff9900' : '#64748b' }}>{seller.plan}</span>
        </div>
      </div>
    </div>
  );
}
