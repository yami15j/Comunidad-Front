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
    <section className="card academic-workspace !space-y-4 !rounded-2xl !p-4 sm:!p-6 [&_label]:!gap-1.5 [&_label]:!text-[11px] [&_input]:!rounded-xl [&_input]:!px-3 [&_input]:!py-2.5 [&_input]:!text-xs [&_select]:!rounded-xl [&_select]:!px-3 [&_select]:!py-2.5 [&_select]:!text-xs [&_textarea]:!rounded-xl [&_textarea]:!p-3 [&_textarea]:!text-xs">
      <header className="border-l-[3px] border-brand py-1 pl-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Conecta con tus estudiantes</p>
        <h1 className="mt-2 !text-2xl font-extrabold tracking-tight text-ink">Avisos y eventos</h1>
        <p className="mt-2 max-w-xl text-xs leading-6 text-subtle">Comparte novedades y recordatorios. Tus destinatarios recibirán el aviso en la plataforma.</p>
      </header>
      <form onSubmit={submit} className="grid !gap-4 !mt-5 border-t border-line pt-5 md:!grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
                ? "Toda la comunidad académica"
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
        <label className="md:col-span-2">
          Título
          <input
            required
            minLength={3}
            maxLength={160}
            placeholder="Ej. Materiales para nuestra próxima clase"
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
            rows={4}
            placeholder="Incluye fecha, hora y detalles si se trata de un evento."
          />
          <span className="text-right text-[10px] font-normal text-subtle">{body.length}/2.000 caracteres</span>
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
        <div className="flex items-end md:justify-end">
        <button
          className="btn btn-primary !min-h-10 !rounded-xl !px-5 !py-2.5 !text-xs"
          disabled={busy || (role === "mentor" && !courses.length)}
        >
          {busy ? "Publicando..." : "Publicar aviso"}
        </button>
        </div>
        {message && <p role="status" className="rounded-xl border border-line bg-elevated/50 px-3 py-2 text-xs">{message}</p>}
      </form>
      {role === "mentor" && (
        <p className="!mt-4 border-t border-line pt-3 !text-[11px] !text-subtle">
          Los avisos se publican directamente para los estudiantes de tu curso.
        </p>
      )}
    </section>
  );
}
