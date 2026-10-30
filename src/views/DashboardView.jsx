import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Megaphone,
  Play,
  Radio,
} from "lucide-react";
import {
  Avatar,
  CourseCard,
  EmptyState,
  Metric,
  Progress,
} from "../components/ui";
function date(value, options) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Fecha por confirmar"
    : parsed.toLocaleDateString("es-EC", options);
}
export function DashboardView({
  user,
  courses = [],
  liveClasses = [],
  announcements = [],
  onSelectCourse,
  onOpenLiveSession,
  onNavigate,
}) {
  const upcoming = useMemo(
    () =>
      [...liveClasses]
        .filter((session) => session.effectiveStatus !== "ended")
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)),
    [liveClasses],
  );
  const nextClass = upcoming[0];
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const activeCourse =
    courses.find(
      (course) =>
        course.totalLessonsCount > 0 &&
        course.progressPercent > 0 &&
        course.progressPercent < 100,
    ) ||
    courses.find(
      (course) => course.totalLessonsCount > 0 && course.progressPercent < 100,
    ) ||
    courses.find((course) => course.totalLessonsCount > 0);
  const nextLesson = activeCourse?.modules
    ?.flatMap((module) => module.lessons)
    .find((lesson) => !lesson.completed);
  const learning = courses.filter((course) => course.accessType !== "live");
  const completed = courses.reduce(
    (total, course) => total + (course.completedLessonsCount || 0),
    0,
  );
  const average = learning.length
    ? Math.round(
        learning.reduce(
          (total, course) => total + (course.progressPercent || 0),
          0,
        ) / learning.length,
      )
    : 0;
  const remaining = nextClass
    ? Math.max(0, new Date(nextClass.scheduledAt).getTime() - now)
    : 0;
  const days = Math.floor(remaining / 86400000),
    hours = Math.floor(remaining / 3600000) % 24,
    minutes = Math.floor(remaining / 60000) % 60;
  const firstName = user?.name?.trim().split(/\s+/)[0] || "estudiante";
  return (
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden rounded-2xl border border-sky-900/30 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 px-5 py-6 text-white shadow-panel sm:px-7 sm:py-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full border-[45px] border-sky-400/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-24 size-64 rounded-full bg-sky-500/5 blur-2xl"
        />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="max-w-xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300/15 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-sky-200">
              <span className="size-1.5 rounded-full bg-sky-400" />
              TU ESPACIO DE APRENDIZAJE
            </p>
            <h1 className="text-2xl leading-tight font-extrabold tracking-tight text-white sm:text-[30px]">
              Hola, {firstName}.<br />
              <span className="font-medium text-sky-200">
                Sigamos avanzando.
              </span>
            </h1>
            <p className="mt-3 max-w-md text-xs leading-6 text-slate-300">
              Cada lección es un paso más. Aquí encontrarás tus programas, tu
              progreso y lo próximo en tu agenda.
            </p>
          </div>
          <button
            className="btn self-start shrink-0 !min-h-10 !rounded-xl !border-sky-400/30 !bg-sky-500 !px-4 !py-2.5 !text-xs !text-white shadow-lg shadow-sky-950/20 transition hover:!bg-sky-400 md:self-center"
            onClick={() => onNavigate("courses")}
          >
            Explorar mis programas
            <ArrowUpRight size={16} />
          </button>
        </div>
      </section>
      <section
        aria-label="Resumen del estudiante"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
      >
        <Metric
          icon={BookOpen}
          label="Mis programas"
          value={courses.length}
          detail="Tu formación disponible"
        />
        <Metric
          icon={CheckCircle2}
          label="Lecciones completadas"
          value={completed}
          detail="Pasos que ya has dado"
        />
        <Metric
          icon={GraduationCap}
          label="Progreso promedio"
          value={average + "%"}
          detail="En tus cursos de contenido"
        />
        <Metric
          icon={Clock3}
          label="Tiempo completado"
          value={
            Number(user?.stats?.totalHoursWatched || 0).toLocaleString(
              "es-EC",
            ) + " h"
          }
          detail="De las lecciones finalizadas"
        />
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-7">
          {activeCourse && (
            <section className="overflow-hidden rounded-2xl border border-brand-line/70 bg-gradient-to-br from-surface to-brand-soft/20 p-4 shadow-panel sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
                  CONTINUAR APRENDIENDO
                </p>
                <span className="rounded-full border border-line bg-surface px-2 py-1 text-[9px] font-semibold text-subtle">A tu ritmo</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="hidden size-20 shrink-0 overflow-hidden rounded-xl border border-line sm:block sm:size-24">
                  <img
                    src={activeCourse.thumbnail}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 text-base leading-6 font-bold tracking-tight text-ink">
                    {activeCourse.title}
                  </h2>
                  <p className="mt-1.5 text-[11px] leading-5 text-subtle">
                    {nextLesson
                      ? "Siguiente lección: " + nextLesson.title
                      : "Has completado todas las lecciones publicadas."}
                  </p>
                  <div className="mt-3">
                    <Progress
                      value={activeCourse.progressPercent}
                      label="Tu avance"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={activeCourse.mentorName}
                    src={activeCourse.mentorAvatar}
                    className="size-7"
                  />
                  <div><p className="text-[9px] text-subtle">Tu mentor</p><p className="text-[11px] font-semibold text-muted">{activeCourse.mentorName}</p></div>
                </div>
                <button
                  className="btn btn-primary !min-h-9 !rounded-xl !px-4 !py-2 !text-xs"
                  onClick={() => onSelectCourse(activeCourse)}
                >
                  Retomar curso
                  <ArrowRight size={13} />
                </button>
              </div>
            </section>
          )}
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <div>
                <div className="flex items-center gap-2"><h2 className="text-base font-bold tracking-tight text-ink">Mis programas</h2><span className="rounded-full border border-brand-line bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">{courses.length}</span></div>
                <p className="mt-1 text-[11px] text-subtle">
                  Conocimiento para tu siguiente paso.
                </p>
              </div>
              <button
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[10px] font-semibold text-brand transition-colors hover:border-brand/30 hover:bg-brand-soft"
                onClick={() => onNavigate("courses")}
              >
                Ver todos
                <ArrowRight size={13} />
              </button>
            </div>
            {courses.length ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),320px))] items-stretch gap-4 [&_article>div:first-child]:!h-32 [&_article>div:last-child]:!p-4 [&_article_h3]:!text-sm [&_article_h3]:!leading-5 [&_article_.btn]:!text-[11px]">
                {courses.slice(0, 4).map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onSelect={onSelectCourse}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Tus programas te esperan"
                description="Cuando tengas un curso asignado, podrás comenzar tu aprendizaje desde aquí."
              />
            )}
          </section>
        </div>
        <aside className="min-w-0 space-y-6">
          <section className="rounded-[22px] border border-line bg-surface p-5 shadow-panel">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm">Tu próxima clase</h2>
              <CalendarDays size={17} className="text-subtle" />
            </div>
            {nextClass ? (
              <>
                <span className="badge badge-emerald mb-4">
                  {nextClass.effectiveStatus === "live" ? (
                    <Radio size={11} />
                  ) : (
                    <span className="size-1 rounded-full bg-brand" />
                  )}
                  {nextClass.effectiveStatus === "live"
                    ? "En vivo ahora"
                    : "En tu agenda"}
                </span>
                <h3 className="text-base leading-6">{nextClass.title}</h3>
                <p className="mt-2 text-xs text-subtle">{nextClass.subtitle}</p>
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-elevated/60 p-3">
                  <div className="min-w-10 border-r border-line pr-3 text-center">
                    <p className="text-xl leading-none font-extrabold text-brand">
                      {date(nextClass.scheduledAt, { day: "2-digit" })}
                    </p>
                    <p className="mt-1 text-[9px] font-bold uppercase text-subtle">
                      {date(nextClass.scheduledAt, { month: "short" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold">{nextClass.time}</p>
                    <p className="mt-1 text-[10px] text-subtle">
                      {nextClass.duration}
                    </p>
                  </div>
                </div>
                <div className="my-4 flex items-center gap-2.5">
                  <Avatar
                    src={nextClass.mentorAvatar}
                    name={nextClass.mentorName}
                    className="size-7"
                  />
                  <p className="text-[11px] text-subtle">
                    {nextClass.mentorName}
                  </p>
                </div>
                {nextClass.effectiveStatus !== "live" && remaining > 0 && (
                  <p className="mb-4 text-[10px] text-subtle">
                    Comienza en{" "}
                    <span className="font-bold text-ink">
                      {days > 0 ? days + " d " : ""}
                      {hours + " h " + minutes + " min"}
                    </span>
                  </p>
                )}
                <button
                  className="btn btn-primary w-full"
                  onClick={() => onOpenLiveSession(nextClass)}
                >
                  {nextClass.effectiveStatus === "live"
                    ? "Ver clase e ingresar"
                    : "Ver detalles de la clase"}
                  <ArrowUpRight size={14} />
                </button>
              </>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="Tu agenda está al día"
                description="Las próximas clases de tus programas aparecerán aquí."
              />
            )}
            <button
              className="mt-4 flex w-full items-center justify-center gap-2 text-[11px] font-semibold text-subtle hover:text-brand"
              onClick={() => onNavigate("live")}
            >
              Ver calendario completo
              <ArrowRight size={12} />
            </button>
          </section>
          <section className="rounded-[22px] border border-line bg-surface p-5 shadow-panel">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm">Novedades</h2>
              <Megaphone size={17} className="text-subtle" />
            </div>
            {announcements.length ? (
              <div className="space-y-5">
                {announcements.slice(0, 4).map((item) => (
                  <article
                    key={item.id}
                    className="border-b border-line pb-4 last:border-0 last:pb-0"
                  >
                    <p className="text-[9px] font-bold tracking-wide text-brand">
                      {item.courseTitle || "TU COMUNIDAD"}
                    </p>
                    <h3 className="mt-1.5 text-xs leading-5">{item.title}</h3>
                    <p className="mt-1.5 line-clamp-3 text-[11px] leading-5 text-subtle">
                      {item.body}
                    </p>
                    <p className="mt-2 text-[9px] text-subtle/70">
                      {date(item.publishedAt, {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="py-4 text-xs leading-6 text-subtle">
                No hay novedades por ahora. Los avisos de tu comunidad se
                mostrarán aquí.
              </p>
            )}
          </section>
        </aside>
      </div>
      {upcoming.length > 1 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg">Más adelante en tu agenda</h2>
            <button
              className="text-xs font-bold text-brand"
              onClick={() => onNavigate("live")}
            >
              Ver calendario
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.slice(1, 5).map((session) => (
              <button
                key={session.id}
                onClick={() => onOpenLiveSession(session)}
                className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left shadow-panel hover:border-brand/30"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <CalendarDays size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{session.title}</p>
                  <p className="mt-1 text-[10px] text-subtle">
                    {session.date} · {session.time} · {session.duration}
                  </p>
                </div>
                <ArrowUpRight
                  size={15}
                  className="text-subtle transition group-hover:text-brand"
                />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
export default DashboardView;
