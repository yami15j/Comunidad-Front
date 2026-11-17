import React, { useState } from "react";
import { Play, ExternalLink, FileText, Film, ChevronDown } from "lucide-react";
import { api } from "../services/api";
import { RecordingPlayer } from "./RecordingPlayer";

function webLink(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
function fileType(value) {
  if (!value) return 'Enlace';
  const known = { 'application/pdf': 'PDF', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word', 'application/msword': 'Word', 'application/zip': 'ZIP' };
  return known[value] || value.split('/').pop().toUpperCase();
}
export function SavedLessonDetails({ lesson, video, expanded = false }) {
  const [playback, setPlayback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fullText, setFullText] = useState(false);
  const link = webLink(video?.external_url || video?.externalUrl);
  const content = lesson.content_text || '';
  const paragraphs = content.split(/\n\s*\n/).map(text => text.trim()).filter(Boolean);
  const longText = content.length > 650;
  return <details open={expanded || undefined} className="saved-lesson-details group !m-0 !rounded-none !border-0 !bg-transparent !p-0">
    <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-3 py-3 text-xs font-bold text-ink [&::-webkit-details-marker]:hidden"><span>{expanded ? "Información guardada de la lección" : "Ver información guardada"}</span><ChevronDown size={15} className="text-subtle transition group-open:rotate-180" /></summary>
    <div className="grid items-start gap-6 border-t border-line pb-4 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.65fr)]">
      <div className="min-w-0 space-y-5">
        <section><h3 className="!text-xs font-bold text-ink">Resumen</h3><p className="mt-2 whitespace-pre-wrap break-words text-xs !leading-[1.75] text-muted">{lesson.summary || "Sin resumen."}</p></section>
        <section className="border-t border-line pt-4"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="!text-xs font-bold text-ink">Texto de la lección</h3><span className="text-[9px] font-medium text-subtle">Contenido guardado</span></div><div className={"space-y-3 break-words text-xs !leading-[1.75] text-muted " + (longText && !fullText ? "line-clamp-6" : "")}>{paragraphs.length ? paragraphs.map((text, index) => <p key={index} className="whitespace-pre-wrap !leading-[1.75]">{text}</p>) : <p>Sin texto adicional.</p>}</div>{longText && <button type="button" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline" onClick={() => setFullText(value => !value)}>{fullText ? "Mostrar menos" : "Leer texto completo"}<ChevronDown size={12} className={fullText ? "rotate-180" : ""} /></button>}</section>
      </div>
      <aside className="min-w-0 space-y-5 lg:border-l lg:border-line lg:pl-5">
        <section><h3 className="flex items-center gap-2 !text-xs font-bold text-ink"><Film size={15} className="text-brand" />Video vinculado</h3>{lesson.video_id ? <div className="mt-3 space-y-3"><p className="text-xs font-semibold leading-5 text-ink">{video?.title || "Video guardado en la lección"}</p>{link && <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-start gap-1.5 break-all text-[10px] text-brand hover:underline"><ExternalLink size={12} className="mt-0.5 shrink-0" />{link}</a>}<div><button type="button" className="inline-flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-2 text-[11px] font-bold text-brand transition hover:bg-brand hover:text-on-brand disabled:opacity-50" disabled={loading} onClick={async () => { if (playback) { setPlayback(null); return; } setLoading(true); setError(""); try { const access = await api.videos.playback(lesson.video_id); setPlayback(access.url); } catch (failure) { setError(failure.message); } finally { setLoading(false); } }}><Play size={13} />{loading ? "Cargando..." : playback ? "Ocultar video" : "Reproducir video"}</button></div>{error && <p role="alert">{error}</p>}{playback && <RecordingPlayer src={playback} title={video?.title || lesson.title} controls className="aspect-video w-full rounded-lg bg-slate-950" />}</div> : <p className="mt-2 text-[11px] text-subtle">Lección de texto, sin video.</p>}</section>
        <section className="border-t border-line pt-4"><h3 className="flex items-center justify-between !text-xs font-bold text-ink"><span>Materiales guardados</span><span className="text-[10px] font-semibold text-subtle">{lesson.resources.length}</span></h3>{lesson.resources.length ? <ul className="mt-2 divide-y divide-line">{lesson.resources.map(resource => <li key={resource.id} className="flex items-start gap-3 py-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-elevated text-subtle"><FileText size={16} /></span><div className="min-w-0 flex-1"><p className="text-xs font-semibold leading-5 text-ink">{resource.title}</p><div className="mt-1 flex items-center gap-2 text-[9px]"><span className="font-semibold text-subtle">{fileType(resource.mime_type)}</span><span className={"inline-flex items-center gap-1 font-medium " + (resource.is_published ? "text-success" : "text-warning")}><span className="size-1 rounded-full bg-current" />{resource.is_published ? "Publicado" : "Borrador"}</span></div>{resource.description && <p className="mt-2 text-[11px] leading-5 text-muted">{resource.description}</p>}{webLink(resource.external_url) && <a href={webLink(resource.external_url)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex max-w-full items-start gap-1 break-all text-[10px] text-brand hover:underline"><ExternalLink size={11} className="mt-0.5 shrink-0" />{resource.external_url}</a>}</div></li>)}</ul> : <p className="mt-2 text-[11px] text-subtle">Sin materiales adjuntos.</p>}</section>
      </aside>
    </div>
  </details>;
}
