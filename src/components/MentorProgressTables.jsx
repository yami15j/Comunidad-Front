import React, { useState } from 'react';
import { Avatar } from './ui';

const percent = value => Math.min(100, Math.max(0, Number(value) || 0));
function Status({ total, progress }) {
  const label = !Number(total) ? 'Sin lecciones' : progress >= 100 ? 'Completado' : progress > 0 ? 'En curso' : 'Sin iniciar';
  const color = label === 'Completado' ? 'bg-success-soft text-success' : label === 'En curso' ? 'bg-brand-soft text-brand' : 'bg-elevated/80 text-subtle';
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${color}`}>{label}</span>;
}
function Progress({ value, children }) {
  const progress = percent(value);
  return <div className="min-w-36 max-w-64">{children && <p className="mb-1 text-[11px] text-subtle">{children}</p>}<div className="flex items-center gap-3"><div className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-line/60" role="progressbar" aria-label="Avance" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className={`h-full rounded-full ${progress >= 100 ? 'bg-success' : 'bg-brand'}`} style={{ width: `${progress}%` }} /></div><strong className={`w-9 shrink-0 text-right text-xs font-semibold tabular-nums ${progress >= 100 ? 'text-success' : progress > 0 ? 'text-brand' : 'text-subtle'}`}>{progress}%</strong></div></div>;
}
const tableClass = 'w-full !min-w-[680px] [&_thead]:!bg-elevated/40 [&_th]:!px-4 [&_th]:!py-2 [&_th]:!text-[11px] [&_th]:!font-medium [&_th]:!normal-case [&_th]:!tracking-normal [&_th]:!text-subtle [&_td]:!border-line/55 [&_td]:!px-4 [&_td]:!py-3 [&_td]:!text-xs [&_tbody_tr]:transition-colors';

export function MentorProgressTables({ courses = [], students = [], view = 'all' }) {
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const query = search.trim().toLocaleLowerCase('es');
  const filtered = students.filter(student => (!courseId || String(student.courseId) === courseId) && `${student.fullName || student.studentName || ''} ${student.email || ''} ${student.courseTitle || ''}`.toLocaleLowerCase('es').includes(query));
  return <div className="grid min-w-0 gap-4">
    {view !== 'students' && <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-panel" aria-label="Cursos asignados">
      <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 py-3.5"><div className="flex items-center gap-2.5"><h2 className="text-sm font-bold tracking-tight">Cursos</h2><span className="inline-flex min-w-6 items-center justify-center rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-brand">{courses.length}</span></div><span className="text-[11px] text-subtle">Contenido y avance académico</span></div>
      <div className="overflow-x-auto overscroll-x-contain"><table className={tableClass} aria-label="Cursos asignados"><thead><tr>{['Curso', 'Módulos', 'Lecciones', 'Estudiantes', 'Progreso promedio', 'Estado'].map(label => <th key={label} scope="col" className={label === 'Estado' ? '!text-right' : ['Módulos', 'Lecciones', 'Estudiantes'].includes(label) ? '!text-center' : ''}>{label}</th>)}</tr></thead><tbody>
        {courses.map(course => <tr key={course.id}><td className="w-[32%] font-medium leading-5 text-ink">{course.title}</td><td className="!text-center tabular-nums text-muted">{course.totalModulesCount || 0}</td><td className="!text-center tabular-nums text-muted">{course.totalLessonsCount || 0}</td><td className="!text-center"><span className="inline-flex min-w-7 items-center justify-center rounded-md bg-brand-soft/65 px-2 py-1 font-semibold tabular-nums text-brand">{course.activeStudents || 0}</span></td><td className="w-1/4"><Progress value={course.averageProgress} /></td><td className="text-right"><Status total={course.totalLessonsCount} progress={percent(course.averageProgress)} /></td></tr>)}
        {!courses.length && <tr><td colSpan={6} className="!py-8 text-center text-subtle">No tienes cursos asignados actualmente.</td></tr>}
      </tbody></table></div>
    </section>}
    {view !== 'courses' && <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-panel" aria-label="Progreso de estudiantes">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4"><div><h2 className="text-sm font-bold tracking-tight">Progreso de estudiantes</h2><p className="mt-0.5 text-[11px] text-subtle">{filtered.length} {filtered.length === 1 ? 'inscripción' : 'inscripciones'}{(query || courseId) ? ` de ${students.length}` : ''}</p></div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto"><input type="search" aria-label="Buscar estudiante" placeholder="Buscar estudiante…" value={search} onChange={event => setSearch(event.target.value)} className="!min-h-9 min-w-0 flex-1 !bg-elevated/30 !py-1.5 !text-xs sm:w-44" /><select aria-label="Filtrar estudiantes por curso" value={courseId} onChange={event => setCourseId(event.target.value)} className="!min-h-9 w-full !bg-elevated/30 !py-1.5 !text-xs sm:w-44"><option value="">Todos los cursos</option>{courses.map(course => <option key={course.id} value={String(course.id)}>{course.title}</option>)}</select></div>
      </div>
      <div className="overflow-x-auto overscroll-x-contain"><table className={tableClass} aria-label="Progreso de estudiantes"><thead><tr>{['Estudiante', 'Curso', 'Avance', 'Estado'].map(label => <th key={label} scope="col" className={label === 'Estado' ? '!text-right' : ['Módulos', 'Lecciones', 'Estudiantes'].includes(label) ? '!text-center' : ''}>{label}</th>)}</tr></thead><tbody>
        {filtered.map(student => <tr key={`${student.id || student.studentId}:${student.courseId}`}><td className="w-[30%]"><div className="flex items-center gap-2.5"><Avatar src={student.studentAvatar || student.avatarUrl} name={student.fullName || student.studentName || student.email} className="size-8 shrink-0 ring-2 ring-elevated" /><span className="font-medium text-ink">{student.fullName || student.studentName || student.email}</span></div></td><td className="text-subtle"><span className="inline-block max-w-xs rounded-md bg-elevated/50 px-2 py-1 text-[11px] leading-5">{student.courseTitle}</span></td><td className="w-1/4"><Progress value={student.progressPercent}>{student.completedLessons || 0} de {student.totalLessons || 0} lecciones</Progress></td><td className="text-right"><Status total={student.totalLessons} progress={percent(student.progressPercent)} /></td></tr>)}
        {!filtered.length && <tr><td colSpan={4} className="!py-8 text-center text-subtle">{students.length ? 'No hay estudiantes que coincidan con los filtros.' : 'No hay estudiantes matriculados en tus cursos.'}</td></tr>}
      </tbody></table></div>
    </section>}
  </div>;
}
