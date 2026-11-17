import React, { useState } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Search, Save } from "lucide-react";

export function CourseAssignmentsView({ account, courses, enrollments, selected, removed, onSelect, onRemove, onBack, onSave, busy, loading, error, onRetry }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [saveError, setSaveError] = useState("");
  const mentor = account.role === "mentor" || account.role === "docente";
  const stateFor = course => {
    if (mentor) return course.docenteId === account.id ? "assigned" : "available";
    const row = enrollments.find(item => item.student_id === account.id && item.course_id === course.id);
    if (!row) return "available";
    if (row.status !== "active") return "suspended";
    if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return "expired";
    return "assigned";
  };
  const assigned = courses.filter(course => stateFor(course) === "assigned").length;
  const filtered = courses.filter(course => `${course.title} ${course.category || ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()) && (filter === "all" || (filter === "assigned" ? stateFor(course) === "assigned" : filter === "changes" ? selected.includes(course.id) || removed.includes(course.id) : stateFor(course) === "available")));
  const pages = Math.max(1, Math.ceil(filtered.length / 12));
  const currentPage = Math.min(page, pages - 1);
  const changeCount = selected.length + removed.length;
  return <section className="space-y-5" aria-label={`Asignación de cursos de ${account.name}`}>
    <button type="button" className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-brand" disabled={busy} onClick={onBack}><ArrowLeft size={16} />Volver a usuarios</button>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-[10px] font-bold uppercase tracking-widest text-brand">Asignación de cursos</p><h1 className="mt-1 !text-2xl">{account.name}</h1><p className="mt-1 text-xs text-subtle">{mentor ? "Mentor" : "Estudiante"} · {account.email}</p></div>
      <div className="flex w-full min-w-0 flex-nowrap items-center gap-3 lg:w-auto lg:flex-1 lg:justify-end"><div className="relative min-w-0 flex-1 lg:max-w-[320px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" /><input aria-label={`Buscar cursos para ${account.name}`} placeholder="Buscar curso o categoría..." value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} className="w-full !pl-9 !text-xs" /></div><button type="button" className="btn btn-primary !min-h-9 !rounded-lg !px-3 !py-2 !text-xs" disabled={busy || loading || Boolean(error) || !changeCount} onClick={async () => { setSaveError(""); if (!await onSave()) setSaveError("No se guardaron todos los cambios. Revisa el aviso y vuelve a intentarlo."); }}><Save size={13} />{busy ? "Guardando..." : "Guardar cambios"}</button></div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">

      <div className="flex flex-wrap gap-1">{[["all", "Todos"], ["assigned", mentor ? "Asignados" : "Matriculados"], ["available", "Disponibles"], ["changes", "Cambios"]].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => { setFilter(value); setPage(0); }} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === value ? "bg-brand-soft text-brand" : "text-subtle hover:bg-elevated"}`}>{label}</button>)}</div>
    </div>
    <div className="flex flex-wrap justify-end gap-5">
      <span className="inline-flex items-center gap-2 py-1 text-[11px] font-medium text-emerald-800"><strong className="text-sm font-extrabold tabular-nums">{assigned}</strong>{mentor ? "asignados" : "matriculados"}</span>
      <span className="inline-flex items-center gap-2 py-1 text-[11px] font-medium text-brand"><strong className="text-sm font-extrabold tabular-nums">{changeCount}</strong>cambios pendientes</span>
    </div>
    <div className="relative -top-10 space-y-5">
    <p className="text-xs text-subtle">{mentor ? "Selecciona los cursos que impartirá este mentor. Los cursos de otro mentor se reasignarán al guardar." : "Marca para matricular o reactivar. Desmarca para suspender. Los cambios se aplican al guardar."}</p>
    {error && <div role="alert">{error}<button className="btn btn-secondary ml-3" onClick={onRetry}>Reintentar</button></div>}
    {saveError && <p role="alert">{saveError}</p>}

    {loading ? <p role="status" className="py-12 text-center text-subtle">Cargando cursos...</p> : <fieldset disabled={busy || Boolean(error)} aria-label={`Cursos para ${account.name}`} className="overflow-hidden rounded-xl border border-line bg-surface">
      <div aria-hidden="true" className="flex items-center justify-between border-b border-line bg-elevated/60 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-subtle"><span className="pl-7">Materia</span><span>Estado</span></div>
      {filtered.slice(currentPage * 12, (currentPage + 1) * 12).map(course => {
        const state = stateFor(course), removing = removed.includes(course.id), adding = selected.includes(course.id);
        const locked = state === "expired" || (mentor && state === "assigned");
        return <label key={course.id} className={`flex min-w-0 cursor-pointer items-center gap-3 border-b px-4 py-3 transition last:border-b-0 ${removing ? "border-danger-line bg-danger-soft" : adding ? "border-brand bg-brand-soft" : state === "assigned" ? "border-line bg-surface" : "border-line bg-surface hover:bg-elevated/40"} ${locked ? "cursor-default" : ""}`}>
          <div className="flex shrink-0 items-center"><input type="checkbox" aria-label={`Seleccionar ${course.title}`} checked={(state === "assigned" && !removing) || adding} disabled={locked} onChange={event => {
            if (state === "assigned") onRemove(event.target.checked ? removed.filter(id => id !== course.id) : [...removed, course.id]);
            else onSelect(event.target.checked ? [...selected, course.id] : selected.filter(id => id !== course.id));
          }} /></div>
          <div className="min-w-0 flex-1"><h3 className="!text-xs leading-5">{course.title}</h3><p className="mt-0.5 text-[10px] text-subtle">{course.category || "Sin categoría"}</p>{mentor && state !== "assigned" && course.docenteId && <p className="mt-0.5 text-[10px] text-warning">Mentor actual: {course.mentorName || "Otro mentor"}</p>}{!mentor && state === "assigned" && <p className="mt-0.5 text-[10px] text-subtle">{enrollments.find(item => item.student_id === account.id && item.course_id === course.id)?.access_type === "content" ? "Contenido y grabaciones" : "Acceso al curso"}</p>}</div>
          {!mentor && <span className="shrink-0 text-[10px] text-subtle" title="Suspensiones registradas desde la activación del contador">{enrollments.find(item => item.student_id === account.id && item.course_id === course.id)?.suspension_count || 0} suspensiones</span>}
          <span className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${removing ? "bg-danger-soft text-danger" : adding ? "bg-brand-soft text-brand" : state === "assigned" ? "bg-success-soft text-success" : state === "available" ? "bg-elevated text-subtle" : "bg-warning-soft text-warning"}`}>{state === "assigned" && !removing && <Check size={11} />}{removing ? "Por quitar" : adding ? state === "suspended" ? "Por reactivar" : "Por asignar" : state === "assigned" ? mentor ? "Asignado" : "Matriculado" : state === "suspended" ? "Suspendido" : state === "expired" ? "Vencido" : "Disponible"}</span>
        </label>;
      })}
    </fieldset>}
    {!loading && !filtered.length && <div className="rounded-2xl border border-dashed border-line py-14 text-center text-sm text-subtle">No hay cursos para estos filtros.</div>}
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-subtle"><p>{filtered.length} cursos</p><nav aria-label="Páginas de cursos" className="flex items-center gap-3"><button className="icon-button !size-8" aria-label="Página anterior de cursos" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><span>{currentPage + 1} de {pages}</span><button className="icon-button !size-8" aria-label="Página siguiente de cursos" disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></nav></div>

    </div>
  </section>;
}
