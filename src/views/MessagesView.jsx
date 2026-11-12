import React, { useEffect, useRef, useState } from "react";
import { RoleBadge } from "../components/RoleBadge";
import { api } from "../services/api";
import "./MessagesView.css";
export function MessagesView({ user }) {
  const [contacts, setContacts] = useState([]),
    [selected, setSelected] = useState(null),
    [messages, setMessages] = useState([]);
  const [contactError, setContactError] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [reading, setReading] = useState(false);
  const [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  const conversation = useRef(null),
    log = useRef(null),
    mutation = useRef(0);
  const studentId = selected?.studentId;
  const mentorId = selected?.mentorId;
  const pair = studentId ? `${studentId}:${mentorId}` : "";
  useEffect(() => {
    const controller = new AbortController();
    let timer;
    async function refresh(initial = false) {
      if (initial) { setContacts([]); setSelected(null); setLoading(true); setContactError(""); }
      try {
        const rows = await api.mentorChat.conversations({
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setContacts(rows);
        setContactError("");
        setSelected(
          (current) =>
            rows.find(
              (row) =>
                current &&
                row.studentId === current.studentId &&
                row.mentorId === current.mentorId,
            ) || null,
        );
      } catch (failure) {
        if (!controller.signal.aborted) {
          setContactError(failure.message);
          setContacts([]);
          setSelected(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          timer = setTimeout(refresh, 5000);
        }
      }
    }
    refresh(true);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [user.id, revision]);
  useEffect(() => {
    const controller = new AbortController();
    conversation.current = controller;
    let timer;
    async function refresh(initial = false) {
      if (initial) { setMessages([]); setDraft(""); setError(""); setBusy(false); setReading(Boolean(studentId)); }
      if (!studentId) return;
      const version = mutation.current;
      try {
        const rows = await api.mentorChat.messages(
          studentId,
          mentorId,
          { signal: controller.signal },
        );
        if (!controller.signal.aborted && version === mutation.current) {
          setMessages(rows);
          setError("");
        }
      } catch (failure) {
        if (!controller.signal.aborted && version === mutation.current) {
          setMessages([]);
          setError(failure.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setReading(false);
          timer = setTimeout(refresh, 3000);
        }
      }
    }
    refresh(true);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [user.id, studentId, mentorId]);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages]);
  async function send(event) {
    event.preventDefault();
    if (!draft.trim() || busy || !selected) return;
    const controller = conversation.current;
    setBusy(true);
    setError("");
    ++mutation.current;
    try {
      const row = await api.mentorChat.send(
        selected.studentId,
        draft.trim(),
        selected.mentorId,
        { signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      ++mutation.current;
      setMessages((rows) => [
        ...rows.filter((item) => item.id !== row.id),
        row,
      ]);
      setDraft("");
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <section className="messages-page">
      <header>
        <h1 className="text-2xl font-extrabold">Mensajes</h1>
        <p className="mt-2 text-sm text-subtle">
          Conversación privada entre estudiante y mentor asignado. Se muestran
          los últimos 200 mensajes.
        </p>
      </header>
      {loading && <p role="status">Cargando contactos…</p>}
      {contactError && (
        <p role="alert">
          {contactError}{" "}
          <button
            className="btn btn-secondary"
            onClick={() => setRevision((v) => v + 1)}
          >
            Reintentar
          </button>
        </p>
      )}
      {!loading && !contactError && !contacts.length && (
        <p className="messages-empty">
          {user.role === "student"
            ? "No tienes un mentor asignado. Contacta con administración para solicitar una asignación."
            : "No tienes estudiantes asignados."}
        </p>
      )}
      <div className="messages-layout">
        <aside aria-label="Conversaciones" className="messages-contacts">
          {contacts.map((contact) => (
            <button
              key={`${contact.studentId}:${contact.mentorId}`}
              aria-pressed={pair === `${contact.studentId}:${contact.mentorId}`}
              className="message-contact"
              onClick={() => setSelected(contact)}
            >
              <strong>{contact.name || "Participante"}</strong>
              <RoleBadge role={contact.identityRole} />
            </button>
          ))}
        </aside>
        <div className="messages-conversation">
          {!selected ? (
            <p className="messages-empty">Selecciona una conversación.</p>
          ) : (
            <>
              <h2 className="text-base font-bold">{selected.name}</h2>
              <RoleBadge role={selected.identityRole} />
              {reading && <p role="status">Cargando mensajes…</p>}
              {error && <p role="alert">{error}</p>}
              <div
                className="messages-log"
                role="log"
                aria-label="Mensajes privados"
                aria-live="polite"
                ref={log}
              >
                {!reading && !error && !messages.length && (
                  <p>No hay mensajes. Inicia la conversación.</p>
                )}
                {messages.map((row) => (
                  <article
                    key={row.id}
                    className={
                      row.sender_id === user.id
                        ? "private-message private-message--own"
                        : "private-message"
                    }
                  >
                    <header>
                      <strong>{row.sender_name || "Participante"}</strong>
                      <RoleBadge role={row.sender_role} />
                    </header>
                    <p>{row.body}</p>
                    {row.created_at && (
                      <time>
                        {new Date(row.created_at).toLocaleString("es-EC")}
                      </time>
                    )}
                  </article>
                ))}
              </div>
              <form className="messages-compose" onSubmit={send}>
                <label>
                  Mensaje
                  <textarea
                    aria-label="Mensaje"
                    maxLength={2000}
                    rows={3}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                </label>
                <button
                  className="btn btn-primary"
                  disabled={busy || !draft.trim()}
                >
                  Enviar mensaje
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
