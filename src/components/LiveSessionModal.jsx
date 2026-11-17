import React from "react";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, Video } from "lucide-react";
import { zoomLink } from "../services/studentContent";
import { Avatar, Dialog } from "./ui";

export function LiveSessionModal({ isOpen, onClose, liveClass, fullPage = false }) {
  if (!liveClass || !isOpen) return null;
  const joinUrl = zoomLink(liveClass.joinUrl);
  const ended = liveClass.effectiveStatus === "ended";
  const parsed = new Date(liveClass.scheduledAt);
  const valid = !Number.isNaN(parsed.getTime());
  const Container = fullPage ? "section" : Dialog;
  return (
    <Container {...(fullPage ? { "aria-label": "Detalles de la clase", className: "mx-auto w-full min-w-0 max-w-6xl pb-6" } : { open: isOpen, onClose, title: "Detalles de la clase", className: "max-w-lg" })}>
      {fullPage && <button type="button" onClick={onClose} className="mb-5 inline-flex items-center gap-2 rounded-lg py-2 text-xs font-semibold text-muted transition hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"><ArrowLeft size={15} />Volver</button>}
      <div className={fullPage ? "grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]" : "space-y-4"}>
        <section className={fullPage ? "min-w-0 overflow-hidden rounded-xl border border-line bg-surface" : "min-w-0"}>
          <div className={fullPage ? "border-b border-line bg-linear-to-br from-brand-soft/50 to-surface p-5 sm:p-6" : ""}>
            <div className="mb-3 flex flex-wrap items-center gap-3"><span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand">Detalles de la clase</span><span className="rounded-md border border-brand-line bg-surface px-2 py-1 text-[9px] font-semibold text-brand">{liveClass.badge || (ended ? "Finalizada" : "Clase programada")}</span></div>
            <h2 className="break-words text-2xl font-bold leading-8 tracking-tight text-ink">{liveClass.title}</h2>
            {liveClass.subtitle && <p className="mt-2 text-xs leading-5 text-subtle">{liveClass.subtitle}</p>}
          </div>
          <div className={fullPage ? "p-5 sm:p-6" : "mt-4"}>
            <div className="grid grid-cols-2 gap-3 border-b border-line pb-4">
              <div className="flex items-start gap-2.5"><CalendarDays size={17} className="mt-0.5 shrink-0 text-brand" /><div><p className="text-[9px] text-subtle">Fecha y hora</p><p className="mt-1 text-xs font-semibold text-ink">{valid ? parsed.toLocaleDateString("es-EC", { timeZone: "America/Guayaquil", day: "numeric", month: "long" }) : "Fecha por confirmar"}</p><p className="mt-1 text-[10px] text-subtle">{valid ? parsed.toLocaleTimeString("es-EC", { timeZone: "America/Guayaquil", hour: "2-digit", minute: "2-digit" }) : ""}</p></div></div>
              <div className="flex items-start gap-2.5 border-l border-line pl-4"><Clock3 size={17} className="mt-0.5 shrink-0 text-brand" /><div><p className="text-[9px] text-subtle">Duración de la clase</p><p className="mt-1 text-xs font-semibold text-ink">{liveClass.duration}</p></div></div>
            </div>
            <div className="mt-4 flex items-center gap-3"><Avatar name={liveClass.mentorName} src={liveClass.mentorAvatar} className="size-9 shrink-0" /><div className="min-w-0"><p className="text-[9px] text-subtle">Tu mentor</p><p className="mt-0.5 break-words text-xs font-semibold text-ink">{liveClass.mentorName}</p></div></div>
          </div>
        </section>
        <section aria-label="Acceso a Zoom" className="min-w-0 rounded-xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand"><Video size={17} /></span><div><h3 className="text-sm font-bold text-ink">Acceso a la sesión</h3><p className="mt-0.5 text-[10px] text-subtle">Participa desde Zoom</p></div></div>
          {joinUrl && !ended ? <><a href={joinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">Ingresar a Zoom<ArrowUpRight size={14} /></a><p className="mt-2 text-center text-[9px] text-subtle">Se abrirá en una nueva pestaña.</p></> : <p className="rounded-lg bg-elevated px-3 py-3 text-xs leading-5 text-subtle">{ended ? "Esta clase ha finalizado. Consulta la videoteca para encontrar las grabaciones publicadas." : "El profesor todavía no ha publicado el enlace de Zoom. Vuelve a revisar antes de la clase."}</p>}
          {!ended && (liveClass.meetingId || liveClass.meetingPasscode) && <div className="mt-5 border-t border-line pt-4"><h3 className="text-xs font-semibold text-ink">Ingreso manual a Zoom</h3><p className="mt-1 text-[10px] leading-5 text-subtle">También puedes usar estos datos en Zoom.</p><dl className="mt-2 divide-y divide-line/60">{liveClass.meetingId && <div className="flex flex-wrap items-center justify-between gap-2 py-2.5"><dt className="text-[10px] text-subtle">ID de reunión</dt><dd className="select-text break-all font-mono text-xs font-semibold text-ink">{liveClass.meetingId}</dd></div>}{liveClass.meetingPasscode && <div className="flex flex-wrap items-center justify-between gap-2 py-2.5"><dt className="text-[10px] text-subtle">Código de acceso</dt><dd className="select-text break-all font-mono text-xs font-semibold text-ink">{liveClass.meetingPasscode}</dd></div>}</dl></div>}
        </section>
      </div>
    </Container>
  );
}
