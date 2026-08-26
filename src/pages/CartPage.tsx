import { useApp } from '@/lib/store';
import { fetchProductById, fetchProductFlashDeal } from '@/lib/db';
import type { Product, FlashDeal } from '@/lib/db';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, Truck, Flame } from 'lucide-react';
import { useState, useEffect } from 'react';

export function CartPage() {
  const { t, locale, cart, removeFromCart, updateCartQty, navigate } = useApp();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [deals, setDeals] = useState<Record<string, FlashDeal>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const prods: Record<string, Product> = {};
      const dealMap: Record<string, FlashDeal> = {};
      for (const item of cart) {
        if (!prods[item.productId]) {
          const p = await fetchProductById(item.productId);
          if (p) {
            prods[item.productId] = p;
            const deal = await fetchProductFlashDeal(p.id);
            if (deal) dealMap[item.productId] = deal;
          }
        }
      }
      setProducts(prods);
      setDeals(dealMap);
      setLoading(false);
    })();
  }, [cart]);

  const items = cart.map((c) => ({ ...c, product: products[c.productId], deal: deals[c.productId] })).filter((i) => i.product);
  const effectivePrice = (i: typeof items[number]) => i.deal ? i.deal.deal_price : i.product!.price;
  const total = items.reduce((sum, i) => sum + (effectivePrice(i) * i.qty), 0);

  if (loading) return <div className="motif-bg min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-[#ff7a00]/20 border-t-[#ff7a00] animate-spin" /></div>;

  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-3xl font-bold text-[#0f172a] mb-6">{t.cart.title} {items.length > 0 && <span className="text-lg text-[#64748b] font-normal">({items.length} {t.cart.items})</span>}</h1>
        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-[#ff7a00]/40 mx-auto mb-4" />
            <p className="text-[#64748b] mb-1">{t.cart.empty}</p>
            <p className="text-sm text-[#64748b]/60 mb-4">{t.cart.emptyDesc}</p>
            <button onClick={() => navigate('catalog')} className="btn-gold px-6 py-3 rounded-lg font-semibold">{t.cart.continueShopping}</button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="card p-4 flex items-center gap-4">
                  <img src={item.product!.product_images?.[0]?.image_url || ''} alt={item.product!.name} className="w-20 h-20 rounded-xl object-cover cursor-pointer" onClick={() => navigate('product', { id: item.productId })} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#0f172a] cursor-pointer hover:text-[#ff7a00]" onClick={() => navigate('product', { id: item.productId })}>{item.product!.name}</h3>
                    <p className="text-xs text-[#64748b]">{item.product!.sellers?.business_name}</p>
                    {item.variation && <p className="text-xs text-[#64748b] mt-0.5">{item.variation}</p>}
                    {item.deal && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#e06c00] bg-[#ff7a00]/15 px-1.5 py-0.5 rounded mt-1">
                        <Flame className="w-3 h-3" /> {locale === 'fr' ? 'Vente flash' : 'Flash deal'} -{item.deal.discount_percent}%
                      </span>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-[#0f172a]/15 rounded-lg overflow-hidden">
                        <button onClick={() => updateCartQty(item.productId, item.qty - 1)} className="p-1.5 hover:bg-[#0f172a]/5"><Minus className="w-3.5 h-3.5 text-[#0f172a]" /></button>
                        <span className="px-3 text-sm font-semibold text-[#0f172a]">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.productId, item.qty + 1)} className="p-1.5 hover:bg-[#0f172a]/5"><Plus className="w-3.5 h-3.5 text-[#0f172a]" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /> {t.cart.remove}</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#0f172a]">${(effectivePrice(item) * item.qty).toFixed(0)}</p>
                    <p className="text-xs text-[#64748b]">
                      {item.deal && <span className="line-through mr-1">${item.product!.price}</span>}
                      ${effectivePrice(item)} {t.cart.qty}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="card p-5 sticky top-20">
                <h2 className="font-display text-lg font-bold text-[#0f172a] mb-4">{t.cart.orderSummary}</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm"><span className="text-[#64748b]">{t.cart.subtotal}</span><span className="font-semibold text-[#0f172a]">${total.toFixed(2)}</span></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-[#64748b]">{t.cart.delivery}</span><span className="font-semibold text-[#e06c00] flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> {t.cart.freeDelivery}</span></div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#ff7a00]/20 mb-5">
                  <span className="font-bold text-[#0f172a]">{t.cart.total}</span>
                  <span className="text-2xl font-bold text-[#0f172a]">${total.toFixed(2)}</span>
                </div>
                <button onClick={() => navigate('checkout')} className="w-full btn-gold py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2">{t.cart.checkout} <ArrowRight className="w-4 h-4" /></button>
                <button onClick={() => navigate('catalog')} className="w-full mt-2 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">{t.cart.continueShopping}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
