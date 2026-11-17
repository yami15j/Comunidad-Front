import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { RecordingPlayer } from "./RecordingPlayer";
import { Avatar } from "./ui";
import { api } from "../services/api";
export function RecordingWatchView({ video, onBack }) {
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const pendingSave = useRef(false);
  const version = useRef(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController(); let pending = false;
    async function refresh() {
      if (pending || pendingSave.current || document.hidden) return;
      pending = true; const started = version.current;
      try { const data = await api.videos.discussion(video.id, { signal: controller.signal }); if (!controller.signal.aborted && started === version.current) { setFeed(data); setError(""); } }
      catch (failure) { if (!controller.signal.aborted) setError(failure.message || "No se pudieron cargar las preguntas."); }
      finally { pending = false; }
    }
    refresh(); const timer = setInterval(refresh, 3000); window.addEventListener('focus', refresh);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [video.id, revision]);
  async function save(event, kind, id) {
    event.preventDefault(); if (pendingSave.current) return;
    pendingSave.current = true; version.current++; setSaving(true); setError("");
    try {
      if (kind === 'reply') await api.dashboard.answerMentorQuestion(id, reply.trim());
      else await api.dashboard.createLessonQuestion(lessonId || feed.lessons[0].id, question.trim());
      if (!mounted.current) return;
      if (kind === 'reply') { setReplyTo(null); setReply(""); } else setQuestion("");
      setRevision(value => value + 1);
    } catch (failure) { if (mounted.current) setError(failure.message || "No se pudo guardar."); }
    finally { pendingSave.current = false; version.current++; if (mounted.current) setSaving(false); }
  }
  return <section className="w-full min-w-0 space-y-4 pb-5">
    <button type="button" onClick={onBack} className="inline-flex items-center gap-2 py-2 text-xs font-semibold text-muted hover:text-brand"><ArrowLeft size={15} />Volver a grabaciones</button>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0"><RecordingPlayer src={video.url} title={video.title} controls autoPlay className="aspect-video w-full rounded-xl bg-slate-950" onError={() => setError("No se pudo reproducir el video. Vuelve a abrir la grabación.")} /><h1 className="mt-4 break-words text-xl font-bold tracking-tight text-ink">{video.title}</h1><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-subtle"><span>{video.courseTitle}</span><span>{video.mentor}</span><span>{video.duration}</span></div>{video.description && <p className="mt-4 whitespace-pre-wrap text-xs leading-6 text-muted">{video.description}</p>}</div>
      <aside className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface xl:sticky xl:top-24"><header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3"><h2 className="flex items-center gap-2 text-xs font-bold text-ink"><MessageSquare size={14} className="text-brand" />{feed?.canAsk ? "Mis preguntas" : "Preguntas de estudiantes"}</h2><span className="text-[10px] text-subtle">{feed?.questions.length || 0}</span></header>
        <div className="max-h-[65dvh] space-y-3 overflow-y-auto p-4">
          {error && <p role="alert" className="text-xs leading-5 text-danger">{error}</p>}
          {!feed && !error && <p role="status" className="text-xs text-subtle">Cargando preguntas...</p>}
          {feed && !feed.questions.length && <p className="py-4 text-center text-xs leading-6 text-subtle">{feed.lessons.length ? "Todavía no hay preguntas sobre esta grabación." : "Esta grabación aún no está vinculada a una lección. Las preguntas aparecerán al vincularla."}</p>}
          {feed?.questions.map(item => <article key={item.id} className="border-b border-line/60 pb-3 last:border-b-0"><header className="flex items-center gap-2"><Avatar name={item.studentName} src={item.studentAvatar} className="size-7 shrink-0" /><div className="min-w-0"><p className="break-words text-[11px] font-semibold text-ink">{item.studentName}</p><time className="text-[9px] text-subtle">{new Date(item.createdAt).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })}</time></div></header>{feed.lessons.length > 1 && <p className="mt-2 text-[9px] text-brand">{item.lessonTitle}</p>}<p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-muted">{item.question}</p>{item.mentorReply && <div className="mt-2 border-l-2 border-brand-line pl-3"><p className="text-[9px] font-semibold text-brand">Respuesta del mentor</p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-muted">{item.mentorReply}</p></div>}{feed.canReply && <button type="button" disabled={saving} onClick={() => { setReplyTo(replyTo === item.id ? null : item.id); setReply(item.mentorReply || ""); }} className="mt-2 text-[10px] font-semibold text-brand">{item.mentorReply ? "Editar respuesta" : "Responder"}</button>}{replyTo === item.id && <form onSubmit={event => save(event, 'reply', item.id)} className="mt-2 space-y-2"><textarea aria-label={"Respuesta a " + item.studentName} required minLength={2} maxLength={5000} rows={3} disabled={saving} value={reply} onChange={event => setReply(event.target.value)} className="w-full rounded-lg border border-line bg-elevated/30 p-2 text-xs leading-5" /><button disabled={saving || reply.trim().length < 2} className="rounded-lg bg-brand px-3 py-2 text-[10px] font-bold text-white disabled:opacity-40">{saving ? "Guardando..." : "Guardar respuesta"}</button></form>}</article>)}
        </div>
        {feed?.canAsk && feed.lessons.length > 0 && <form onSubmit={event => save(event, 'question')} className="space-y-2 border-t border-line p-4">{feed.lessons.length > 1 && <select aria-label="Lección de la pregunta" value={lessonId || feed.lessons[0].id} onChange={event => setLessonId(event.target.value)} className="w-full !text-xs">{feed.lessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select>}<label className="block text-[10px] font-semibold text-muted">Pregunta sobre el video<textarea required minLength={3} maxLength={2000} rows={3} disabled={saving} value={question} onChange={event => setQuestion(event.target.value)} className="mt-2 w-full rounded-lg border border-line bg-elevated/30 p-2 text-xs font-normal leading-5" placeholder="Escribe tu pregunta..." /></label><button disabled={saving || question.trim().length < 3} className="rounded-lg bg-brand px-3 py-2 text-[10px] font-bold text-white disabled:opacity-40">{saving ? "Enviando..." : "Enviar pregunta"}</button></form>}
      </aside>
    </div>
  </section>;
}
