import React from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { AuditNotification } from '../types/audit';

interface NotificationToastProps {
  notifications: AuditNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => {
        const getBg = () => {
          switch (n.type) {
            case 'success':
              return 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100';
            case 'danger':
              return 'bg-rose-950/90 border-rose-500/50 text-rose-100';
            case 'warning':
              return 'bg-amber-950/90 border-amber-500/50 text-amber-100';
            case 'info':
            default:
              return 'bg-blue-950/90 border-blue-500/50 text-blue-100';
          }
        };

        const getIcon = () => {
          switch (n.type) {
            case 'success':
              return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
            case 'danger':
              return <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
            case 'warning':
              return <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />;
            case 'info':
            default:
              return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
          }
        };

        return (
          <div
            key={n.id}
            className={`pointer-events-auto border rounded-xl p-3 shadow-xl backdrop-blur-md flex items-start justify-between gap-3 text-xs transition-all animate-in fade-in slide-in-from-bottom-2 ${getBg()}`}
          >
            <div className="flex items-start gap-2.5">
              {getIcon()}
              <div>
                <strong className="font-bold block leading-tight">{n.title}</strong>
                <p className="opacity-90 mt-0.5 leading-snug">{n.message}</p>
                <span className="text-[10px] opacity-60 font-mono mt-1 block">
                  {n.timestamp}
                </span>
              </div>
            </div>
            <button
              onClick={() => onDismiss(n.id)}
              className="opacity-70 hover:opacity-100 transition p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
