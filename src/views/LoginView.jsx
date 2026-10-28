import React, { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Radio,
  TrendingUp,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  AlertCircle,
  LoaderCircle,
  ArrowUpRight,
} from "lucide-react";
import { Brand } from "../components/ui";
export function LoginView({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      await onLogin({ email: email.trim(), password, rememberMe });
    } catch (failure) {
      setError(failure.message || "No se pudo completar la operación.");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden min-h-dvh flex-col overflow-hidden bg-slate-900 px-12 py-10 lg:flex xl:px-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-36 -right-56 size-[650px] rounded-full border border-white/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-14 -right-36 size-[470px] rounded-full border-[70px] border-sky-500/8"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-8 bottom-20 size-72 rounded-full border border-sky-400/10"
        />
        <div className="relative">
          <Brand light />
        </div>
        <div className="relative my-auto max-w-lg py-20">
          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold tracking-[0.05em] text-sky-200">
            <span className="size-1.5 rounded-full bg-sky-400" />
            TU ESPACIO DE CRECIMIENTO
          </span>
          <h1 className="text-[48px] leading-[1.12] font-extrabold tracking-[-0.055em] text-white xl:text-[60px]">
            El siguiente nivel
            <br />
            empieza <span className="text-sky-400">contigo.</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-slate-300">
            Conocimiento que se convierte en acción. Conecta con tus mentores y
            avanza a tu ritmo, desde un solo lugar.
          </p>
          <div className="mt-12 space-y-5">
            {[
              {
                icon: BookOpen,
                title: "Aprende con propósito",
                text: "Programas y recursos para poner en práctica.",
              },
              {
                icon: Radio,
                title: "Conecta en vivo",
                text: "Clases y conversaciones con tus mentores.",
              },
              {
                icon: TrendingUp,
                title: "Sigue tu evolución",
                text: "Retoma tu aprendizaje donde lo dejaste.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sky-300">
                  <item.icon size={18} strokeWidth={1.6} />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">{item.title}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center justify-between border-t border-white/10 pt-6 text-[10px] tracking-wide text-slate-400">
          <span>COMUNIDAD DEL INTERCAMBIO</span>
          <span className="flex items-center gap-2">
            Formación & negocios
            <ArrowUpRight size={13} />
          </span>
        </div>
      </aside>
      <main className="relative flex min-h-dvh flex-col px-6 py-7 sm:px-12">
        <div className="lg:hidden">
          <Brand />
        </div>
        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-14 sm:py-20">
          <span className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-brand-line/70 bg-brand-soft text-brand">
            <LockKeyhole size={22} strokeWidth={1.5} />
          </span>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
            BIENVENIDO A TU COMUNIDAD
          </p>
          <h1 className="text-[32px] leading-tight font-extrabold tracking-[-0.045em]">
            Qué gusto verte de nuevo.
          </h1>
          <p className="mt-3 text-[13px] leading-6 text-subtle">
            Ingresa a tu cuenta y continúa construyendo tu próximo paso.
          </p>
          <form onSubmit={submit} className="mt-9 space-y-5">
            <label className="grid gap-2 text-xs font-semibold text-muted">
              Correo electrónico
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle"
                />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@correo.com"
                  className="!min-h-12 w-full !pl-10"
                />
              </div>
            </label>
            <label className="grid gap-2 text-xs font-semibold text-muted">
              Contraseña
              <div className="relative">
                <LockKeyhole
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="!min-h-12 w-full !pr-11 !pl-10"
                />
                <button
                  type="button"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-2 text-subtle hover:text-brand"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <label className="flex w-fit cursor-pointer items-center gap-2.5 text-[11px] text-muted">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Recordarme en este dispositivo
            </label>
            {error && (
              <div role="alert" className="flex items-start gap-2.5">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary !min-h-12 w-full !text-sm"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  Ingresar a mi plataforma
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          <div className="mt-9 flex items-center gap-3 text-[10px] text-subtle/70">
            <span className="h-px flex-1 bg-line" />
            <LockKeyhole size={11} />
            <span>Tu espacio de aprendizaje</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        </div>
        <p className="text-center text-[10px] text-subtle/70">
          Comunidad del Intercambio · Formación que conecta
        </p>
      </main>
    </div>
  );
}
export default LoginView;
