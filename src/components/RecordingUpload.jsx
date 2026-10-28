import React, { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
export function RecordingUpload({
  courses,
  liveClasses,
  onUploaded,
  onSessionUpdated,
}) {
  const [linkSession, setLinkSession] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
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
      const response = await fetch(created.upload.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
        signal: aborter.signal,
      });
      if (!response.ok)
        throw new Error("No se pudo subir el archivo. Intenta nuevamente.");
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
      );
      onSessionUpdated(updated);
      setLinkMessage("Enlace guardado.");
    } catch (error) {
      setLinkMessage(error.message);
    }
  }
  return (
    <section className="academic-workspace card mb-6">
      <h2>Publicar grabación</h2>
      <p>
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
        <label>
          Título
          <input
            required
            minLength={3}
            disabled={busy}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full [padding:10px]"
          />
        </label>
        <label>
          Archivo de video
          <input
            required
            type="file"
            accept="video/*"
            disabled={busy}
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
        </label>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Publicando..." : "Publicar grabacion"}
        </button>
        <p role="status">{message}</p>
      </form>
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
        <button className="btn btn-primary">Guardar enlace</button>
        <p role="status">{linkMessage}</p>
      </form>
    </section>
  );
}
