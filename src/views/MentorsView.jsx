import React, { useState } from "react";
import {
  GraduationCap,
  ArrowUpRight,
  BookOpen,
  Search,
  Globe,
  Link2,
} from "lucide-react";
import { Avatar, Dialog, EmptyState } from "../components/ui";
function publicLink(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export function MentorsView({ mentors = [], courses = [], onSelectCourse }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const visible = mentors.filter((mentor) =>
    [mentor.name, mentor.role, mentor.company]
      .join(" ")
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  const assigned = selected
    ? courses.filter((course) => course.docenteId === selected.id)
    : [];
  return (
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="border-l-[3px] border-brand py-1 pl-4 sm:pl-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Personas que te impulsan</p>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-[28px]">Aprende de la experiencia.</h1>
          <p className="mt-2 max-w-xl text-xs leading-6 text-subtle">Conoce a tu mentor, su trayectoria y los programas que imparte.</p>
        </div>
      <div className="relative w-full shrink-0 sm:max-w-72 lg:w-64">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle"
        />
        <input
          type="search"
          aria-label="Buscar mentores"
          placeholder="Buscar por nombre o especialidad..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full !min-h-9 !rounded-xl !py-2 !pl-10 !text-[11px]"
        />
      </div>
      </header>
      {!visible.length ? (
        <EmptyState
          icon={GraduationCap}
          title={search ? "No hay resultados para esta búsqueda" : "Aún no tienes un mentor asignado"}
          description="Tu mentor se mostrará aquí cuando administración lo asigne."
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),340px))] gap-4">
          {visible.map((mentor) => (
            <article
              key={mentor.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-panel transition hover:-translate-y-0.5 hover:border-brand/30"
            >
              <div className="h-14 border-b border-brand-line/30 bg-linear-to-br from-brand-soft to-elevated" />
              <div className="flex flex-1 flex-col px-4 pb-4">
                <div className="relative -mt-6 mb-3 flex w-fit rounded-full bg-surface p-1">
                  <Avatar
                    name={mentor.name}
                    src={mentor.avatar}
                    className="size-12 !text-lg"
                  />
                </div>
                <h2 className="text-base font-bold tracking-tight">{mentor.name}</h2>
                <p className="mt-1 text-[11px] font-semibold text-brand">
                  {mentor.role}
                </p>
                {mentor.company && (
                  <p className="mt-1 text-[11px] text-subtle">
                    {mentor.company}
                  </p>
                )}
                <p className="my-3 line-clamp-3 text-[11px] leading-5 text-subtle">
                  {mentor.bio ||
                    "Este mentor aún no ha completado su biografía."}
                </p>
                <div className="mt-auto border-t border-line pt-3">
                  <button
                    className="flex w-full items-center justify-between rounded-lg bg-brand-soft/60 px-3 py-2.5 text-[11px] font-semibold text-brand transition-colors hover:bg-brand-soft"
                    onClick={() => setSelected(mentor)}
                  >
                    Ver perfil y programas
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Perfil del mentor"
      >
        {selected && (
          <>
            <div className="flex items-center gap-4">
              <Avatar
                name={selected.name}
                src={selected.avatar}
                className="size-20 !text-xl"
              />
              <div>
                <h2 className="text-xl">{selected.name}</h2>
                <p className="mt-1 text-xs font-semibold text-brand">
                  {selected.role}
                </p>
                <p className="mt-1 text-[11px] text-subtle">
                  {selected.company}
                </p>
              </div>
            </div>
            <h3 className="mt-7 mb-3 text-sm">Su experiencia</h3>
            <p className="whitespace-pre-wrap text-xs leading-7 text-muted">
              {selected.bio || "Biografía pendiente."}
            </p>
            <div className="mt-4 flex gap-2">
              {[
                ["linkedin", "LinkedIn", Link2],
                ["website", "Sitio web", Globe],
              ].map(
                ([key, label, Icon]) =>
                  publicLink(selected[key]) && (
                    <a
                      key={key}
                      className="btn btn-secondary btn-sm"
                      href={publicLink(selected[key])}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon size={13} />
                      {label}
                      <ArrowUpRight size={11} />
                    </a>
                  ),
              )}
            </div>
            <div className="mt-7 border-t border-line pt-6">
              <h3 className="mb-4 text-sm">Programas que imparte</h3>
              {assigned.length ? (
                <div className="space-y-3">
                  {assigned.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-3 rounded-xl border border-line bg-elevated/50 p-4"
                    >
                      <BookOpen size={18} className="shrink-0 text-brand" />
                      <p className="flex-1 text-xs font-bold">{course.title}</p>
                      <button
                        aria-label={"Ver curso " + course.title}
                        className="icon-button"
                        disabled={!onSelectCourse}
                        onClick={() => {
                          setSelected(null);
                          onSelectCourse(course);
                        }}
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs leading-6 text-subtle">
                  No tiene cursos asignados visibles para tu cuenta.
                </p>
              )}
            </div>
          </>
        )}
      </Dialog>
    </section>
  );
}
export default MentorsView;
