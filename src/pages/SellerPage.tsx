import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { fetchProducts, fetchSellerBySlug } from '@/lib/db';
import type { Seller, Product } from '@/lib/db';
import { ProductCard } from '@/components/Cards';
import { Star, MapPin, Package, Calendar, Crown, Award, BadgeCheck } from 'lucide-react';

export function SellerPage() {
  const { t, params, locale } = useApp();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // params.id could be a slug or uuid — try slug first, then search products by seller_id
      const s = await fetchSellerBySlug(params.id);
      if (s) {
        setSeller(s);
        const prods = await fetchProducts({ sellerId: s.id, limit: 50 });
        setProducts(prods);
      } else {
        // Try by id directly from products
        const prods = await fetchProducts({ sellerId: params.id, limit: 50 });
        setProducts(prods);
        if (prods[0]?.sellers) setSeller(prods[0].sellers);
      }
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) return <div className="motif-bg min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-[#0e9f6e]/20 border-t-[#0e9f6e] animate-spin" /></div>;

  if (!seller) return <div className="max-w-7xl mx-auto px-4 py-20 text-center"><p className="text-[#64748b]">{t.catalog.noResults}</p></div>;

  const BadgeIcon = seller.is_official ? Crown : seller.plan === 'premium' ? Award : BadgeCheck;
  const badgeColor = seller.is_official ? '#0e9f6e' : seller.plan === 'premium' ? '#64748b' : '#0f172a';

  return (
    <div className="motif-bg min-h-screen">
      <div className="relative h-48 sm:h-64 overflow-hidden bg-[#0f172a]">
        <img src={seller.store_banner_url || ''} alt={seller.business_name} className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-16 flex flex-col sm:flex-row items-center sm:items-end gap-4 pb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-[#0e9f6e] overflow-hidden bg-[#f7f8fa] shadow-xl shrink-0">
            <img src={seller.store_logo_url || ''} alt={seller.business_name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a]">{seller.business_name}</h1>
              <BadgeIcon className="w-5 h-5" style={{ color: badgeColor }} />
              {seller.is_official && <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#0e9f6e] text-[#0f172a]">Official Store</span>}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-4 mt-2">
              <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-[#ff9900] text-[#ff9900]" /><span className="text-sm font-medium text-[#0f172a]">{seller.rating}</span><span className="text-xs text-[#64748b]/60">({seller.total_reviews})</span></div>
              <span className="text-xs text-[#64748b] flex items-center gap-1"><MapPin className="w-3 h-3" />{seller.city}</span>
            </div>
            {seller.description && <p className="text-sm text-[#64748b] mt-2 max-w-lg">{seller.description}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="card p-4 text-center"><Package className="w-5 h-5 text-[#0e9f6e] mx-auto mb-1" /><p className="text-xl font-bold text-[#0f172a]">{seller.total_products}</p><p className="text-xs text-[#64748b]">{t.seller.products}</p></div>
          <div className="card p-4 text-center"><Star className="w-5 h-5 text-[#0e9f6e] mx-auto mb-1" /><p className="text-xl font-bold text-[#0f172a]">{seller.rating}</p><p className="text-xs text-[#64748b]">{t.product.reviews}</p></div>
          <div className="card p-4 text-center"><Calendar className="w-5 h-5 text-[#0e9f6e] mx-auto mb-1" /><p className="text-xl font-bold text-[#0f172a]">{seller.joined_year}</p><p className="text-xs text-[#64748b]">{locale === 'fr' ? 'Membre depuis' : 'Member since'}</p></div>
        </div>

        <h2 className="font-display text-2xl font-bold text-[#0f172a] mb-5">{products.length} {t.seller.products}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  );
}
