import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { fetchProductById, fetchAddresses, fetchPaymentProviders, createOrdersFromCart } from '@/lib/db';
import type { Product, Address, PaymentProvider } from '@/lib/db';
import { CheckCircle, CreditCard, MapPin, Plus, Truck, ShieldCheck, User, Mail, Phone, Smartphone } from 'lucide-react';

export function CheckoutPage() {
  const { t, locale, cart, navigate, clearCart, showToast, user, geo } = useApp();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderTrackingIds, setOrderTrackingIds] = useState<string[]>([]);
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '', address: '', city: '' });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const prods: Record<string, Product> = {};
      for (const item of cart) {
        if (!prods[item.productId]) {
          const p = await fetchProductById(item.productId);
          if (p) prods[item.productId] = p;
        }
      }
      setProducts(prods);

      if (user) {
        const addr = await fetchAddresses(user.id);
        setAddresses(addr);
        setSelectedAddressId(addr.find((a) => a.is_default)?.id || addr[0]?.id || '');
      }

      const pp = await fetchPaymentProviders(geo.countryId);
      setPaymentProviders(pp);
      if (pp.length > 0) setPaymentMethod(pp[0].slug);
      setLoading(false);
    })();
  }, [cart, user, geo.countryId]);

  const items = cart.map((c) => ({ ...c, product: products[c.productId] })).filter((i) => i.product);
  const subtotal = items.reduce((sum, i) => sum + (i.product!.price * i.qty), 0);

  const placeOrder = async () => {
    if (items.length === 0) return;
    if (!user && (!guestInfo.name || !guestInfo.email || !guestInfo.address)) {
      showToast(locale === 'fr' ? 'Veuillez remplir vos informations' : 'Please fill your information', 'error');
      return;
    }
    const addr = addresses.find((a) => a.id === selectedAddressId);
    const deliveryAddress = user
      ? (addr ? `${addr.street}, ${addr.city}` : '')
      : `${guestInfo.address}, ${guestInfo.city}`;

    setPlacing(true);
    try {
      // A marketplace order belongs to a single seller, so a cart spanning multiple
      // sellers is split into one order per seller here rather than merged into one.
      const created = await createOrdersFromCart({
        items: items.map((i) => ({ line: { productId: i.productId, qty: i.qty, variation: i.variation }, product: i.product! })),
        userId: user?.id || null,
        guestName: guestInfo.name,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
        deliveryAddress,
        paymentMethod,
      });
      setOrderTrackingIds(created.map((o) => o.trackingId));
      setOrderPlaced(true);
      clearCart();
      showToast(t.checkout.orderPlaced);
    } catch (e) {
      console.error('placeOrder failed', e);
      showToast(locale === 'fr' ? 'Erreur lors de la commande' : 'Order error', 'error');
    } finally {
      setPlacing(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="motif-bg min-h-screen flex items-center justify-center px-4 py-12">
        <div className="card p-8 max-w-md text-center animate-fade-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center pulse-gold">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#0f172a] mb-2">{t.checkout.orderPlaced}</h2>
          <p className="text-sm text-[#64748b] mb-2">{t.checkout.orderPlacedDesc}</p>
          <div className="mb-6 space-y-1">
            {orderTrackingIds.map((tid) => (
              <p key={tid} className="text-xs text-[#64748b]">{t.delivery.trackingId}: <span className="font-mono font-bold text-[#0f172a]">{tid}</span></p>
            ))}
            {orderTrackingIds.length > 1 && (
              <p className="text-[11px] text-[#64748b]/70">{locale === 'fr' ? `Votre commande a été répartie en ${orderTrackingIds.length} envois car elle contient des produits de plusieurs vendeurs.` : `Your order was split into ${orderTrackingIds.length} shipments because it contains products from multiple sellers.`}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('delivery', { id: orderTrackingIds[0] })} className="flex-1 btn-gold py-3 rounded-xl font-semibold">{t.delivery.title}</button>
            <button onClick={() => navigate('home')} className="flex-1 btn-cocoa py-3 rounded-xl font-semibold">{t.nav.home}</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="motif-bg min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-[#0e9f6e]/20 border-t-[#0e9f6e] animate-spin" /></div>;

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
              <h2 className="font-display text-lg font-bold text-[#0f172a] mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-[#0e9f6e]" /> {t.checkout.deliveryAddress}</h2>
              {user ? (
                <>
                  {addresses.length > 0 ? (
                    <div className="space-y-2">
                      {addresses.map((a) => (
                        <button key={a.id} onClick={() => setSelectedAddressId(a.id)}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all ${selectedAddressId === a.id ? 'border-[#0e9f6e] bg-[#0e9f6e]/5' : 'border-[#0f172a]/10 hover:border-[#0e9f6e]/50'}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#0f172a]">{a.label}</span>
                            {a.is_default && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0e9f6e]/15 text-[#64748b]">{t.account.defaultAddress}</span>}
                          </div>
                          <p className="text-xs text-[#64748b] mt-1">{a.full_name} • {a.phone}</p>
                          <p className="text-xs text-[#64748b]">{a.street}, {a.city}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#64748b] mb-3">{t.account.noAddresses}</p>
                  )}
                  <button onClick={() => navigate('account')} className="flex items-center gap-2 text-sm font-semibold text-[#0e9f6e] hover:underline mt-2">
                    <Plus className="w-4 h-4" /> {t.checkout.addNewAddress}
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#0e9f6e]/10 flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-[#0e9f6e]" />
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

            {/* Payment */}
            <div className="premium-card p-5 rounded-2xl">
              <h2 className="font-display text-lg font-bold text-[#0f172a] mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#0e9f6e]" /> {t.checkout.paymentMethod}</h2>
              <div className="space-y-2">
                {paymentProviders.map((p) => (
                  <button key={p.id} onClick={() => setPaymentMethod(p.slug)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${paymentMethod === p.slug ? 'border-[#0e9f6e] bg-[#0e9f6e]/5' : 'border-[#0f172a]/10 hover:border-[#0e9f6e]/50'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${paymentMethod === p.slug ? 'bg-[#0e9f6e] text-[#0f172a]' : 'bg-[#0f172a]/5 text-[#64748b]'}`}>
                      {p.slug.includes('mobile') || p.slug.includes('mpesa') ? <Smartphone className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                    </div>
                    <span className="text-sm font-medium text-[#0f172a]">{p.name}</span>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 ${paymentMethod === p.slug ? 'border-[#0e9f6e] bg-[#0e9f6e]' : 'border-[#0f172a]/20'}`}>
                      {paymentMethod === p.slug && <CheckCircle className="w-4 h-4 text-[#0f172a] mx-auto" />}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-xl bg-[#0e9f6e]/10 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0e9f6e] mt-0.5 shrink-0" />
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
                    <span className="text-sm font-bold text-[#0f172a]">${(i.product!.price * i.qty).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-3 border-t border-[#0e9f6e]/20">
                <div className="flex items-center justify-between text-sm"><span className="text-[#64748b]">{t.cart.subtotal}</span><span className="font-semibold text-[#0f172a]">${subtotal.toFixed(2)}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-[#64748b]">{t.cart.delivery}</span><span className="font-semibold text-green-600 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> {t.cart.freeDelivery}</span></div>
                <div className="flex items-center justify-between pt-2 border-t border-[#0e9f6e]/20">
                  <span className="font-bold text-[#0f172a]">{t.cart.total}</span>
                  <span className="text-2xl font-bold text-[#0f172a]">${subtotal.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={placeOrder} disabled={placing || (user ? !selectedAddressId : !guestInfo.name || !guestInfo.email || !guestInfo.address)} className="w-full btn-gold py-3.5 rounded-xl font-semibold mt-5 disabled:opacity-50 soft-glow">
                {placing ? (locale === 'fr' ? 'Traitement...' : 'Processing...') : t.checkout.placeOrder}
              </button>
              <button onClick={() => navigate('cart')} className="w-full mt-2 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">{t.common.back}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
