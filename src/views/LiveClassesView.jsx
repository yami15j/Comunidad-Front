import React, { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Film,
  Radio,
} from "lucide-react";
import { Avatar, EmptyState, PageHeading } from "../components/ui";
const keyForDate = (date) =>
  [date.getFullYear(), date.getMonth(), date.getDate()].join("-");
export function LiveClassesView({
  liveClasses = [],
  onOpenLiveSession,
  onNavigate,
}) {
  const [today] = useState(() => new Date());
  const [month, setMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState(null);
  const valid = liveClasses.filter((item) =>
    Number.isFinite(new Date(item.scheduledAt).getTime()),
  );
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const sessions = valid
    .filter((item) => {
      const date = new Date(item.scheduledAt);
      return selectedDay
        ? keyForDate(date) === selectedDay
        : date.getFullYear() === month.getFullYear() &&
            date.getMonth() === month.getMonth();
    })
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  function changeMonth(delta) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
    setSelectedDay(null);
  }
  return (
    <section className="space-y-7">
      <PageHeading
        eyebrow="APRENDE EN COMUNIDAD"
        title="Nos vemos en clase."
        description="Un espacio para aprender, preguntar y conectar con tus mentores. Consulta tu agenda e ingresa a Zoom desde cada clase."
        icon={Radio}
        action={
          <button
            className="btn btn-secondary"
            onClick={() => onNavigate("replays")}
          >
            <Film size={15} />
            Ver grabaciones
            <ArrowUpRight size={14} />
          </button>
        }
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        <section className="rounded-[22px] border border-line bg-surface p-4 shadow-panel sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-subtle">
                TU CALENDARIO
              </p>
              <h2 className="mt-1 text-xl capitalize">
                {month.toLocaleDateString("es-EC", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="icon-button"
                aria-label="Mes anterior"
                onClick={() => changeMonth(-1)}
              >
                <ChevronLeft size={17} />
              </button>
              <button
                className="icon-button"
                aria-label="Mes siguiente"
                onClick={() => changeMonth(1)}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map((day) => (
              <span
                key={day}
                className="pb-3 text-center text-[9px] font-bold tracking-wider text-subtle"
              >
                {day}
              </span>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <span key={"empty-" + i} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const date = new Date(
                month.getFullYear(),
                month.getMonth(),
                i + 1,
              );
              const key = keyForDate(date);
              const count = valid.filter(
                (item) => keyForDate(new Date(item.scheduledAt)) === key,
              ).length;
              const selected = selectedDay === key;
              const isToday = keyForDate(today) === key;
              return (
                <button
                  key={key}
                  aria-label={
                    date.toLocaleDateString("es-EC") + ", " + count + " clases"
                  }
                  aria-pressed={selected}
                  onClick={() => setSelectedDay(selected ? null : key)}
                  className={
                    "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-semibold transition sm:min-h-20 sm:rounded-2xl " +
                    (selected
                      ? "border-brand bg-brand text-on-brand shadow-sm shadow-brand/20"
                      : isToday
                        ? "border-brand-line bg-brand-soft text-brand"
                        : count
                          ? "border-brand-line/60 bg-brand-soft/30 text-ink hover:border-brand"
                          : "border-transparent text-subtle hover:border-line hover:bg-elevated")
                  }
                >
                  <span className={isToday ? "font-extrabold" : ""}>
                    {i + 1}
                  </span>
                  <span
                    className={
                      "h-1.5 " + (count ? "flex items-center gap-0.5" : "")
                    }
                  >
                    {count > 0 && (
                      <>
                        <span
                          className={
                            "size-1 rounded-full " +
                            (selected ? "bg-on-brand" : "bg-brand")
                          }
                        />
                        {count > 1 && (
                          <span
                            className={
                              "size-1 rounded-full " +
                              (selected ? "bg-on-brand" : "bg-brand")
                            }
                          />
                        )}
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <span className="flex items-center gap-2 text-[10px] text-subtle">
              <span className="size-1.5 rounded-full bg-brand" />
              Días con clases programadas
            </span>
            <button
              className="text-[10px] font-bold text-brand hover:underline"
              onClick={() => {
                setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelectedDay(keyForDate(today));
              }}
            >
              Ir a hoy
            </button>
          </div>
          <p className="mt-3 text-[10px] text-subtle/70">
            Horarios según la zona horaria de tu dispositivo.
          </p>
        </section>
        <aside className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm">
              {selectedDay ? "Clases del día" : "Agenda del mes"}
            </h2>
            <span className="rounded-lg bg-surface px-2.5 py-1 text-[10px] font-bold text-subtle">
              {sessions.length} clases
            </span>
          </div>
          {selectedDay && (
            <button
              className="text-[10px] font-semibold text-brand"
              onClick={() => setSelectedDay(null)}
            >
              Ver todo el mes
            </button>
          )}
          {!sessions.length && (
            <EmptyState
              icon={CalendarDays}
              title="Un espacio libre en tu agenda"
              description="No tienes clases programadas para este periodo. Prueba con otra fecha."
            />
          )}
          {sessions.map((session) => (
            <article
              key={session.id}
              className="rounded-2xl border border-line bg-surface p-5 shadow-panel"
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={
                    "badge " +
                    (session.effectiveStatus === "ended"
                      ? "badge-purple"
                      : "badge-emerald")
                  }
                >
                  {session.badge || "Programada"}
                </span>
                <CalendarDays size={15} className="text-subtle" />
              </div>
              <h3 className="text-sm leading-6">{session.title}</h3>
              <p className="mt-1.5 text-[11px] leading-5 text-subtle">
                {session.subtitle}
              </p>
              <div className="mt-4 flex items-center gap-2.5">
                <Avatar
                  name={session.mentorName}
                  src={session.mentorAvatar}
                  className="size-7"
                />
                <p className="text-[11px] text-muted">
                  Profesor: {session.mentorName}
                </p>
              </div>
              <div className="my-4 flex flex-wrap items-center gap-2 text-[10px] text-subtle">
                <CalendarDays size={12} />
                {session.date}
                <span className="text-line">/</span>
                <Clock3 size={12} />
                {session.time} · {session.duration}
              </div>
              <button
                className="btn btn-secondary w-full"
                onClick={() => onOpenLiveSession(session)}
              >
                {session.effectiveStatus === "ended"
                  ? "Ver detalles"
                  : "Ver clase e ingresar a Zoom"}
                <ArrowUpRight size={13} />
              </button>
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
}
export default LiveClassesView;
