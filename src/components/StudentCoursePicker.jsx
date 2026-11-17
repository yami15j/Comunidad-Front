import React, { useState } from 'react';
import { Check, ChevronDown, Search, BookOpen, Save } from 'lucide-react';
import { Dialog } from './ui';

function enrollmentStatus(row, now = Date.now()) {
  if (!row) return 'available';
  if (row.status !== 'active') return 'suspended';
  if (row.expires_at && new Date(row.expires_at).getTime() <= now) return 'expired';
  return 'active';
}

export function StudentCoursePicker({ student, courses, enrollments, selected = [], onChange, loading, error, onRetry, busy, plain = false, removed = [], onRemoveChange, onSave }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rows = enrollments.filter(row => row.student_id === student.id);
  const active = rows.filter(row => enrollmentStatus(row) === 'active');
  const filtered = courses.filter(course => course.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <>
    <button type="button" onClick={() => setOpen(true)} disabled={busy}
      className={"flex w-full items-center gap-3 text-left transition-colors " + (plain ? "border-0 bg-transparent py-2 hover:text-brand" : "rounded-2xl border border-line bg-surface p-3 hover:border-brand/40 hover:bg-brand-soft/30")}>
      <span className="min-w-0 flex-1"><span className="block text-xs font-bold">Cursos del estudiante</span>
        <span className="mt-1 block text-[11px] text-subtle">{loading ? 'Consultando matrículas...' : error ? 'No se pudieron consultar las matrículas' : `${active.length} ${active.length === 1 ? 'curso matriculado' : 'cursos matriculados'}`}</span>
        {selected.length > 0 && <span className="mt-1 block text-[11px] font-semibold text-brand">{selected.length} por matricular</span>}
      </span><ChevronDown size={15} className="text-subtle" />
    </button>
    <Dialog open={open} onClose={() => { if (!busy) setOpen(false); }} title={<span className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><BookOpen size={20} /></span><span><span className="block text-base font-bold">Gestionar cursos</span><span className="mt-0.5 block text-[11px] font-medium text-subtle">{student.name}</span></span></span>} className="!max-w-xl !rounded-2xl [&>div:first-child]:!py-4 [&>div:last-child]:!pt-4">
      <p className="mb-4 text-[11px] leading-5 text-subtle">Marca los cursos para matricular y desmarca los matriculados para quitar su acceso.</p>
      {loading ? <p role="status">Consultando matrículas...</p> : error ? <div role="alert"><p>{error}</p><button className="btn btn-secondary mt-3" onClick={onRetry}>Reintentar</button></div> : <>
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] text-subtle">
          <span>Matriculados <strong className="ml-1 text-xs font-bold text-ink">{active.length}</strong></span>
          <span>Por agregar <strong className="ml-1 text-xs font-bold text-brand">{selected.length}</strong></span>
          <span>Por quitar <strong className="ml-1 text-xs font-bold text-rose-600">{removed.length}</strong></span>
        </div>
        <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" /><input aria-label={`Buscar cursos para ${student.name}`} placeholder="Buscar un curso..." value={search} onChange={event => setSearch(event.target.value)} className="w-full !rounded-xl !bg-elevated/40 !pl-9 !text-xs" /></div>
        <fieldset disabled={busy} aria-label={`Cursos para ${student.name}`} className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {filtered.map(course => {
            const row = rows.find(item => item.course_id === course.id);
            const status = enrollmentStatus(row);
            const enrolled = status === 'active';
            const removing = removed.includes(course.id);
            const checked = selected.includes(course.id);
            const restricted = status === 'suspended' || status === 'expired';
            return <label key={course.id} className={`group flex items-center gap-3 rounded-xl border px-3.5 py-3 transition duration-150 ${removing ? 'border-danger-line bg-danger-soft' : enrolled ? 'border-success-line bg-success-soft' : checked ? 'border-brand/40 bg-brand-soft' : 'border-line bg-surface hover:border-brand/40 hover:bg-elevated/40'} ${!restricted ? 'cursor-pointer' : 'opacity-70'}`}>
              <input type="checkbox" className="!w-4 !h-4 shrink-0 accent-sky-600 cursor-pointer disabled:cursor-not-allowed" checked={(enrolled && !removing) || checked} disabled={restricted || (enrolled && !onRemoveChange)}
                onChange={event => enrolled ? onRemoveChange(event.target.checked ? removed.filter(id => id !== course.id) : [...removed, course.id]) : onChange(event.target.checked ? [...selected, course.id] : selected.filter(id => id !== course.id))} />
              <span className="min-w-0 flex-1"><span className="block text-xs font-bold">{course.title}</span>
                <span className="mt-1 block text-[10px] text-subtle">{restricted ? 'Revisa este acceso en Accesos por programa' : row?.access_type === 'live' ? 'Solo clases en vivo' : row?.access_type === 'content' ? 'Contenido y grabaciones' : course.category || 'Programa de formación'}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${removing ? 'bg-danger-soft text-danger' : enrolled ? 'bg-success-soft text-success' : restricted ? 'bg-warning-soft text-warning' : 'bg-elevated text-subtle'}`}>
                {removing ? "Por quitar" : enrolled ? <span className="flex items-center gap-1"><Check size={11} />Matriculado</span> : status === 'suspended' ? 'Suspendido' : status === 'expired' ? 'Vencido' : checked ? 'Seleccionado' : 'Disponible'}
              </span>
            </label>;
          })}
          {!filtered.length && <p className="py-6 text-center text-xs text-subtle">No hay cursos para mostrar.</p>}
        </fieldset>
        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-60 text-[10px] leading-5 text-subtle">Quitar un curso suspende el acceso y conserva el progreso.</p><div className="flex shrink-0 justify-end gap-2"><button type="button" disabled={busy} className="btn btn-secondary !min-h-9 !rounded-xl !px-3 !text-xs" onClick={() => setOpen(false)}>Listo</button>{onSave && <button type="button" disabled={busy || (!selected.length && !removed.length)} className="btn btn-primary !min-h-9 !rounded-xl !px-3 !text-xs" onClick={async () => { if (await onSave()) setOpen(false); }}><Save size={14} />{busy ? "Guardando..." : "Guardar cambios"}</button>}</div></div>
      </>}
    </Dialog>
  </>;
}
