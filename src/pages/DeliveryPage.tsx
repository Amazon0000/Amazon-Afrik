import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { fetchOrderByTracking } from '@/lib/db';
import type { Order, OrderItem } from '@/lib/db';
import { Truck, Package, CheckCircle, Clock, MapPin, Search, Loader2, AlertTriangle, XCircle } from 'lucide-react';

// Real order status -> timeline step index. Matches the actual enum used
// across the app (orders.status), not a fake always-in-transit display.
const STATUS_STEP: Record<string, number> = {
  pending: 0, confirmed: 1, preparing: 2, inTransit: 3, delivered: 4, cancelled: -1,
};

export function DeliveryPage() {
  const { t, params, locale, user } = useApp();
  const [trackingId, setTrackingId] = useState(params.id || '');
  const [guestEmail, setGuestEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const runSearch = async (id: string, email?: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setNotFound(false);
    setSearched(true);
    const result = await fetchOrderByTracking(id.trim(), email?.trim() || undefined);
    setLoading(false);
    if (result) {
      setOrder(result.order);
      setItems(result.items);
    } else {
      setOrder(null);
      setItems([]);
      setNotFound(true);
    }
  };

  // Deep link from an order confirmation / account page — auto-search
  // immediately if we already have a tracking id (works right away for
  // logged-in users; guests need to also enter their email below).
  useEffect(() => {
    if (params.id) runSearch(params.id, undefined);
  }, [params.id]);

  const steps = [
    { key: 'pending', icon: Clock, label: t.delivery.pending, desc: locale === 'fr' ? 'Commande reçue' : 'Order received' },
    { key: 'confirmed', icon: CheckCircle, label: t.delivery.confirmed, desc: locale === 'fr' ? 'Commande confirmée par le vendeur' : 'Order confirmed by seller' },
    { key: 'preparing', icon: Package, label: t.delivery.preparing, desc: locale === 'fr' ? 'En préparation par le vendeur' : 'Being prepared by seller' },
    { key: 'inTransit', icon: Truck, label: t.delivery.inTransit, desc: locale === 'fr' ? 'En route vers vous' : 'On the way to you' },
    { key: 'delivered', icon: CheckCircle, label: t.delivery.delivered, desc: locale === 'fr' ? 'Livré' : 'Delivered' },
  ];
  const currentStep = order ? STATUS_STEP[order.status] ?? 0 : 0;
  const isCancelled = order?.status === 'cancelled';

  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-3xl font-bold text-[#0f172a] mb-2">{t.delivery.title}</h1>
        <p className="text-sm text-[#64748b] mb-6">{t.delivery.sellerDelivers}</p>

        {/* Search form — always available so this page never needs a fake
            placeholder order when no id was passed. */}
        <div className="card p-5 mb-6 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{t.delivery.trackingId}</label>
            <input value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="ORD-123456-abcd" className="input-field" />
          </div>
          {!user && (
            <div>
              <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-1.5">{locale === 'fr' ? "Email utilisé lors de l'achat" : 'Email used at checkout'}</label>
              <input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="you@email.com" className="input-field" />
            </div>
          )}
          <button onClick={() => runSearch(trackingId, guestEmail)} disabled={loading || !trackingId.trim()} className="btn-gold w-full py-3 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {locale === 'fr' ? 'Suivre ma commande' : 'Track my order'}
          </button>
        </div>

        {searched && notFound && !loading && (
          <div className="card p-6 flex items-center gap-3 bg-red-50 border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">
              {locale === 'fr'
                ? "Commande introuvable. Vérifiez le numéro de suivi" + (!user ? ' et l\u2019email utilisé lors de l\u2019achat.' : '.')
                : "Order not found. Check the tracking number" + (!user ? ' and the email used at checkout.' : '.')}
            </p>
          </div>
        )}

        {order && (
          <>
            <div className="card p-5 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748b] uppercase">{t.delivery.trackingId}</span>
                <span className="font-mono font-bold text-[#0f172a]">{order.tracking_id}</span>
              </div>
              {order.delivery_address && (
                <div className="flex items-center gap-2 pt-2 border-t border-[#ff7a00]/10">
                  <MapPin className="w-4 h-4 text-[#ff7a00] shrink-0" />
                  <span className="text-sm text-[#0f172a]">{order.delivery_address}</span>
                </div>
              )}
            </div>

            {isCancelled ? (
              <div className="card p-6 mb-6 flex items-center gap-3 bg-red-50 border border-red-200">
                <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                <div>
                  <p className="font-semibold text-red-700">{t.delivery.cancelled}</p>
                  <p className="text-xs text-red-600 mt-0.5">{locale === 'fr' ? 'Cette commande a été annulée.' : 'This order was cancelled.'}</p>
                </div>
              </div>
            ) : (
              <div className="card p-6 mb-6">
                <div className="space-y-0">
                  {steps.map((s, i) => {
                    const done = i <= currentStep;
                    const active = i === currentStep;
                    return (
                      <div key={s.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${done ? 'bg-[#ff7a00] text-[#0f172a]' : 'bg-[#0f172a]/5 text-[#64748b]/40'} ${active ? 'pulse-gold' : ''}`}>
                            <s.icon className="w-5 h-5" />
                          </div>
                          {i < steps.length - 1 && <div className={`w-0.5 h-12 ${i < currentStep ? 'bg-[#ff7a00]' : 'bg-[#0f172a]/10'}`} />}
                        </div>
                        <div className="pt-2 pb-8">
                          <p className={`font-semibold ${done ? 'text-[#0f172a]' : 'text-[#64748b]/50'}`}>{s.label}</p>
                          <p className="text-xs text-[#64748b] mt-0.5">{s.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {order.shipping_min_days != null && !isCancelled && (
              <div className="card p-4 flex items-center gap-2 bg-[#ff7a00]/10 mb-6">
                <Clock className="w-4 h-4 text-[#ff7a00] shrink-0" />
                <span className="text-sm text-[#64748b]">
                  {t.delivery.estimatedArrival}: {order.shipping_min_days}-{order.shipping_max_days} {locale === 'fr' ? 'jours' : 'days'}
                </span>
              </div>
            )}

            {items.length > 0 && (
              <div className="card p-5">
                <h3 className="font-display text-lg font-bold text-[#0f172a] mb-3">{locale === 'fr' ? 'Articles' : 'Items'}</h3>
                <div className="space-y-2">
                  {items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between text-sm">
                      <span className="text-[#0f172a]">{it.product_name} x{it.qty}</span>
                      <span className="font-semibold text-[#0f172a]">${(it.price * it.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
