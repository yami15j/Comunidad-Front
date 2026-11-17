import React, { useState } from 'react';

export function TicketOptionsDialog({ open, onClose, options, onCreate, onEdit, loadError, onRetry }) {
  const [kind, setKind] = useState('label');
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!open) return null;
  return <section className="w-full min-w-0" aria-label="Mis etiquetas y estados">
    <header className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand">Configuración de soporte</p><h2 className="text-2xl font-bold tracking-tight">Mis etiquetas y estados</h2><p className="mt-2 text-sm text-subtle">Organiza tus solicitudes con categorías y etapas de atención.</p></div><button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>Volver a tickets</button></header>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
    <div className="mb-4 flex gap-2 rounded-lg bg-elevated p-1">{[['label','Mis etiquetas'],['status','Mis estados']].map(([value,label]) => <button type="button" key={value} aria-pressed={kind === value} onClick={() => { setKind(value); setEditing(null); setName(''); setError(''); }} className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold ${kind === value ? 'bg-surface text-brand shadow-sm' : 'text-subtle'}`}>{label}</button>)}</div>
    <p className="mb-4 text-xs leading-6 text-subtle">{kind === 'label' ? 'Crea etiquetas para clasificar tus solicitudes. Después podrás seleccionarlas en Etiquetar.' : 'Crea etapas como “Esperando respuesta” o “En revisión”. Estos estados cuentan como pendientes hasta resolver el ticket.'}</p>
    <form className="flex items-end gap-2" onSubmit={async event => { event.preventDefault(); if (busy || name.trim().length < 2) return; setBusy(true); setError(''); try { if (editing) await onEdit(editing.id, { kind, name: name.trim() }); else await onCreate({ kind, name: name.trim() }); setEditing(null); setName(''); } catch (failure) { setError(failure.message); } finally { setBusy(false); } }}>
      <label className="grid min-w-0 flex-1 gap-2 text-xs font-semibold">{kind === 'label' ? 'Nueva etiqueta' : 'Estado personalizado'}<input aria-label={kind === 'label' ? 'Nueva etiqueta' : 'Estado personalizado'} required minLength={2} maxLength={32} value={name} onChange={event => setName(event.target.value)} disabled={busy} placeholder={kind === 'label' ? 'Ej. Inscripciones' : 'Ej. Esperando respuesta'} /></label>
      <button className="btn btn-primary" disabled={busy || name.trim().length < 2}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar'}</button>
    {editing && <button type="button" className="text-xs text-subtle" onClick={() => { setEditing(null); setName(''); }}>Cancelar</button>}</form>
    {(error || loadError) && <div role="alert" className="mt-4 text-sm text-subtle"><p>{/schema cache|ticket_options/i.test(error || loadError) ? 'No se pudo cargar la configuración. Vuelve a intentarlo para actualizar la conexión.' : error || loadError}</p>{onRetry && <button type="button" className="mt-2 font-semibold text-brand" onClick={onRetry}>Reintentar</button>}</div>}
    </div><div className="rounded-xl border border-line bg-surface p-5 sm:p-6"><p className="mb-4 text-sm font-semibold">{kind === 'label' ? 'Etiquetas guardadas' : 'Estados guardados'}</p><div className="flex flex-wrap gap-2">{options.filter(option => option.kind === kind).map(option => <span key={option.id} className="rounded-full border border-brand-line bg-brand-soft px-3 py-1.5 text-xs text-brand">{option.name}{onEdit && <button type="button" disabled={busy} aria-label={`Editar ${option.name}`} className="ml-3 font-semibold underline underline-offset-2" onClick={() => { setEditing(option); setName(option.name); setError(''); }}>Editar</button>}</span>)}{!options.some(option => option.kind === kind) && <p className="py-6 text-sm text-subtle">Todavía no has agregado {kind === 'label' ? 'etiquetas' : 'estados personalizados'}.</p>}</div></div></div>
  </section>;
}
