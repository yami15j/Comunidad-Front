import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, RefreshCw, Trash2 } from "lucide-react";
import { api } from "../services/api";
import { runTicketMutation } from "../services/asyncFlows";
import { canReadTicket, visibleTickets } from "../services/access";
import { Dialog } from "../components/ui";
import "./TicketsView.css";

const statusLabel = { open: "Pendiente", in_progress: "En atención", resolved: "Resuelto", closed: "Cerrado" };
const isResolved = ticket => ["resolved", "closed"].includes(ticket.status);
const suggestedLabels = ["Acceso", "Cursos", "Clases en vivo", "Grabaciones", "Facturación", "Problema técnico"];

export function TicketsView({ user, searchTerm = "", initialTicketId = null }) {
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
  const labels = [...new Set(tickets.flatMap(ticket => ticket.labels || []))].sort();
  const filtered = tickets.filter(ticket =>
    (!staff || filter === "all" || (filter === "resolved" ? isResolved(ticket) : !isResolved(ticket))) &&
    (!labelFilter || ticket.labels?.includes(labelFilter)) &&
    [searchTerm, query].every(term => `${ticket.subject} ${ticket.student_name || ""} ${ticket.agent_name || ""} ${(ticket.labels || []).join(" ")}`.toLowerCase().includes(term.toLowerCase())));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 2));
  const visiblePage = Math.min(ticketPage, pageCount - 1);
  const listed = staff ? filtered.slice(visiblePage * 2, visiblePage * 2 + 2) : filtered;
  async function perform(action) {
    const signal = lifetime.current.signal;
    ++mutation.current;
    setBusy(true); setError("");
    try {
      const completed = await runTicketMutation({
        action, signal, selectionVersion: () => selectionVersion.current,
        onTicket: result => setTickets(rows => [result, ...rows.filter(row => row.id !== result.id)]),
        onSelect: setSelectedId,
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
  return <section className="tickets-page">
    <div className="tickets-heading"><div><h1><MessageSquare size={26} /> {admin ? "Supervisión de soporte" : support ? "Mesa de soporte" : "Mis tickets"}</h1><p>{admin ? "Consulta las solicitudes, el agente responsable y las conversaciones de tus estudiantes." : support ? "Toma un ticket disponible para atender su conversación." : "Crea una consulta y conversa con el equipo de soporte."}</p></div><button className="btn btn-secondary" onClick={() => setRevision(value => value + 1)}><RefreshCw size={16} /> Actualizar</button></div>
    {error && <p role="alert" className="tickets-error">{error} <button className="btn btn-secondary" onClick={() => setRevision(value => value + 1)}>Reintentar</button></p>}
    {!staff && <CreateTicket busy={busy} onCreate={input => perform(options => api.tickets.create(input, options))} />}
    <div className="support-toolbar">
      {staff && <div className="support-tabs" aria-label="Estado del ticket">{[["pending", "Pendientes", tickets.filter(ticket => !isResolved(ticket)).length], ["resolved", "Resueltos", tickets.filter(isResolved).length], ["all", "Todos", tickets.length]].map(([value, title, count]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{title}<span>{count}</span></button>)}</div>}
      <input aria-label="Buscar tickets" placeholder="Buscar asunto o etiqueta…" value={query} onChange={event => setQuery(event.target.value)} />
      <select aria-label="Filtrar por etiqueta" value={labelFilter} onChange={event => setLabelFilter(event.target.value)}><option value="">Todas las etiquetas</option>{labels.map(label => <option key={label}>{label}</option>)}</select>
    </div>
    <div className="tickets-layout">
      <aside className="tickets-list" aria-label="Tickets">
        {loading ? <p role="status">Cargando tickets…</p> : !filtered.length ? <p>No hay tickets para mostrar.</p> : listed.map(ticket => <div className={`ticket-item ${selectedId === ticket.id ? "selected" : ""}`} key={ticket.id}>
          <button className="ticket-select" onClick={() => { ++selectionVersion.current; setSelectedId(ticket.id); }}>
            <strong>{ticket.subject}</strong><span data-status={ticket.status}>{statusLabel[ticket.status] || ticket.status}</span><div className="ticket-labels">{ticket.labels?.map(label => <em key={label}>{label}</em>)}</div><small>{new Date(ticket.created_at).toLocaleDateString("es-EC", {day:"numeric", month:"short", year:"numeric"})}</small>
          </button>
          {support && <button type="button" className="ticket-delete" disabled={busy} aria-label={"Eliminar ticket: " + ticket.subject} title="Eliminar ticket" onClick={() => { setDeleteError(""); setTicketToDelete(ticket); }}><Trash2 size={18} aria-hidden="true" /></button>}
        </div>)}
        {staff && pageCount > 1 && <nav className="support-ticket-pagination" aria-label="Páginas de tickets"><button className="btn btn-secondary" disabled={visiblePage === 0} onClick={() => setTicketPage(visiblePage - 1)}>Anterior</button><span>{visiblePage + 1} / {pageCount}</span><button className="btn btn-secondary" disabled={visiblePage === pageCount - 1} onClick={() => setTicketPage(visiblePage + 1)}>Siguiente</button></nav>}
      </aside>
      <div className="ticket-conversation">
        {!selected ? <div className="flex min-h-40 flex-1 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-brand-soft/30 to-surface p-4 text-center"><span className="mb-2 rounded-full border border-brand-line bg-brand-soft px-2.5 py-1 text-[9px] font-semibold text-brand">Estamos para ayudarte</span><h2 className="text-sm font-semibold text-ink">Tu espacio de soporte</h2><p className="mt-2 max-w-xs text-xs leading-6 text-subtle">Selecciona un ticket de la lista para consultar sus detalles y continuar la conversación.</p></div> : <>
          <div className="support-detail-heading"><div><span className="text-xs font-semibold text-brand">{statusLabel[selected.status]}</span><h2 className="mt-1 text-lg font-bold tracking-tight">{selected.subject}</h2></div>{support && selected.assigned_to === user.id && <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => { setLabelTicket(selected); setLabelDraft((selected.labels || []).join(", ")); }}>Etiquetar</button>}</div>
          <div className="ticket-labels">{selected.labels?.map(label => <em key={label}>{label}</em>)}</div>
          {admin && <div className="grid gap-1 rounded-xl bg-elevated p-3 text-xs text-subtle"><p>Estudiante: <strong className="text-ink">{selected.student_name || "Estudiante"}</strong></p><p>Responsable: <strong className="text-ink">{selected.agent_name || "Sin asignar"}</strong></p><p>Creado: {new Date(selected.created_at).toLocaleString("es-EC")}</p><p className="text-brand">Vista de supervisión · Solo lectura</p></div>}

          {support && !selected.assigned_to && !isResolved(selected) && <button className="btn btn-primary" disabled={busy} onClick={() => perform(options => api.tickets.claim(selected.id, options))}>Tomar ticket</button>}
          {selected.status === "closed" ? <p>Este ticket está cerrado. Su conversación se eliminó permanentemente.</p> : canReadTicket(selected, user) ? <Conversation key={`${user.id}:${selected.id}`} ticket={selected} user={user} busy={busy} onSend={body => perform(options => api.tickets.send(selected.id, body, options))} revision={revision} mutation={mutation} /> : <p>Toma este ticket para acceder a su conversación.</p>}
          {support && canReadTicket(selected, user) && !isResolved(selected) && <button className="btn btn-primary" disabled={busy} onClick={() => perform(options => api.tickets.resolve(selected.id, options))}>Marcar como resuelto</button>}
          {selected.status === "resolved" && <p className="support-resolved">Caso resuelto. El historial de la conversación se conserva.</p>}
        </>}
      </div>
    </div>
    <Dialog open={Boolean(labelTicket)} onClose={() => { if (!busy) setLabelTicket(null); }} title="Etiquetar ticket" className="max-w-sm">
      <form className="grid gap-4" onSubmit={async event => { event.preventDefault(); const values = [...new Set(labelDraft.split(",").map(label => label.trim()).filter(Boolean))]; if (values.length > 5 || values.some(label => label.length > 32)) { setError("Usa hasta 5 etiquetas de máximo 32 caracteres."); return; } if (await perform(options => api.tickets.labels(labelTicket.id, values, options))) setLabelTicket(null); }}>
        <div><p className="mb-2 text-xs font-semibold text-muted">Selecciona las etiquetas del caso</p><div className="flex flex-wrap gap-2">{[...new Set([...suggestedLabels, ...labels])].map(label => {
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
  }}><h2>Nueva consulta</h2><label>Asunto<input name="subject" placeholder="Describe brevemente tu consulta" required maxLength={200} /></label><label>Mensaje<textarea name="message" placeholder="Cuéntanos qué necesitas y los detalles para ayudarte" required maxLength={2000} rows={3} /></label><button className="btn btn-primary" disabled={busy}>Crear ticket</button></form>;
}

function Conversation({ ticket, user, busy, onSend, revision, mutation }) {
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
      const sender = own ? "Tú" : message.sender_id === ticket.student_id ? message.sender_name?.trim() || "Estudiante" : ticket.agent_name || "Soporte";
      return <article key={message.id} className={own ? "own-message" : ""}><strong>{sender}</strong><p>{message.body}</p><small>{new Date(message.created_at).toLocaleString("es-EC")}</small></article>;
    })}
  </div>{user.role !== "admin" && !isResolved(ticket) && <form className="ticket-reply" onSubmit={async event => {
    event.preventDefault();
    if (busy || sending.current || !body.trim()) return;
    sending.current = true;
    const submitted = body;
    try {
      if (await onSend(submitted.trim())) setBody(current => current === submitted ? "" : current);
    } finally { sending.current = false; }
  }}><label>Respuesta<textarea value={body} onChange={event => setBody(event.target.value)} onKeyDown={event => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (!event.repeat) event.currentTarget.form.requestSubmit();
    }
  }} required maxLength={2000} rows={3} /></label><button className="btn btn-primary" disabled={busy || !body.trim()}>Enviar respuesta</button></form>}</>;
}
