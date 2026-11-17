import { RoleBadge } from "../components/RoleBadge";
import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, RefreshCw, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, ArrowLeft, Download } from "lucide-react";
import { api } from "../services/api";
import { runTicketMutation } from "../services/asyncFlows";
import { canReadTicket, visibleTickets } from "../services/access";
import { Avatar, Dialog } from "../components/ui";
import "./TicketsView.css";
import { TicketOptionsDialog } from '../components/TicketOptionsDialog';

const statusLabel = { open: "Pendiente", in_progress: "En atención", resolved: "Resuelto", closed: "Cerrado" };
const isResolved = ticket => ["resolved", "closed"].includes(ticket.status);
const ticketStatusLabel = ticket => ticket.custom_status || statusLabel[ticket.status] || ticket.status;
const suggestedLabels = ["Acceso", "Cursos", "Clases en vivo", "Grabaciones", "Facturación", "Problema técnico"];

export function TicketsView({ user, searchTerm = "", initialTicketId = null, sidebarFilter, onCountsChange, onOptionsClose }) {
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState(initialTicketId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [revision, setRevision] = useState(0);
  const [filter, setFilter] = useState("pending");
  const [query, setQuery] = useState("");
  const [labelFilter, setLabelFilter] = useState("");
  const [labelTicket, setLabelTicket] = useState(null);
  const [labelDraft, setLabelDraft] = useState("");
  const [ticketPage, setTicketPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [oldestFirst, setOldestFirst] = useState(false);
  const [customOptions, setCustomOptions] = useState([]);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [customFilter, setCustomFilter] = useState('');
  const lifetime = useRef(null);
  const mutation = useRef(0);
  const selectionVersion = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    return () => controller.abort();
  }, [user.id]);

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    async function refresh() {
      try {
        const version = mutation.current;
        const rows = await api.tickets.list({ signal: controller.signal });
        if (controller.signal.aborted || version !== mutation.current) return;
        setTickets(visibleTickets(rows, user));
        setError("");
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          timer = setTimeout(refresh, 3000);
        }
      }
    }
    refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [user, revision]);

  const selected = tickets.find(ticket => ticket.id === selectedId);
  const support = user.role === "soporte";
  const admin = user.role === "admin";
  const staff = support || admin;
  useEffect(() => {
    if (!support) return;
    const controller = new AbortController();
    api.tickets.options({ signal: controller.signal }).then(rows => { if (!controller.signal.aborted) { setCustomOptions(rows); setOptionsError(''); } }).catch(failure => { if (!controller.signal.aborted) setOptionsError(failure.message); });
    return () => controller.abort();
  }, [support, user.id, revision, optionsOpen]);
  useEffect(() => {
    if (sidebarFilter !== undefined) { setOptionsOpen(sidebarFilter === 'options'); if (sidebarFilter !== 'options') setFilter(sidebarFilter); setSelectedId(null); setTicketPage(0); }
  }, [sidebarFilter]);
  useEffect(() => {
    onCountsChange?.({ pending: tickets.filter(ticket => !isResolved(ticket)).length, resolved: tickets.filter(isResolved).length, all: tickets.length });
  }, [tickets, onCountsChange]);
  const labels = [...new Set([...tickets.flatMap(ticket => ticket.labels || []), ...customOptions.filter(option => option.kind === 'label').map(option => option.name)])].sort();
  const filtered = tickets.filter(ticket =>
    (!staff || filter === "all" || (filter === "resolved" ? isResolved(ticket) : !isResolved(ticket))) &&
    (!labelFilter || ticket.labels?.includes(labelFilter)) &&
    (!customFilter || ticket.custom_status_id === customFilter) &&
    [searchTerm, query].every(term => `${ticket.subject} ${ticket.student_name || ""} ${ticketStatusLabel(ticket)} ${(ticket.labels || []).join(" ")}`.toLowerCase().includes(term.toLowerCase())));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visiblePage = Math.min(ticketPage, pageCount - 1);
  const sorted = [...filtered].sort((a,b) => (oldestFirst ? 1 : -1) * (new Date(a.created_at) - new Date(b.created_at)));
  const listed = sorted.slice(visiblePage * pageSize, (visiblePage + 1) * pageSize);
  function exportTickets() {
    const rows = [["ID", "Asunto", "Estudiante", "Responsable", "Estado", "Fecha"], ...sorted.map(t => [t.id,t.subject,t.student_name || "","Soporte",ticketStatusLabel(t),t.created_at])];
    const csv = "\uFEFF" + rows.map(row => row.map(v => '"' + String(v).replaceAll('"','""') + '"').join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], {type: "text/csv;charset=utf-8;"}));
    const link = document.createElement("a"); link.href=url; link.download="tickets.csv"; link.click(); URL.revokeObjectURL(url);
  }
  async function perform(action, selectResult = true) {
    const signal = lifetime.current.signal;
    ++mutation.current;
    setBusy(true); setError("");
    try {
      const completed = await runTicketMutation({
        action, signal, selectionVersion: () => selectionVersion.current,
        onTicket: result => setTickets(rows => [result, ...rows.filter(row => row.id !== result.id)]),
        onSelect: selectResult ? setSelectedId : () => {},
      });
      if (!completed) return false;
      setRevision(value => value + 1);
      return true;
    } catch (failure) {
      if (!signal.aborted) setError(failure.message);
      return false;
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  }
  async function deleteTicket(ticket) {
    setDeleteError("");
    const completed = await perform(async options => {
      try {
        await api.tickets.remove(ticket.id, options);
      } catch (failure) {
        if (!options.signal.aborted) setDeleteError(failure.message);
        throw failure;
      }
      if (!options.signal.aborted) {
        ++mutation.current;
        setTickets(rows => rows.filter(row => row.id !== ticket.id));
        setSelectedId(current => current === ticket.id ? null : current);
      }
    });
    if (completed) setTicketToDelete(null);
  }
  if (support && optionsOpen) return <TicketOptionsDialog key={user.id} open onClose={() => { setOptionsOpen(false); onOptionsClose?.(); }} options={customOptions} loadError={optionsError} onRetry={() => setRevision(value => value + 1)} onEdit={async (id, input) => {
    const signal = lifetime.current.signal;
    const updated = await api.tickets.editOption(id, input, { signal });
    if (!signal.aborted) { setCustomOptions(rows => rows.map(option => option.id === id ? updated : option)); setLabelFilter(''); setRevision(value => value + 1); }
  }} onCreate={async input => {
    const signal = lifetime.current.signal;
    const created = await api.tickets.createOption(input, { signal });
    if (!signal.aborted) { setCustomOptions(rows => [...rows.filter(option => option.id !== created.id), created]); setOptionsError(''); }
  }} />;
  return <section className="tickets-page" data-chat-open={Boolean(selected)}>
    {!selected && <div className="tickets-heading"><div className="support-heading-search"><input aria-label="Buscar tickets" placeholder="Buscar asunto o etiqueta…" value={query} onChange={event => setQuery(event.target.value)} /></div><div className="flex flex-wrap items-center gap-2"><button className="btn btn-secondary" disabled={!filtered.length} onClick={exportTickets}><Download size={16} /> Exportar</button><button className="btn btn-secondary" onClick={() => setRevision(value => value + 1)}><RefreshCw size={16} /> Actualizar</button><select aria-label="Filtrar por etiqueta" value={labelFilter} onChange={event => setLabelFilter(event.target.value)}><option value="">Todas las etiquetas</option>{labels.map(label => <option key={label}>{label}</option>)}</select></div></div>}
    {error && <p role="alert" className="tickets-error">{error} <button className="btn btn-secondary" onClick={() => setRevision(value => value + 1)}>Reintentar</button></p>}
    {!selected && support && <div className="flex shrink-0 flex-wrap items-center gap-2">{sidebarFilter === undefined && <button type="button" className="btn btn-secondary" onClick={() => setOptionsOpen(true)}>Mis etiquetas y estados</button>}<select aria-label="Filtrar por estado personalizado" className="rounded-lg border border-line bg-surface px-3 py-2 text-xs" value={customFilter} onChange={event => { setCustomFilter(event.target.value); setTicketPage(0); }}><option value="">Todos los estados personalizados</option>{customOptions.filter(option => option.kind === 'status').map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></div>}
    {!selected && !staff && <CreateTicket busy={busy} onCreate={input => perform(options => api.tickets.create(input, options))} />}
    <div className="support-toolbar" hidden={Boolean(selected)}>
      {staff && sidebarFilter === undefined && <div className="support-tabs" aria-label="Estado del ticket">{[["all", "Todos", tickets.length], ["pending", "Pendientes", tickets.filter(ticket => !isResolved(ticket)).length], ["resolved", "Resueltos", tickets.filter(isResolved).length]].map(([value, title, count]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{title}<span>{count}</span></button>)}</div>}


    </div>
    <div className="tickets-layout" data-detail-open={Boolean(selected)}>
      {!selected && <div className="support-table-card">
      <div className="support-table-scroll"><table className="support-table"><thead><tr><th>Ticket ID</th><th>Asunto</th><th>Estudiante</th><th>Responsable</th><th>Estado</th><th><button className="inline-flex items-center gap-2" onClick={() => setOldestFirst(value => !value)}>Fecha <ArrowUpDown size={13} /></button></th><th>Acciones</th></tr></thead>
      <tbody>{loading ? <tr><td colSpan={7}><p className="support-table-empty" role="status">Cargando tickets…</p></td></tr> : !listed.length ? <tr><td colSpan={7}><div className="support-table-empty"><MessageSquare size={28} /><strong>No hay tickets para mostrar</strong><p>Las solicitudes aparecerán aquí. Prueba con otros filtros.</p></div></td></tr> : listed.map(ticket => <tr key={ticket.id} className={"support-ticket-row " + (selectedId === ticket.id ? "support-row-selected" : "")} onClick={event => {
        if (event.target.closest("button, select, input, a, textarea")) return;
        ++selectionVersion.current;
        setSelectedId(ticket.id);
      }}>
      <td><span className="whitespace-nowrap font-mono text-[11px] text-subtle">#{String(ticket.id).slice(-6).toUpperCase()}</span></td>
      <td><button className="ticket-subject" onClick={() => { ++selectionVersion.current; setSelectedId(ticket.id); }}>{ticket.subject}</button><div className="ticket-labels mt-1.5">{ticket.labels?.map(label => <em key={label}>{label}</em>)}</div></td>
      <td><div className="flex items-center gap-2"><Avatar src={ticket.student_avatar_url} name={ticket.student_name || "Estudiante"} className="size-9" /><span className="whitespace-nowrap text-xs">{ticket.student_name || "Estudiante"}</span></div></td>
      <td><span className="text-xs text-muted">{"Soporte"}</span></td>
      <td>{support ? <select className="support-status-select" data-status={ticket.status} aria-label={"Cambiar estado: " + ticket.subject} value={ticket.custom_status_id ? "custom:" + ticket.custom_status_id : ticket.status} disabled={busy} onChange={event => {
        const nextStatus = event.target.value;
        if (nextStatus === ticket.status) return;
        perform(options => nextStatus.startsWith('custom:') ? api.tickets.customStatus(ticket.id, nextStatus.slice(7), options) : api.tickets.setStatus(ticket.id, nextStatus, options), false);
      }}>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}<optgroup label="Mis estados personalizados">{customOptions.filter(option => option.kind === "status").map(option => <option key={option.id} value={"custom:" + option.id}>{option.name}</option>)}</optgroup></select> : <span className="support-status" data-status={ticket.status}><span className="size-1.5 rounded-full bg-current" />{ticketStatusLabel(ticket)}</span>}</td>
      <td><time className="whitespace-nowrap text-[11px] text-subtle" dateTime={ticket.created_at}>{new Date(ticket.created_at).toLocaleDateString("es-EC",{day:"2-digit",month:"short",year:"numeric"})}</time></td>
      <td><div className="flex gap-1"><button className="support-row-action support-chat-action" title="Abrir chat" aria-label={"Abrir ticket: " + ticket.subject} onClick={() => { ++selectionVersion.current; setSelectedId(ticket.id); }}><MessageSquare size={16} /></button>{support && <button className="support-row-action support-delete-action" title="Eliminar ticket" disabled={busy} aria-label={"Eliminar ticket: " + ticket.subject} onClick={() => { setDeleteError(""); setTicketToDelete(ticket); }}><Trash2 size={15} /></button>}</div></td>
      </tr>)}</tbody></table></div>
      <footer className="support-table-footer"><label>Mostrar<select aria-label="Tickets por página" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setTicketPage(0); }}>{[10,15,25,50].map(size => <option key={size}>{size}</option>)}</select>por página</label><nav className="flex items-center gap-2" aria-label="Páginas de tickets"><button className="support-row-action" aria-label="Página anterior" disabled={visiblePage === 0} onClick={() => setTicketPage(visiblePage - 1)}><ChevronLeft size={16} /></button><span className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-on-brand">{visiblePage + 1}</span><span className="text-xs text-subtle">de {pageCount}</span><button className="support-row-action" aria-label="Página siguiente" disabled={visiblePage === pageCount - 1} onClick={() => setTicketPage(visiblePage + 1)}><ChevronRight size={16} /></button></nav><p>{filtered.length} tickets en total</p></footer>
      </div>}
      <div className="ticket-conversation" hidden={!selected}>
        {selected && <button className="btn btn-secondary self-start" onClick={() => { ++selectionVersion.current; setSelectedId(null); }}><ArrowLeft size={16} /> Volver a tickets</button>}
        {!selected ? <div className="flex min-h-40 flex-1 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-brand-soft/30 to-surface p-4 text-center"><span className="mb-2 rounded-full border border-brand-line bg-brand-soft px-2.5 py-1 text-[9px] font-semibold text-brand">Estamos para ayudarte</span><h2 className="text-sm font-semibold text-ink">Tu espacio de soporte</h2><p className="mt-2 max-w-xs text-xs leading-6 text-subtle">Selecciona un ticket de la lista para consultar sus detalles y continuar la conversación.</p></div> : <>
          <div className="support-detail-heading"><div><span className="text-xs font-semibold text-brand">{ticketStatusLabel(selected)}</span><h2 className="mt-1 text-lg font-bold tracking-tight">{selected.subject}</h2></div>{support && selected.assigned_to === user.id && <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => { setLabelTicket(selected); setLabelDraft((selected.labels || []).join(", ")); }}>Etiquetar</button>}</div>
          <div className="ticket-labels">{selected.labels?.map(label => <em key={label}>{label}</em>)}</div>
          {admin && <div className="grid gap-1 rounded-xl bg-elevated p-3 text-xs text-subtle"><p>Estudiante: <strong className="text-ink">{selected.student_name || "Estudiante"}</strong></p><p>Responsable: <strong className="text-ink">{"Soporte"}</strong></p><p>Creado: {new Date(selected.created_at).toLocaleString("es-EC")}</p><p className="text-brand">Vista de supervisión · Solo lectura</p></div>}

          {support && !selected.assigned_to && !isResolved(selected) && <button className="btn btn-primary" disabled={busy} onClick={() => perform(options => api.tickets.claim(selected.id, options))}>Tomar ticket</button>}
          {selected.status === "closed" ? <p>Este ticket está cerrado. Puedes reabrirlo desde el estado en la lista de tickets.</p> : canReadTicket(selected, user) ? <Conversation key={`${user.id}:${selected.id}`} ticket={selected} user={user} busy={busy} onSend={async body => { let sent; const saved = await perform(async options => { sent = await api.tickets.send(selected.id, body, options); }); return saved ? sent : null; }} revision={revision} mutation={mutation} /> : <p>Toma este ticket para acceder a su conversación.</p>}
          {support && canReadTicket(selected, user) && !isResolved(selected) && <button className="btn btn-primary" disabled={busy} onClick={() => perform(options => api.tickets.resolve(selected.id, options))}>Marcar como resuelto</button>}
          {selected.status === "resolved" && <p className="support-resolved">Caso resuelto. El historial de la conversación se conserva.</p>}
        </>}
      </div>
    </div>
    <Dialog open={Boolean(labelTicket)} onClose={() => { if (!busy) setLabelTicket(null); }} title="Etiquetar ticket" className="max-w-sm">
      <form className="grid gap-4" onSubmit={async event => { event.preventDefault(); const values = [...new Set(labelDraft.split(",").map(label => label.trim()).filter(Boolean))]; if (values.length > 5 || values.some(label => label.length > 32)) { setError("Usa hasta 5 etiquetas de máximo 32 caracteres."); return; } if (await perform(options => api.tickets.labels(labelTicket.id, values, options))) setLabelTicket(null); }}>
        <div><p className="mb-2 text-xs font-semibold text-muted">Selecciona las etiquetas del caso</p><div className="flex flex-wrap gap-2">{[...new Set([...suggestedLabels, ...customOptions.filter(option => option.kind === "label").map(option => option.name), ...labels])].map(label => {
          const chosen = labelDraft.split(",").map(value => value.trim()).filter(Boolean);
          const active = chosen.includes(label);
          return <button key={label} type="button" aria-pressed={active} disabled={busy || (!active && chosen.length >= 5)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${active ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface text-subtle hover:border-brand"}`} onClick={() => setLabelDraft((active ? chosen.filter(value => value !== label) : [...chosen, label]).join(", "))}>{active ? "✓ " : "+ "}{label}</button>;
        })}</div></div>
        <label>Etiquetas separadas por comas<input autoFocus value={labelDraft} onChange={event => setLabelDraft(event.target.value)} placeholder="Acceso, Cursos, Facturación" maxLength={170} /></label>
        <p className="text-xs text-subtle">Hasta 5 etiquetas. Borra el texto para quitarlas.</p>
        {error && <p role="alert" className="text-xs text-danger">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Guardando…" : "Guardar etiquetas"}</button>
      </form>
    </Dialog>
    <Dialog open={Boolean(ticketToDelete)} onClose={() => { if (!busy) setTicketToDelete(null); }} title="Eliminar ticket" className="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-danger-line bg-danger-soft text-danger"><Trash2 size={25} aria-hidden="true" /></div>
        <p className="text-sm font-semibold text-muted">¿Eliminar este ticket?</p>
        <p className="mt-2 max-w-full break-words text-sm font-bold">{ticketToDelete?.subject}</p>
        <p className="mt-3 text-xs leading-6 text-subtle">El ticket y sus mensajes se eliminarán permanentemente. Esta acción no se puede deshacer.</p>
        {deleteError && <p role="alert" className="mt-3 text-xs text-danger">{deleteError}</p>}
        <div className="mt-6 flex w-full gap-3">
          <button type="button" className="btn btn-secondary flex-1" disabled={busy} onClick={() => setTicketToDelete(null)}>Cancelar</button>
          <button type="button" className="btn flex-1 border border-danger-line bg-danger-soft text-danger hover:bg-danger/20" disabled={busy} onClick={() => deleteTicket(ticketToDelete)}><Trash2 size={16} />{busy ? "Eliminando…" : "Eliminar"}</button>
        </div>
      </div>
    </Dialog>
  </section>;
}

function CreateTicket({ busy, onCreate }) {
  return <form className="ticket-create" onSubmit={event => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = new FormData(form);
    const subject = input.get("subject").trim(), message = input.get("message").trim();
    if (subject && message) onCreate({ subject, message }).then(saved => { if (saved) form.reset(); });
  }}><h2>Nueva consulta</h2><label>Asunto<input name="subject" placeholder="Describe brevemente tu consulta" required maxLength={200} /></label><label>Mensaje<textarea onKeyDown={event => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (!busy && !event.repeat) event.currentTarget.form.requestSubmit();
    }
  }} name="message" placeholder="Cuéntanos qué necesitas y los detalles para ayudarte" required maxLength={2000} rows={3} /></label><button className="btn btn-primary" disabled={busy}>Crear ticket</button></form>;
}

