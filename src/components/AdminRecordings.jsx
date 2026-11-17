import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Film, LoaderCircle, Play, RefreshCw, Search } from "lucide-react";
import { Dialog } from "./ui";
import { RecordingPlayer } from "./RecordingPlayer";

export function AdminRecordings({ recordings = [], courses = [], onPlay, onRefresh }) {
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("");
  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const requestVersion = useRef(0);
  useEffect(() => () => { requestVersion.current++; }, []);
  const published = recordings.filter(video => !video.status || video.status === "ready");
  const filtered = published.filter(video => (!courseId || video.courseId === courseId) && `${video.title} ${video.courseTitle || ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  const currentPage = Math.min(page, pages - 1);
  async function play(video) {
    if (busyId) return;
    const version = ++requestVersion.current;
    setBusyId(video.id); setError("");
    try { const access = await onPlay(video); if (version === requestVersion.current) setPlaying({ ...video, url: access.url }); }
    catch (failure) { if (version === requestVersion.current) setError(failure.message || "No se pudo reproducir la grabación."); }
    finally { if (version === requestVersion.current) setBusyId(null); }
  }
  return <section className="space-y-4 py-5" aria-label="Grabaciones publicadas">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="!text-base">Grabaciones publicadas <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-md bg-brand-soft px-1.5 py-0.5 align-middle text-[10px] font-bold text-brand">{published.length}</span></h2><p className="mt-1 text-xs text-subtle">Tus clases grabadas, organizadas por curso.</p></div><button type="button" className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[11px] font-semibold text-muted transition hover:border-brand-line hover:text-brand disabled:opacity-50" disabled={refreshing} onClick={async () => { setRefreshing(true); setError(""); try { await onRefresh(); } catch (failure) { setError(failure.message || "No se pudieron actualizar las grabaciones."); } finally { setRefreshing(false); } }}><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />Actualizar</button></header>
    <div className="flex flex-wrap items-center gap-3"><div className="relative w-full min-w-0 sm:max-w-sm sm:flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" /><input type="search" aria-label="Buscar grabaciones publicadas" placeholder="Buscar video o curso..." value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} className="w-full !min-h-10 !rounded-xl !bg-surface !pl-9 !text-xs" /></div><select aria-label="Filtrar grabaciones por curso" value={courseId} onChange={event => { setCourseId(event.target.value); setPage(0); }} className="w-full !min-h-10 !rounded-xl !bg-surface !text-xs sm:!w-56"><option value="">Todos los cursos</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></div>
    {error && <p role="alert">{error}</p>}
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm shadow-slate-900/[0.02]"><div className="hidden grid-cols-[minmax(0,1fr)_minmax(140px,0.55fr)_100px_110px] gap-4 border-b border-line bg-elevated/40 px-5 py-3 text-[9px] font-bold uppercase tracking-wider text-subtle sm:grid"><span>Video grabado</span><span>Curso</span><span>Publicado el</span><span className="text-right">Reproducir</span></div>
      {filtered.slice(currentPage * 6, (currentPage + 1) * 6).map(video => <article key={video.id} className="flex flex-wrap items-center gap-3 border-b border-line/70 px-5 py-3.5 transition last:border-0 hover:bg-brand-soft/20 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(140px,0.55fr)_100px_110px] sm:gap-4"><div className="flex min-w-0 flex-1 items-center gap-3"><span className="relative flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-elevated text-brand">{video.thumbnail || courses.find(course => course.id === video.courseId)?.thumbnail ? <img src={video.thumbnail || courses.find(course => course.id === video.courseId)?.thumbnail} alt="" className="absolute inset-0 size-full object-cover" /> : <Film size={18} />}<span className="relative flex size-5 items-center justify-center rounded-md bg-surface/90 shadow-sm"><Play size={11} className="fill-current text-brand" /></span></span><div className="min-w-0"><p className="break-words text-xs font-semibold leading-5 text-ink">{video.title}</p><p className="mt-1 text-[10px] text-subtle">{video.duration === "Duración pendiente" || !video.duration ? "Clase grabada" : video.duration}</p></div></div><p className="w-full break-words text-[11px] font-medium leading-5 text-muted sm:w-auto">{video.courseTitle || courses.find(course => course.id === video.courseId)?.title || "Curso no disponible"}</p><time className="text-[10px] text-subtle">{video.date || "—"}</time><button type="button" aria-label={`Reproducir ${video.title}`} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-[11px] font-bold text-brand transition hover:bg-brand hover:text-on-brand disabled:opacity-50" disabled={Boolean(busyId)} onClick={() => play(video)}>{busyId === video.id ? <LoaderCircle size={14} className="animate-spin" /> : <Play size={14} />}Ver video</button></article>)}
      {!filtered.length && <div className="py-10 text-center"><Film size={25} className="mx-auto text-subtle" /><p className="mt-3 text-xs font-semibold text-muted">{published.length ? "No hay videos para estos filtros." : "Todavía no hay grabaciones publicadas."}</p><p className="mt-1 text-[11px] text-subtle">Los videos aparecerán aquí después de publicarlos.</p></div>}
    </div>
    <p className="text-[10px] text-subtle">{filtered.length} {filtered.length === 1 ? "grabación" : "grabaciones"}{query || courseId ? " para estos filtros" : " disponibles"}</p>
    {pages > 1 && <nav aria-label="Páginas de grabaciones" className="flex items-center justify-end gap-3 text-xs text-subtle"><button className="icon-button !size-8" aria-label="Página anterior de grabaciones" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><span>{currentPage + 1} de {pages}</span><button className="icon-button !size-8" aria-label="Página siguiente de grabaciones" disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></nav>}
    <Dialog open={Boolean(playing)} onClose={() => setPlaying(null)} title={playing?.title || "Clase grabada"} className="!max-w-4xl"><p className="mb-3 text-xs text-subtle">{playing?.courseTitle}</p>{playing && <RecordingPlayer src={playing.url} title={playing.title} controls autoPlay className="aspect-video w-full rounded-xl bg-slate-950" />}</Dialog>
  </section>;
}
