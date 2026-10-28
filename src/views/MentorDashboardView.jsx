import React, { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Radio,
  Send,
  Sparkles,
  TrendingUp,
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
      <button
        className="btn btn-primary"
        onClick={() => onNavigate("mentor-courses")}
      >
        Gestionar mis cursos y estudiantes
      </button>
      <section>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="badge badge-emerald">
            <Sparkles size={13} />
            <span>Panel académico del mentor</span>
          </span>
          <span className="text-[13px] text-muted">
            {user.company || "Perfil profesional"}
          </span>
        </div>
        <h1 className="text-2xl sm:text-[28px] font-extrabold [letter-spacing:-0.02em] text-ink">
          Panel del Mentor: {user.name}
        </h1>
        <p className="text-muted text-[15px] mt-1">
          Datos calculados desde tus cursos, matrículas y actividad académica en
          Supabase.
        </p>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 [gap:14px]">
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Users size={20} />
          </div>
          <div>
            <div className="stat-value">{stats.activeStudents || 0}</div>
            <div className="stat-label">Alumnos Activos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="stat-value">{stats.averageProgress || 0}%</div>
            <div className="stat-label">Progreso Promedio</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <HelpCircle size={20} />
          </div>
          <div>
            <div className="stat-value">{stats.questionsPending || 0}</div>
            <div className="stat-label">Dudas por Responder</div>
          </div>
        </div>
      </section>

      {featuredLive ? (
        <section className="live-banner">
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-6 items-center">
            <div>
              <span className="badge badge-live mb-3">
                <Radio size={14} />
                <span>
                  {featuredLive.effectiveStatus === "live"
                    ? "SESIÓN EN VIVO"
                    : "PRÓXIMA SESIÓN"}
                </span>
              </span>
              <h2 className="text-[22px] font-extrabold text-ink">
                {featuredLive.title}
              </h2>
              <p className="text-muted text-[14px] mt-2">
                {featuredLive.subtitle}
              </p>
              <div className="text-muted text-[13px] [margin-top:14px]">
                {featuredLive.date} • {featuredLive.time} •{" "}
                {featuredLive.duration} • {featuredLive.attendeesCount || 0}{" "}
                estudiantes matriculados
              </div>
            </div>
            <div className="[background:var(--bg-surface-elevated)] [border:1px_solid_var(--border-medium)] [border-radius:var(--radius-md)] [padding:22px] text-center">
              <div className="text-[12px] text-brand font-bold mb-3">
                ACCESO PROTEGIDO CON LIVEKIT
              </div>
              <button
                className="btn btn-primary w-full"

                onClick={() => onOpenLiveSession(featuredLive)}
              >
                <Radio size={16} />
                <span>
                  {featuredLive.effectiveStatus === "live"
                    ? "Entrar como anfitrión"
                    : "Abrir sala de la sesión"}
                </span>
              </button>
            </div>
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

      <section className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex justify-between items-center [margin-bottom:18px] gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-brand" />
              <h3 className="text-[17px] font-bold text-ink">
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
          <div className="flex flex-col [gap:14px]">
            {questions.length ? (
              questions.map((question) => (
                <article
                  key={question.id}
                  className="p-4 [border-radius:var(--radius-md)] [background:var(--bg-surface-elevated)] [border:1px_solid_var(--border-subtle)]"
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
              <EmptyState>
                No existen preguntas registradas en tus cursos.
              </EmptyState>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center [margin-bottom:18px]">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-brand" />
              <h3 className="text-[17px] font-bold text-ink">
                Cursos asignados
              </h3>
            </div>
            <span className="text-[12px] text-subtle">
              {stats.assignedCourses || 0} cursos
            </span>
          </div>
          <div className="flex flex-col [gap:14px]">
            {courses.length ? (
              courses.map((course) => (
                <article
                  key={course.id}
                  className="p-4 [border-radius:var(--radius-md)] [background:var(--bg-surface-elevated)] [border:1px_solid_var(--border-subtle)]"
                >
                  <h4 className="text-[14px] font-bold text-ink">
                    {course.title}
                  </h4>
                  <div className="text-[12px] text-subtle [margin-top:5px]">
                    {course.totalModulesCount || 0} módulos •{" "}
                    {course.totalLessonsCount || 0} lecciones •{" "}
                    {course.activeStudents || 0} estudiantes
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

      <section className="card">
        <div className="flex items-center gap-2 [margin-bottom:18px]">
          <CheckCircle2 size={18} className="text-brand" />
          <h3 className="text-[17px] font-bold text-ink">
            Progreso de estudiantes por curso
          </h3>
        </div>
        {students.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
            {students.map((student) => (
              <article
                key={`${student.id}:${student.courseId}`}
                className="[padding:14px] [border:1px_solid_var(--border-subtle)] [border-radius:var(--radius-md)] [background:var(--bg-deep)]"
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
                  {student.completedLessons} de {student.totalLessons} lecciones
                  • {student.progressPercent}%
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
