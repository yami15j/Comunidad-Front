import { liveSessionState, compareLiveSessions } from "../services/liveSessionState";
import { zoomLink } from "../services/studentContent";
import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Film,
  Search,
  Copy,
  Play,
  Video,
  Clock3,
} from "lucide-react";
import { RecordingPlayer } from "../components/RecordingPlayer";
import { Avatar, Dialog, EmptyState } from "../components/ui";
const keyForDate = (date) =>
  [date.getFullYear(), date.getMonth(), date.getDate()].join("-");
export function LiveClassesView({
  liveClasses = [],
  initialTarget,
  courses = [],
  replays = [],
  onPlay,
  onNavigate,
}) {
  const playbackVersion = useRef(0);
  useEffect(() => () => { playbackVersion.current += 1; }, []);
  const [playing, setPlaying] = useState(null);
  const [playBusy, setPlayBusy] = useState(null);
  const [playError, setPlayError] = useState("");
  async function openRecording(video) {
    if (playBusy || !onPlay) return;
    const version = ++playbackVersion.current;
    setPlayBusy(video.id); setPlayError("");
    try { const access = await onPlay(video); if (version === playbackVersion.current) setPlaying({ ...video, url: access.url }); }
    catch (error) { if (version === playbackVersion.current) setPlayError(error.message || "No se pudo reproducir el video."); }
    finally { if (version === playbackVersion.current) setPlayBusy(null); }
  }
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(timer); }, []);
  const resolvedClasses = liveClasses.map(session => ({ ...session, ...liveSessionState(session, now) }));
  const [today] = useState(() => new Date());
  const [month, setMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [copyNotice, setCopyNotice] = useState("");
  useEffect(() => { if (!copyNotice) return; const timer = setTimeout(() => setCopyNotice(""), 3500); return () => clearTimeout(timer); }, [copyNotice]);
  async function copyValue(value) {
    try { await navigator.clipboard.writeText(String(value)); setCopyNotice("Copiado al portapapeles"); }
    catch { setCopyNotice("No se pudo copiar. Selecciona el dato para copiarlo manualmente."); }
  }
  function addToCalendar(session) {
    const start = new Date(session.scheduledAt);
    if (!Number.isFinite(start.getTime())) return;
    const duration = Number(session.durationMinutes) || parseInt(session.duration, 10) || 60;
    const end = new Date(start.getTime() + duration * 60000);
    const stamp = value => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const escape = value => String(value || "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    const text = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Comunidad//Clases//ES", "BEGIN:VEVENT", "UID:" + escape(session.id) + "@comunidad", "DTSTAMP:" + stamp(new Date()), "DTSTART:" + stamp(start), "DTEND:" + stamp(end), "SUMMARY:" + escape(session.title), "DESCRIPTION:" + escape([session.subtitle, session.mentorName, zoomLink(session.joinUrl), session.meetingId ? "ID: " + session.meetingId : "", session.meetingPasscode ? "Codigo: " + session.meetingPasscode : ""].filter(Boolean).join("\n")), "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "clase.ics"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function changeDay(value) { setSelectedDay(value); setPage(1); }
  const valid = resolvedClasses.filter((item) =>
    Number.isFinite(new Date(item.scheduledAt).getTime()),
  );
  const initialDate = valid.find(session => session.id === initialTarget?.sessionId)?.scheduledAt;
  useEffect(() => {
    if (!initialDate) return;
    const date = new Date(initialDate);
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectedDay(keyForDate(date)); setStatus("all"); setSearch(""); setPage(1);
  }, [initialDate, initialTarget?.revision]);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const sessions = valid
    .filter((item) => {
      const date = new Date(item.scheduledAt);
      return selectedDay
        ? keyForDate(date) === selectedDay
        : date.getFullYear() === month.getFullYear() &&
            date.getMonth() === month.getMonth();
    })
    .sort(compareLiveSessions);
  const liveIds = sessions.filter(session => session.isLiveNow).map(session => session.id).join(",");
  useEffect(() => { setPage(1); }, [liveIds]);
  const filtered = sessions.filter(session => [session.title, session.subtitle, session.courseTitle, session.mentorName].filter(Boolean).join(" ").toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) && (status === "all" || (status === "upcoming" ? !["ended", "live"].includes(session.effectiveStatus) : session.effectiveStatus === status)));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 4));
  const currentPage = Math.min(page, pageCount);
  const grouped = filtered.slice((currentPage - 1) * 4, currentPage * 4).reduce((groups, session) => {
    const key = keyForDate(new Date(session.scheduledAt));
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(session);
    else groups.push({ key, date: new Date(session.scheduledAt), items: [session] });
    return groups;
  }, []);
  function changeMonth(delta) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
    changeDay(null);
  }
  return (
    <section className="space-y-7">
      <header className="relative isolate overflow-hidden rounded-2xl bg-linear-to-r from-slate-950 via-sky-950 to-sky-800 px-5 py-6 text-white sm:px-7">
        {courses[0]?.thumbnail && <><img src={courses[0].thumbnail} alt="" className="absolute inset-y-0 right-0 -z-10 h-full w-1/2 object-cover opacity-45" /><div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-slate-950 via-sky-950/90 to-transparent" /></>}
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-400/15 px-2.5 py-1 text-[9px] font-semibold text-sky-200"><span className="size-1.5 rounded-full bg-sky-400" />Aprendizaje en tiempo real</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Clases <span className="text-sky-300">en vivo</span></h1><p className="mt-2 max-w-md text-xs leading-5 text-sky-100/85">Conecta con tu mentor, participa y sigue aprendiendo en comunidad.</p>
      </header>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0">
          <nav aria-label="Secciones de clases" className="mb-4 flex flex-wrap gap-4 border-b border-line"><button type="button" className="inline-flex items-center gap-2 border-b-2 border-brand pb-3 text-xs font-bold text-brand" onClick={() => { setStatus("all"); setPage(1); }}><Video size={14} />Clases del mes</button><button type="button" onClick={() => onNavigate("replays")} className="inline-flex items-center gap-2 pb-3 text-xs font-semibold text-subtle hover:text-brand"><Film size={14} />Grabaciones</button><button type="button" onClick={() => { const calendar = document.getElementById("live-class-calendar"); calendar?.scrollIntoView({ behavior: "smooth", block: "center" }); calendar?.focus({ preventScroll: true }); }} className="inline-flex items-center gap-2 pb-3 text-xs font-semibold text-subtle hover:text-brand"><CalendarDays size={14} />Calendario</button></nav>
        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm">
              {selectedDay ? "Clases del día" : "Agenda del mes"}
            </h2>
            <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-semibold text-subtle">
              {filtered.length} clases
            </span>
          </div>
          <div className="space-y-3">
            <div className="relative"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" /><input type="search" aria-label="Buscar clases en la agenda" placeholder="Buscar clase o curso..." value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className="w-full !min-h-9 !rounded-lg !border-line !bg-surface !py-2 !pl-9 !text-[11px]" /></div>
            <div aria-label="Filtrar clases por estado" className="flex flex-wrap gap-1 border-b border-line pb-2">{[["all", "Todas"], ["upcoming", "Próximas"], ["live", "En vivo"], ["ended", "Finalizadas"]].map(([value, label]) => <button key={value} type="button" aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }} className={"rounded-lg px-3 py-1.5 text-[10px] font-semibold transition focus-visible:outline-2 focus-visible:outline-brand " + (status === value ? "bg-brand text-white" : "text-subtle hover:bg-elevated hover:text-ink")}>{label}</button>)}</div>
          </div>
          {copyNotice && <p role="status" className="rounded-lg border border-brand-line bg-brand-soft px-3 py-2 text-[10px] text-brand">{copyNotice}</p>}
          {selectedDay && (
            <button
              className="text-[10px] font-semibold text-brand"
              onClick={() => changeDay(null)}
            >
              Ver todo el mes
            </button>
          )}
          {!filtered.length && (
            <EmptyState
              icon={CalendarDays}
              title={search || status !== "all" ? "No hay clases con estos filtros" : "Un espacio libre en tu agenda"}
              description="No tienes clases programadas para este periodo. Prueba con otra fecha."
            />
          )}
          {grouped.map(group => <section key={group.key + ":" + group.items[0].id} className="space-y-2.5">
            <header className="flex flex-wrap items-center justify-between gap-2 px-1 py-1.5"><h3 className="text-[11px] font-semibold capitalize text-muted">{group.date.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })}</h3><span className="text-[9px] text-subtle">{group.items.length} {group.items.length === 1 ? "clase" : "clases"}</span></header>
            <div className="space-y-3">{group.items.map(session => {
              const course = courses.find(course => String(course.id) === String(session.courseId));
              const image = course?.thumbnail || session.thumbnail;
              const url = zoomLink(session.joinUrl);
              return <article key={session.id} className="grid min-w-0 gap-4 rounded-xl border border-line bg-surface p-3.5 shadow-sm transition hover:border-brand-line sm:grid-cols-[110px_minmax(0,1fr)_150px] 2xl:grid-cols-[145px_minmax(0,1fr)_150px]">
                <div className="relative min-h-32 overflow-hidden rounded-xl bg-elevated ">{image ? <img src={image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center bg-brand-soft text-brand"><Video size={32} /></div>}<div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-slate-950/45 to-slate-950/5" /><span className={"absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-bold text-white " + (session.isLiveNow ? "bg-red-600 shadow-sm shadow-red-950/30" : "bg-slate-950/65")}><span aria-hidden="true" className={"size-1.5 rounded-full " + (session.isLiveNow ? "animate-pulse bg-white motion-reduce:animate-none" : session.effectiveStatus === "ended" ? "bg-slate-300" : "bg-sky-400")} />{session.isLiveNow ? "EN VIVO" : session.badge}</span><span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-slate-950/65 px-2 py-1 text-[9px] font-semibold text-white"><CalendarDays size={11} />{new Date(session.scheduledAt).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}</span></div>
                <div className="min-w-0"><span className="inline-flex rounded-md bg-brand-soft px-2 py-0.5 text-[9px] font-semibold text-brand">{course?.category && course.category !== "Sin categoría" ? course.category : "Clase en vivo"}</span>{session.isLiveNow && <p className="mt-1.5 text-[10px] font-bold text-red-600 dark:text-red-400">Clase en vivo ahora</p>}<h4 className="mt-1.5 break-words text-sm font-bold leading-5 tracking-tight text-ink">{session.title}</h4><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9px] font-medium text-muted"><span className="inline-flex items-center gap-1.5"><Avatar name={session.mentorName} src={session.mentorAvatar} className="size-4 shrink-0" />{session.mentorName}</span><span className="inline-flex items-center gap-1"><Clock3 size={11} className="shrink-0 text-brand" />{session.time} ({session.duration})</span><span className="inline-flex items-center gap-1"><Video size={11} className="text-brand" />Zoom</span></div><p className="mt-2 text-[11px] leading-5 text-subtle">{session.description || session.subtitle}</p></div>
                <div className="flex flex-col justify-center gap-2 sm:col-start-3 sm:row-start-1">{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[10px] font-bold text-white transition hover:brightness-110"><Video size={12} />Unirse a la clase<ArrowUpRight size={12} /></a> : <span className="inline-flex min-h-9 items-center justify-center rounded-lg bg-elevated px-3 py-2 text-[10px] text-subtle">Enlace pendiente</span>}<button type="button" onClick={() => addToCalendar(session)} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-brand-line px-3 py-2 text-[10px] font-semibold text-brand transition hover:bg-brand-soft"><CalendarDays size={12} />Agregar al calendario</button></div>
                {(url || session.meetingId || session.meetingPasscode) && <div className="min-w-0 border-t border-line/60 pt-2 sm:col-span-3">{url && <a href={url} target="_blank" rel="noopener noreferrer" className="block break-all text-[9px] leading-4 text-brand hover:underline">{session.joinUrl}</a>}<dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px]">{[["ID", session.meetingId], ["Código", session.meetingPasscode]].map(([label, value]) => value && <div key={label} className="flex items-center gap-1.5"><dt className="text-subtle">{label}:</dt><dd className="select-text break-all font-mono font-semibold text-ink">{value}</dd><button type="button" aria-label={"Copiar " + label + " de " + session.title} onClick={() => copyValue(value)} className="inline-flex size-6 items-center justify-center rounded-md text-subtle hover:bg-brand-soft hover:text-brand"><Copy size={11} /></button></div>)}</dl></div>}
              </article>;
            })}</div>
          </section>)}
          {filtered.length > 4 && <nav aria-label="Páginas de clases" className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[10px] text-subtle"><p>{(currentPage - 1) * 4 + 1}?{Math.min(currentPage * 4, filtered.length)} de {filtered.length} clases</p><div className="flex items-center gap-2"><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border border-line bg-surface px-3 py-2 font-semibold text-brand disabled:opacity-40">Anterior</button><span aria-live="polite">{currentPage} de {pageCount}</span><button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} className="rounded-lg border border-line bg-surface px-3 py-2 font-semibold text-brand disabled:opacity-40">Siguiente</button></div></nav>}
        </div>
          <section className="mt-6"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-bold text-ink"><Play size={15} className="text-brand" />Grabaciones recientes</h2><button type="button" onClick={() => onNavigate("replays")} className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand">Ver todas<ArrowUpRight size={12} /></button></div>
            {playError && <p role="alert" className="mb-3 text-xs text-danger">{playError}</p>}
            {replays.length ? <div className="grid gap-3 sm:grid-cols-3">{[...replays].sort((a,b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))).slice(0,3).map(video => <button key={video.id} type="button" disabled={Boolean(playBusy) || !onPlay} onClick={() => openRecording(video)} className="group min-w-0 overflow-hidden rounded-xl border border-line bg-surface text-left transition hover:border-brand-line disabled:opacity-50"><div className="relative h-24 overflow-hidden bg-elevated">{video.thumbnail && <img src={video.thumbnail} alt="" loading="lazy" className="size-full object-cover transition group-hover:scale-105" />}<span className="absolute inset-0 flex items-center justify-center bg-slate-950/15"><span className="flex size-8 items-center justify-center rounded-full bg-surface/95 text-brand"><Play size={15} /></span></span></div><div className="p-3"><h3 className="line-clamp-2 text-xs font-bold leading-5 text-ink">{video.title}</h3><p className="mt-1 truncate text-[10px] text-subtle">{playBusy === video.id ? "Abriendo..." : video.courseTitle || "Clase grabada"}</p></div></button>)}</div> : <div className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-xs text-subtle">Tus grabaciones aparecerán aquí cuando estén disponibles.</div>}
          </section>
        </div>
        <div className="min-w-0 space-y-4 xl:sticky xl:top-24">
        <section id="live-class-calendar" tabIndex={-1} className="min-w-0 rounded-xl border border-line bg-surface p-3.5 sm:p-4 ">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-subtle">
                TU CALENDARIO
              </p>
              <h2 className="mt-1 text-sm font-bold first-letter:uppercase">
                {month.toLocaleDateString("es-EC", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-line bg-elevated/50 p-1">
              <button
                className="icon-button !size-7"
                aria-label="Mes anterior"
                onClick={() => changeMonth(-1)}
              >
                <ChevronLeft size={17} />
              </button>
              <button
                className="icon-button !size-7"
                aria-label="Mes siguiente"
                onClick={() => changeMonth(1)}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map((day) => (
              <span
                key={day}
                className="rounded-lg bg-elevated/60 py-1.5 text-center text-[9px] font-bold tracking-wider text-subtle"
              >
                {day}
              </span>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <span key={"empty-" + i} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const date = new Date(
                month.getFullYear(),
                month.getMonth(),
                i + 1,
              );
              const key = keyForDate(date);
              const count = valid.filter(
                (item) => keyForDate(new Date(item.scheduledAt)) === key,
              ).length;
              const selected = selectedDay === key;
              const isToday = keyForDate(today) === key;
              return (
                <button
                  key={key}
                  aria-label={
                    date.toLocaleDateString("es-EC") + ", " + count + " clases"
                  }
                  aria-pressed={selected}
                  onClick={() => changeDay(selected ? null : key)}
                  className={
                    "relative flex h-8 flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] font-semibold transition " +
                    (selected
                      ? "border-brand bg-brand text-on-brand shadow-sm shadow-brand/20"
                      : isToday
                        ? "border-brand-line bg-brand-soft text-brand"
                        : count
                          ? "border-brand-line/60 bg-brand-soft/30 text-ink hover:border-brand"
                          : "border-transparent text-subtle hover:border-line hover:bg-elevated")
                  }
                >
                  <span className={isToday ? "font-extrabold" : ""}>
                    {i + 1}
                  </span>
                  <span
                    className={
                      "h-1.5 " + (count ? "flex items-center gap-0.5" : "")
                    }
                  >
                    {count > 0 && (
                      <>
                        <span
                          className={
                            "size-1 rounded-full " +
                            (selected ? "bg-on-brand" : "bg-brand")
                          }
                        />
                        {count > 1 && (
                          <span
                            className={
                              "size-1 rounded-full " +
                              (selected ? "bg-on-brand" : "bg-brand")
                            }
                          />
                        )}
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
            <span className="flex items-center gap-2 text-[10px] text-subtle">
              <span className="size-1.5 rounded-full bg-brand" />
              Días con clases programadas
            </span>
            <button
              className="text-[10px] font-bold text-brand hover:underline"
              onClick={() => {
                setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                changeDay(keyForDate(today));
              }}
            >
              Ir a hoy
            </button>
          </div>
          <p className="mt-2 text-[9px] text-subtle/70">
            Horarios según la zona horaria de tu dispositivo.
          </p>
        </section>
          <div className="rounded-xl border border-brand-line/50 bg-brand-soft/50 p-4"><p className="text-xs font-bold text-ink">Sigue aprendiendo</p><p className="mt-1.5 text-[11px] leading-5 text-muted">Selecciona una fecha para consultar tus clases o vuelve a las grabaciones de tus cursos.</p><button type="button" onClick={() => onNavigate("replays")} className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-brand">Ver grabaciones<ArrowUpRight size={12} /></button></div>
        </div>
      </div>
      <Dialog open={Boolean(playing)} onClose={() => setPlaying(null)} title={playing?.title || "Grabación"} className="max-w-4xl">{playing && <RecordingPlayer title={playing.title} src={playing.url} controls autoPlay className="aspect-video w-full rounded-xl bg-slate-950" />}</Dialog>

    </section>
  );
}
export default LiveClassesView;
