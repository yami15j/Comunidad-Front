import React, { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Plus, Send, RefreshCw } from "lucide-react";
import { Avatar, Dialog } from "../components/ui";
import { RoleBadge } from "../components/RoleBadge";
import { api } from "../services/api";

const channels = ["Ventas B2B", "Finanzas", "Casos de Éxito", "Liderazgo"];
export function CommunityView({ user, initialThreadId = null }) {
  const [threads, setThreads] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [revision, setRevision] = useState(0),
    [channel, setChannel] = useState("all"),
    [expanded, setExpanded] = useState(initialThreadId);
  const [open, setOpen] = useState(false),
    [title, setTitle] = useState(""),
    [content, setContent] = useState(""),
    [category, setCategory] = useState(channels[0]),
    [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false),
    [mutationError, setMutationError] = useState("");
  const lifetime = useRef(null);
  const mutationVersion = useRef(0);
  const mutationPending = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    let fetching = false;
    async function load(silent = false) {
      if (fetching || mutationPending.current || controller.signal.aborted) return;
      fetching = true;
      const version = mutationVersion.current;
      if (!silent) { setThreads([]); setLoading(true); setError(""); }
      try {
        const rows = await api.forums.list({ signal: controller.signal });
        if (!controller.signal.aborted && version === mutationVersion.current) {
          setThreads(rows); setError("");
        }
      } catch (failure) {
        if (!controller.signal.aborted && !silent) setError(failure.message);
      } finally {
        fetching = false;
        if (!controller.signal.aborted && !silent) setLoading(false);
      }
    }
    load();
    const refresh = () => { if (document.visibilityState !== "hidden") load(true); };
    const timer = window.setInterval(refresh, 3000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort(); window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [user.id, revision]);
  function toggleThread(id) {
    setExpanded(current => current === id ? null : id);
    setReply(""); setMutationError("");
  }
  function submitOnEnter(event) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!event.repeat && !busy) event.currentTarget.form?.requestSubmit();
  }
  async function mutate(action, onSuccess) {
    const controller = lifetime.current;
    if (!controller || controller.signal.aborted || busy) return;
    mutationPending.current = true;
    mutationVersion.current += 1;
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
      mutationVersion.current += 1;
      mutationPending.current = false;
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <section className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5 pt-1">
        <div className="min-w-0"><h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Foro de comunidad</h2><p className="mt-1.5 text-xs leading-5 text-subtle">Pregunta, comparte ideas y aprende con tu comunidad.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50" disabled={loading || Boolean(error)} onClick={() => { setOpen(true); setMutationError(""); }}><Plus size={14} /> Iniciar Nuevo Debate</button>
        <button className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-semibold text-muted transition hover:border-brand-line hover:text-brand disabled:opacity-50" disabled={loading || busy} onClick={() => setRevision(v => v + 1)}><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualizar</button>
        </div>
      </div>
      <nav aria-label="Canales del foro" className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-line">
        {["all", ...channels].map((value) => (
          <button
            key={value}
            className={`inline-flex items-center gap-2 border-b-2 px-0.5 pb-3 pt-1 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-brand ${channel === value ? "border-brand text-brand" : "border-transparent text-subtle hover:border-brand-line hover:text-brand"}`}
            aria-pressed={channel === value}
            onClick={() => setChannel(value)}
          >
            {value === "all" ? "Todos los debates" : value}
            {!loading && !error && <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${channel === value ? "bg-brand-soft text-brand" : "bg-elevated text-subtle"}`}>{threads.filter(thread => value === "all" || thread.category === value).length}</span>}
          </button>
        ))}
      </nav>
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_210px]">
      <div className="flex min-w-0 flex-col gap-3">
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
              tabIndex={0}
              aria-label={"Debate: " + thread.title}
              onClick={(event) => {
                if (event.target.closest("button, a, input, textarea, select, form") || event.target.closest("[data-conversation]")) return;
                if (window.getSelection()?.toString()) return;
                toggleThread(thread.id);
              }}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); toggleThread(thread.id); }
              }}
              className={`group relative min-w-0 cursor-pointer overflow-hidden rounded-xl border bg-surface p-3.5 transition duration-200 focus-visible:outline-2 focus-visible:outline-brand sm:p-4 ${expanded === thread.id ? "border-brand-line shadow-sm" : "border-line hover:border-brand-line hover:shadow-sm"}`}
            >
              <header className="flex min-w-0 items-start gap-3">
                <Avatar src={thread.authorAvatar} name={thread.author || "Participante"} className="size-8 shrink-0 ring-2 ring-elevated" />
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-base font-bold leading-6 tracking-tight text-ink transition group-hover:text-brand">{thread.title}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-subtle">
                    <span className="font-semibold text-muted">{thread.author || "Participante"}</span>
                    <RoleBadge role={thread.identityRole} />
                    {thread.createdAt && <time dateTime={thread.createdAt}>{new Date(thread.createdAt).toLocaleString("es-EC", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time>}
                  </div>
                </div>
              </header>
              <p className="mb-3 mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-muted sm:ml-11">{thread.content}</p>
              <div className="mb-3 flex items-center gap-2 text-[10px] sm:ml-11"><span className="text-subtle">Tema</span><span className="rounded-md bg-brand-soft px-2 py-1 font-semibold text-brand">{thread.category}</span></div>
              <div className="flex flex-wrap items-center gap-2 border-t border-line/60 pt-2 sm:ml-11">
                <button
                  className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all disabled:opacity-50 ${thread.likedByMe ? "bg-rose-50 text-rose-600" : "text-subtle hover:bg-rose-50 hover:text-rose-600"}`}
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
                  {thread.likes} {thread.likes === 1 ? "Aporte útil" : "Aportes útiles"}
                </button>
                <button
                  className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${expanded === thread.id ? "bg-brand-soft text-brand" : "text-subtle hover:bg-brand-soft hover:text-brand"}`}
                  aria-expanded={expanded === thread.id}
                  onClick={() => {
                    toggleThread(thread.id);
                  }}
                >
                  <MessageCircle size={14} />
                  {thread.commentsCount} {thread.commentsCount === 1 ? "Respuesta" : "Respuestas"}
                </button>
              </div>
              {expanded === thread.id && (
                <section
                  data-conversation
                  aria-label={"Respuestas a " + thread.title}
                  className="-mx-3.5 -mb-3.5 mt-3 cursor-auto border-t border-line bg-elevated/20 px-3.5 py-3 sm:-mx-4 sm:-mb-4 sm:px-4"
                >
                  {!thread.comments.length && (
                    <p className="text-xs text-subtle">
                      Todavía no hay respuestas.
                    </p>
                  )}
                  <h3 className="mb-1 flex items-center gap-2 text-[11px] font-semibold text-muted">Conversación <span className="font-semibold text-brand">({thread.commentsCount})</span></h3>
                  {thread.comments.map((comment) => (
                    <article
                      key={comment.id}
                      className="min-w-0 border-b border-line/50 py-3 last:border-b-0"
                    >
                      <header className="flex min-w-0 items-center gap-2.5">
                        <Avatar name={comment.author || "Participante"} className="size-8 shrink-0 text-[10px]" />
                        <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
                          <strong className="break-words font-bold text-ink">{comment.author || "Participante"}</strong>
                          <RoleBadge role={comment.identityRole} />
                        </div>
                      </header>
                      <p className="ml-[42px] mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-muted">
                        {comment.content}
                      </p>
                    </article>
                  ))}
                  <form
                    className="mt-3 flex flex-col gap-2 rounded-lg border border-line bg-surface p-3 transition focus-within:border-brand-line focus-within:ring-2 focus-within:ring-brand/10"
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
                    <label className="text-[11px] font-semibold text-muted">
                      Tu respuesta
                      <textarea
                        onKeyDown={submitOnEnter}
                        aria-label={"Respuesta a " + thread.title}
                        rows={2}
                        maxLength={2000}
                        placeholder="Comparte tu respuesta…"
                        className="mt-1.5 block min-h-16 w-full resize-y border-0 bg-transparent py-1 text-sm font-normal leading-6 text-ink outline-none placeholder:text-subtle focus:outline-none focus:ring-0"
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                      />
                    </label>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2.5">
                    <p className="text-[10px] font-normal text-subtle">Enter para enviar. Shift + Enter para otra línea</p>
                    <button
                      className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={busy || !reply.trim()}
                    >
                      {busy ? "Publicando…" : "Publicar respuesta"}
                    </button>
                    </div>
                  </form>
                </section>
              )}
            </article>
          ))}
      </div>
      <aside className="hidden space-y-3 xl:sticky xl:top-24 xl:block">
        <div className="border-l border-line pl-5 pt-1">
          <h3 className="text-xs font-bold text-ink">Hagamos comunidad</h3>
          <ul className="mt-3 space-y-2.5 text-[11px] leading-5 text-subtle"><li className="">Comparte ideas y ejemplos útiles.</li><li className="">Pregunta con confianza y responde con respeto.</li><li className="">Reconoce los aportes de los demás.</li></ul>
        </div>
      </aside>
      </div>
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
              onKeyDown={submitOnEnter}
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
