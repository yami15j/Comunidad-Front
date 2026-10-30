import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export function EnrollmentStudentFields({ courseId, value, onChange, disabled }) {
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setState({ items: [], loading: true, error: '' });
      try {
        const items = [];
        let page = 0;
        while (!controller.signal.aborted) {
          const result = await api.courses.enrollmentCandidates(courseId, page++, { signal: controller.signal });
          items.push(...result.items);
          if (!result.items.length || items.length >= result.total) break;
        }
        if (!controller.signal.aborted) setState({ items, loading: false, error: '' });
      } catch (error) {
        if (!controller.signal.aborted) setState({ items: [], loading: false, error: error.message });
      }
    }
    load();
    return () => controller.abort();
  }, [courseId, revision]);
  return <>
    <label className="min-w-0 !gap-1.5 !text-[11px]">Matricular estudiante por correo
      <input type="email" required disabled={disabled} className="!rounded-xl !px-3 !py-2.5 !text-xs"
        value={value} onChange={event => onChange(event.target.value)} placeholder="Escribe el correo del estudiante" />
    </label>
    <label className="min-w-0 !gap-1.5 !text-[11px]">O selecciona un estudiante
      <select aria-label="Seleccionar estudiante registrado" disabled={disabled || state.loading}
        className="!rounded-xl !px-3 !py-2.5 !text-xs" value={state.items.some(item => item.email === value) ? value : ''}
        onChange={event => onChange(event.target.value)}>
        <option value="">{state.loading ? 'Cargando estudiantes...' : state.error ? 'Lista no disponible' : `Estudiantes registrados (${state.items.length})`}</option>
        {state.items.map(item => <option key={item.id} value={item.email}>{item.fullName || item.email}{item.fullName ? ` · ${item.email}` : ''}</option>)}
      </select>
      {state.error && <span className="text-[10px] text-danger">No se pudo cargar la lista. Puedes escribir el correo. <button type="button" className="underline" onClick={() => setRevision(previous => previous + 1)}>Reintentar</button></span>}
    </label>
  </>;
}
