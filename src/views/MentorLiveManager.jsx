import React, { useState } from 'react';
import { Dialog } from '../components/ui';
const blank = () => ({ courseId: '', title: '', scheduledAt: '', durationMinutes: 60, joinUrl: '', meetingId: '', meetingPasscode: '' });
export function MentorLiveManager({ courses, liveClasses, onSchedule, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  function start(session) {
    setEditing(session?.id || null);
    if (session) {
      const date = new Date(session.scheduledAt);
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setForm({ courseId: session.courseId, title: session.title, scheduledAt: local,
        durationMinutes: session.durationMinutes || 60, joinUrl: session.joinUrl || '', meetingId: session.meetingId || '', meetingPasscode: session.meetingPasscode || '' });
    } else setForm(blank());
    setError(''); setMessage(''); setOpen(true);
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const input = { ...form, scheduledAt: new Date(form.scheduledAt).toISOString(), durationMinutes: Number(form.durationMinutes) };
      if (editing) await onUpdate(editing, input);
      else await onSchedule(input);
      setOpen(false); setMessage(editing ? 'Clase actualizada.' : 'Clase programada.');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  const change = key => event => setForm(previous => ({ ...previous, [key]: event.target.value }));
  return <section className="card academic-workspace mb-5 !space-y-3 !rounded-2xl !p-4 sm:!px-5 [&_.btn]:!min-h-9 [&_.btn]:!rounded-xl [&_.btn]:!px-3 [&_.btn]:!py-2 [&_.btn]:!text-xs">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="!text-base">Gestionar mis clases en vivo</h2><p className="mt-1 text-xs text-subtle">Programa clases y edita su título, fecha, duración o enlace de Zoom.</p></div>
      <button className="btn btn-primary" disabled={!courses.length} onClick={() => start(null)}>Programar clase</button>
    </div>
    {!courses.length && <p>No tienes cursos asignados para programar clases.</p>}
    {message && <p role="status">{message}</p>}
    {liveClasses.filter(session => session.effectiveStatus !== 'ended' && session.status !== 'ended').map(session =>
      <div key={session.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <div><p className="text-sm font-bold">{session.title}</p><p className="mt-1 text-xs text-subtle">{new Date(session.scheduledAt).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })} · {courses.find(course => course.id === session.courseId)?.title}</p></div>
        <button className="btn btn-secondary" onClick={() => start(session)}>Editar clase</button>
      </div>)}
    <Dialog open={open} onClose={() => { if (!busy) setOpen(false); }} title={editing ? 'Editar clase en vivo' : 'Programar clase en vivo'} className="!max-w-xl [&>div:last-child]:!p-5">
      <form onSubmit={submit} className="grid gap-4 [&_label]:grid [&_label]:min-w-0 [&_label]:gap-1.5 [&_label]:text-xs [&_label]:font-semibold [&_label]:text-muted [&_input]:w-full [&_input]:min-w-0 [&_input]:!rounded-xl [&_input]:!px-3 [&_input]:!py-2.5 [&_input]:!text-xs [&_select]:w-full [&_select]:min-w-0 [&_select]:!rounded-xl [&_select]:!px-3 [&_select]:!py-2.5 [&_select]:!text-xs">
        <p className="text-xs leading-5 text-subtle">Define el horario y los datos de ingreso para tus estudiantes.</p>
        <label>Curso<select required disabled={busy || Boolean(editing)} value={form.courseId} onChange={change('courseId')}>
          <option value="">Selecciona un curso</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
        </select></label>
        <label>Título<input required minLength={3} disabled={busy} value={form.title} onChange={change('title')} /></label>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
          <label>Fecha y hora local<input required type="datetime-local" disabled={busy} value={form.scheduledAt} onChange={change('scheduledAt')} /></label>
          <label>Duración (minutos)<input required type="number" min={15} max={480} disabled={busy} value={form.durationMinutes} onChange={change('durationMinutes')} /></label>
        </div>
        <fieldset className="grid gap-4 rounded-2xl border border-line bg-elevated/50 p-4">
        <legend className="px-1 text-[10px] font-bold uppercase tracking-wider text-brand">Acceso a Zoom</legend>
        <label>Enlace de invitados (opcional)<input type="url" placeholder="https://zoom.us/j/..." disabled={busy} value={form.joinUrl} onChange={change('joinUrl')} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>ID de reunión (opcional)<input inputMode="numeric" maxLength={20} placeholder="123 4567 8901" disabled={busy} value={form.meetingId} onChange={change('meetingId')} /></label>
          <label>Código de acceso (opcional)<input maxLength={32} autoComplete="off" placeholder="Código para invitados" disabled={busy} value={form.meetingPasscode} onChange={change('meetingPasscode')} /></label>
        </div>
        <p className="text-[11px] leading-5 text-subtle">El ID y el código permiten ingresar manualmente. Usa el código de invitados, no la clave de anfitrión.</p>
        </fieldset>
        {error && <p role="alert">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4 [&_.btn]:!min-h-9 [&_.btn]:!rounded-xl [&_.btn]:!px-4 [&_.btn]:!py-2 [&_.btn]:!text-xs"><button className="btn btn-primary" disabled={busy}>{busy ? 'Guardando...' : editing ? 'Guardar cambios' : 'Publicar clase'}</button>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setOpen(false)}>Cancelar</button></div>
      </form>
    </Dialog>
  </section>;
}
