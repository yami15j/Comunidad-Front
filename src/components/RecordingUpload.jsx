import { Link, Upload, Check } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { recordingErrorMessage } from "../services/recordingFeedback";
import { api } from "../services/api";
import { MAX_VIDEO_BYTES, uploadVideoFile } from "../services/videoUpload";
export function RecordingUpload({
  courses,
  liveClasses,
  onUploaded,
  onSessionUpdated,
  showLinkEditor = true,
  allowExternal = false,
}) {
  const [linkSession, setLinkSession] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [meetingPasscode, setMeetingPasscode] = useState("");
  const [linkMessage, setLinkMessage] = useState("");
  const [courseId, setCourseId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState(allowExternal ? "vimeo" : "file");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [savedRecording, setSavedRecording] = useState(null);
  const feedbackRef = useRef(null);
  const [linkState, setLinkState] = useState("info");
  const controller = useRef(null);
  useEffect(() => {
    if (message && messageType !== "info") feedbackRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [message, messageType]);
  useEffect(() => () => controller.current?.abort(), []);
  async function upload(event) {
    event.preventDefault();
    if (busy || (source === "file" && !file)) return;
    setSavedRecording(null);
    setUploadProgress(null);
    setMessageType("info");
    if (source === "vimeo") {
      setBusy(true); setMessage("Publicando enlace...");
      const token = localStorage.getItem("traction_access_token");
      try {
        const result = await api.videos.create({ courseId, liveSessionId: sessionId || undefined, title: title.trim(), externalUrl: externalUrl.trim() });
        if (token !== localStorage.getItem("traction_access_token")) return;
        onUploaded(result.video);
        setSavedRecording({ title: result.video.title || title.trim(), course: courses.find(course => course.id === courseId)?.title });
        setMessageType("success"); setMessage("La grabación se guardó correctamente."); setExternalUrl(""); setTitle("");
      } catch (error) { if (token === localStorage.getItem("traction_access_token")) { setMessageType("error"); setMessage(recordingErrorMessage(error)); } }
      finally { setBusy(false); }
      return;
    }
    if (!file.type.startsWith("video/")) {
      setMessageType("error");
      setMessage("Selecciona un archivo de video.");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setMessageType("error");
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
      setUploadProgress(0);
      await uploadVideoFile(created.upload.signedUrl, file, aborter.signal, undefined, progress => {
        if (current()) {
          setUploadProgress(progress);
          setMessage(progress === 100 ? "Archivo enviado. Verificando y guardando…" : `Subiendo video: ${progress}%`);
        }
      });
      if (!current()) return;
      const completed = await api.videos.complete(id, {
        sizeBytes: file.size,
        mimeType: file.type,
      });
      if (!current()) return;
      onUploaded(completed);
      setSavedRecording({ title: completed.title || title.trim(), course: courses.find(course => course.id === courseId)?.title });
      setMessageType("success");
      setMessage(
        "La grabación se guardó correctamente.",
      );
      setTitle("");
      setUploadProgress(null);
    } catch (error) {
      if (current()) {
        setMessageType("error");
        setMessage(recordingErrorMessage(error));
        if (id) {
          try {
            await api.videos.remove(id);
          } catch {
            setMessage(
              recordingErrorMessage(error) +
                " Quedo una carga pendiente; revisa los videos antes de reintentar.",
            );
          }
        }
      }
    } finally {
      if (current()) { setBusy(false); setUploadProgress(null); }
    }
  }
  async function saveLink(event) {
    event.preventDefault();
    setLinkState("info");
    setLinkMessage("Guardando...");
    try {
      const updated = await api.liveSessions.updateLink(
        linkSession,
        joinUrl.trim() || null,
        { meetingId, meetingPasscode },
      );
      onSessionUpdated(updated);
      setLinkState("success");
      setLinkMessage("Cambios guardados correctamente.");
    } catch (error) {
      setLinkState("error");
      setLinkMessage(error.message);
    }
  }
  return (
    <section className="academic-workspace card mb-6 !space-y-4 !rounded-2xl !p-4 sm:!p-5 [&_label]:!gap-1.5 [&_label]:!text-[11px] [&_input:not([type=file])]:!rounded-xl [&_input:not([type=file])]:!px-3 [&_input:not([type=file])]:!py-2.5 [&_input:not([type=file])]:!text-xs [&_select]:!rounded-xl [&_select]:!px-3 [&_select]:!py-2.5 [&_select]:!text-xs [&_.btn]:!min-h-9 [&_.btn]:!rounded-xl [&_.btn]:!px-4 [&_.btn]:!py-2 [&_.btn]:!text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4"><div className="flex items-center gap-3"><div><p className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-brand">Contenido del curso</p><h2 className="!text-lg font-bold tracking-tight">Publicar grabación</h2><p className="mt-1 text-xs text-subtle">Comparte una clase grabada con tus estudiantes.</p></div></div><span className="inline-flex items-center gap-1.5 text-subtle text-[10px] font-medium text-muted">Acceso por matrícula</span></div>
        {message && <div ref={feedbackRef} role={messageType === "error" ? "alert" : "status"} aria-live="polite" aria-atomic="true" className={`flex items-start rounded-xl border px-3 py-2 md:col-span-2 ${messageType === "success" ? "w-fit max-w-full border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : messageType === "error" ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300" : "border-brand-line bg-brand-soft text-brand"}`}>

          <div className="min-w-0"><p className="!text-xs !leading-5 font-semibold">{messageType === "success" ? "¡Grabación guardada!" : messageType === "error" ? "No se pudo guardar la grabación" : "Publicando grabación"}</p>{messageType !== "success" && <p className="mt-0.5 !text-[11px] !leading-5">{message}</p>}{savedRecording && messageType === "success" && <p className="mt-0.5 break-words !text-[11px] !leading-4">{savedRecording.title} · {savedRecording.course}</p>}</div>
        </div>}
      <form onSubmit={upload} className="!mt-4 !grid !grid-cols-1 !gap-5 lg:!grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {busy && uploadProgress !== null && <div className="lg:col-span-2"><div className="mb-1 flex justify-between text-xs text-brand"><span>{uploadProgress === 100 ? "Verificando archivo…" : "Subiendo video"}</span><span>{uploadProgress}%</span></div><progress aria-label="Progreso de subida del video" max="100" value={uploadProgress} className="h-2 w-full overflow-hidden rounded-full accent-sky-500" /></div>}

        <div className="min-w-0 space-y-4 rounded-xl bg-elevated/30 p-4">
        {allowExternal && <fieldset className="min-w-0"><legend className="mb-2 text-[11px] font-semibold text-muted">¿Cómo quieres compartir la clase?</legend><div className="grid grid-cols-2 gap-1 rounded-xl bg-elevated p-1">{[{ value: "vimeo", label: "Enlace de video", description: "Pega el enlace y publica tu clase" }, { value: "file", label: "Desde tu computadora", description: "Sube un archivo de video" }].map(option => <label key={option.value} className={`relative !flex cursor-pointer !flex-row items-center gap-2 rounded-lg border !px-3 !py-2 transition-all focus-within:ring-2 focus-within:ring-brand/40 ${source === option.value ? "border-transparent bg-surface shadow-sm" : "border-transparent bg-transparent hover:bg-surface/60"} ${busy ? "pointer-events-none opacity-60" : ""}`}><input className="sr-only" type="radio" name="recording-source" value={option.value} checked={source === option.value} disabled={busy} onChange={() => { setSource(option.value); setMessage(""); setSavedRecording(null); }} /><span className={"shrink-0 " + (source === option.value ? "text-brand" : "text-subtle")}>{option.value === "vimeo" ? <Link size={16} /> : <Upload size={16} />}</span><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-ink">{option.label}</span></span></label>)}</div></fieldset>}
        {source === "vimeo" && <div className="min-w-0"><label>Enlace de video<div className="relative mt-1"><input required type="url" maxLength={2048} disabled={busy} className="w-full !bg-surface" placeholder="https://vimeo.com/..." value={externalUrl} onChange={e => setExternalUrl(e.target.value)} /></div></label><p className="mt-2 text-[11px] font-normal leading-5 text-subtle">El video se verá dentro de la plataforma.</p></div>}
        {source === "file" && <label className="cursor-pointer rounded-xl border border-dashed border-brand-line bg-brand-soft/30 p-4 transition-colors hover:bg-brand-soft/60 focus-within:ring-2 focus-within:ring-brand/40">
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
        }
        {source === "file" && file && <p className="text-xs text-subtle">Tamaño: {(file.size / 1024 ** 2).toFixed(1)} MB. Máximo del contenedor: 2 GB; también aplica el límite global de Supabase.</p>}

          <p className="flex items-center gap-1.5 text-[10px] text-subtle"><Check size={12} className="text-brand" />El video se vincula al curso que selecciones.</p>
        </div>
        <div className="min-w-0 space-y-3"><div><p className="text-xs font-bold text-ink">Datos de la grabación</p><p className="mt-1 text-[10px] text-subtle">Define el título y el curso donde aparecerá.</p></div>
        <label className="!grid">
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

        </div>
        <div className="flex flex-col items-start justify-between gap-4 border-t border-line pt-4 sm:flex-row sm:items-center lg:col-span-2">
          <div className="flex items-start gap-2"><p className="max-w-md text-[11px] leading-5 text-subtle">{source === "vimeo" ? "Al guardar, aparecerá en las grabaciones del curso para estudiantes con acceso." : "La clase estará disponible cuando termine de subir el archivo."}</p></div>
          <button className="btn btn-primary w-full shrink-0 !gap-2 !px-4 !py-2 shadow-sm transition hover:shadow-md sm:w-auto" disabled={busy}>
            {busy ? "Guardando..." : "Publicar grabación"}
          </button>
        </div>

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
        {linkMessage && <p role={linkState === "error" ? "alert" : "status"} aria-live="polite" className={`w-fit rounded-xl border px-3 py-2 !text-xs ${linkState === "success" ? "border-success-line bg-success-soft text-success" : linkState === "error" ? "border-danger-line bg-danger-soft text-danger" : "border-line text-muted"}`}>{linkMessage}</p>}
      </form>
      </>}
    </section>
  );
}
