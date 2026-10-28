import React from "react";
import { ArrowUpRight, CalendarDays, Clock3, Video } from "lucide-react";
import { zoomLink } from "../services/studentContent";
import { Avatar, Dialog } from "./ui";
export function LiveSessionModal({ isOpen, onClose, liveClass }) {
  if (!liveClass) return null;
  const joinUrl = zoomLink(liveClass.joinUrl);
  const ended = liveClass.effectiveStatus === "ended";
  const parsed = new Date(liveClass.scheduledAt);
  const valid = !Number.isNaN(parsed.getTime());
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title="Detalles de la clase"
      className="max-w-lg"
    >
      <span className="badge badge-emerald mb-4">
        {liveClass.badge || (ended ? "Finalizada" : "Clase programada")}
      </span>
      <h2 className="text-[23px] leading-8 font-extrabold tracking-tight">
        {liveClass.title}
      </h2>
      {liveClass.subtitle && (
        <p className="mt-2 text-xs leading-6 text-subtle">
          {liveClass.subtitle}
        </p>
      )}
      <div className="mt-5 flex items-center gap-3">
        <Avatar
          name={liveClass.mentorName}
          src={liveClass.mentorAvatar}
          className="size-9"
        />
        <div>
          <p className="text-[9px] font-semibold text-subtle">TU MENTOR</p>
          <p className="mt-0.5 text-xs font-bold">{liveClass.mentorName}</p>
        </div>
      </div>
      <div className="my-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-elevated/60 p-4">
          <CalendarDays size={17} className="mb-3 text-brand" />
          <p className="text-xs font-bold">
            {valid
              ? parsed.toLocaleDateString("es-EC", {
                  day: "numeric",
                  month: "long",
                })
              : "Fecha por confirmar"}
          </p>
          <p className="mt-1 text-[10px] text-subtle">
            {valid
              ? parsed.toLocaleTimeString("es-EC", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-elevated/60 p-4">
          <Clock3 size={17} className="mb-3 text-brand" />
          <p className="text-xs font-bold">{liveClass.duration}</p>
          <p className="mt-1 text-[10px] text-subtle">Duración de la clase</p>
        </div>
      </div>
      {joinUrl && !ended ? (
        <>
          <a
            className="btn btn-primary !min-h-12 w-full"
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Video size={16} />
            Ingresar a Zoom
            <ArrowUpRight size={15} />
          </a>
          <p className="mt-3 text-center text-[10px] text-subtle">
            La reunión se abrirá en una nueva pestaña.
          </p>
        </>
      ) : (
        <div className="rounded-xl border border-line bg-elevated p-4 text-xs leading-6 text-subtle">
          {ended
            ? "Esta clase ha finalizado. Consulta la videoteca para encontrar las grabaciones publicadas."
            : "El profesor todavía no ha publicado el enlace de Zoom. Vuelve a revisar antes de la clase."}
        </div>
      )}
    </Dialog>
  );
}
