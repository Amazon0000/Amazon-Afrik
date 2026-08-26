import { useApp } from '@/lib/store';
import { Truck, Package, CheckCircle, Clock, MapPin, Camera, PenTool } from 'lucide-react';

export function DeliveryPage() {
  const { t, params, locale } = useApp();
  const trackingId = params.id || 'TRK-100';

  const steps = [
    { icon: Clock, label: t.delivery.pending, desc: locale === 'fr' ? 'Commande reçue' : 'Order received', done: true },
    { icon: Package, label: t.delivery.preparing, desc: locale === 'fr' ? 'En préparation par le vendeur' : 'Being prepared by seller', done: true },
    { icon: Truck, label: t.delivery.inTransit, desc: locale === 'fr' ? 'En route vers le client' : 'On the way to customer', done: true, active: true },
    { icon: CheckCircle, label: t.delivery.delivered, desc: locale === 'fr' ? 'Livré au client' : 'Delivered to customer', done: false },
  ];

  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-3xl font-bold text-[#0f172a] mb-2">{t.delivery.title}</h1>
        <p className="text-sm text-[#64748b] mb-6">{t.delivery.sellerDelivers}</p>

        {/* Tracking header */}
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748b] uppercase">{t.delivery.trackingId}</span>
            <span className="font-mono font-bold text-[#0f172a]">{trackingId}</span>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-[#ff7a00]/10">
            <MapPin className="w-4 h-4 text-[#ff7a00]" />
            <span className="text-sm text-[#0f172a]">Abidjan, Cocody, Riviera</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="card p-6 mb-6">
          <div className="space-y-0">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${s.done ? 'bg-[#ff7a00] text-[#0f172a]' : 'bg-[#0f172a]/5 text-[#64748b]/40'} ${s.active ? 'pulse-gold' : ''}`}
                  >
                    <s.icon className="w-5 h-5" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-0.5 h-12 ${s.done ? 'bg-[#ff7a00]' : 'bg-[#0f172a]/10'}`} />
                  )}
                </div>
                <div className="pt-2 pb-8">
                  <p className={`font-semibold ${s.done ? 'text-[#0f172a]' : 'text-[#64748b]/50'}`}>{s.label}</p>
                  <p className="text-xs text-[#64748b] mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Proof of delivery */}
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
          <div className="mt-4 p-3 rounded-lg bg-[#ff7a00]/10 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#ff7a00]" />
            <span className="text-sm text-[#64748b]">{t.delivery.estimatedArrival}: 2h30</span>
          </div>
        </div>
      </div>
    </div>
  );
}
