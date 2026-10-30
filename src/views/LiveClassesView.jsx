import React, { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Film,
} from "lucide-react";
import { Avatar, EmptyState } from "../components/ui";
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
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="border-l-[3px] border-brand py-1 pl-4 sm:pl-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Aprende en comunidad</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">Nos vemos en clase.</h1>
          <p className="mt-2 max-w-lg text-xs leading-6 text-subtle">Consulta tu agenda, revisa los detalles y accede a tus clases.</p>
        </div>
          <button
            className="btn btn-secondary self-start shrink-0 !min-h-9 !rounded-xl !px-3 !py-2 !text-xs sm:self-center"
            onClick={() => onNavigate("replays")}
          >
            <Film size={15} />
            Ver grabaciones
            <ArrowUpRight size={14} />
          </button>
      </header>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 rounded-2xl border border-line bg-surface p-4 shadow-panel sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-subtle">
                TU CALENDARIO
              </p>
              <h2 className="mt-1 text-base font-bold first-letter:uppercase">
                {month.toLocaleDateString("es-EC", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-line bg-elevated/50 p-1">
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
                className="rounded-lg bg-elevated/60 py-2 text-center text-[9px] font-bold tracking-wider text-subtle"
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
                    "relative flex h-11 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-semibold transition sm:h-12 " +
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
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
        <aside className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm">
              {selectedDay ? "Clases del día" : "Agenda del mes"}
            </h2>
            <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-semibold text-subtle">
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
              className="group overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-panel transition-colors hover:border-brand/30"
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={
                    "inline-flex items-center rounded-full border px-2 py-1 text-[9px] font-semibold " +
                    (session.effectiveStatus === "ended"
                      ? "border-line bg-elevated/70 text-subtle"
                      : "border-brand-line bg-brand-soft text-brand")
                  }
                >
                  {session.badge || "Programada"}
                </span>
                <span className="text-[9px] font-medium text-subtle">{session.duration}</span>
              </div>
              <h3 className="text-sm font-bold leading-5 tracking-tight text-ink">{session.title}</h3>
              <p className="mt-1 text-[10px] leading-5 text-subtle">
                {session.subtitle}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Avatar
                  name={session.mentorName}
                  src={session.mentorAvatar}
                  className="size-6"
                />
                <p className="text-[10px] font-medium text-muted">
                  {session.mentorName}
                </p>
              </div>
              <div className="my-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-elevated/40 px-3 py-2.5 text-[10px] text-muted">
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} className="text-brand" />
                {session.date}
                </span>
                <span className="inline-flex items-center gap-1.5"><Clock3 size={12} className="text-brand" />
                {session.time}</span>
              </div>
              <button
                className={`btn w-full !min-h-9 !rounded-xl !py-2 !text-[11px] ${session.effectiveStatus === 'ended' ? 'btn-secondary' : 'btn-primary'}`}
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
