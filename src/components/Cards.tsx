import { Star, MapPin, Heart } from 'lucide-react';
import { useApp } from '@/lib/store';
import type { Product, Seller } from '@/lib/db';

export function ProductCard({ product }: { product: Product }) {
  const { t, navigate, wishlist, toggleWishlist, showToast } = useApp();
  const inWishlist = wishlist.includes(product.id);
  const country = product.countries;
  const seller = product.sellers;
  const img = product.product_images?.[0]?.image_url || '';
  const discount = product.old_price ? Math.round((1 - product.price / product.old_price) * 100) : 0;

  return (
    <div
      onClick={() => navigate('product', { id: product.id })}
      className="bg-white border border-[#e7e7e7] rounded-sm p-3 flex flex-col justify-between h-full hover:shadow-md hover:border-[#dddddd] transition-all cursor-pointer group"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[#f7f7f7] rounded-sm mb-3">
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {product.is_sponsored && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-sm bg-black/60 text-white">
            {t.catalog.sponsored}
          </span>
        )}
        {discount > 0 && (
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[10px] font-black rounded-sm bg-[#cc0c39] text-white">
            -{discount}%
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
            showToast(inWishlist ? t.common.removedFromWishlist : t.common.addedToWishlist);
          }}
          className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 hover:bg-white transition-all"
        >
          <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-[#cc0c39] text-[#cc0c39]' : 'text-[#888888]'}`} />
        </button>
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/85 flex items-center justify-center">
            <span className="px-2.5 py-1 text-[10px] font-black rounded-sm bg-[#cc0c39] text-white uppercase">
              {t.product.outOfStock}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Product Name */}
          <h3 className="text-[13px] font-normal text-[#0f172a] leading-[17px] line-clamp-2 hover:text-[#0a7d54] font-sans">
            {product.name}
          </h3>

          {/* Seller store name */}
          {seller && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('seller', { id: seller.id });
              }}
              className="text-[11px] text-[#007185] hover:text-[#c45500] hover:underline text-left mt-0.5 block truncate font-sans"
            >
              {seller.business_name}
            </button>
          )}

          {/* Rating stars */}
          <div className="flex items-center gap-0.5 mt-1.5">
            {[1, 2, 3, 4, 5].map((starIdx) => (
              <Star
                key={starIdx}
                className={`w-3 h-3 ${starIdx <= Math.round(product.rating) ? 'fill-[#de7921] text-[#de7921]' : 'text-gray-200'}`}
              />
            ))}
            <span className="text-[11px] text-[#007185] hover:text-[#c45500] ml-1 font-medium">
              ({product.total_reviews})
            </span>
            {country && (
              <span className="text-[11px] text-gray-400 ml-auto" title={country.name}>
                {country.flag}
              </span>
            )}
          </div>
        </div>

        {/* Pricing structure */}
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-[#0f172a] font-sans">
              ${product.price}
            </span>
            {product.old_price && (
              <span className="text-xs text-[#565959] line-through font-normal">
                ${product.old_price}
              </span>
            )}
          </div>

          {/* Fast shipping indicator */}
          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1 leading-none">
            <span className="text-[#007600] font-bold">✓ Free Shipping</span> by seller
          </p>
        </div>
      </div>
    </div>
  );
}

export function SellerCard({ seller }: { seller: Seller }) {
  const { navigate, t } = useApp();
  return (
    <div
      onClick={() => navigate('seller', { id: seller.id })}
      className="bg-white border border-[#e7e7e7] rounded-sm overflow-hidden hover:shadow-md hover:border-[#dddddd] transition-all cursor-pointer group"
    >
      <div className="relative h-24 overflow-hidden bg-[#003087]">
        <img
          src={seller.store_banner_url || ''}
          alt={seller.business_name}
          loading="lazy"
          className="w-full h-full object-cover opacity-85 transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {seller.is_official && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-black rounded-sm bg-[#0e9f6e] text-black uppercase">
            Official
          </span>
        )}
      </div>

      <div className="p-4 -mt-10 relative">
        <div className="w-14 h-14 rounded border border-white overflow-hidden bg-white shadow-sm shrink-0">
          <img src={seller.store_logo_url || ''} alt={seller.business_name} loading="lazy" className="w-full h-full object-cover" />
        </div>
        <h3 className="mt-2.5 font-bold text-sm text-[#0f172a] group-hover:text-[#0a7d54]">{seller.business_name}</h3>
        <div className="flex items-center gap-1 mt-1 text-xs text-[#565959]">
          <Star className="w-3.5 h-3.5 fill-[#de7921] text-[#de7921]" />
          <span className="font-bold text-gray-800">{seller.rating}</span>
          <span>({seller.total_reviews})</span>
          <span className="ml-auto flex items-center gap-0.5 text-[11px] text-gray-400"><MapPin className="w-3 h-3" />{seller.city}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-[#565959] pt-2.5 border-t border-gray-100">
          <span>{seller.total_products} {t.seller.products.toLowerCase()}</span>
          <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
            {seller.plan}
          </span>
        </div>
      </div>
    </div>
  );
}
