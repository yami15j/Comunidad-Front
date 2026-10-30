import React, { useMemo, useState } from "react";
import {
  BookOpen,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  CheckCircle2,
  MessageSquare,
  Radio,
  Send,
  Users,
} from "lucide-react";

function EmptyState({ children }) {
  return (
    <div className="p-6 text-center [border:1px_dashed_var(--border-medium)] [border-radius:var(--radius-md)] text-muted text-[13px]">
      {children}
    </div>
  );
}

function StudentAvatar({ student }) {
  if (student.studentAvatar || student.avatarUrl) {
    return (
      <img
        src={student.studentAvatar || student.avatarUrl}
        alt=""
        className="[width:34px] [height:34px] rounded-full object-cover"
      />
    );
  }

  const name = student.studentName || student.fullName || "E";
  return (
    <div
      aria-hidden="true"
      className="[width:34px] [height:34px] rounded-full grid [place-items:center] [background:var(--brand-celeste-subtle)] text-brand font-extrabold"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function MentorDashboardView({
  user,
  liveClasses,
  courses,
  dashboard = { students: [], questions: [] },
  onAnswerQuestion,
  onOpenLiveSession,
  onNavigate,
}) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [savingQuestionId, setSavingQuestionId] = useState(null);
  const [replyError, setReplyError] = useState("");
  const stats = user?.stats || {};
  const questions = dashboard.questions || [];
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

  const handleSendReply = async (questionId) => {
    if (!replyText.trim() || !onAnswerQuestion) return;
    setSavingQuestionId(questionId);
    setReplyError("");
    try {
      await onAnswerQuestion(questionId, replyText.trim());
      setReplyingTo(null);
      setReplyText("");
    } catch (error) {
      setReplyError(error.message || "No se pudo guardar la respuesta.");
    } finally {
      setSavingQuestionId(null);
    }
  };

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <section className="border-l-[3px] border-brand pl-4 py-1 sm:pl-5">
        <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Panel académico del mentor</span>
          {user.company && <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-medium text-subtle">{user.company}</span>}
        </div>
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-[28px]">Tu panel, {user.name}</h1>
        <p className="mt-2 max-w-xl text-xs leading-6 text-subtle sm:text-sm">Revisa tus cursos, acompaña a tus estudiantes y sigue su avance.</p>
      </section>
      <button className="btn btn-primary self-start shrink-0 !min-h-9 !max-w-full !rounded-xl !px-4 !py-2 !text-xs !font-semibold transition-shadow hover:shadow-md lg:self-center" onClick={() => onNavigate('mentor-courses')}>
        Gestionar mis cursos y estudiantes
      </button>
      </div>
      <section className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <div className="stat-card"><div><div className="stat-value">{stats.activeStudents || 0}</div><div className="stat-label">Alumnos Activos</div></div></div>
        <div className="stat-card"><div><div className="stat-value">{stats.averageProgress || 0}%</div><div className="stat-label">Progreso Promedio</div></div></div>
        <div className="stat-card"><div><div className="stat-value">{stats.questionsPending || 0}</div><div className="stat-label">Dudas por Responder</div></div></div>
      </section>

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
        <section className="card">
          <EmptyState>
            No tienes clases próximas. Puedes consultar el historial en Clases
            en vivo.
          </EmptyState>
          <button
            className="btn btn-secondary btn-sm mt-3"
            onClick={() => onNavigate("live")}
          >
            Ver todas las sesiones
          </button>
        </section>
      )}

      <section className="grid items-start gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-panel sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-brand" />
              <h3 className="text-sm font-bold tracking-tight text-ink">
                Dudas de estudiantes
              </h3>
            </div>
            <span className="badge badge-emerald text-[11px]">
              {stats.questionsPending || 0} pendientes
            </span>
          </div>

          {replyError && (
            <div role="alert" className="mb-3 text-danger text-[12px]">
              {replyError}
            </div>
          )}
          <div className="flex flex-col gap-3">
            {questions.length ? (
              questions.map((question) => (
                <article
                  key={question.id}
                  className="rounded-xl border border-line bg-elevated/40 p-4"
                >
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center [gap:10px]">
                      <StudentAvatar student={question} />
                      <div>
                        <div className="text-[13px] font-bold text-ink">
                          {question.studentName}
                        </div>
                        <div className="text-[11px] text-subtle">
                          {question.studentCompany} • {question.timeAgo}
                        </div>
                      </div>
                    </div>
                    <span
                      className={
                        (question.status === "Pendiente"
                          ? "badge badge-amber"
                          : "badge badge-emerald") + " text-[11px]"
                      }
                    >
                      {question.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-brand font-semibold mt-3">
                    {question.courseTitle} • {question.lessonTitle}
                  </div>
                  <p className="text-[13px] text-muted [line-height:1.5] mt-2">
                    “{question.question}”
                  </p>
                  {question.mentorReply && (
                    <div className="[padding:10px_12px] [margin-top:10px] [border-radius:var(--radius-sm)] [background:var(--brand-celeste-subtle)] [border:1px_solid_var(--brand-celeste-border)] text-[12px]">
                      <strong className="text-brand">Tu respuesta: </strong>
                      <span className="text-ink">{question.mentorReply}</span>
                    </div>
                  )}
                  {replyingTo === question.id ? (
                    <div className="flex flex-col gap-2 mt-3">
                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="w-full [padding:10px] [border-radius:var(--radius-sm)] [background:var(--bg-surface)] [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={
                            savingQuestionId === question.id ||
                            !replyText.trim()
                          }
                          onClick={() => handleSendReply(question.id)}
                        >
                          <Send size={13} />
                          <span>
                            {savingQuestionId === question.id
                              ? "Guardando..."
                              : "Responder"}
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : question.status === "Pendiente" ? (
                    <button
                      className="btn btn-secondary btn-sm mt-3"

                      onClick={() => {
                        setReplyingTo(question.id);
                        setReplyText("");
                      }}
                    >
                      <MessageSquare size={13} />
                      <span>Responder</span>
                    </button>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-line bg-elevated/30 p-5 text-center">
                <span className="mb-3 grid size-9 place-items-center rounded-xl bg-brand-soft text-brand"><MessageSquare size={17} /></span>
                <p className="text-xs font-semibold text-ink">No hay dudas por aquí</p>
                <p className="mt-1 max-w-64 text-[11px] leading-5 text-subtle">Las preguntas de tus estudiantes aparecerán en este espacio para que puedas responderlas.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-panel sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-brand" />
              <h3 className="text-sm font-bold tracking-tight text-ink">
                Cursos asignados
              </h3>
            </div>
            <span className="rounded-full bg-elevated px-2.5 py-1 text-[10px] font-semibold text-subtle">
              {courses.length} {courses.length === 1 ? 'curso' : 'cursos'}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {courses.length ? (
              courses.map((course) => (
                <article
                  key={course.id}
                  className="rounded-xl border border-line bg-elevated/40 p-4"
                >
                  <h4 className="text-[14px] font-bold text-ink">
                    {course.title}
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-medium text-subtle">
                    <span className="rounded-md bg-surface px-2 py-1">{course.totalModulesCount || 0} módulos</span>
                    <span className="rounded-md bg-surface px-2 py-1">{course.totalLessonsCount || 0} lecciones</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-1 text-brand"><Users size={11} />{course.activeStudents || 0} {course.activeStudents === 1 ? 'estudiante' : 'estudiantes'}</span>
                  </div>
                  <div className="progress-bar-container [height:6px] mt-3">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${course.averageProgress || 0}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-muted [margin-top:5px]">
                    Progreso promedio: {course.averageProgress || 0}%
                  </div>
                </article>
              ))
            ) : (
              <EmptyState>No tienes cursos asignados actualmente.</EmptyState>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-panel sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <CheckCircle2 size={18} className="text-brand" />
          <h3 className="text-sm font-bold tracking-tight text-ink">
            Progreso de estudiantes por curso
          </h3>
          <span className="ml-auto rounded-full bg-elevated px-2.5 py-1 text-[10px] font-semibold text-subtle">{students.length} inscripciones</span>
        </div>
        {students.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {students.map((student) => (
              <article
                key={`${student.id}:${student.courseId}`}
                className="rounded-xl border border-line bg-elevated/40 p-4"
              >
                <div className="flex [gap:10px] items-center">
                  <StudentAvatar student={student} />
                  <div className="[min-width:0px]">
                    <div className="text-[13px] font-bold text-ink">
                      {student.fullName || student.email}
                    </div>
                    <div className="text-[11px] text-subtle">
                      {student.courseTitle}
                    </div>
                  </div>
                </div>
                <div className="progress-bar-container [height:6px] mt-3">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${student.progressPercent}%` }}
                  />
                </div>
                <div className="text-[11px] text-muted [margin-top:5px]">
                  <span>{student.completedLessons} de {student.totalLessons} lecciones</span>
                  <span className="float-right font-bold text-brand">{student.progressPercent}%</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState>
            No hay estudiantes matriculados en tus cursos.
          </EmptyState>
        )}
      </section>
    </div>
  );
}

export default MentorDashboardView;
