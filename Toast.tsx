import { useApp } from '@/lib/store';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 safe-bottom">
      {toasts.map((toast) => {
        const Icon = toast.type === 'success' ? CheckCircle : toast.type === 'error' ? XCircle : Info;
        const color = toast.type === 'success' ? '#0e9f6e' : toast.type === 'error' ? '#ef4444' : '#0e9f6e';
        return (
          <div key={toast.id} className="bg-white border border-[#e2e8f0] rounded-xl p-3.5 flex items-center gap-3 shadow-xl animate-fade-up min-w-[280px] max-w-sm">
            <Icon className="w-5 h-5 shrink-0" style={{ color }} />
            <p className="text-sm text-[#0f172a] flex-1">{toast.message}</p>
            <button onClick={() => dismissToast(toast.id)} className="p-1 rounded hover:bg-[#f7f8fa]">
              <X className="w-4 h-4 text-[#64748b]" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
