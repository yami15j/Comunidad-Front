import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, BookOpen, CheckCircle2, Play, X } from "lucide-react";
export function Brand({ light = false, compact = false }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="relative block size-12 shrink-0">
        {/* El globo blanco del PNG necesita contraste dentro de su contorno. */}
        <span
          aria-hidden="true"
          className="absolute top-[25.2%] left-[28.9%] size-[45.5%] rounded-full bg-slate-900"
        />
        <img
          src="/logo.png"
          className="relative size-full object-contain"
          width={48}
          height={48}
          alt={compact ? "Comunidad del Intercambio" : ""}
        />
      </span>
      {!compact && (
        <div
          className={
            "min-w-0 leading-tight " + (light ? "text-white" : "text-ink")
          }
        >
          <div className="text-[13px] font-extrabold tracking-[0.12em]">
            COMUNIDAD
          </div>
          <div
            className={
              "mt-1 text-[10px] font-semibold tracking-[0.17em] " +
              (light ? "text-sky-300" : "text-brand")
            }
          >
            DEL INTERCAMBIO
          </div>
        </div>
      )}
    </div>
  );
}
export function Avatar({ src, name = "", className = "size-10" }) {
  const [failed, setFailed] = useState(null);
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("") || "C";
  return (
    <span
      aria-label={name || "Perfil"}
      role="img"
      className={
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-line/60 bg-brand-soft text-xs font-bold text-brand " +
        className
      }
    >
      {src && failed !== src ? (
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(src)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
  icon: Icon,
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-5">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
            {Icon && <Icon size={14} />} {eyebrow}
          </p>
        )}
        <h1 className="text-2xl leading-tight font-extrabold tracking-[-0.04em] sm:text-[30px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-xl text-[13px] leading-6 text-muted">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
export function EmptyState({
  title,
  description,
  icon: Icon = BookOpen,
  action,
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-elevated/50 px-5 py-8 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-line bg-surface text-brand">
        <Icon size={22} strokeWidth={1.6} />
      </span>
      <h3 className="text-sm font-bold">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-xs leading-6 text-subtle">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function Metric({ label, value, detail }) {
  return (
    <article className="group relative overflow-hidden rounded-xl border border-line bg-surface p-3 shadow-panel transition-colors hover:border-brand/30 sm:px-4 sm:py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold leading-4 text-muted">{label}</span>
      </div>
      <div className="text-2xl leading-none font-extrabold tracking-tight tabular-nums text-ink">
        {value}
      </div>
      {detail && <p className="mt-1.5 text-[10px] leading-4 text-subtle">{detail}</p>}
      <div aria-hidden="true" className="absolute inset-x-4 bottom-0 h-0.5 rounded-t-full bg-brand/15 transition-colors group-hover:bg-brand/40 sm:inset-x-5" />
    </article>
  );
}
export function Progress({ value, label }) {
  const percent = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div>
      {label && (
        <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
          <span className="text-subtle">{label}</span>
          <span className="font-bold tabular-nums text-brand">{percent}%</span>
        </div>
      )}
      <div
        className="progress-bar-container"
        role="progressbar"
        aria-label={label || "Progreso del curso"}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-bar-fill" style={{ width: percent + "%" }} />
      </div>
    </div>
  );
}
export function CourseCard({ course, onSelect }) {
  const liveOnly = course.accessType === "live";
  const available = course.totalLessonsCount > 0 || liveOnly;
  return (
    <article className="group flex w-full min-w-0 max-w-sm flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-panel transition duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md">
      <div className="relative h-36 overflow-hidden bg-elevated sm:h-40">
        <img
          src={course.thumbnail}
          alt=""
          loading="lazy"
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/35 to-transparent" />
        <span className="absolute top-3 left-3 rounded-lg border border-line bg-surface/95 px-2.5 py-1 text-[10px] font-bold text-muted backdrop-blur-sm">
          {course.category && course.category !== "Sin categoría" ? course.category : "Programa de formación"}
        </span>
        {course.progressPercent === 100 && (
          <span className="absolute right-3 bottom-3 rounded-full bg-surface p-1.5 text-brand">
            <CheckCircle2 size={16} />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-subtle">
          <span className="rounded-md bg-elevated px-2 py-1">{course.totalModulesCount || 0} {course.totalModulesCount === 1 ? 'módulo' : 'módulos'}</span>
          <span className="rounded-md bg-elevated px-2 py-1">{course.totalLessonsCount || 0} {course.totalLessonsCount === 1 ? 'lección' : 'lecciones'}</span>
          {course.estimatedMinutes > 0 && (
            <>
              <span className="size-0.5 rounded-full bg-line-strong" />
              <span>{course.estimatedHours}</span>
            </>
          )}
        </div>
        <h3 className="line-clamp-2 text-base leading-6 font-bold tracking-tight text-ink">
          {course.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-subtle">
          {course.tagline}
        </p>
        <div className="my-4 flex items-center gap-2.5">
          <Avatar
            name={course.mentorName}
            src={course.mentorAvatar}
            className="size-8"
          />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-muted">
              {course.mentorName}
            </p>
            <p className="truncate text-[10px] text-subtle">
              {course.mentorRole}
            </p>
          </div>
        </div>
        <div className="mt-auto space-y-3 border-t border-line pt-3">
          {liveOnly ? (
            <p className="text-xs font-semibold text-brand">
              Acceso a clases en vivo
            </p>
          ) : (
            <Progress
              value={course.progressPercent}
              label={
                course.completedLessonsCount +
                " de " +
                course.totalLessonsCount +
                " lecciones"
              }
            />
          )}
          <button
            className={`btn w-full !min-h-9 !rounded-xl !py-2 !text-xs ${available ? "btn-primary" : "btn-secondary !border-dashed !bg-elevated/50"}`}
            disabled={!available}
            onClick={() => onSelect(course)}
          >
            {available
              ? liveOnly
                ? "Ver clases"
                : course.progressPercent > 0
                  ? "Continuar aprendiendo"
                  : "Comenzar programa"
              : "Contenido por publicar"}
            {available &&
              (course.progressPercent > 0 ? (
                <Play size={13} />
              ) : (
                <ArrowRight size={14} />
              ))}
          </button>
        </div>
      </div>
    </article>
  );
}
export function Dialog({
  open,
  onClose,
  title,
  children,
  className = "max-w-2xl",
}) {
  const panel = useRef(null);
  const close = useRef(onClose);
  const id = useId();
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const selector =
      'button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]';
    panel.current?.querySelector(selector)?.focus();
    function keydown(event) {
      if (event.key === "Escape") close.current();
      if (event.key === "Tab") {
        const targets = [...(panel.current?.querySelectorAll(selector) || [])];
        const first = targets[0],
          last = targets.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);
  if (!open) return null;
  const dialog = (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={"modal-dialog " + className}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <h2 id={id} className="text-base">
            {title}
          </h2>
          <button aria-label="Cerrar" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </div>
  );
  return typeof document === "undefined" ? dialog : createPortal(dialog, document.body);
}
