import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { fetchProductById, fetchAddresses, fetchPaymentProviders } from '@/lib/db';
import type { Product, Address, PaymentProvider } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { CheckCircle, CreditCard, Smartphone, MapPin, Plus, Truck, ShieldCheck, Loader2 } from 'lucide-react';

const MOBILE_OPERATORS = [
  { id: 'wave', name: 'Wave', logo: '🌊', color: '#1eb5ff', countries: ['CI', 'SN'] },
  { id: 'orange', name: 'Orange Money', logo: '🍊', color: '#ff6600', countries: ['CI', 'SN', 'ML', 'GN'] },
  { id: 'mtn', name: 'MTN Mobile Money', logo: '🟡', color: '#ffcc00', countries: ['CI', 'GH', 'NG', 'CM'] },
  { id: 'mpesa', name: 'M-Pesa', logo: '🟢', color: '#4caf50', countries: ['KE', 'TZ', 'UG'] },
  { id: 'airtel', name: 'Airtel Money', logo: '🔴', color: '#e53935', countries: ['KE', 'UG', 'TZ', 'ZM', 'MW'] },
];

export function CheckoutPage() {
  const { t, locale, cart, navigate, clearCart, showToast, user, geo, formatPrice } = useApp();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [momoPhone, setMomoPhone] = useState('');
  const [ussdStep, setUssdStep] = useState<'idle' | 'pending' | 'success'>('idle');
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

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

  const executeOrderCreation = async () => {
    if (!user || items.length === 0) return;
    const addr = addresses.find((a) => a.id === selectedAddressId);
    const id = `ORD-${Date.now().toString().slice(-6)}`;
    try {
      const { data: order } = await supabase.from('orders').insert({
        user_id: user.id,
        seller_id: items[0].product!.seller_id,
        status: 'confirmed',
        total: subtotal,
        payment_method: selectedOperator ? `Mobile Money (${selectedOperator})` : paymentMethod,
        delivery_address: addr ? `${addr.street}, ${addr.city}` : '',
        tracking_id: id,
      }).select().single();

      if (order) {
        for (const item of items) {
          await supabase.from('order_items').insert({
            order_id: order.id,
            product_id: item.productId,
            product_name: item.product!.name,
            qty: item.qty,
            price: item.product!.price,
            image_url: item.product!.product_images?.[0]?.image_url || null,
          });
        }
      }
      setOrderId(id);
      setOrderPlaced(true);
      setUssdStep('idle');
      clearCart();
      showToast(t.checkout.orderPlaced);
    } catch {
      showToast(locale === 'fr' ? 'Erreur lors de la commande' : 'Order error', 'error');
      setUssdStep('idle');
    }
  };

  const placeOrder = async () => {
    if (!user || items.length === 0) return;
    const isMobileMoney = paymentMethod.includes('mobile') || paymentMethod.includes('mpesa');
    if (isMobileMoney) {
      if (!selectedOperator || !momoPhone.trim()) {
        showToast(locale === 'fr' ? 'Sélectionnez un opérateur et saisissez votre numéro' : 'Please select an operator and enter your number', 'error');
        return;
      }
      setUssdStep('pending');
    } else {
      await executeOrderCreation();
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
          <p className="text-xs text-[#64748b] mb-6">{t.delivery.trackingId}: <span className="font-mono font-bold text-[#0f172a]">{orderId}</span></p>
          <div className="flex gap-3">
            <button onClick={() => navigate('delivery', { id: orderId })} className="flex-1 btn-gold py-3 rounded-xl font-semibold">{t.delivery.title}</button>
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
            <div className="card p-5">
              <h2 className="font-display text-lg font-bold text-[#0f172a] mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-[#0e9f6e]" /> {t.checkout.deliveryAddress}</h2>
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
            </div>

            {/* Payment */}
            <div className="card p-5">
              <h2 className="font-display text-lg font-bold text-[#0f172a] mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#0e9f6e]" /> {t.checkout.paymentMethod}</h2>
              <div className="space-y-2">
                {paymentProviders.map((p) => {
                  const isMobileMoney = p.slug.includes('mobile') || p.slug.includes('mpesa');
                  return (
                    <div key={p.id} className="space-y-2">
                      <button onClick={() => { setPaymentMethod(p.slug); if (!isMobileMoney) setSelectedOperator(''); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${paymentMethod === p.slug ? 'border-[#0e9f6e] bg-[#0e9f6e]/5' : 'border-[#0f172a]/10 hover:border-[#0e9f6e]/50'}`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${paymentMethod === p.slug ? 'bg-[#0e9f6e] text-[#0f172a]' : 'bg-[#0f172a]/5 text-[#64748b]'}`}>
                          {isMobileMoney ? <Smartphone className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                        </div>
                        <span className="text-sm font-medium text-[#0f172a]">{p.name}</span>
                        <div className={`ml-auto w-5 h-5 rounded-full border-2 ${paymentMethod === p.slug ? 'border-[#0e9f6e] bg-[#0e9f6e]' : 'border-[#0f172a]/20'}`}>
                          {paymentMethod === p.slug && <CheckCircle className="w-4 h-4 text-[#0f172a] mx-auto" />}
                        </div>
                      </button>

                      {isMobileMoney && paymentMethod === p.slug && (
                        <div className="p-4 rounded-xl bg-[#f7f8fa] border border-[#e2e8f0] space-y-4 ml-2 animate-fade-up text-left">
                          <p className="text-xs font-semibold text-[#0f172a] uppercase">{locale === 'fr' ? 'Choisissez votre opérateur' : 'Choose your operator'}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {MOBILE_OPERATORS.map((op) => (
                              <button key={op.id} type="button" onClick={() => setSelectedOperator(op.name)}
                                className={`p-2.5 rounded-lg border-2 flex items-center gap-2 transition-all text-sm font-medium ${selectedOperator === op.name ? 'border-[#0e9f6e] bg-[#0e9f6e]/10' : 'border-[#e2e8f0] bg-white hover:border-[#0e9f6e]/50'}`}>
                                <span className="text-lg">{op.logo}</span>
                                <span>{op.name}</span>
                              </button>
                            ))}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? 'Numéro de téléphone mobile' : 'Phone number'}</label>
                            <input type="tel" value={momoPhone} onChange={(e) => setMomoPhone(e.target.value)} placeholder="+225 07 00 00 00" className="input-field text-sm" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 rounded-xl bg-[#0e9f6e]/10 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0e9f6e] mt-0.5 shrink-0" />
                <p className="text-xs text-[#64748b]">{t.checkout.directPaymentDesc}</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="card p-5 sticky top-20">
              <h2 className="font-display text-lg font-bold text-[#0f172a] mb-4">{t.cart.orderSummary}</h2>
              <div className="space-y-3 mb-4">
                {items.map((i) => (
                  <div key={i.productId} className="flex items-center gap-3">
                    <img src={i.product!.product_images?.[0]?.image_url || ''} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#0f172a] truncate">{i.product!.name}</p>
                      <p className="text-xs text-[#64748b]">{t.cart.qty}: {i.qty}</p>
                    </div>
                    <span className="text-sm font-bold text-[#0f172a]">{formatPrice(i.product!.price * i.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-3 border-t border-[#0e9f6e]/20">
                <div className="flex items-center justify-between text-sm"><span className="text-[#64748b]">{t.cart.subtotal}</span><span className="font-semibold text-[#0f172a]">{formatPrice(subtotal)}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-[#64748b]">{t.cart.delivery}</span><span className="font-semibold text-green-600 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> {t.cart.freeDelivery}</span></div>
                <div className="flex items-center justify-between pt-2 border-t border-[#0e9f6e]/20">
                  <span className="font-bold text-[#0f172a]">{t.cart.total}</span>
                  <span className="text-2xl font-bold text-[#0f172a]">{formatPrice(subtotal)}</span>
                </div>
              </div>
              <button onClick={placeOrder} disabled={!user || !selectedAddressId} className="w-full btn-gold py-3.5 rounded-xl font-semibold mt-5 disabled:opacity-50">
                {t.checkout.placeOrder}
              </button>
              {!user && <p className="text-xs text-red-500 text-center mt-2">{locale === 'fr' ? 'Veuillez vous connecter' : 'Please log in'}</p>}
              <button onClick={() => navigate('cart')} className="w-full mt-2 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">{t.common.back}</button>
            </div>
          </div>
        </div>
      </div>

      {/* USSD Prompt Modal Popup */}
      {ussdStep === 'pending' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="card p-6 max-w-md w-full text-center bg-white shadow-2xl animate-fade-up">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#0e9f6e]/15 flex items-center justify-center pulse-gold">
              <Smartphone className="w-6 h-6 text-[#0e9f6e]" />
            </div>
            <h3 className="font-display text-xl font-bold text-[#0f172a] mb-2">{locale === 'fr' ? 'Autorisation USSD Push' : 'USSD Push Authorization'}</h3>
            <p className="text-sm text-[#64748b] mb-4">
              {locale === 'fr'
                ? `Zando Côte d'Ivoire : Une demande de paiement de ${formatPrice(subtotal)} a été envoyée sur votre téléphone (${momoPhone}) via ${selectedOperator}.`
                : `Zando Africa: A payment request of ${formatPrice(subtotal)} was sent to your phone (${momoPhone}) via ${selectedOperator}.`}
            </p>
            <div className="p-3.5 rounded-xl bg-[#f7f8fa] border border-[#e2e8f0] mb-5 text-xs text-[#64748b] leading-relaxed text-left flex items-start gap-2">
              <Loader2 className="w-4 h-4 text-[#0e9f6e] animate-spin shrink-0 mt-0.5" />
              <span>
                {locale === 'fr'
                  ? "Veuillez déverrouiller votre téléphone et confirmer la transaction en entrant votre code PIN secret."
                  : "Please unlock your phone and confirm the transaction by entering your secret PIN."}
              </span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={executeOrderCreation} className="flex-1 btn-gold py-3 rounded-xl font-semibold text-sm">
                {locale === 'fr' ? 'Simuler la confirmation par PIN' : 'Simulate PIN confirmation'}
              </button>
              <button type="button" onClick={() => setUssdStep('idle')} className="px-4 py-3 rounded-xl border border-[#e2e8f0] text-sm text-gray-600">
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
