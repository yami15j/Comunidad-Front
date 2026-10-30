import React, { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { MAX_VIDEO_BYTES, uploadVideoFile } from "../services/videoUpload";
export function RecordingUpload({
  courses,
  liveClasses,
  onUploaded,
  onSessionUpdated,
  showLinkEditor = true,
}) {
  const [linkSession, setLinkSession] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [meetingPasscode, setMeetingPasscode] = useState("");
  const [linkMessage, setLinkMessage] = useState("");
  const [courseId, setCourseId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function upload(event) {
    event.preventDefault();
    if (busy || !file) return;
    if (!file.type.startsWith("video/")) {
      setMessage("Selecciona un archivo de video.");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setMessage("El video supera el límite de 2 GB. Reduce su tamaño antes de subirlo.");
      return;
    }
    const aborter = new AbortController();
    controller.current = aborter;
    setBusy(true);
    setMessage("Preparando grabacion...");
    let id;
    const token = localStorage.getItem("traction_access_token");
    const current = () =>
      !aborter.signal.aborted &&
      token === localStorage.getItem("traction_access_token");
    try {
      const created = await api.videos.create({
        courseId,
        liveSessionId: sessionId || undefined,
        title: title.trim(),
        mimeType: file.type,
        sizeBytes: file.size,
      });
      id = created.video.id;
      if (!current()) return;
      setMessage("Subiendo archivo. Mantén esta pantalla abierta...");
      await uploadVideoFile(created.upload.signedUrl, file, aborter.signal);
      if (!current()) return;
      const completed = await api.videos.complete(id, {
        sizeBytes: file.size,
        mimeType: file.type,
      });
      if (!current()) return;
      onUploaded(completed);
      setMessage(
        "Grabacion publicada. Los estudiantes matriculados ya pueden verla.",
      );
      setTitle("");
    } catch (error) {
      if (current()) {
        setMessage(error.message);
        if (id) {
          try {
            await api.videos.remove(id);
          } catch {
            setMessage(
              error.message +
                " Quedo una carga pendiente; revisa los videos antes de reintentar.",
            );
          }
        }
      }
    } finally {
      if (current()) setBusy(false);
    }
  }
  async function saveLink(event) {
    event.preventDefault();
    setLinkMessage("Guardando...");
    try {
      const updated = await api.liveSessions.updateLink(
        linkSession,
        joinUrl.trim() || null,
        { meetingId, meetingPasscode },
      );
      onSessionUpdated(updated);
      setLinkMessage("Enlace guardado.");
    } catch (error) {
      setLinkMessage(error.message);
    }
  }
  return (
    <section className="academic-workspace card mb-6 !space-y-4 !rounded-2xl !p-4 sm:!p-5 [&_label]:!gap-1.5 [&_label]:!text-[11px] [&_input:not([type=file])]:!rounded-xl [&_input:not([type=file])]:!px-3 [&_input:not([type=file])]:!py-2.5 [&_input:not([type=file])]:!text-xs [&_select]:!rounded-xl [&_select]:!px-3 [&_select]:!py-2.5 [&_select]:!text-xs [&_.btn]:!min-h-9 [&_.btn]:!rounded-xl [&_.btn]:!px-4 [&_.btn]:!py-2 [&_.btn]:!text-xs">
      <h2 className="!text-lg font-bold tracking-tight">Publicar grabación</h2>
      <p className="!mt-1 text-xs leading-6 text-subtle">
        Sube el video descargado de Zoom. Se publicará para los alumnos
        matriculados en el curso.
      </p>
      <form onSubmit={upload} className="grid gap-3 mt-4">
        <label>
          Curso
          <select
            required
            disabled={busy}
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setSessionId("");
            }}
            className="w-full [padding:10px]"
          >
            <option value="">Selecciona un curso</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Clase relacionada (opcional)
          <select
            disabled={busy}
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="w-full [padding:10px]"
          >
            <option value="">Sin clase relacionada</option>
            {liveClasses
              .filter((session) => session.courseId === courseId)
              .map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title} - {session.date}
                </option>
              ))}
          </select>
        </label>
        <label className="md:col-span-2">
          Título de la grabación
          <input
            required
            minLength={3}
            placeholder="Ej. Auditoría: introducción y conceptos clave"
            disabled={busy}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full [padding:10px]"
          />
        </label>
        <label className="cursor-pointer rounded-xl border border-dashed border-brand-line bg-brand-soft/30 p-4 transition-colors hover:bg-brand-soft/60 focus-within:ring-2 focus-within:ring-brand/40">
          <span className="text-xs font-semibold text-ink">Selecciona tu video</span>
          <span className="text-[10px] font-normal text-subtle">Elige el archivo de la clase para compartirlo con tus estudiantes.</span>
          <input
            required
            type="file"
            accept="video/*"
            aria-label="Elegir video para subir"
            className="mt-2 block w-full min-w-0 cursor-pointer text-xs text-muted file:mr-3 file:cursor-pointer file:rounded-xl file:border file:border-brand file:bg-brand file:px-5 file:py-3 file:text-xs file:font-bold file:text-white file:shadow-sm hover:file:brightness-95 disabled:cursor-wait disabled:opacity-60"
            disabled={busy}
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
        </label>
        {file && <p className="text-xs text-subtle">Tamaño: {(file.size / 1024 ** 2).toFixed(1)} MB. Máximo del contenedor: 2 GB; también aplica el límite global de Supabase.</p>}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-line pt-3 sm:flex-row sm:items-center md:col-span-2">
          <p className="max-w-md text-[11px] leading-5 text-subtle">Disponible para los estudiantes matriculados cuando termine la subida.</p>
          <button className="btn btn-primary shrink-0" disabled={busy}>
            {busy ? "Publicando..." : "Publicar grabación"}
          </button>
        </div>
        {message && <p role="status" className="rounded-xl border border-line bg-elevated/50 px-3 py-2 text-xs">{message}</p>}
      </form>
      {showLinkEditor && <>
      <hr className="[margin:24px_0]" />
      <h2>Enlace de Zoom de una clase</h2>
      <form onSubmit={saveLink} className="grid gap-3">
        <label>
          Clase
          <select
            required
            value={linkSession}
            onChange={(e) => {
              setLinkSession(e.target.value);
              setJoinUrl(
                liveClasses.find((session) => session.id === e.target.value)
                  ?.joinUrl || "",
              );
              const session = liveClasses.find(item => item.id === e.target.value);
              setMeetingId(session?.meetingId || '');
              setMeetingPasscode(session?.meetingPasscode || '');
              setLinkMessage("");
            }}
          >
            <option value="">Selecciona una clase</option>
            {liveClasses.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title} - {session.date}
              </option>
            ))}
          </select>
        </label>
        <label>
          Enlace de Zoom
          <input
            type="url"
            placeholder="https://zoom.us/j/..."
            value={joinUrl}
            onChange={(e) => setJoinUrl(e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>ID de reunión (opcional)<input inputMode="numeric" maxLength={20} value={meetingId} onChange={e => setMeetingId(e.target.value)} /></label>
          <label>Código de acceso (opcional)<input maxLength={32} autoComplete="off" value={meetingPasscode} onChange={e => setMeetingPasscode(e.target.value)} /></label>
        </div>
        <button className="btn btn-primary">Guardar enlace y datos de acceso</button>
        <p role="status">{linkMessage}</p>
      </form>
      </>}
    </section>
  );
}
