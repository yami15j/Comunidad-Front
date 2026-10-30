import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Pin,
  Send,
  X,
} from "lucide-react";

export function CommunityView({ threads, user }) {
  const [threadList, setThreadList] = useState(threads);
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Ventas B2B");
  const [newContent, setNewContent] = useState("");

  const channels = [
    "all",
    "Ventas B2B",
    "Finanzas",
    "Casos de Éxito",
    "Liderazgo",
  ];

  const handleLike = (threadId) => {
    setThreadList((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          const isLiked = t.likedByMe;
          return {
            ...t,
            likedByMe: !isLiked,
            likes: isLiked ? t.likes - 1 : t.likes + 1,
          };
        }
        return t;
      }),
    );
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newThread = {
      id: Date.now().toString(),
      author: user.name,
      authorRole: `${user.title} • ScaleTech`,
      authorAvatar: user.avatar,
      badge: user.plan.toUpperCase(),
      title: newTitle,
      category: newCategory,
      content: newContent,
      timeAgo: "Hace unos segundos",
      likes: 1,
      replies: 0,
      likedByMe: true,
      isPinned: false,
    };

    setThreadList([newThread, ...threadList]);
    setNewTitle("");
    setNewContent("");
    setShowNewPostModal(false);
  };

  const filteredThreads =
    selectedChannel === "all"
      ? threadList
      : threadList.filter((t) => t.category === selectedChannel);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="border-l-[3px] border-brand py-1 pl-4 sm:pl-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
              <span>Red Privada de Empresarios</span>
            </span>
          </div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-[28px]">
            Comunidad & Mesa Redonda de Tracción
          </h1>
          <p className="mt-2 max-w-xl text-xs leading-6 text-subtle">
            Resuelve cuellos de botella con fundadores que enfrentan los mismos
            retos comerciales y operativos.
          </p>
        </div>

        <button
          className="btn btn-primary self-start shrink-0 !min-h-9 !rounded-xl !px-4 !py-2 !text-xs lg:self-center"
          onClick={() => setShowNewPostModal(true)}
        >
          <Plus size={16} />
          <span>Iniciar Nuevo Debate</span>
        </button>
      </div>

      {/* Selector de Canales */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-line bg-elevated/40 p-2">
        {channels.map((ch) => (
          <button
            key={ch}
            onClick={() => setSelectedChannel(ch)}
            aria-pressed={selectedChannel === ch}
            className={'shrink-0 rounded-xl border px-3 py-2 text-[11px] font-semibold transition-colors ' + (selectedChannel === ch ? 'border-brand bg-brand text-on-brand shadow-sm' : 'border-line bg-surface text-subtle hover:border-brand/40 hover:text-brand')}
          >
            {ch === "all" ? "Todos los Debates" : `#${ch}`}
          </button>
        ))}
      </div>

      {/* Lista de Hilos de Discusión */}
      <div className="flex flex-col gap-4">
        {filteredThreads.map((thread) => (
          <div key={thread.id} className="rounded-2xl border border-line bg-surface p-4 shadow-panel transition-colors hover:border-brand/25 sm:p-5 [&_.btn]:!min-h-8 [&_.btn]:!rounded-lg [&_.btn]:!px-3 [&_.btn]:!py-1.5 [&_.btn]:!text-[11px]">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={thread.authorAvatar}
                  alt={thread.author}
                  className="size-9 shrink-0 rounded-full border border-line object-cover"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-bold text-ink">
                      {thread.author}
                    </span>
                    <span className="badge badge-emerald text-[11px] [padding:2px_6px]">
                      {thread.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-subtle">
                    {thread.authorRole} • {thread.timeAgo}
                  </div>
                </div>
              </div>

              {thread.isPinned && (
                <span className="badge badge-amber text-[11px]">
                  <Pin size={11} /> Destacado
                </span>
              )}
            </div>

            <h3 className="mb-2 text-sm font-bold leading-6 tracking-tight text-ink">
              {thread.title}
            </h3>
            <p className="mb-4 text-xs leading-6 text-muted">
              {thread.content}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
              <div className="flex flex-wrap gap-2">
                <button
                  className={
                    `btn btn-sm ${thread.likedByMe ? "btn-primary" : "btn-secondary"}` +
                    " [gap:6px]"
                  }
                  onClick={() => handleLike(thread.id)}
                >
                  <Heart
                    size={14}
                    fill={thread.likedByMe ? "currentColor" : "none"}
                  />
                  <span>{thread.likes} Aportes Útiles</span>
                </button>

                <button
                  className="btn btn-secondary btn-sm [gap:6px]"
                  onClick={() =>
                    alert(`Abriendo respuestas del hilo "${thread.title}"...`)
                  }
                >
                  <MessageCircle size={14} />
                  <span>{thread.replies} Respuestas</span>
                </button>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => alert("Enlace copiado al portapapeles")}
                title="Compartir debate"
              >
                <Share2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para Crear Nuevo Post */}
      {showNewPostModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowNewPostModal(false)}
        >
          <div
            className="modal-dialog [max-width:580px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="[padding:18px_24px] bg-elevated [border-bottom:1px_solid_var(--border-subtle)] flex justify-between items-center">
              <div>
                <h3 className="text-[17px] font-extrabold text-ink">
                  Iniciar Nueva Discusión Empresarial
                </h3>
                <p className="text-[12px] text-muted">
                  Comparte una duda sobre tu proceso o un caso de éxito con los
                  demás miembros.
                </p>
              </div>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="[background:none] [border:none] text-muted cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreatePost}
              className="[padding:20px_24px] flex flex-col gap-4"
            >
              <div>
                <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                  Canal / Temática
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] bg-elevated [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                >
                  <option value="Ventas B2B">Ventas B2B & Prospección</option>
                  <option value="Finanzas">Finanzas & Runway</option>
                  <option value="Casos de Éxito">
                    Casos de Éxito & Victorias
                  </option>
                  <option value="Liderazgo">Liderazgo & Equipos</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                  Título de la consulta o aporte
                </label>
                <input
                  type="text"
                  placeholder="Ej: ¿Qué CRM recomiendan para un equipo de 3 vendedores?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] bg-elevated [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                  Detalles y contexto de tu empresa
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe la situación actual, qué has intentado y qué sugerencias buscas..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] bg-elevated [border:1px_solid_var(--border-medium)] text-ink text-[13px] [resize:vertical]"
                  required
                />
              </div>

              <div className="flex justify-end [gap:10px] [margin-top:10px]">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowNewPostModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  <Send size={14} />
                  <span>Publicar Debate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityView;
