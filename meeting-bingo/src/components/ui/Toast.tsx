import { useEffect, useState } from 'react';
import type { Toast as ToastType } from '../../types';

interface Props {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

const typeClasses = {
  success: 'bg-green-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
};

function ToastItem({ toast, onDismiss }: { toast: ToastType; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => setVisible(false), (toast.duration ?? 2500) - 300);
    const remove = setTimeout(() => onDismiss(toast.id), toast.duration ?? 2500);
    return () => { cancelAnimationFrame(show); clearTimeout(hide); clearTimeout(remove); };
  }, [toast, onDismiss]);

  return (
    <div
      className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow-lg transition-all duration-300 ${typeClasses[toast.type]} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      {toast.message}
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  );
}
