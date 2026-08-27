import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { fetchProductById, fetchAddresses, fetchSellerPaymentMethods, fetchProductFlashDeal, decrementProductStock, validateCoupon, redeemCoupon } from '@/lib/db';
import type { Product, Address, SellerPaymentMethod, FlashDeal } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { CheckCircle, CreditCard, MapPin, Plus, Truck, ShieldCheck, User, Mail, Phone, Smartphone, Store, AlertTriangle, Tag, Loader2, X } from 'lucide-react';

export function CheckoutPage() {
  const { t, locale, cart, navigate, clearCart, showToast, user } = useApp();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [deals, setDeals] = useState<Record<string, FlashDeal>>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [sellerPayments, setSellerPayments] = useState<Record<string, SellerPaymentMethod[]>>({});
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '', address: '', city: '' });
  const [couponInput, setCouponInput] = useState<Record<string, string>>({});
  const [appliedCoupons, setAppliedCoupons] = useState<Record<string, { code: string; discount: number }>>({});
  const [couponChecking, setCouponChecking] = useState<Record<string, boolean>>({});

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

      if (user) {
        const addr = await fetchAddresses(user.id);
        setAddresses(addr);
        setSelectedAddressId(addr.find((a) => a.is_default)?.id || addr[0]?.id || '');
      }

      const sellerIds = Array.from(new Set(Object.values(prods).map((p) => p.seller_id)));
      const paymentsBySeller: Record<string, SellerPaymentMethod[]> = {};
      const defaults: Record<string, string> = {};
      await Promise.all(sellerIds.map(async (sellerId) => {
        const methods = (await fetchSellerPaymentMethods(sellerId)).filter((m) => m.is_active);
        paymentsBySeller[sellerId] = methods;
        if (methods.length > 0) defaults[sellerId] = methods[0].id;
      }));
      setSellerPayments(paymentsBySeller);
      setSelectedPayment(defaults);
      setLoading(false);
    })();
  }, [cart, user]);

  const items = cart.map((c) => ({ ...c, product: products[c.productId], deal: deals[c.productId] })).filter((i) => i.product);
  const effectivePrice = (i: typeof items[number]) => i.deal ? i.deal.deal_price : i.product!.price;
  const subtotal = items.reduce((sum, i) => sum + (effectivePrice(i) * i.qty), 0);

  const sellerGroups = items.reduce<Record<string, typeof items>>((acc, item) => {
    const sid = item.product!.seller_id;
    (acc[sid] ||= []).push(item);
    return acc;
  }, {});
  const sellerIds = Object.keys(sellerGroups);
  const allSellersHavePayment = sellerIds.every((sid) => selectedPayment[sid]);
  const sellerSubtotal = (sid: string) => sellerGroups[sid].reduce((sum, i) => sum + effectivePrice(i) * i.qty, 0);
  const sellerFinalTotal = (sid: string) => Math.max(0, sellerSubtotal(sid) - (appliedCoupons[sid]?.discount || 0));
  const totalDiscount = Object.values(appliedCoupons).reduce((sum, c) => sum + c.discount, 0);
  const grandTotal = Math.max(0, subtotal - totalDiscount);

  const applyCoupon = async (sellerId: string) => {
    const code = (couponInput[sellerId] || '').trim();
    if (!code) return;
    setCouponChecking({ ...couponChecking, [sellerId]: true });
    const result = await validateCoupon(code, sellerId, sellerSubtotal(sellerId));
    setCouponChecking({ ...couponChecking, [sellerId]: false });
    if (result.valid) {
      setAppliedCoupons({ ...appliedCoupons, [sellerId]: { code: code.toUpperCase(), discount: result.discount_amount } });
      showToast(locale === 'fr' ? `Code appliqué : -$${result.discount_amount.toFixed(2)}` : `Code applied: -$${result.discount_amount.toFixed(2)}`);
    } else {
      const messages: Record<string, { fr: string; en: string }> = {
        not_found: { fr: 'Code invalide pour ce vendeur', en: 'Invalid code for this seller' },
        expired: { fr: 'Ce code a expiré', en: 'This code has expired' },
        limit_reached: { fr: "Ce code a atteint sa limite d'utilisation", en: 'This code has reached its usage limit' },
        min_order_not_met: { fr: `Achat minimum de $${result.min_order_amount} requis`, en: `Minimum order of $${result.min_order_amount} required` },
      };
      const m = messages[result.reason];
      showToast((locale === 'fr' ? m?.fr : m?.en) || (locale === 'fr' ? 'Code invalide' : 'Invalid code'), 'error');
    }
  };

  const removeCoupon = (sellerId: string) => {
    const next = { ...appliedCoupons };
    delete next[sellerId];
    setAppliedCoupons(next);
  };

  const placeOrder = async () => {
    if (items.length === 0) return;
    if (!user && (!guestInfo.name || !guestInfo.email || !guestInfo.address)) {
      showToast(locale === 'fr' ? 'Veuillez remplir vos informations' : 'Please fill your information', 'error');
      return;
    }
    if (!allSellersHavePayment) {
      showToast(locale === 'fr' ? "Un vendeur n'a pas encore de moyen de paiement actif" : 'A seller has no active payment method yet', 'error');
      return;
    }

    // Defensive re-check: stock may have moved since the cart/checkout page loaded
    // (another buyer could have just bought the last units).
    for (const item of items) {
      const fresh = await fetchProductById(item.productId);
      if (!fresh || fresh.stock < item.qty) {
        showToast(locale === 'fr'
          ? `Stock insuffisant pour "${item.product!.name}" (${fresh?.stock ?? 0} disponible${(fresh?.stock ?? 0) > 1 ? 's' : ''}) — ajustez votre panier.`
          : `Not enough stock for "${item.product!.name}" (${fresh?.stock ?? 0} available) — please adjust your cart.`, 'error');
        return;
      }
    }

    const addr = addresses.find((a) => a.id === selectedAddressId);
    const deliveryAddress = user
      ? (addr ? `${addr.street}, ${addr.city}` : '')
      : `${guestInfo.address}, ${guestInfo.city}`;

    try {
      const createdIds: string[] = [];
      for (const sellerId of sellerIds) {
        const groupItems = sellerGroups[sellerId];
        const rawTotal = groupItems.reduce((sum, i) => sum + effectivePrice(i) * i.qty, 0);
        const coupon = appliedCoupons[sellerId];
        let discountAmount = 0;
        let redeemedCode: string | null = null;
        if (coupon) {
          // Re-validate + atomically consume the use right at order time — the
          // preview above could be stale (another buyer may have just used the
          // last redemption). If redemption fails, the order still goes through
          // at full price rather than blocking the whole checkout.
          const stillValid = await redeemCoupon(coupon.code, sellerId);
          if (stillValid) {
            discountAmount = coupon.discount;
            redeemedCode = coupon.code;
          } else {
            showToast(locale === 'fr' ? `Le code ${coupon.code} n'est plus disponible — commande passée au prix plein` : `Code ${coupon.code} is no longer available — order placed at full price`, 'error');
          }
        }
        const groupTotal = Math.max(0, rawTotal - discountAmount);
        const method = sellerPayments[sellerId]?.find((m) => m.id === selectedPayment[sellerId]);
        const trackingId = `ORD-${Date.now().toString().slice(-6)}-${sellerId.slice(0, 4)}`;

        const { data: order } = await supabase.from('orders').insert({
          user_id: user?.id || null,
          guest_name: !user ? guestInfo.name : null,
          guest_email: !user ? guestInfo.email : null,
          guest_phone: !user ? guestInfo.phone : null,
          seller_id: sellerId,
          status: 'confirmed',
          total: groupTotal,
          coupon_code: redeemedCode,
          discount_amount: discountAmount,
          payment_method: method?.display_name || method?.provider_name || null,
          delivery_address: deliveryAddress,
          tracking_id: trackingId,
        }).select().single();

        if (order) {
          for (const item of groupItems) {
            await supabase.from('order_items').insert({
              order_id: order.id,
              product_id: item.productId,
              product_name: item.product!.name,
              qty: item.qty,
              price: effectivePrice(item),
              image_url: item.product!.product_images?.[0]?.image_url || null,
            });
            await decrementProductStock(item.productId, item.qty);
          }
          createdIds.push(trackingId);
        }
      }
      setOrderIds(createdIds);
      setOrderPlaced(true);
      clearCart();
      showToast(t.checkout.orderPlaced);
    } catch {
      showToast(locale === 'fr' ? 'Erreur lors de la commande' : 'Order error', 'error');
    }
  };

  if (orderPlaced) {
    return (
      <div className="motif-bg min-h-screen flex items-center justify-center px-4 py-12">
        <div className="card p-8 max-w-md text-center animate-fade-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff7a00]/15 flex items-center justify-center pulse-gold">
            <CheckCircle className="w-8 h-8 text-[#e06c00]" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#0f172a] mb-2">{t.checkout.orderPlaced}</h2>
          <p className="text-sm text-[#64748b] mb-2">{t.checkout.orderPlacedDesc}</p>
          <div className="mb-6 space-y-1">
            {orderIds.map((id) => (
              <p key={id} className="text-xs text-[#64748b]">{t.delivery.trackingId}: <span className="font-mono font-bold text-[#0f172a]">{id}</span></p>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('delivery', { id: orderIds[0] })} className="flex-1 btn-gold py-3 rounded-xl font-semibold">{t.delivery.title}</button>
            <button onClick={() => navigate('home')} className="flex-1 btn-cocoa py-3 rounded-xl font-semibold">{t.nav.home}</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="motif-bg min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-[#ff7a00]/20 border-t-[#ff7a00] animate-spin" /></div>;

  if (items.length === 0) {
    return (
      <div className="motif-bg min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 text-center max-w-md">
          <p className="text-[#64748b] mb-4">{t.cart.empty}</p>
          <button onClick={() => navigate('catalog')} className="btn-gold px-6 py-3 rounded-lg font-semibold">{t.cart.continueShopping}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-3xl font-bold text-[#0f172a] mb-6">{t.checkout.title}</h1>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Address */}
            <div className="premium-card p-5 rounded-2xl">
              <h2 className="font-display text-lg font-bold text-[#0f172a] mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-[#ff7a00]" /> {t.checkout.deliveryAddress}</h2>
              {user ? (
                <>
                  {addresses.length > 0 ? (
                    <div className="space-y-2">
                      {addresses.map((a) => (
                        <button key={a.id} onClick={() => setSelectedAddressId(a.id)}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all ${selectedAddressId === a.id ? 'border-[#ff7a00] bg-[#ff7a00]/5' : 'border-[#0f172a]/10 hover:border-[#ff7a00]/50'}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#0f172a]">{a.label}</span>
                            {a.is_default && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ff7a00]/15 text-[#64748b]">{t.account.defaultAddress}</span>}
                          </div>
                          <p className="text-xs text-[#64748b] mt-1">{a.full_name} • {a.phone}</p>
                          <p className="text-xs text-[#64748b]">{a.street}, {a.city}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#64748b] mb-3">{t.account.noAddresses}</p>
                  )}
                  <button onClick={() => navigate('account')} className="flex items-center gap-2 text-sm font-semibold text-[#ff7a00] hover:underline mt-2">
                    <Plus className="w-4 h-4" /> {t.checkout.addNewAddress}
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#ff7a00]/10 flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-[#ff7a00]" />
                    <p className="text-xs text-[#0f172a]">{locale === 'fr' ? 'Commandez sans compte. Vos informations sont sécurisées.' : 'Checkout without an account. Your info is secure.'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" /><input value={guestInfo.name} onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })} placeholder={locale === 'fr' ? 'Nom complet' : 'Full name'} className="input-field pl-10" /></div>
                    <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" /><input value={guestInfo.email} onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })} placeholder="Email" className="input-field pl-10" /></div>
                    <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" /><input value={guestInfo.phone} onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })} placeholder={locale === 'fr' ? 'Téléphone' : 'Phone'} className="input-field pl-10" /></div>
                    <input value={guestInfo.city} onChange={(e) => setGuestInfo({ ...guestInfo, city: e.target.value })} placeholder={locale === 'fr' ? 'Ville' : 'City'} className="input-field" />
                  </div>
                  <input value={guestInfo.address} onChange={(e) => setGuestInfo({ ...guestInfo, address: e.target.value })} placeholder={locale === 'fr' ? 'Adresse de livraison' : 'Delivery address'} className="input-field" />
                </div>
              )}
            </div>

            {/* Payment — per seller, direct to their own PSP */}
            <div className="premium-card p-5 rounded-2xl">
              <h2 className="font-display text-lg font-bold text-[#0f172a] mb-1 flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#ff7a00]" /> {t.checkout.paymentMethod}</h2>
              <p className="text-xs text-[#64748b] mb-4">{t.checkout.directPaymentDesc}</p>

              <div className="space-y-5">
                {sellerIds.map((sellerId) => {
                  const groupItems = sellerGroups[sellerId];
                  const seller = groupItems[0].product!.sellers;
                  const methods = sellerPayments[sellerId] || [];
                  return (
                    <div key={sellerId} className="p-3 rounded-xl bg-[#f7f8fa]">
                      <div className="flex items-center gap-2 mb-3">
                        <Store className="w-4 h-4 text-[#64748b]" />
                        <span className="text-sm font-semibold text-[#0f172a]">{seller?.business_name || sellerId}</span>
                        <span className="ml-auto text-sm font-bold text-[#0f172a]">${sellerFinalTotal(sellerId).toFixed(2)}</span>
                      </div>
                      {methods.length === 0 ? (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-xs">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          {locale === 'fr' ? "Ce vendeur n'a pas encore connecté de moyen de paiement." : 'This seller has not connected a payment method yet.'}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {methods.map((m) => (
                            <button key={m.id} onClick={() => setSelectedPayment({ ...selectedPayment, [sellerId]: m.id })}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all bg-white ${selectedPayment[sellerId] === m.id ? 'border-[#ff7a00] bg-[#ff7a00]/5' : 'border-[#0f172a]/10 hover:border-[#ff7a00]/50'}`}>
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedPayment[sellerId] === m.id ? 'bg-[#ff7a00] text-white' : 'bg-[#0f172a]/5 text-[#64748b]'}`}>
                                {m.provider_type === 'mobile_money' ? <Smartphone className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                              </div>
                              <span className="text-sm font-medium text-[#0f172a]">{m.display_name || m.provider_name}</span>
                              <div className={`ml-auto w-5 h-5 rounded-full border-2 shrink-0 ${selectedPayment[sellerId] === m.id ? 'border-[#ff7a00] bg-[#ff7a00]' : 'border-[#0f172a]/20'}`}>
                                {selectedPayment[sellerId] === m.id && <CheckCircle className="w-4 h-4 text-white mx-auto" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Coupon code — per seller, since discounts are seller-funded, not Zando's */}
                      <div className="mt-3 pt-3 border-t border-[#0f172a]/10">
                        {appliedCoupons[sellerId] ? (
                          <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-[#3d1f00]/20">
                            <span className="text-xs font-semibold text-[#3d1f00] flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {appliedCoupons[sellerId].code} · -${appliedCoupons[sellerId].discount.toFixed(2)}</span>
                            <button onClick={() => removeCoupon(sellerId)} className="text-[#64748b] hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input value={couponInput[sellerId] || ''} onChange={(e) => setCouponInput({ ...couponInput, [sellerId]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && applyCoupon(sellerId)} placeholder={locale === 'fr' ? 'Code promo' : 'Coupon code'} className="input-field text-xs py-2 flex-1 font-mono uppercase" />
                            <button onClick={() => applyCoupon(sellerId)} disabled={couponChecking[sellerId]} className="btn-cocoa px-4 py-2 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 disabled:opacity-50">
                              {couponChecking[sellerId] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (locale === 'fr' ? 'Appliquer' : 'Apply')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-[#ff7a00]/10 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#ff7a00] mt-0.5 shrink-0" />
                <p className="text-xs text-[#64748b]">{t.checkout.directPaymentDesc}</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="premium-card p-5 sticky top-20 rounded-2xl bg-gradient-to-br from-white to-[#f8fbfa]">
              <h2 className="font-display text-lg font-bold text-[#0f172a] mb-4">{t.cart.orderSummary}</h2>
              <div className="space-y-3 mb-4">
                {items.map((i) => (
                  <div key={i.productId} className="flex items-center gap-3">
                    <img src={i.product!.product_images?.[0]?.image_url || ''} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#0f172a] truncate">{i.product!.name}</p>
                      <p className="text-xs text-[#64748b]">{t.cart.qty}: {i.qty}</p>
                    </div>
                    <span className="text-sm font-bold text-[#0f172a]">${(effectivePrice(i) * i.qty).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-3 border-t border-[#3d1f00]/15">
                <div className="flex items-center justify-between text-sm"><span className="text-[#64748b]">{t.cart.subtotal}</span><span className="font-semibold text-[#0f172a]">${subtotal.toFixed(2)}</span></div>
                {totalDiscount > 0 && (
                  <div className="flex items-center justify-between text-sm"><span className="text-[#64748b] flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {locale === 'fr' ? 'Remise' : 'Discount'}</span><span className="font-semibold text-[#3d1f00]">-${totalDiscount.toFixed(2)}</span></div>
                )}
                <div className="flex items-center justify-between text-sm"><span className="text-[#64748b]">{t.cart.delivery}</span><span className="font-semibold text-[#3d1f00] flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> {t.cart.freeDelivery}</span></div>
                <div className="flex items-center justify-between pt-2 border-t border-[#3d1f00]/15">
                  <span className="font-bold text-[#0f172a]">{t.cart.total}</span>
                  <span className="text-2xl font-bold text-[#0f172a]">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={placeOrder} disabled={(user ? !selectedAddressId : !guestInfo.name || !guestInfo.email || !guestInfo.address) || !allSellersHavePayment} className="w-full btn-gold py-3.5 rounded-full font-semibold mt-5 disabled:opacity-50 soft-glow">
                {t.checkout.placeOrder}
              </button>
              <button onClick={() => navigate('cart')} className="w-full mt-2 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">{t.common.back}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
