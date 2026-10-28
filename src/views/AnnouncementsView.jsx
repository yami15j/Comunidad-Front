import React, { useState } from "react";
import { api } from "../services/api";
export function AnnouncementsView({ role, courses, onPublished }) {
  const [courseId, setCourseId] = useState("");
  const [kind, setKind] = useState("announcement");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await api.notifications.publish({
        courseId: courseId || undefined,
        kind,
        title: title.trim(),
        body: body.trim(),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      setMessage(
        "Publicado. El aviso ya aparece en las notificaciones de sus destinatarios.",
      );
      setTitle("");
      setBody("");
      await onPublished?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card academic-workspace">
      <h1>Avisos y eventos</h1>
      <p>
        Las nuevas clases, lecciones, materiales y grabaciones generan
        notificaciones dentro de la plataforma. Aqui puedes publicar novedades
        adicionales.
      </p>
      <form onSubmit={submit} className="grid [gap:14px] mt-5">
        <label>
          Destinatarios
          <select
            disabled={busy}
            required={role !== "admin"}
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">
              {role === "admin"
                ? "Toda la comunidad academica"
                : "Selecciona uno de tus cursos"}
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipo
          <select
            disabled={busy}
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="announcement">Novedad</option>
            <option value="event">Evento</option>
          </select>
        </label>
        <label>
          Titulo
          <input
            required
            minLength={3}
            maxLength={160}
            disabled={busy}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Mensaje
          <textarea
            required
            minLength={3}
            maxLength={2000}
            disabled={busy}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Incluye fecha, hora y detalles si se trata de un evento."
          />
        </label>
        <label>
          Vencimiento (opcional, hora local)
          <input
            type="datetime-local"
            disabled={busy}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </label>
        <button
          className="btn btn-primary"
          disabled={busy || (role === "mentor" && !courses.length)}
        >
          {busy ? "Publicando..." : "Publicar aviso"}
        </button>
        <p role="status">{message}</p>
      </form>
      {role === "mentor" && (
        <p>
          Publicas directamente para tus cursos, sin aprobacion administrativa.
        </p>
      )}
    </section>
  );
}
