import React, { useState } from "react";
import { Brand } from "../components/ui";
import { api } from "../services/api";

export function readPasswordRecovery(location) {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  if (params.get('type') !== 'recovery' && location.pathname !== '/recuperar-contrasena') return null;
  return { accessToken: params.get('type') === 'recovery' ? params.get('access_token') : null, challenge: new URLSearchParams(location.search || '').get('challenge') };
}
export function PasswordRecoveryView({ recovery, onDone }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  return <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-canvas p-5"><Brand />
    <section className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-panel">
      <h1 className="text-xl font-extrabold tracking-tight">Recuperar contraseña</h1>
      {!recovery.accessToken || !recovery.challenge ? <><p role="alert" className="my-4 text-sm leading-6 text-subtle">El enlace no es válido o ha vencido. Vuelve al inicio de sesión y solicita otro desde “¿Olvidaste tu contraseña?”.</p><button className="btn btn-primary w-full" onClick={onDone}>Volver al inicio de sesión</button></> : saved ? <><p role="status" className="my-4 text-sm leading-6 text-brand">Contraseña actualizada. Ingresa con tu correo y tu nueva contraseña.</p><button className="btn btn-primary w-full" onClick={onDone}>Iniciar sesión</button></> : <form className="mt-5 grid gap-4" onSubmit={async event => {
        event.preventDefault(); if (busy) return;
        if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return; }
        setBusy(true); setError('');
        try { await api.resetPassword(recovery.accessToken, password, recovery.challenge); setSaved(true); setPassword(''); setConfirmation(''); }
        catch (failure) { setError(failure.message); }
        finally { setBusy(false); }
      }}>
        <p className="text-xs leading-6 text-subtle">Escribe una contraseña nueva de al menos 8 caracteres.</p>
        <label className="grid gap-2 text-xs font-semibold">Nueva contraseña<input type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={busy} value={password} onChange={event => setPassword(event.target.value)} /></label>
        <label className="grid gap-2 text-xs font-semibold">Confirmar contraseña<input type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={busy} value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
        {error && <p role="alert" className="text-xs leading-6 text-danger">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar nueva contraseña'}</button>
        <button type="button" className="text-xs text-subtle hover:text-brand" disabled={busy} onClick={onDone}>Volver al inicio de sesión</button>
      </form>}
    </section>
  </main>;
}
