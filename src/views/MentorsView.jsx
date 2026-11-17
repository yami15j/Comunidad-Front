import React, { useEffect, useState } from "react";
import {
  GraduationCap,
  ArrowLeft,
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
export function MentorsView({ mentors = [], courses = [], onSelectCourse, fullPageProfile = false, onSaveProfile }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => {
    if (editing) return;
    setSelected(current => {
      if (!current) return current;
      const latest = mentors.find(mentor => mentor.id === current.id) || null;
      return JSON.stringify(current) === JSON.stringify(latest) ? current : latest;
    });
  }, [mentors, editing]);
  function startEditing() {
    setDraft({ fullName: selected.name || "", title: selected.title || "", company: selected.company || "", bio: selected.bio || "", linkedin: selected.linkedin || "", website: selected.website || "" });
    setSaveError(""); setEditing(true);
  }
  async function saveProfile(event) {
    event.preventDefault(); if (!editing || saving || !draft.fullName?.trim()) return;
    setSaving(true); setSaveError("");
    try { const updated = await onSaveProfile(selected.id, { ...draft, fullName: draft.fullName.trim() }); setSelected(updated); setEditing(false); setNotice("Guardado exitosamente"); }
    catch (error) { setSaveError(error.message || "No se pudo guardar el perfil."); }
    finally { setSaving(false); }
  }
  const visible = mentors.filter((mentor) =>
    [mentor.name, mentor.role, mentor.company]
      .join(" ")
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  const assigned = selected
    ? courses.filter((course) => course.docenteId === selected.id)
    : [];
  const profileValues = editing ? draft : { fullName: selected?.name || "", title: selected?.title || "", company: selected?.company || "", bio: selected?.bio || "", linkedin: selected?.linkedin || "", website: selected?.website || "" };
  if (selected && fullPageProfile) return (
    <section className="mx-auto w-full min-w-0 max-w-7xl space-y-5 pb-6">
      <button type="button" disabled={saving} onClick={() => { setSelected(null); setEditing(false); setSaveError(""); }} className="inline-flex items-center gap-2 rounded-lg py-2 text-xs font-semibold text-muted transition hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"><ArrowLeft size={15} />Volver a mentores</button>
      {notice && <div role="status" className="fixed right-6 top-24 z-50 rounded-xl border border-emerald-200 bg-surface px-4 py-3 text-xs font-semibold text-emerald-700 shadow-lg">{notice}</div>}
      <header className="flex flex-wrap items-center gap-4 border-b border-line pb-6">
        <Avatar name={selected.name} src={selected.avatar} className="size-16 shrink-0 !text-xl sm:size-20" />
        <div className="min-w-0 flex-1"><p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-brand">Perfil del mentor</p><h1 className="break-words text-xl font-bold tracking-tight text-ink sm:text-2xl">{selected.name}</h1><p className="mt-2 text-xs text-subtle">{[selected.role, selected.company].filter(Boolean).join(" · ")}</p></div>
        <span className="rounded-lg bg-brand-soft px-3 py-2 text-xs font-semibold text-brand">{assigned.length} {assigned.length === 1 ? "curso asignado" : "cursos asignados"}</span>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <form id="mentor-profile-edit" onSubmit={saveProfile} className="rounded-xl border border-line bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-bold text-ink">Datos del perfil</h2>{onSaveProfile && <button type="button" onClick={startEditing} disabled={editing || saving} className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-default disabled:opacity-50">Editar perfil</button>}</div><p className="mt-1 text-xs text-subtle">Los cambios se aplicarán al pulsar Guardar cambios.</p>
        <fieldset disabled={!editing || saving} className="mt-5 grid gap-4 sm:grid-cols-2">
          {[["fullName", "Nombre completo", 120], ["title", "Especialidad o cargo", 160], ["company", "Empresa u organización", 160], ["linkedin", "LinkedIn", 2048], ["website", "Sitio web", 2048]].map(([key, label, max]) => <label key={key} className="grid gap-2 text-xs font-semibold text-muted">{label}<input type={key === "linkedin" || key === "website" ? "url" : "text"} required={key === "fullName"} maxLength={max} value={profileValues[key] || ""} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} className="w-full !rounded-lg !border-line !bg-elevated/30 !text-xs focus:!border-brand" /></label>)}
          <label className="grid gap-2 text-xs font-semibold text-muted sm:col-span-2">Biografía y experiencia<textarea rows={6} maxLength={2000} value={profileValues.bio || ""} onChange={event => setDraft(current => ({ ...current, bio: event.target.value }))} className="w-full resize-y rounded-lg border border-line bg-elevated/30 p-3 text-xs font-normal leading-6 focus:border-brand focus:outline-none" /><span className="text-right text-[10px] font-normal text-subtle">{profileValues.bio?.length || 0}/2000</span></label>
        </fieldset>
        {saveError && <p role="alert" className="mt-4 text-xs text-danger">{saveError}</p>}
        {onSaveProfile && <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          {editing && <button type="button" disabled={saving} onClick={() => { setEditing(false); setSaveError(""); }} className="rounded-lg border border-line px-4 py-2 text-xs font-semibold text-muted disabled:opacity-50">Cancelar</button>}
          <button type="submit" disabled={!editing || saving || !draft.fullName?.trim()} className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Guardando…" : "Guardar cambios"}</button>
        </div>}
      </form>
        <section className="min-w-0"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-bold text-ink">Programas que imparte</h2><span className="text-[10px] text-subtle">{assigned.length} en total</span></div>
          {assigned.length ? <div className="overflow-hidden rounded-xl border border-line bg-surface divide-y divide-line">{assigned.map(course => <button key={course.id} type="button" disabled={!onSelectCourse || saving} aria-label={"Ver curso " + course.title} onClick={() => { setSelected(null); onSelectCourse?.(course); }} className="group flex w-full min-w-0 items-center gap-3 p-4 text-left transition hover:bg-elevated/50 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-brand">{course.thumbnail ? <img src={course.thumbnail} alt="" className="h-11 w-14 shrink-0 rounded-lg object-cover" /> : <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"><BookOpen size={18} /></span>}<span className="min-w-0 flex-1"><span className="block break-words text-xs font-bold text-ink">{course.title}</span><span className="mt-1 block text-[10px] text-subtle">{course.category || "Sin categoría"}</span></span><ArrowUpRight size={15} className="shrink-0 text-subtle transition group-hover:text-brand" /></button>)}</div> : <div className="rounded-xl border border-dashed border-line p-6 text-center text-xs leading-6 text-subtle">Este mentor aún no tiene cursos asignados.</div>}
        </section>
      </div>
    </section>
  );
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
