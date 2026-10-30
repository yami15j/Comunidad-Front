import React, { useMemo, useState } from "react";
import {
  FileText,
  Film,
  ArrowUpRight,
  Search,
  Library,
  LoaderCircle,
  Download,
  Play,
} from "lucide-react";
import { libraryItems } from "../services/studentContent";
import { CourseCard, Dialog, EmptyState } from "../components/ui";
export function LibraryView({
  courses = [],
  replays = [],
  onSelectCourse,
  onOpenResource,
  onPlay,
}) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("Todos");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [videoError, setVideoError] = useState("");
  const items = useMemo(
    () => libraryItems(courses, replays),
    [courses, replays],
  );
  const filtered = items.filter(
    (item) =>
      (type === "Todos" || item.type === type) &&
      [item.title, item.courseTitle, item.lessonTitle, item.description]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  async function open(item) {
    if (busy) return;
    setError("");
    setBusy(item.key);
    try {
      if (item.course) await onSelectCourse(item.course);
      else if (item.video) {
        const result = await onPlay(item.video);
        setVideoError("");
        setPlaying({ title: item.title, url: result.url });
      } else {
        const result = await onOpenResource(item.resource);
        const link = document.createElement("a");
        link.href = result.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        if (result.sourceType === "storage")
          link.download = result.fileName || item.title;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (failure) {
      setError(
        failure.message || "No se pudo abrir el contenido. Intenta nuevamente.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="space-y-7">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
      <header className="border-l-[3px] border-brand py-1 pl-4 sm:pl-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Explora y aprende</p>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-[28px]">Tu biblioteca de posibilidades.</h1>
        <p className="mt-2 max-w-xl text-xs leading-6 text-subtle sm:text-sm">Encuentra programas, talleres y materiales para seguir aprendiendo a tu ritmo.</p>
      </header>
        <div className="relative w-full shrink-0 sm:max-w-72 lg:w-64">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle"
          />
          <input
            aria-label="Buscar contenido"
            type="search"
            placeholder="Buscar en la biblioteca..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full !min-h-9 !rounded-xl !border-line !bg-surface !py-2 !pl-9 !text-[11px] shadow-sm focus:!border-brand"
          />
        </div>
      </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-subtle">
          <span>{filtered.length} {filtered.length === 1 ? 'contenido disponible' : 'contenidos disponibles'}</span>
          {(search || type !== 'Todos') && <button type="button" className="font-semibold text-brand hover:underline" onClick={() => { setSearch(''); setType('Todos'); }}>Limpiar filtros</button>}
        </div>
      <div className="flex flex-wrap gap-2">
        {[
          "Todos",
          "Cursos",
          "Masterclasses",
          "Talleres",
          "Grabaciones",
          "Recursos",
        ].map((label) => {
          const count =
            label === "Todos"
              ? items.length
              : items.filter((item) => item.type === label).length;
          return (
            <button
              key={label}
              onClick={() => setType(label)}
              aria-pressed={type === label}
              className={
                "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[11px] font-semibold transition " +
                (type === label
                  ? "border-brand bg-brand text-on-brand shadow-sm shadow-brand/10"
                  : "border-line bg-surface text-subtle hover:border-brand/30 hover:text-brand")
              }
            >
              {label}
              <span
                className={
                  "rounded-md px-1.5 py-0.5 text-[9px] " +
                  (type === label ? "bg-on-brand/15" : "bg-elevated")
                }
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
      {error && <p role="alert">{error}</p>}
      {!filtered.length ? (
        <EmptyState
          icon={Library}
          title="Sin contenido disponible"
          description="Los materiales publicados de tus programas aparecerán aquí. Prueba otra categoría o búsqueda."
        />
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>article]:max-w-none">
          {filtered.map((item) =>
            item.course ? (
              <CourseCard
                key={item.key}
                course={item.course}
                onSelect={onSelectCourse}
              />
            ) : (
              <article
                key={item.key}
                className="group flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-line bg-surface shadow-panel transition hover:border-brand/25"
              >
                {item.video ? (
                  <div className="relative h-40 overflow-hidden bg-elevated">
                    <img
                      src={item.thumbnail}
                      alt=""
                      className="size-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-surface/95 text-brand shadow-sm">
                      <Play size={14} fill="currentColor" />
                    </span>
                  </div>
                ) : (
                  <div className="flex h-28 items-center justify-between border-b border-line bg-linear-to-br from-brand-soft to-elevated px-6">
                    <span className="flex size-12 items-center justify-center rounded-2xl border border-brand-line/70 bg-surface text-brand">
                      <FileText size={24} strokeWidth={1.4} />
                    </span>
                    <span className="rounded-lg border border-line bg-surface/70 px-2 py-1 text-[9px] font-bold uppercase text-subtle">
                      {item.resourceType || "Material"}
                    </span>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <span className="mb-3 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-brand">
                    {item.video ? <Film size={11} /> : <FileText size={11} />}{" "}
                    {item.type}
                  </span>
                  <h3 className="text-sm leading-6">{item.title}</h3>
                  <p className="mt-2 text-[11px] leading-5 text-subtle">
                    {item.courseTitle || item.description}
                  </p>
                  {item.lessonTitle && (
                    <p className="mt-1 text-[10px] text-subtle">
                      Lección: {item.lessonTitle}
                    </p>
                  )}
                  <button
                    disabled={busy !== null}
                    className="btn btn-secondary mt-auto pt-5 w-full"
                    onClick={() => open(item)}
                  >
                    {busy === item.key ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : item.video ? (
                      <Play size={13} />
                    ) : (
                      <Download size={14} />
                    )}{" "}
                    {busy === item.key
                      ? "Abriendo..."
                      : item.video
                        ? "Ver grabación"
                        : "Abrir recurso"}
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </article>
            ),
          )}
        </div>
      )}
      <Dialog
        open={!!playing}
        onClose={() => setPlaying(null)}
        title={playing?.title || "Grabación"}
        className="max-w-4xl"
      >
        {playing && (
          <video
            controls
            autoPlay
            src={playing.url}
            className="aspect-video w-full rounded-xl bg-slate-950"
            onError={() =>
              setVideoError(
                "No se pudo reproducir la grabación. Vuelve a abrirla.",
              )
            }
          />
        )}{" "}
        {videoError && (
          <p role="alert" className="mt-4">
            {videoError}
          </p>
        )}
      </Dialog>
    </section>
  );
}
export default LibraryView;
