import React from "react";
import { X, Calendar } from "lucide-react";

export function LiveSessionModal({ isOpen, onClose, liveClass }) {
  if (!isOpen || !liveClass) return null;
  return <div className="modal-backdrop" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-labelledby="session-title" className="modal-dialog" onClick={event => event.stopPropagation()} style={{ maxWidth: 560, width: "90vw", padding: 24 }}>
      <button className="btn btn-secondary" aria-label="Cerrar" onClick={onClose} style={{ float: "right" }}><X size={18} /></button>
      <Calendar size={24} /><h2 id="session-title">{liveClass.title}</h2>
      <p>{liveClass.mentorName}</p>
      <p>{liveClass.scheduledAt ? new Date(liveClass.scheduledAt).toLocaleString("es-EC") : "Fecha por confirmar"} · {liveClass.duration}</p>
      <p>La información de acceso a esta clase se compartirá cuando esté disponible.</p>
    </section>
  </div>;
}
