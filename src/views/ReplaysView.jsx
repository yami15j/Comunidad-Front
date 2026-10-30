import React, { useState } from "react";
import {
  Film,
  Play,
  Search,
  CalendarDays,
  Clock3,
  LoaderCircle,
} from "lucide-react";
import { Dialog, EmptyState } from "../components/ui";
export function ReplaysView({ replays = [], onNavigate, onPlay }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [playing, setPlaying] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const categories = [
    ...new Set(replays.map((item) => item.category).filter(Boolean)),
  ];
  const filtered = replays.filter(
    (item) =>
      [item.title, item.mentor, item.courseTitle]
        .join(" ")
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()) &&
      (category === "all" || category === item.category),
  );
  async function open(video) {
    if (busy) return;
    setBusy(video.id);
    setError("");
    try {
      const access = await onPlay(video);
      setPlaying({ ...video, url: access.url });
    } catch (failure) {
      setError(failure.message || "No se pudo reproducir el video.");
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="border-l-[3px] border-brand py-1 pl-4 sm:pl-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Aprendizaje a tu ritmo</p>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-[28px]">Vuelve a los mejores momentos.</h1>
          <p className="mt-2 max-w-xl text-xs leading-6 text-subtle sm:text-sm">Tus clases y talleres grabados, listos para ver cuando lo necesites.</p>
        </div>
        {onNavigate && (
            <button
              className="btn btn-secondary self-start shrink-0 !min-h-9 !rounded-xl !px-4 !py-2 !text-xs lg:self-center"
              onClick={() => onNavigate("live")}
            >
              Ver clases en vivo
            </button>
          )}
      </header>
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle"
          />
          <input
            className="w-full !rounded-xl !border-line !bg-elevated/50 !py-2.5 !pl-10 !text-xs focus:!border-brand"
            type="search"
            aria-label="Buscar grabaciones"
            placeholder="Buscar por tema, curso o mentor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Categoría de grabaciones"
          className="w-full !rounded-xl !py-2.5 !text-xs sm:!w-48"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">Todas las categorías</option>
          {categories.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[10px] text-subtle">
          <span>{filtered.length} {filtered.length === 1 ? 'grabación disponible' : 'grabaciones disponibles'}</span>
          {(search || category !== 'all') && <button type="button" className="font-semibold text-brand hover:underline" onClick={() => { setSearch(''); setCategory('all'); }}>Limpiar filtros</button>}
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      {filtered.length ? (
        <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-[22px] border border-line bg-surface shadow-panel transition hover:-translate-y-1 hover:border-brand/25"
            >
              <button
                className="relative block aspect-video w-full overflow-hidden bg-elevated"
                onClick={() => open(item)}
                disabled={busy !== null}
                aria-label={"Reproducir " + item.title}
              >
                <img
                  src={item.thumbnail}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-linear-to-t from-slate-950/45 to-transparent" />
                <span className="absolute top-3 left-3 rounded-lg bg-surface/95 px-2.5 py-1 text-[9px] font-bold text-brand">
                  GRABACIÓN
                </span>
                <span className="absolute top-1/2 left-1/2 flex size-12 -translate-1/2 items-center justify-center rounded-full border border-line/50 bg-surface/95 text-brand shadow-lg">
                  {busy === item.id ? (
                    <LoaderCircle size={20} className="animate-spin" />
                  ) : (
                    <Play size={19} fill="currentColor" className="ml-0.5" />
                  )}
                </span>
                <span className="absolute right-3 bottom-3 rounded-md bg-slate-950/70 px-2 py-1 text-[9px] font-semibold text-white">
                  {item.duration}
                </span>
              </button>
              <div className="p-5">
                <p className="mb-2 truncate text-[9px] font-bold uppercase tracking-wider text-brand">
                  {item.courseTitle || item.category}
                </p>
                <h3 className="text-sm leading-6">{item.title}</h3>
                <p className="mt-2 text-[11px] text-subtle">{item.mentor}</p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-[10px] text-subtle">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={12} />
                    {item.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={12} />
                    {item.duration}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Film}
          title="Las grabaciones aparecerán aquí"
          description="No hay grabaciones publicadas que coincidan con tu búsqueda. Cuando se publique una clase de tus cursos, podrás volver a verla desde este espacio."
        />
      )}
      <Dialog
        open={!!playing}
        onClose={() => setPlaying(null)}
        title={playing?.title || "Grabación"}
        className="max-w-4xl"
      >
        {playing && (
          <>
            <video
              src={playing.url}
              controls
              autoPlay
              className="aspect-video w-full rounded-xl bg-slate-950"
              onError={() =>
                setError(
                  "No se pudo reproducir el video. Vuelve a abrir la grabación.",
                )
              }
            />
            <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-subtle">
              <span>{playing.mentor}</span>
              <span>·</span>
              <span>{playing.duration}</span>
            </div>
            {playing.description && (
              <p className="mt-3 text-xs leading-6 text-muted">
                {playing.description}
              </p>
            )}
          </>
        )}
      </Dialog>
    </section>
  );
}
export default ReplaysView;