export function Conversation({ ticket, user, busy, onSend, revision, mutation }) {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const sending = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    let timer;
    async function refresh() {
      try {
        const version = mutation.current;
        const rows = await api.tickets.messages(ticket.id, { signal: controller.signal });
        if (!controller.signal.aborted && version === mutation.current) { setMessages(rows); setError(""); }
      } catch (failure) {
        if (!controller.signal.aborted) { setMessages([]); setError(failure.message); }
      } finally {
        if (!controller.signal.aborted) { setLoading(false); timer = setTimeout(refresh, 3000); }
      }
    }
    refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [ticket.id, revision, mutation]);
  return <><div className="ticket-messages" aria-live="polite" aria-label="Conversación">
    {loading && <p role="status">Cargando conversación…</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && !messages.length && <p>No hay mensajes.</p>}
    {messages.map(message => {
      const own = message.sender_id === user.id;
      const sender = own ? "Tú" : message.sender_name?.trim() || (message.sender_id === ticket.student_id ? "Estudiante" : "Participante");
      return <article key={message.id} className={own ? "own-message" : ""}><header className="flex flex-wrap items-center gap-2"><strong>{sender}</strong><RoleBadge role={message.sender_role} /></header><p>{message.body}</p><small>{new Date(message.created_at).toLocaleString("es-EC")}</small></article>;
    })}
  </div>{user.role !== "admin" && !isResolved(ticket) && <form className="ticket-reply" onSubmit={async event => {
    event.preventDefault();
    if (busy || sending.current || !body.trim()) return;
    sending.current = true;
    const submitted = body;
    try {
      const sent = await onSend(submitted.trim());
      if (sent) {
        if (sent.id) setMessages(rows => [...rows.filter(row => row.id !== sent.id), sent]);
        setBody(current => current === submitted ? "" : current);
      }
    } finally { sending.current = false; }
  }}><label>Respuesta<textarea aria-label="Respuesta" value={body} onChange={event => setBody(event.target.value)} onKeyDown={event => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (!event.repeat) event.currentTarget.form.requestSubmit();
    }
  }} required maxLength={2000} rows={3} /></label><button className="btn btn-primary" disabled={busy || !body.trim()}>Enviar respuesta</button></form>}</>;
}
