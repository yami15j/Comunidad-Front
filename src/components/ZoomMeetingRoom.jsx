import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Video } from "lucide-react";
import { api } from "../services/api";
import { zoomLink } from "../services/studentContent";
export function ZoomMeetingRoom({ session, onBack }) {
  const frame = useRef(null);
  const [nonce] = useState(() => crypto.randomUUID());
  const [access, setAccess] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    const listener = event => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'zoom-left') { setAccess(null); setConnected(false); return; }
      if (event.data?.nonce !== nonce) return;
      if (event.data.type === 'zoom-ready' && access) frame.current.contentWindow.postMessage({ type: 'zoom-join', nonce, access }, window.location.origin);
      if (event.data.type === 'zoom-error') { setError(event.data.message); setAccess(null); setConnected(false); }
      if (event.data.type === 'zoom-connected') setConnected(true);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [access, nonce]);
  useEffect(() => {
    if (!access || connected) return;
    const timer = setTimeout(() => { setError("Zoom esta tardando en responder. Puedes reintentar o usar Abrir en Zoom."); setAccess(null); }, 60000);
    return () => clearTimeout(timer);
  }, [access, connected]);
  async function connect() {
    if (busy) return;
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError("");
    try { const result = await api.liveSessions.zoomJoin(session.id, { signal: controller.signal }); if (!controller.signal.aborted) setAccess(result); }
    catch (failure) { if (!controller.signal.aborted) setError(failure.message || "No se pudo conectar con Zoom."); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  const external = zoomLink(session.joinUrl);
  return <section className="space-y-4"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 py-2 text-xs font-semibold text-muted hover:text-brand"><ArrowLeft size={15} />Volver a clases</button><header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-brand">Aula en vivo</p><h1 className="mt-1 text-xl font-bold text-ink">{session.title}</h1><p className="mt-1 text-xs text-subtle">{session.mentorName}</p></div>{external && <a href={external} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-brand">Abrir en Zoom<ArrowUpRight size={13} /></a>}</header>
    {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">{error}</p>}
    {access ? <div className="overflow-hidden rounded-xl border border-line bg-surface"><p role="status" className="border-b border-line px-4 py-2 text-[10px] text-subtle">{connected ? "Conectado a la reunión" : "Conectando con Zoom..."}</p><iframe ref={frame} src={"/zoom-meeting.html?nonce=" + encodeURIComponent(nonce)} title="Reunión de Zoom" allow="camera; microphone; fullscreen; display-capture; autoplay" allowFullScreen className="h-[70dvh] min-h-[480px] w-full border-0" /></div> : <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-line bg-surface p-6 text-center"><Video size={32} className="mb-3 text-brand" /><h2 className="text-base font-bold text-ink">Participa sin salir de tu plataforma</h2><p className="mt-2 max-w-sm text-xs leading-6 text-subtle">Al ingresar podrás ver al mentor y la pantalla compartida. Zoom te pedirá los permisos que necesites para participar.</p><button type="button" disabled={busy} onClick={connect} className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy ? "Conectando..." : error ? "Reintentar conexión" : "Entrar a la clase"}</button></div>}
  </section>;
}
