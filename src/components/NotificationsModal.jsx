import React, { useState } from "react";
import { Bell, BookOpen, CalendarDays, CheckCheck, FileText, Film, Radio, RefreshCw, ArrowUpRight, MessageSquare } from "lucide-react";
import { Dialog, EmptyState } from "./ui";
const types = {
  question: { label: "Pregunta de lección", Icon: MessageSquare, color: "bg-brand-soft text-brand" },
  answer: { label: "Respuesta del mentor", Icon: MessageSquare, color: "bg-brand-soft text-brand" },
  support: { label: "Soporte", Icon: MessageSquare, color: "bg-brand-soft text-brand" },
  forum: { label: "Comunidad", Icon: MessageSquare, color: "bg-brand-soft text-brand" },
  chat: { label: "Mensaje", Icon: MessageSquare, color: "bg-brand-soft text-brand" },
  live: { label: "Clase en vivo", Icon: Radio, color: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" },
  content: { label: "Lección", Icon: BookOpen, color: "bg-brand-soft text-brand" },
  resource: { label: "Material", Icon: FileText, color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  replay: { label: "Grabación", Icon: Film, color: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" },
  event: { label: "Evento", Icon: CalendarDays, color: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" },
};
const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil", year: "numeric", month: "2-digit", day: "2-digit" });
function dayGroup(value, today, yesterday) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Anteriores";
  const key = dayFormat.format(date);
  return key === today ? "Hoy" : key === yesterday ? "Ayer" : "Anteriores";
}
export function NotificationsModal({ isOpen, onClose, notifications = [], onMarkAllAsRead, onNotificationClick, error, onRetry }) {
  const [filter, setFilter] = useState("all");
  const unread = notifications.filter(item => !item.read).length;
  const visible = notifications.filter(item => filter === "all" || !item.read).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const today = dayFormat.format(new Date());
  const yesterday = dayFormat.format(new Date(Date.now() - 86400000));
  const groups = ["Hoy", "Ayer", "Anteriores"].map(label => ({ label, items: visible.filter(item => dayGroup(item.createdAt, today, yesterday) === label) })).filter(group => group.items.length);
  return <Dialog open={isOpen} onClose={onClose} title={<span className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl border border-brand-line/60 bg-brand-soft text-brand"><Bell size={18} strokeWidth={1.8} /></span><span className="text-base font-bold tracking-tight">Notificaciones</span>{unread > 0 && <span className="rounded-md bg-brand px-2 py-0.5 text-[10px] font-bold text-white">{unread}</span>}</span>} className="!max-w-lg !overflow-hidden !rounded-2xl [&>div:first-child]:!bg-elevated/30 [&>div:first-child]:!px-4 [&>div:first-child]:!py-3 [&>div:last-child]:!p-0">
    <div className="border-b border-line px-4 pb-3 pt-3"><p className="mb-3 text-[11px] text-subtle">Las novedades de tus clases y tu comunidad.</p><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-1 rounded-lg bg-elevated p-0.5">{[["all", "Todas", notifications.length], ["unread", "Sin leer", unread]].map(([value, label, count]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={"inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition focus-visible:outline-2 focus-visible:outline-brand " + (filter === value ? "bg-surface text-brand shadow-sm" : "text-subtle hover:text-ink")}>{label}<span className="text-[9px] opacity-70">{count}</span></button>)}</div><button type="button" disabled={!unread} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[10px] font-semibold text-brand transition hover:bg-brand-soft disabled:text-subtle disabled:opacity-50" onClick={onMarkAllAsRead}><CheckCheck size={15} strokeWidth={1.8} aria-hidden="true" />Marcar todas como leídas</button></div></div>
    {error && <div role="alert" className="m-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"><p>{error}</p><button type="button" className="mt-2 inline-flex items-center gap-2 text-xs font-semibold" onClick={onRetry}><RefreshCw size={12} />Reintentar</button></div>}
    <div className="max-h-[55dvh] overflow-y-auto overscroll-contain bg-elevated/20 pb-3" aria-label="Lista de notificaciones">
      {!visible.length && !error ? <div className="px-5 py-8"><EmptyState icon={Bell} title={filter === "unread" ? "Estás al día" : "No tienes notificaciones disponibles"} description={filter === "unread" ? "Ya revisaste todas tus notificaciones." : "Las novedades de tu comunidad aparecerán aquí."} /></div> : groups.map(group => <section key={group.label} aria-label={group.label}>
        <h3 className="sticky top-0 z-10 flex items-center gap-2 bg-surface/95 px-4 py-2.5 !text-[9px] font-bold uppercase tracking-[0.12em] text-subtle backdrop-blur-sm">{group.label}<span className="font-medium tracking-normal text-subtle/60">{group.items.length}</span></h3>
        <div className="space-y-2 px-3">{group.items.map(item => {
          const meta = types[item.type] || { label: "Novedad", Icon: Bell, color: "bg-brand-soft text-brand" };
          const Icon = meta.Icon;
          const date = new Date(item.createdAt);
          const dateText = Number.isNaN(date.getTime()) ? "" : date.toLocaleString("es-EC", { timeZone: "America/Guayaquil", ...(group.label === "Anteriores" ? { day: "numeric", month: "short" } : {}), hour: "2-digit", minute: "2-digit" });
          const starting = item.id?.startsWith("live-reminder:") && item.id.endsWith(":live");
          return <button key={item.id} type="button" onClick={() => onNotificationClick(item)} className={"group flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-brand " + (!item.read ? "border-brand-line/60 bg-surface hover:border-brand-line hover:shadow-sm" : "border-line/60 bg-surface/60 hover:bg-surface")}>
            <span className={"mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-current/10 " + (item.read ? "bg-elevated text-subtle" : starting ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300" : meta.color)}><Icon size={18} strokeWidth={1.8} aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span className="mb-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1"><span className={"text-[9px] font-semibold " + (starting ? "text-red-600 dark:text-red-400" : "text-subtle")}>{starting ? "Tu clase comienza ahora" : item.id?.startsWith("live-reminder:") ? "Recordatorio de clase" : meta.label}</span><time dateTime={item.createdAt} className="text-[9px] text-subtle/80">{dateText}</time></span><span className={"block break-words text-[11px] leading-5 text-ink " + (item.read ? "font-medium" : "font-bold")}>{item.title}</span><span className="mt-0.5 block line-clamp-2 whitespace-pre-wrap break-words text-[10px] leading-4 text-subtle">{item.description}</span></span>
            <span className="flex shrink-0 flex-col items-center gap-2 pt-1">{!item.read && <span aria-label="Sin leer" className="size-1.5 rounded-full bg-brand" />}<ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" className="text-subtle/60 transition group-hover:translate-x-0.5 group-hover:text-brand" /></span>
          </button>;
        })}</div>
      </section>)}
    </div>
    <div className="flex items-center justify-between gap-3 border-t border-line bg-surface px-4 py-2 text-[9px] text-subtle"><span>{unread ? `${unread} ${unread === 1 ? "notificación pendiente" : "notificaciones pendientes"}` : "Todas tus notificaciones están leídas"}</span><span className="text-brand">Tu comunidad, al día</span></div>
  </Dialog>;
}
export default NotificationsModal;
