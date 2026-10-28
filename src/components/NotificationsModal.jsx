import React from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCheck,
  FileText,
  Film,
  Radio,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { Dialog, EmptyState } from "./ui";
const icons = {
  live: Radio,
  content: BookOpen,
  resource: FileText,
  replay: Film,
  event: CalendarDays,
};
export function NotificationsModal({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllAsRead,
  onNotificationClick,
  error,
  onRetry,
}) {
  const unread = notifications.filter((item) => !item.read).length;
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title="Tu comunidad, al día"
      className="max-w-xl"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-xs text-subtle">
          {unread
            ? unread + " notificaciones sin leer"
            : "Estás al día con tu comunidad."}
        </p>
        <button
          disabled={!unread}
          className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold text-brand disabled:text-subtle"
          onClick={onMarkAllAsRead}
        >
          <CheckCheck size={14} />
          Marcar todas como leídas
        </button>
      </div>
      {error && (
        <div role="alert" className="mb-4">
          <p>{error}</p>
          <button
            className="mt-2 flex items-center gap-2 text-xs font-bold"
            onClick={onRetry}
          >
            <RefreshCw size={12} />
            Reintentar
          </button>
        </div>
      )}
      {!notifications.length && !error ? (
        <EmptyState
          icon={Bell}
          title="No tienes notificaciones disponibles"
          description="Las nuevas clases, contenidos y eventos de tus programas aparecerán aquí."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => {
            const Icon = icons[item.type] || Bell;
            return (
              <button
                key={item.id}
                className={
                  "group flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition " +
                  (item.read
                    ? "border-transparent bg-surface hover:bg-elevated"
                    : "border-brand-line/50 bg-brand-soft/70 hover:bg-brand-soft")
                }
                onClick={() => onNotificationClick(item)}
              >
                <span
                  className={
                    "flex size-9 shrink-0 items-center justify-center rounded-xl " +
                    (item.read
                      ? "bg-elevated text-subtle"
                      : "bg-surface text-brand")
                  }
                >
                  <Icon size={16} strokeWidth={1.7} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs leading-5 font-bold">{item.title}</p>
                    {!item.read && (
                      <span
                        aria-label="Sin leer"
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand"
                      />
                    )}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-[11px] leading-5 text-subtle">
                    {item.description}
                  </p>
                  <p className="mt-2 text-[9px] text-subtle/75">
                    {new Date(item.createdAt).toLocaleString("es-EC", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <ArrowUpRight
                  size={13}
                  className="mt-1 shrink-0 text-subtle/50 group-hover:text-brand"
                />
              </button>
            );
          })}
        </div>
      )}
    </Dialog>
  );
}
export default NotificationsModal;
