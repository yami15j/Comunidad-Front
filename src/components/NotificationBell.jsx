import React, { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";

export function NotificationBell({ userId, notifications = [], unreadCount = 0, onOpen }) {
  const seen = useRef({ userId: null, ids: new Set() });
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    if (seen.current.userId !== userId) seen.current = { userId, ids: new Set() };
    const fresh = notifications.find(item => !item.read && !seen.current.ids.has(item.id));
    notifications.forEach(item => seen.current.ids.add(item.id));
    if (fresh) setNotice({ ...fresh, userId });
  }, [notifications, userId]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(timer);
  }, [notice]);
  const open = () => { setNotice(null); onOpen(); };
  const visible = notice?.userId === userId && notifications.some(item => item.id === notice.id && !item.read);
  return <div className="relative shrink-0">
    <button className="icon-button relative" onClick={open} aria-label={"Notificaciones" + (unreadCount ? ", " + unreadCount + " sin leer" : "")}>
      <Bell size={19} strokeWidth={1.7} />
      {unreadCount > 0 && <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full border-2 border-surface bg-brand px-0.5 text-[8px] leading-3 font-bold text-on-brand">{unreadCount > 9 ? "9+" : unreadCount}</span>}
    </button>
    {visible && <div role="status" aria-live="polite" className="absolute right-[-48px] top-full z-50 mt-2 w-56 max-w-[85vw] rounded-xl border border-brand-line bg-surface p-3 shadow-floating sm:right-0">
      <span aria-hidden="true" className="absolute -top-1.5 right-16 size-3 rotate-45 border-t border-l border-brand-line bg-surface sm:right-3" />
      <div className="relative flex items-start gap-2">
        <button onClick={open} className="min-w-0 flex-1 text-left"><span className="text-[9px] font-bold uppercase tracking-wider text-brand">Nueva notificación</span><p className="mt-0.5 text-[11px] font-semibold leading-4 text-ink">{notice.title}</p><span className="mt-1 block text-[10px] text-subtle">Pulsa para ver tus avisos</span></button>
        <button aria-label="Cerrar aviso de notificación" onClick={() => setNotice(null)} className="rounded-md p-1 text-subtle hover:bg-elevated"><X size={14} /></button>
      </div>
    </div>}
  </div>;
}
