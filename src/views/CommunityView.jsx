import React, { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Plus, Send, RefreshCw } from "lucide-react";
import { Avatar, Dialog } from "../components/ui";
import { RoleBadge } from "../components/RoleBadge";
import { api } from "../services/api";

const channels = ["Ventas B2B", "Finanzas", "Casos de Éxito", "Liderazgo"];
export function CommunityView({ user }) {
  const [threads, setThreads] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [revision, setRevision] = useState(0),
    [channel, setChannel] = useState("all"),
    [expanded, setExpanded] = useState(null);
  const [open, setOpen] = useState(false),
    [title, setTitle] = useState(""),
    [content, setContent] = useState(""),
    [category, setCategory] = useState(channels[0]),
    [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false),
    [mutationError, setMutationError] = useState("");
  const lifetime = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    async function load() {
      setThreads([]); setLoading(true); setError("");
      try { const rows = await api.forums.list({signal:controller.signal}); if (!controller.signal.aborted) setThreads(rows); }
      catch(failure) { if (!controller.signal.aborted) setError(failure.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [user.id, revision]);
  async function mutate(action, onSuccess) {
    const controller = lifetime.current;
    if (!controller || controller.signal.aborted || busy) return;
    setBusy(true);
    setMutationError("");
    try {
      const row = await action({ signal: controller.signal });
      if (controller.signal.aborted) return;
      setThreads((rows) =>
        [row, ...rows.filter((item) => item.id !== row.id)].sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
        ),
      );
      onSuccess?.();
    } catch (failure) {
      if (!controller.signal.aborted) setMutationError(failure.message);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <section className="flex min-w-0 flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Comunidad</h1>
          <p className="mt-2 text-xs leading-6 text-subtle">
            Comparte consultas y experiencias con estudiantes, mentores y
            administración.
          </p>
          <p className="text-xs text-subtle">
            Últimos 100 debates · hasta 200 respuestas recientes por debate
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-secondary"
            disabled={loading || busy}
            onClick={() => setRevision((v) => v + 1)}
          >
            <RefreshCw size={14} />
            Actualizar
          </button>
          <button
            className="btn btn-primary"
            disabled={loading || Boolean(error)}
            onClick={() => {
              setOpen(true);
              setMutationError("");
            }}
          >
            <Plus size={15} />
            Iniciar Nuevo Debate
          </button>
        </div>
      </header>
      <nav aria-label="Canales del foro" className="flex flex-wrap gap-2">
        {["all", ...channels].map((value) => (
          <button
            key={value}
            className="btn btn-secondary"
            aria-pressed={channel === value}
            onClick={() => setChannel(value)}
          >
            {value === "all" ? "Todos los debates" : value}
          </button>
        ))}
      </nav>
      {loading && <p role="status">Cargando debates…</p>}
      {error && (
        <p role="alert">
          {error}{" "}
          <button
            className="btn btn-secondary"
            onClick={() => setRevision((v) => v + 1)}
          >
            Reintentar
          </button>
        </p>
      )}
      {mutationError && !open && <p role="alert">{mutationError}</p>}
      {!loading &&
        !error &&
        !threads.filter((row) => channel === "all" || row.category === channel)
          .length && (
          <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-subtle">
            No hay debates para mostrar. Inicia la primera conversación.
          </p>
        )}
      {!loading &&
        !error &&
        threads
          .filter((row) => channel === "all" || row.category === channel)
          .map((thread) => (
            <article
              key={thread.id}
              className="min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-5"
            >
              <header className="flex items-center gap-3">
                <Avatar
                  src={thread.authorAvatar}
                  name={thread.author || "Participante"}
                  className="size-9"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm">
                      {thread.author || "Participante"}
                    </strong>
                    <RoleBadge role={thread.identityRole} />
                  </div>
                  <p className="mt-1 text-[11px] text-subtle">
                    {thread.category} ·{" "}
                    {thread.createdAt
                      ? new Date(thread.createdAt).toLocaleString("es-EC")
                      : ""}
                  </p>
                </div>
              </header>
              <h2 className="mt-4 break-words text-base font-bold">
                {thread.title}
              </h2>
              <p className="my-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted">
                {thread.content}
              </p>
              <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                <button
                  className="btn btn-secondary"
                  aria-pressed={thread.likedByMe}
                  disabled={busy}
                  onClick={() =>
                    mutate((options) =>
                      api.forums.like(thread.id, !thread.likedByMe, options),
                    )
                  }
                >
                  <Heart
                    size={14}
                    fill={thread.likedByMe ? "currentColor" : "none"}
                  />
                  {thread.likes} Aportes útiles
                </button>
                <button
                  className="btn btn-secondary"
                  aria-expanded={expanded === thread.id}
                  onClick={() => {
                    setExpanded(expanded === thread.id ? null : thread.id);
                    setReply("");
                    setMutationError("");
                  }}
                >
                  <MessageCircle size={14} />
                  {thread.commentsCount} Respuestas
                </button>
              </div>
              {expanded === thread.id && (
                <section
                  aria-label={"Respuestas a " + thread.title}
                  className="mt-4 space-y-3 border-t border-line pt-4"
                >
                  {!thread.comments.length && (
                    <p className="text-xs text-subtle">
                      Todavía no hay respuestas.
                    </p>
                  )}
                  {thread.comments.map((comment) => (
                    <article
                      key={comment.id}
                      className="rounded-xl bg-elevated p-3"
                    >
                      <header className="flex flex-wrap items-center gap-2 text-xs">
                        <strong>{comment.author || "Participante"}</strong>
                        <RoleBadge role={comment.identityRole} />
                      </header>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                        {comment.content}
                      </p>
                    </article>
                  ))}
                  <form
                    className="flex flex-col gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (reply.trim())
                        mutate(
                          (options) =>
                            api.forums.reply(thread.id, reply.trim(), options),
                          () => setReply(""),
                        );
                    }}
                  >
                    <label className="text-xs font-semibold">
                      Tu respuesta
                      <textarea
                        aria-label={"Respuesta a " + thread.title}
                        rows={3}
                        maxLength={2000}
                        className="mt-2 w-full rounded-xl border border-line bg-surface p-3"
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                      />
                    </label>
                    <button
                      className="btn btn-primary self-start"
                      disabled={busy || !reply.trim()}
                    >
                      Publicar respuesta
                    </button>
                  </form>
                </section>
              )}
            </article>
          ))}
      <Dialog
        open={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        title="Iniciar Nuevo Debate"
        className="max-w-xl"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (title.trim() && content.trim())
              mutate(
                (options) =>
                  api.forums.create(
                    { title: title.trim(), content: content.trim(), category },
                    options,
                  ),
                () => {
                  setTitle("");
                  setContent("");
                  setOpen(false);
                  setChannel("all");
                },
              );
          }}
        >
          <label className="text-xs font-semibold">
            Canal
            <select
              className="mt-2 w-full rounded-xl border border-line bg-elevated p-3"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {channels.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Título
            <input
              aria-label="Título del debate"
              maxLength={200}
              className="mt-2 w-full rounded-xl border border-line bg-elevated p-3"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <label className="text-xs font-semibold">
            Contenido
            <textarea
              aria-label="Contenido del debate"
              maxLength={4000}
              rows={5}
              className="mt-2 w-full rounded-xl border border-line bg-elevated p-3"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
            />
          </label>
          {mutationError && <p role="alert">{mutationError}</p>}
          <button
            className="btn btn-primary"
            disabled={busy || !title.trim() || !content.trim()}
          >
            <Send size={14} />
            {busy ? "Publicando…" : "Publicar Debate"}
          </button>
        </form>
      </Dialog>
    </section>
  );
}
export default CommunityView;
