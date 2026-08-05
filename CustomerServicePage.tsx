import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { fetchOrderByTrackingId } from '@/lib/db';
import type { Order } from '@/lib/db';
import { Truck, Package, CheckCircle, Clock, MapPin, Camera, PenTool, XCircle } from 'lucide-react';

const STEP_ORDER = ['pending', 'confirmed', 'preparing', 'inTransit', 'delivered'] as const;

export function DeliveryPage() {
  const { t, params, locale } = useApp();
  const trackingId = params.id || '';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!trackingId) { setLoading(false); setNotFound(true); return; }
    (async () => {
      setLoading(true);
      setNotFound(false);
      const o = await fetchOrderByTrackingId(trackingId);
      if (o) setOrder(o); else setNotFound(true);
      setLoading(false);
    })();
  }, [trackingId]);

  if (loading) {
    return <div className="motif-bg min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-[#0e9f6e]/20 border-t-[#0e9f6e] animate-spin" /></div>;
  }

  if (notFound || !order) {
    return (
      <div className="motif-bg min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 text-center max-w-md">
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-[#0f172a] font-semibold mb-1">{locale === 'fr' ? 'Commande introuvable' : 'Order not found'}</p>
          <p className="text-sm text-[#64748b]">{locale === 'fr' ? "Vérifiez le numéro de suivi." : 'Check the tracking number.'}</p>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const currentIdx = STEP_ORDER.indexOf(order.status as typeof STEP_ORDER[number]);

  const steps = [
    { icon: Clock, label: t.delivery.pending, desc: locale === 'fr' ? 'Commande reçue' : 'Order received' },
    { icon: Package, label: t.delivery.preparing, desc: locale === 'fr' ? 'En préparation par le vendeur' : 'Being prepared by seller' },
    { icon: Truck, label: t.delivery.inTransit, desc: locale === 'fr' ? 'En route vers le client' : 'On the way to customer' },
    { icon: CheckCircle, label: t.delivery.delivered, desc: locale === 'fr' ? 'Livré au client' : 'Delivered to customer' },
  ].map((s, i) => {
    // Map the 4 display steps onto the 5 order statuses (pending+confirmed both count as step 0)
    const stepStatusIdx = i === 0 ? 1 : i + 1; // confirmed=1, preparing=2, inTransit=3, delivered=4
    return { ...s, done: !isCancelled && currentIdx >= stepStatusIdx, active: !isCancelled && currentIdx === stepStatusIdx };
  });

  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-3xl font-bold text-[#0f172a] mb-2">{t.delivery.title}</h1>
        <p className="text-sm text-[#64748b] mb-6">{t.delivery.sellerDelivers}</p>

        {/* Tracking header */}
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748b] uppercase">{t.delivery.trackingId}</span>
            <span className="font-mono font-bold text-[#0f172a]">{order.tracking_id}</span>
          </div>
          {order.delivery_address && (
            <div className="flex items-center gap-2 pt-2 border-t border-[#0e9f6e]/10">
              <MapPin className="w-4 h-4 text-[#0e9f6e]" />
              <span className="text-sm text-[#0f172a]">{order.delivery_address}</span>
            </div>
          )}
        </div>

        {isCancelled ? (
          <div className="card p-6 mb-6 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-500" />
            <p className="text-sm font-semibold text-[#0f172a]">{locale === 'fr' ? 'Cette commande a été annulée.' : 'This order was cancelled.'}</p>
          </div>
        ) : (
          <div className="card p-6 mb-6">
            <div className="space-y-0">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${s.done ? 'bg-[#0e9f6e] text-[#0f172a]' : 'bg-[#0f172a]/5 text-[#64748b]/40'} ${s.active ? 'pulse-gold' : ''}`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    {i < steps.length - 1 && <div className={`w-0.5 h-12 ${s.done ? 'bg-[#0e9f6e]' : 'bg-[#0f172a]/10'}`} />}
                  </div>
                  <div className="pt-2 pb-8">
                    <p className={`font-semibold ${s.done ? 'text-[#0f172a]' : 'text-[#64748b]/50'}`}>{s.label}</p>
                    <p className="text-xs text-[#64748b] mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.status === 'delivered' && (
          <div className="card p-6">
            <h3 className="font-display text-lg font-bold text-[#0f172a] mb-4">{t.delivery.proofOfDelivery}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square rounded-xl bg-[#0f172a]/5 border-2 border-dashed border-[#0f172a]/10 flex flex-col items-center justify-center">
                <Camera className="w-8 h-8 text-[#64748b]/30 mb-2" />
                <p className="text-xs text-[#64748b]/60">{locale === 'fr' ? 'Photo de livraison' : 'Delivery photo'}</p>
              </div>
              <div className="aspect-square rounded-xl bg-[#0f172a]/5 border-2 border-dashed border-[#0f172a]/10 flex flex-col items-center justify-center">
                <PenTool className="w-8 h-8 text-[#64748b]/30 mb-2" />
                <p className="text-xs text-[#64748b]/60">{locale === 'fr' ? 'Signature client' : 'Customer signature'}</p>
              </div>
            </div>
          </div>
        )}

        {order.order_items && order.order_items.length > 0 && (
          <div className="card p-6 mt-6">
            <h3 className="font-display text-lg font-bold text-[#0f172a] mb-4">{locale === 'fr' ? 'Articles' : 'Items'}</h3>
            <div className="space-y-3">
              {order.order_items.map((it) => (
                <div key={it.id} className="flex items-center justify-between text-sm">
                  <span className="text-[#0f172a]">{it.product_name} × {it.qty}</span>
                  <span className="font-semibold text-[#0f172a]">${(it.price * it.qty).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
