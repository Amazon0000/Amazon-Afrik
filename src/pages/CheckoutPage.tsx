import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { fetchProductById, fetchAddresses, fetchSellerPaymentMethods, fetchProductsByIds, fetchFlashDealsForProducts, decrementProductStock, validateCoupon, redeemCoupon, getDigitalDownloadUrl, fetchShippingRatesForCountry, notifyNewOrder, fetchSellerPspCredentials, initiateVendorCheckoutPayment, incrementFlashDealClaimed } from '@/lib/db';
import type { Product, Address, SellerPaymentMethod, FlashDeal, ShippingRate, SellerPspCredential } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { CheckCircle, CreditCard, MapPin, Plus, Truck, ShieldCheck, User, Mail, Phone, Smartphone, Store, AlertTriangle, Tag, Loader2, X, Wallet, Download, FileText } from 'lucide-react';

export function CheckoutPage() {
  const { t, locale, cart, navigate, clearCart, showToast, user, countries } = useApp();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [deals, setDeals] = useState<Record<string, FlashDeal>>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [sellerPayments, setSellerPayments] = useState<Record<string, SellerPaymentMethod[]>>({});
  const [pspCredentialsBySeller, setPspCredentialsBySeller] = useState<Record<string, SellerPspCredential[]>>({});
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [digitalItems, setDigitalItems] = useState<{ orderItemId: string; name: string }[]>([]);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '', address: '', city: '', countryId: '' });
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [couponInput, setCouponInput] = useState<Record<string, string>>({});
  const [appliedCoupons, setAppliedCoupons] = useState<Record<string, { code: string; discount: number }>>({});
  const [couponChecking, setCouponChecking] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      const ids = cart.map((item) => item.productId);
      const prods = await fetchProductsByIds(ids);
      const dealMap = await fetchFlashDealsForProducts(Object.keys(prods));
      setProducts(prods);
      setDeals(dealMap);

      if (user) {
        const addr = await fetchAddresses(user.id);
        setAddresses(addr);
        setSelectedAddressId(addr.find((a) => a.is_default)?.id || addr[0]?.id || '');
      }

      const sellerIds = Array.from(new Set(Object.values(prods).map((p) => p.seller_id)));
      const paymentsBySeller: Record<string, SellerPaymentMethod[]> = {};
      const pspCredsBySeller: Record<string, SellerPspCredential[]> = {};
      const defaults: Record<string, string> = {};
      await Promise.all(sellerIds.map(async (sellerId) => {
        const [methods, pspCreds] = await Promise.all([
          fetchSellerPaymentMethods(sellerId).then((m) => m.filter((x) => x.is_active)),
          fetchSellerPspCredentials(sellerId),
        ]);
        // A seller connecting a real API PSP (Seller Center > Payment
        // gateways) previously never appeared at checkout at all —
        // checkout only ever read the separate manual directory table
        // (seller_payment_methods), and connecting real keys doesn't
        // write to that table. Synthesize a buyer-facing entry for any
        // active, fully-configured real credential that doesn't already
        // have a matching manual entry, so "connected" actually means
        // "buyers can pay with it".
        const merged = [...methods];
        for (const cred of pspCreds) {
          if (!cred.is_active || !cred.has_secret) continue;
          const alreadyListed = methods.some((m) => m.provider_name.toLowerCase() === cred.provider);
          if (!alreadyListed) {
            merged.push({
              id: `psp-credential-${cred.id}`,
              seller_id: sellerId,
              provider_name: cred.provider,
              provider_type: 'card',
              account_identifier: null,
              is_active: true,
              is_verified: true,
              display_name: cred.provider.charAt(0).toUpperCase() + cred.provider.slice(1),
              instructions: null,
              created_at: cred.created_at,
            });
          }
        }
        paymentsBySeller[sellerId] = merged;
        pspCredsBySeller[sellerId] = pspCreds;
        if (merged.length > 0) defaults[sellerId] = merged[0].id;
      }));
      setSellerPayments(paymentsBySeller);
      setPspCredentialsBySeller(pspCredsBySeller);
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

  // Shipping — physical items only, priced dynamically per seller x destination
  // country. Digital-only sellers never need a rate (instant delivery).
  const destinationCountryId = user
    ? addresses.find((a) => a.id === selectedAddressId)?.country_id || ''
    : guestInfo.countryId;

  useEffect(() => {
    if (!destinationCountryId) { setShippingRates([]); return; }
    (async () => {
      setShippingLoading(true);
      setShippingRates(await fetchShippingRatesForCountry(destinationCountryId));
      setShippingLoading(false);
    })();
  }, [destinationCountryId]);

  const sellerHasPhysicalItems = (sid: string) => sellerGroups[sid].some((i) => i.product!.product_type !== 'digital');
  const sellerShippingRate = (sid: string) => shippingRates.find((r) => r.seller_id === sid);
  const sellerShippingFee = (sid: string) => sellerHasPhysicalItems(sid) ? (sellerShippingRate(sid)?.fee ?? 0) : 0;
  // A seller blocks checkout only if they actually have physical items, a
  // destination has been chosen, and they simply don't ship there.
  const allSellersCanShip = sellerIds.every((sid) => !sellerHasPhysicalItems(sid) || !destinationCountryId || sellerShippingRate(sid));
  const totalShipping = sellerIds.reduce((sum, sid) => sum + sellerShippingFee(sid), 0);

  const sellerFinalTotal = (sid: string) => Math.max(0, sellerSubtotal(sid) - (appliedCoupons[sid]?.discount || 0)) + sellerShippingFee(sid);
  const totalDiscount = Object.values(appliedCoupons).reduce((sum, c) => sum + c.discount, 0);
  const grandTotal = Math.max(0, subtotal - totalDiscount) + totalShipping;

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

  const handleDownload = async (orderItemId: string) => {
    setDownloading((prev) => ({ ...prev, [orderItemId]: true }));
    const result = await getDigitalDownloadUrl(orderItemId, !user ? guestInfo.email : undefined);
    setDownloading((prev) => ({ ...prev, [orderItemId]: false }));
    if ('url' in result) {
      window.open(result.url, '_blank');
    } else {
      showToast(result.error, 'error');
    }
  };

  const placeOrder = async () => {
    if (items.length === 0) return;
    if (!user && (!guestInfo.name || !guestInfo.email || !guestInfo.address)) {
      showToast(locale === 'fr' ? 'Veuillez remplir vos informations' : 'Please fill your information', 'error');
      return;
    }
    if (!user && items.some((i) => i.product!.product_type !== 'digital') && !guestInfo.countryId) {
      showToast(locale === 'fr' ? 'Sélectionnez votre pays de livraison' : 'Select your delivery country', 'error');
      return;
    }
    if (!allSellersHavePayment) {
      showToast(locale === 'fr' ? "Un vendeur n'a pas encore de moyen de paiement actif" : 'A seller has no active payment method yet', 'error');
      return;
    }
    if (!allSellersCanShip) {
      showToast(locale === 'fr' ? "Un vendeur ne livre pas encore vers votre pays" : "A seller doesn't ship to your country yet", 'error');
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
      const pendingRealPayments: { orderId: string; provider: 'stripe' | 'paddle' | 'payunit' | 'paystack' | 'flutterwave'; trackingId: string }[] = [];
      for (const sellerId of sellerIds) {
        const groupItems = sellerGroups[sellerId];
        const rawTotal = groupItems.reduce((sum, i) => sum + effectivePrice(i) * i.qty, 0);
        const coupon = appliedCoupons[sellerId];
        let discountAmount = 0;
        let redeemedCode: string | null = null;
        if (coupon) {
          // Re-validate (non-consuming) right at order time — the preview
          // above could be stale (another buyer may have just used the last
          // redemption). Actually consuming a use (redeemCoupon) happens
          // below, AFTER we know whether this order is immediately
          // confirmed or awaiting real PSP payment — a coupon must not be
          // permanently spent on a checkout that's later abandoned and
          // never actually pays (see the identical fix for stock decrement).
          const revalidated = await validateCoupon(coupon.code, sellerId, rawTotal);
          if (revalidated.valid) {
            discountAmount = revalidated.discount_amount ?? coupon.discount;
            redeemedCode = coupon.code;
          } else {
            showToast(locale === 'fr' ? `Le code ${coupon.code} n'est plus disponible — commande passée au prix plein` : `Code ${coupon.code} is no longer available — order placed at full price`, 'error');
          }
        }
        const groupTotal = Math.max(0, rawTotal - discountAmount) + sellerShippingFee(sellerId);
        const method = sellerPayments[sellerId]?.find((m) => m.id === selectedPayment[sellerId]);
        const trackingId = `ORD-${Date.now().toString().slice(-6)}-${sellerId.slice(0, 4)}`;
        const rate = sellerShippingRate(sellerId);
        const isFullyDigital = groupItems.every((i) => i.product!.product_type === 'digital');
        const customerPhone = user ? (addr?.phone || null) : (guestInfo.phone || null);

        // Real API-connected PSP? (seller_psp_credentials, matched by
        // provider name against the chosen manual-directory entry) — if
        // so, the order starts 'pending' and only becomes 'confirmed' once
        // a webhook verifies real payment (see vendor-checkout-*).
        // Otherwise (mobile money, bank transfer, no API key configured),
        // keep the existing behavior: the seller confirms manually.
        const providerKey = (method?.provider_name || '').toLowerCase();
        const realCredential = pspCredentialsBySeller[sellerId]?.find(
          (c): c is SellerPspCredential & { provider: 'stripe' | 'paddle' | 'payunit' | 'paystack' | 'flutterwave' } =>
            c.is_active && c.has_secret && c.provider !== 'airwallex' && c.provider === providerKey
        );

        const { data: order } = await supabase.from('orders').insert({
          user_id: user?.id || null,
          guest_name: !user ? guestInfo.name : null,
          guest_email: !user ? guestInfo.email : null,
          guest_phone: !user ? guestInfo.phone : null,
          customer_phone: customerPhone,
          seller_id: sellerId,
          // Digital-only orders are fulfilled the instant payment succeeds
          // (file access already granted below); physical orders start
          // "confirmed" = awaiting shipment, and move through preparing ->
          // inTransit -> delivered as the seller updates them. Orders
          // going through a real connected PSP start 'pending' instead —
          // confirmed only once the webhook verifies payment.
          status: realCredential ? 'pending' : (isFullyDigital ? 'delivered' : 'confirmed'),
          total: groupTotal,
          coupon_code: redeemedCode,
          discount_amount: discountAmount,
          payment_method: method?.display_name || method?.provider_name || null,
          delivery_address: deliveryAddress,
          tracking_id: trackingId,
          shipping_fee: sellerShippingFee(sellerId),
          shipping_min_days: rate?.min_days ?? null,
          shipping_max_days: rate?.max_days ?? null,
          destination_country_id: destinationCountryId || null,
        }).select().single();

        if (order) {
          for (const item of groupItems) {
            const { data: insertedItem } = await supabase.from('order_items').insert({
              order_id: order.id,
              product_id: item.productId,
              product_name: item.product!.name,
              qty: item.qty,
              price: effectivePrice(item),
              image_url: item.product!.product_images?.[0]?.image_url || null,
              product_type: item.product!.product_type,
              digital_file_path: item.product!.product_type === 'digital' ? item.product!.digital_file_path : null,
            }).select('id').single();
            if (item.product!.product_type === 'digital' && insertedItem) {
              setDigitalItems((prev) => [...prev, { orderItemId: insertedItem.id, name: item.product!.name }]);
            }
            // Stock is only reserved for orders that are immediately
            // trusted (manual payment methods, digital goods). Orders
            // awaiting real PSP verification ('pending') must NOT
            // decrement stock yet — an abandoned/failed checkout would
            // otherwise permanently lock inventory for a sale that never
            // happened. That decrement instead happens in the webhook
            // handler (activate-vendor-payment.ts) once payment is
            // actually confirmed.
            if (!realCredential) {
              await decrementProductStock(item.productId, item.qty);
              if (item.deal) await incrementFlashDealClaimed(item.deal.id, item.qty);
            }
          }
          createdIds.push(trackingId);
          if (realCredential) {
            pendingRealPayments.push({ orderId: order.id, provider: realCredential.provider, trackingId });
          } else {
            if (redeemedCode) await redeemCoupon(redeemedCode, sellerId);
            notifyNewOrder(order.id);
          }
        }
      }

      // If any seller in this order uses a real connected PSP, send the
      // buyer to pay right now — redirecting to the vendor's own checkout
      // page. The order only confirms once that payment is verified.
      if (pendingRealPayments.length > 0) {
        const first = pendingRealPayments[0];
        const returnUrl = `${window.location.origin}${window.location.pathname}?p=account&tab=orders`;
        const result = await initiateVendorCheckoutPayment({
          orderId: first.orderId, provider: first.provider, returnUrl,
          buyerEmail: user?.email || guestInfo.email,
        });
        if ('redirectUrl' in result) {
          clearCart();
          window.location.href = result.redirectUrl;
          return;
        }
        showToast(result.error, 'error');
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
          {digitalItems.length > 0 && (
            <div className="mb-6 space-y-2 text-left">
              <p className="text-xs font-semibold text-[#0f172a] uppercase">{locale === 'fr' ? 'Vos téléchargements' : 'Your downloads'}</p>
              {digitalItems.map((di) => (
                <div key={di.orderItemId} className="flex items-center gap-3 p-3 rounded-xl bg-[#ff7a00]/5 border border-[#ff7a00]/15">
                  <FileText className="w-5 h-5 text-[#ff7a00] shrink-0" />
                  <span className="flex-1 min-w-0 text-sm font-medium text-[#0f172a] truncate">{di.name}</span>
                  <button onClick={() => handleDownload(di.orderItemId)} disabled={downloading[di.orderItemId]} className="btn-gold px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 disabled:opacity-50">
                    {downloading[di.orderItemId] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} {locale === 'fr' ? 'Télécharger' : 'Download'}
                  </button>
                </div>
              ))}
              {!user && <p className="text-[11px] text-[#64748b]/70">{locale === 'fr' ? 'Créez un compte pour retrouver vos téléchargements plus tard depuis votre tableau de bord.' : 'Create an account to find your downloads later from your dashboard.'}</p>}
            </div>
          )}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" /><input value={guestInfo.name} onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })} placeholder={locale === 'fr' ? 'Nom complet' : 'Full name'} className="input-field pl-10" /></div>
                    <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" /><input value={guestInfo.email} onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })} placeholder="Email" className="input-field pl-10" /></div>
                    <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" /><input value={guestInfo.phone} onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })} placeholder={locale === 'fr' ? 'Téléphone' : 'Phone'} className="input-field pl-10" /></div>
                    <input value={guestInfo.city} onChange={(e) => setGuestInfo({ ...guestInfo, city: e.target.value })} placeholder={locale === 'fr' ? 'Ville' : 'City'} className="input-field" />
                  </div>
                  <input value={guestInfo.address} onChange={(e) => setGuestInfo({ ...guestInfo, address: e.target.value })} placeholder={locale === 'fr' ? 'Adresse de livraison' : 'Delivery address'} className="input-field" />
                  {items.some((i) => i.product!.product_type !== 'digital') && (
                    <div>
                      <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? 'Pays de livraison' : 'Delivery country'} *</label>
                      <select value={guestInfo.countryId} onChange={(e) => setGuestInfo({ ...guestInfo, countryId: e.target.value })} className="input-field cursor-pointer">
                        <option value="">—</option>
                        {countries.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                      </select>
                    </div>
                  )}
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
                      {sellerHasPhysicalItems(sellerId) && destinationCountryId && !sellerShippingRate(sellerId) && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-xs mb-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          {locale === 'fr' ? "Ce vendeur ne livre pas encore vers votre pays." : "This seller doesn't ship to your country yet."}
                        </div>
                      )}
                      {sellerHasPhysicalItems(sellerId) && sellerShippingRate(sellerId) && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white text-xs text-[#0f172a] mb-2 border border-[#0f172a]/10">
                          <Truck className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
                          <span className="flex-1">{locale === 'fr' ? 'Livraison' : 'Shipping'}: ${sellerShippingRate(sellerId)!.fee.toFixed(2)} · {sellerShippingRate(sellerId)!.min_days}-{sellerShippingRate(sellerId)!.max_days} {locale === 'fr' ? 'jours' : 'days'}</span>
                        </div>
                      )}
                      {methods.length === 0 ? (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-xs">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          {locale === 'fr' ? "Ce vendeur n'a pas encore connecté de moyen de paiement." : 'This seller has not connected a payment method yet.'}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {methods.map((m) => {
                            const isReal = pspCredentialsBySeller[sellerId]?.some((c) => c.is_active && c.has_secret && c.provider === m.provider_name.toLowerCase());
                            return (
                            <button key={m.id} onClick={() => setSelectedPayment({ ...selectedPayment, [sellerId]: m.id })}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all bg-white ${selectedPayment[sellerId] === m.id ? 'border-[#ff7a00] bg-[#ff7a00]/5' : 'border-[#0f172a]/10 hover:border-[#ff7a00]/50'}`}>
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedPayment[sellerId] === m.id ? 'bg-[#ff7a00] text-white' : 'bg-[#0f172a]/5 text-[#64748b]'}`}>
                                {m.provider_type === 'mobile_money' ? <Smartphone className="w-4 h-4" /> : m.provider_type === 'digital_wallet' ? <Wallet className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-medium text-[#0f172a] flex items-center gap-1.5">
                                  {m.display_name || m.provider_name}
                                  {isReal && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-green-100 text-green-700">{locale === 'fr' ? 'Paiement instantané' : 'Instant payment'}</span>}
                                </p>
                                {m.account_identifier && <p className="text-xs text-[#64748b] truncate">{m.account_identifier}</p>}
                              </div>
                              <div className={`ml-auto w-5 h-5 rounded-full border-2 shrink-0 ${selectedPayment[sellerId] === m.id ? 'border-[#ff7a00] bg-[#ff7a00]' : 'border-[#0f172a]/20'}`}>
                                {selectedPayment[sellerId] === m.id && <CheckCircle className="w-4 h-4 text-white mx-auto" />}
                              </div>
                            </button>
                            );
                          })}
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
            <div className="premium-card p-5 lg:sticky lg:top-20 rounded-2xl bg-gradient-to-br from-white to-[#f8fbfa]">
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#64748b]">{t.cart.delivery}</span>
                  {items.every((i) => i.product!.product_type === 'digital') ? (
                    <span className="font-semibold text-[#3d1f00] flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> {t.cart.freeDelivery}</span>
                  ) : !destinationCountryId ? (
                    <span className="text-[#64748b]">{locale === 'fr' ? 'Choisissez la destination' : 'Choose destination'}</span>
                  ) : shippingLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#64748b]" />
                  ) : (
                    <span className="font-semibold text-[#0f172a]">${totalShipping.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#3d1f00]/15">
                  <span className="font-bold text-[#0f172a]">{t.cart.total}</span>
                  <span className="text-2xl font-bold text-[#0f172a]">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={placeOrder} disabled={(user ? !selectedAddressId : !guestInfo.name || !guestInfo.email || !guestInfo.address || (items.some((i) => i.product!.product_type !== 'digital') && !guestInfo.countryId)) || !allSellersHavePayment || !allSellersCanShip} className="w-full btn-gold py-3.5 rounded-full font-semibold mt-5 disabled:opacity-50 soft-glow">
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
