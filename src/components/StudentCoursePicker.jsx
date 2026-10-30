import React, { useState } from 'react';
import { Check, CheckCircle2, ChevronDown, Search } from 'lucide-react';
import { Dialog } from './ui';

function enrollmentStatus(row, now = Date.now()) {
  if (!row) return 'available';
  if (row.status !== 'active') return 'suspended';
  if (row.expires_at && new Date(row.expires_at).getTime() <= now) return 'expired';
  return 'active';
}

export function StudentCoursePicker({ student, courses, enrollments, selected = [], onChange, loading, error, onRetry, busy }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rows = enrollments.filter(row => row.student_id === student.id);
  const active = rows.filter(row => enrollmentStatus(row) === 'active');
  const filtered = courses.filter(course => course.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <>
    <button type="button" onClick={() => setOpen(true)} disabled={busy}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left transition-colors hover:border-brand/40 hover:bg-brand-soft/30">
      <span className="min-w-0 flex-1"><span className="block text-xs font-bold">Cursos del estudiante</span>
        <span className="mt-1 block text-[11px] text-subtle">{loading ? 'Consultando matrículas...' : error ? 'No se pudieron consultar las matrículas' : `${active.length} ${active.length === 1 ? 'curso matriculado' : 'cursos matriculados'}`}</span>
        {selected.length > 0 && <span className="mt-1 block text-[11px] font-semibold text-brand">{selected.length} por matricular</span>}
      </span><ChevronDown size={15} className="text-subtle" />
    </button>
    <Dialog open={open} onClose={() => { if (!busy) setOpen(false); }} title={`Cursos de ${student.name}`} className="max-w-xl">
      <p className="mb-4 text-xs leading-6 text-subtle">Consulta sus matrículas y marca los cursos que deseas agregar.</p>
      {loading ? <p role="status">Consultando matrículas...</p> : error ? <div role="alert"><p>{error}</p><button className="btn btn-secondary mt-3" onClick={onRetry}>Reintentar</button></div> : <>
        <div className="mb-4 flex flex-wrap gap-2"><span className="badge badge-emerald"><CheckCircle2 size={12} /> {active.length} matriculados</span><span className="badge">{selected.length} seleccionados</span></div>
        <div className="relative mb-4"><Search size={15} className="absolute left-3 top-3 text-subtle" /><input aria-label={`Buscar cursos para ${student.name}`} placeholder="Buscar un curso..." value={search} onChange={event => setSearch(event.target.value)} className="w-full !pl-9" /></div>
        <fieldset disabled={busy} aria-label={`Cursos para ${student.name}`} className="max-h-80 space-y-2 overflow-y-auto">
          {filtered.map(course => {
            const row = rows.find(item => item.course_id === course.id);
            const status = enrollmentStatus(row);
            const enrolled = status === 'active';
            const checked = selected.includes(course.id);
            const restricted = status === 'suspended' || status === 'expired';
            return <label key={course.id} className={`flex items-center gap-3 rounded-xl border p-3 ${enrolled ? 'border-success-line bg-success-soft' : checked ? 'border-brand/40 bg-brand-soft' : 'border-line bg-surface'} ${status === 'available' ? 'cursor-pointer' : ''}`}>
              <input type="checkbox" className="!w-4 !h-4 shrink-0 accent-sky-600" checked={enrolled || checked} disabled={status !== 'available'}
                onChange={event => onChange(event.target.checked ? [...selected, course.id] : selected.filter(id => id !== course.id))} />
              <span className="min-w-0 flex-1"><span className="block text-xs font-bold">{course.title}</span>
                <span className="mt-1 block text-[10px] text-subtle">{restricted ? 'Revisa este acceso en Accesos por programa' : row?.access_type === 'live' ? 'Solo clases en vivo' : row?.access_type === 'content' ? 'Contenido y grabaciones' : course.category || 'Programa de formación'}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${enrolled ? 'bg-success-soft text-success' : restricted ? 'bg-warning-soft text-warning' : 'bg-elevated text-subtle'}`}>
                {enrolled ? <span className="flex items-center gap-1"><Check size={11} />Matriculado</span> : status === 'suspended' ? 'Suspendido' : status === 'expired' ? 'Vencido' : checked ? 'Seleccionado' : 'Disponible'}
              </span>
            </label>;
          })}
          {!filtered.length && <p className="py-6 text-center text-xs text-subtle">No hay cursos para mostrar.</p>}
        </fieldset>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4"><p className="text-[11px] text-subtle">Las matrículas existentes se conservan.</p><button type="button" disabled={busy} className="btn btn-primary" onClick={() => setOpen(false)}>Listo{selected.length ? ` · ${selected.length} seleccionados` : ''}</button></div>
      </>}
    </Dialog>
  </>;
}
