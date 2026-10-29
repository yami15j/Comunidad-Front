import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, RefreshCw, Trash2 } from "lucide-react";
import { api } from "../services/api";
import { runTicketMutation } from "../services/asyncFlows";
import { canReadTicket, visibleTickets } from "../services/access";
import { Dialog } from "../components/ui";
import "./TicketsView.css";

const statusLabel = { open: "Disponible", in_progress: "En atención", closed: "Cerrado" };

export function TicketsView({ user, searchTerm = "" }) {
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [revision, setRevision] = useState(0);
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
  const filtered = tickets.filter(ticket => ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()));
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
    <div className="tickets-heading"><div><h1><MessageSquare size={26} /> {support ? "Mesa de soporte" : "Mis tickets"}</h1><p>{support ? "Toma un ticket disponible para atender su conversación." : "Crea una consulta y conversa con el equipo de soporte."}</p></div><button className="btn btn-secondary" onClick={() => setRevision(value => value + 1)}><RefreshCw size={16} /> Actualizar</button></div>
    {error && <p role="alert" className="tickets-error">{error} <button className="btn btn-secondary" onClick={() => setRevision(value => value + 1)}>Reintentar</button></p>}
    {!support && <CreateTicket busy={busy} onCreate={input => perform(options => api.tickets.create(input, options))} />}
    <div className="tickets-layout">
      <aside className="tickets-list" aria-label="Tickets">
        {loading ? <p role="status">Cargando tickets…</p> : !filtered.length ? <p>No hay tickets para mostrar.</p> : filtered.map(ticket => <div className={`ticket-item ${selectedId === ticket.id ? "selected" : ""}`} key={ticket.id}>
          <button className="ticket-select" onClick={() => { ++selectionVersion.current; setSelectedId(ticket.id); }}>
            <strong>{ticket.subject}</strong><span>{statusLabel[ticket.status] || ticket.status}</span><small>{new Date(ticket.created_at).toLocaleString("es-EC")}</small>
          </button>
          {support && <button type="button" className="ticket-delete" disabled={busy} aria-label={"Eliminar ticket: " + ticket.subject} title="Eliminar ticket" onClick={() => { setDeleteError(""); setTicketToDelete(ticket); }}><Trash2 size={18} aria-hidden="true" /></button>}
        </div>)} 
      </aside>
      <div className="ticket-conversation">
        {!selected ? <p>Selecciona un ticket para ver sus detalles.</p> : <>
          <h2>{selected.subject}</h2><p>{statusLabel[selected.status]}</p>

          {support && !selected.assigned_to && selected.status !== "closed" && <button className="btn btn-primary" disabled={busy} onClick={() => perform(options => api.tickets.claim(selected.id, options))}>Tomar ticket</button>}
          {selected.status === "closed" ? <p>Este ticket está cerrado. Su conversación se eliminó permanentemente.</p> : canReadTicket(selected, user) ? <Conversation key={`${user.id}:${selected.id}`} ticket={selected} user={user} busy={busy} onSend={body => perform(options => api.tickets.send(selected.id, body, options))} revision={revision} mutation={mutation} /> : <p>Toma este ticket para acceder a su conversación.</p>}
          {support && canReadTicket(selected, user) && <button className="btn btn-secondary" disabled={busy} onClick={() => {
            if (window.confirm("¿Cerrar este ticket? Todos sus mensajes se eliminarán permanentemente. Esta acción no se puede deshacer.")) perform(async options => {
              const result = await api.tickets.close(selected.id, options);
              return { ...selected, ...result, status: "closed" };
            });
          }}>Cerrar ticket y eliminar conversación</button>}
        </>}
      </div>
    </div>
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
  }}><h2>Nueva consulta</h2><label>Asunto<input name="subject" required maxLength={200} /></label><label>Mensaje<textarea name="message" required maxLength={2000} rows={3} /></label><button className="btn btn-primary" disabled={busy}>Crear ticket</button></form>;
}

function Conversation({ ticket, user, busy, onSend, revision, mutation }) {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
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
      const sender = own ? "Tú" : user.role === "soporte" && message.sender_id === ticket.student_id ? message.sender_name?.trim() || "Estudiante" : "Soporte";
      return <article key={message.id} className={own ? "own-message" : ""}><strong>{sender}</strong><p>{message.body}</p><small>{new Date(message.created_at).toLocaleString("es-EC")}</small></article>;
    })}
  </div><form className="ticket-reply" onSubmit={async event => { event.preventDefault(); if (body.trim()) { if (await onSend(body.trim())) setBody(""); } }}><label>Respuesta<textarea value={body} onChange={event => setBody(event.target.value)} required maxLength={2000} rows={3} /></label><button className="btn btn-primary" disabled={busy || !body.trim()}>Enviar respuesta</button></form></>;
}
