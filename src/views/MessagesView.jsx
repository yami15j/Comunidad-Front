import React, { useEffect, useRef, useState } from "react";
import { RoleBadge } from "../components/RoleBadge";
import { Avatar, Dialog } from "../components/ui";
import { Send, LockKeyhole, UserRound } from "lucide-react";
import { api } from "../services/api";
import "./MessagesView.css";
export function MessagesView({ user, initialContact = null }) {
  const [profileOpen, setProfileOpen] = useState(false);
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
                (current || (initial && initialContact)) &&
                row.studentId === (current || initialContact).studentId &&
                row.mentorId === (current || initialContact).mentorId,
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
        <h1 className="text-2xl font-extrabold">{user.role === "student" ? "Chat con mi mentor" : "Chat con estudiantes"}</h1>
        <p className="mt-2 text-sm text-subtle">
          Conversación privada: solo tú y tu {user.role === "student" ? "mentor asignado" : "estudiante"} pueden leer estos mensajes.
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
          <h2 className="messages-contacts-title">{user.role === "student" ? "Mi mentor" : "Mis estudiantes"}</h2>
          {contacts.map((contact) => (
            <button
              key={`${contact.studentId}:${contact.mentorId}`}
              aria-pressed={pair === `${contact.studentId}:${contact.mentorId}`}
              className="message-contact"
              onClick={() => setSelected(contact)}
            >
              <Avatar src={contact.avatarUrl || contact.avatar} name={contact.name} className="size-10 shrink-0" />
              <span className="grid min-w-0 gap-1.5"><strong>{contact.name || "Participante"}</strong><RoleBadge role={contact.identityRole} /></span>
            </button>
          ))}
        </aside>
        <div className="messages-conversation">
          {!selected ? (
            <p className="messages-empty">Selecciona una conversación.</p>
          ) : (
            <>
              <div className="messages-conversation-heading"><div className="flex min-w-0 items-center gap-3"><Avatar src={selected.avatarUrl || selected.avatar} name={selected.name} className="size-11 shrink-0" /><div className="min-w-0"><h2>{selected.name}</h2><span className="mt-1 flex items-center gap-1.5 text-[10px] text-subtle"><LockKeyhole size={11} />Conversación privada</span></div></div><button type="button" className="messages-profile-button" onClick={() => setProfileOpen(true)}><UserRound size={14} />Ver perfil</button></div>
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
                {messages.map((row, index) => (
                  <React.Fragment key={row.id}>
                  {row.created_at && (!messages[index - 1]?.created_at || new Date(messages[index - 1].created_at).toDateString() !== new Date(row.created_at).toDateString()) && <div className="messages-day"><span>{new Date(row.created_at).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })}</span></div>}
                  <div className={`messages-row ${row.sender_id === user.id ? "messages-row--own" : ""}`}>
                  <Avatar src={row.sender_id === user.id ? user.avatar || user.avatarUrl : selected.avatarUrl || selected.avatar} name={row.sender_name || (row.sender_id === user.id ? user.name : selected.name)} className="size-8 shrink-0" />
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
                        {new Date(row.created_at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                      </time>
                    )}
                  </article>
                  </div>
                  </React.Fragment>
                ))}
              </div>
              <form className="messages-compose" onSubmit={send}>
                <label>
                  <span className="sr-only">Mensaje</span>
                  <textarea
                    aria-label="Mensaje"
                    maxLength={2000}
                    rows={3}
                    placeholder="Escribe tu mensaje…"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
                      event.preventDefault();
                      if (!event.repeat && !busy && draft.trim()) event.currentTarget.form?.requestSubmit();
                    }}
                  />
                </label>
                <button
                  className="btn btn-primary"
                  aria-label="Enviar mensaje"
                  title="Enviar mensaje"
                  disabled={busy || !draft.trim()}
                >
                  <Send size={20} aria-hidden="true" /><span className="sr-only">Enviar mensaje</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <Dialog open={profileOpen && Boolean(selected)} onClose={() => setProfileOpen(false)} title="Perfil del contacto" className="max-w-sm">
        {selected && <div className="flex flex-col items-center gap-3 py-3 text-center"><Avatar src={selected.avatarUrl || selected.avatar} name={selected.name} className="size-20" /><h2 className="text-base font-bold">{selected.name}</h2><RoleBadge role={selected.identityRole} /><p className="text-xs leading-6 text-subtle">{user.role === "student" ? "Tu mentor asignado para acompañarte en tu aprendizaje." : "Estudiante asignado a tu acompañamiento."}</p></div>}
      </Dialog>
    </section>
  );
}
