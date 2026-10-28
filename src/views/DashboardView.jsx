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
      <section className="relative isolate overflow-hidden rounded-[26px] bg-slate-900 px-6 py-8 text-white sm:px-9 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-12 size-96 rounded-full border-[60px] border-sky-400/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-8 right-24 size-52 rounded-full border border-sky-300/10"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-7">
          <div className="max-w-xl">
            <p className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-sky-300">
              <span className="size-1.5 rounded-full bg-sky-400" />
              TU ESPACIO DE APRENDIZAJE
            </p>
            <h1 className="text-[29px] leading-tight font-extrabold tracking-[-0.04em] text-white sm:text-[36px]">
              Hola, {firstName}.<br />
              <span className="font-medium text-slate-300">
                Sigamos avanzando.
              </span>
            </h1>
            <p className="mt-4 max-w-sm text-xs leading-6 text-slate-400">
              Cada lección es un paso más. Aquí encontrarás tus programas, tu
              progreso y lo próximo en tu agenda.
            </p>
          </div>
          <button
            className="btn !border-white/15 !bg-white/8 !px-5 !text-white backdrop-blur-sm hover:!bg-white/15"
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
            <section className="rounded-[22px] border border-brand-line/60 bg-surface p-5 shadow-panel sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
                  CONTINUAR APRENDIENDO
                </p>
                <span className="text-[10px] text-subtle">A tu ritmo</span>
              </div>
              <div className="flex items-start gap-5">
                <div className="hidden h-24 w-28 shrink-0 overflow-hidden rounded-xl sm:block">
                  <img
                    src={activeCourse.thumbnail}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg leading-7 font-bold tracking-tight">
                    {activeCourse.title}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-subtle">
                    {nextLesson
                      ? "Siguiente lección: " + nextLesson.title
                      : "Has completado todas las lecciones publicadas."}
                  </p>
                  <div className="mt-4">
                    <Progress
                      value={activeCourse.progressPercent}
                      label="Tu avance"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={activeCourse.mentorName}
                    src={activeCourse.mentorAvatar}
                    className="size-6"
                  />
                  <span className="text-[11px] text-subtle">
                    {activeCourse.mentorName}
                  </span>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onSelectCourse(activeCourse)}
                >
                  <Play size={12} fill="currentColor" />
                  Retomar curso
                  <ArrowRight size={13} />
                </button>
              </div>
            </section>
          )}
          <section>
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Mis programas</h2>
                <p className="mt-1 text-[11px] text-subtle">
                  Conocimiento para tu siguiente paso.
                </p>
              </div>
              <button
                className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold text-brand hover:underline"
                onClick={() => onNavigate("courses")}
              >
                Ver todos
                <ArrowRight size={13} />
              </button>
            </div>
            {courses.length ? (
              <div className="grid gap-5 sm:grid-cols-2">
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
