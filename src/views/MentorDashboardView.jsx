import React, { useMemo } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Radio,
  Users,
} from "lucide-react";
import { Avatar } from "../components/ui";
import { MiniClassCalendar } from "../components/MiniClassCalendar";
import { MentorProgressTables } from "../components/MentorProgressTables";

export function MentorDashboardView({
  user,
  liveClasses,
  courses,
  dashboard = { students: [], questions: [] },
  onOpenLiveSession,
  onNavigate,
}) {
  const students = dashboard.students || [];
  const featuredLive = useMemo(
    () =>
      [...liveClasses]
        .filter((session) => session.effectiveStatus !== "ended")
        .sort(
          (left, right) =>
            new Date(left.scheduledAt || left.createdAt).getTime() -
            new Date(right.scheduledAt || right.createdAt).getTime(),
        )[0],
    [liveClasses],
  );
  const enrolledCount = featuredLive
    ? courses.find(course => String(course.id) === String(featuredLive.courseId))?.activeStudents
      ?? students.filter(student => String(student.courseId) === String(featuredLive.courseId)).length
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-center lg:justify-between">
      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">Panel académico del mentor</span>
          {user.company && <span className="border-l border-line pl-3 text-xs text-subtle">{user.company}</span>}
        </div>
        <div className="flex items-center gap-3.5"><Avatar src={user.avatar || user.avatarUrl} name={user.name} className="size-12 shrink-0 border border-line" /><div className="min-w-0"><h1 className="text-xl font-bold leading-tight tracking-tight text-ink sm:text-2xl">Hola, {user.name}</h1><p className="mt-1.5 text-xs leading-5 text-subtle">Tus cursos, estudiantes y próximas clases en un solo lugar.</p></div></div>
      </section>
      <button className="btn btn-primary self-start shrink-0 !min-h-10 !max-w-full !px-4 !py-2 !text-xs !font-semibold lg:self-center" onClick={() => onNavigate('mentor-courses')}>
        Gestionar cursos y estudiantes<ArrowUpRight size={14} aria-hidden="true" />
      </button>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex min-w-0 flex-col gap-5">
      {featuredLive ? (
        <section className="overflow-hidden rounded-2xl border border-brand-line bg-gradient-to-br from-brand-soft to-surface p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-line bg-surface/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-brand">
                <Radio size={12} />{featuredLive.effectiveStatus === 'live' ? 'En vivo ahora' : 'Próxima sesión'}
              </span>
              <h2 className="mt-3 text-xl font-extrabold tracking-tight text-ink">{featuredLive.title}</h2>
              <p className="mt-1 text-xs text-subtle">{featuredLive.subtitle}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} className="text-brand" />{featuredLive.date}</span>
                <span className="inline-flex items-center gap-1.5"><Clock3 size={13} className="text-brand" />{featuredLive.time} · {featuredLive.duration}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 font-semibold"><Users size={13} className="text-brand" />{enrolledCount} {enrolledCount === 1 ? 'estudiante matriculado' : 'estudiantes matriculados'}</span>
              </div>
            </div>
            <button className="btn btn-primary !min-h-10 shrink-0 !rounded-xl !px-5 !py-2.5 !text-xs"
              onClick={() => onOpenLiveSession(featuredLive)}>
              <Radio size={15} />Acceso a la clase<ArrowUpRight size={14} />
            </button>
          </div>
        </section>
      ) : (
        <section className="flex flex-col justify-between gap-3 rounded-xl border border-brand-line/70 bg-brand-soft/40 p-4 sm:flex-row sm:items-center sm:px-5">
          <div className="min-w-0"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-brand">Tu agenda</p><h2 className="text-sm font-semibold text-ink">No tienes clases próximas</h2><p className="mt-1 text-xs leading-5 text-subtle">Consulta el historial o prepara tu siguiente sesión.</p></div>
          <button className="btn btn-secondary btn-sm self-start sm:self-center" onClick={() => onNavigate("live")}>Ver todas las sesiones<ArrowUpRight size={13} aria-hidden="true" /></button>
        </section>
      )}


      <MentorProgressTables courses={courses} view="courses" />
      </div>
      <aside className="mx-auto w-full max-w-sm xl:mx-0 xl:max-w-none">
        <MiniClassCalendar sessions={liveClasses} onOpenSession={onOpenLiveSession} />
      </aside>
      </div>

      <MentorProgressTables courses={courses} students={students} view="students" />

    </div>
  );
}

export default MentorDashboardView;
