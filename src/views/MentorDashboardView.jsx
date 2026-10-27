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
    <div
      style={{
        padding: "24px",
        textAlign: "center",
        border: "1px dashed var(--border-medium)",
        borderRadius: "var(--radius-md)",
        color: "var(--text-muted)",
        fontSize: "13px",
      }}
    >
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
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          objectFit: "cover",
        }}
      />
    );
  }

  const name = student.studentName || student.fullName || "E";
  return (
    <div
      aria-hidden="true"
      style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: "var(--brand-celeste-subtle)",
        color: "var(--brand-celeste)",
        fontWeight: 800,
      }}
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
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            flexWrap: "wrap",
          }}
        >
          <span className="badge badge-emerald">
            <Sparkles size={13} />
            <span>Panel académico del mentor</span>
          </span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {user.company || "Perfil profesional"}
          </span>
        </div>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--text-main)",
          }}
        >
          Panel del Mentor: {user.name}
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "15px",
            marginTop: "4px",
          }}
        >
          Datos calculados desde tus cursos, matrículas y actividad académica en
          Supabase.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px",
        }}
      >
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
          <div
            className="stat-icon-wrapper"
            style={{ color: "var(--brand-celeste)" }}
          >
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
              alignItems: "center",
            }}
          >
            <div>
              <span
                className="badge badge-live"
                style={{ marginBottom: "12px" }}
              >
                <Radio size={14} />
                <span>
                  {featuredLive.effectiveStatus === "live"
                    ? "SESIÓN EN VIVO"
                    : "PRÓXIMA SESIÓN"}
                </span>
              </span>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "var(--text-main)",
                }}
              >
                {featuredLive.title}
              </h2>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "14px",
                  marginTop: "8px",
                }}
              >
                {featuredLive.subtitle}
              </p>
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  marginTop: "14px",
                }}
              >
                {featuredLive.date} • {featuredLive.time} •{" "}
                {featuredLive.duration} • {featuredLive.attendeesCount || 0}{" "}
                estudiantes matriculados
              </div>
            </div>
            <div
              style={{
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                padding: "22px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--brand-celeste)",
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                ACCESO PROTEGIDO CON LIVEKIT
              </div>
              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
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
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate("live")}
            style={{ marginTop: 12 }}
          >
            Ver todas las sesiones
          </button>
        </section>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "24px",
        }}
      >
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "18px",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageSquare
                size={18}
                style={{ color: "var(--brand-celeste)" }}
              />
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "var(--text-main)",
                }}
              >
                Dudas de estudiantes
              </h3>
            </div>
            <span className="badge badge-emerald" style={{ fontSize: "11px" }}>
              {stats.questionsPending || 0} pendientes
            </span>
          </div>

          {replyError && (
            <div
              role="alert"
              style={{ marginBottom: 12, color: "#B91C1C", fontSize: 12 }}
            >
              {replyError}
            </div>
          )}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {questions.length ? (
              questions.map((question) => (
                <article
                  key={question.id}
                  style={{
                    padding: "16px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <StudentAvatar student={question} />
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--text-main)",
                          }}
                        >
                          {question.studentName}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                          {question.studentCompany} • {question.timeAgo}
                        </div>
                      </div>
                    </div>
                    <span
                      className={
                        question.status === "Pendiente"
                          ? "badge badge-amber"
                          : "badge badge-emerald"
                      }
                      style={{ fontSize: 10 }}
                    >
                      {question.status}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--brand-celeste)",
                      fontWeight: 600,
                      marginTop: 12,
                    }}
                  >
                    {question.courseTitle} • {question.lessonTitle}
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                      marginTop: 8,
                    }}
                  >
                    “{question.question}”
                  </p>
                  {question.mentorReply && (
                    <div
                      style={{
                        padding: "10px 12px",
                        marginTop: 10,
                        borderRadius: "var(--radius-sm)",
                        background: "var(--brand-celeste-subtle)",
                        border: "1px solid var(--brand-celeste-border)",
                        fontSize: 12,
                      }}
                    >
                      <strong style={{ color: "var(--brand-celeste)" }}>
                        Tu respuesta:{" "}
                      </strong>
                      <span style={{ color: "var(--text-main)" }}>
                        {question.mentorReply}
                      </span>
                    </div>
                  )}
                  {replyingTo === question.id ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        marginTop: 12,
                      }}
                    >
                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        placeholder="Escribe tu respuesta..."
                        style={{
                          width: "100%",
                          padding: 10,
                          borderRadius: "var(--radius-sm)",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-medium)",
                          color: "var(--text-main)",
                          fontSize: 13,
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 8,
                        }}
                      >
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
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: 12 }}
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={18} style={{ color: "var(--brand-celeste)" }} />
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "var(--text-main)",
                }}
              >
                Cursos asignados
              </h3>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
              {stats.assignedCourses || 0} cursos
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {courses.length ? (
              courses.map((course) => (
                <article
                  key={course.id}
                  style={{
                    padding: 16,
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <h4
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--text-main)",
                    }}
                  >
                    {course.title}
                  </h4>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-dim)",
                      marginTop: 5,
                    }}
                  >
                    {course.totalModulesCount || 0} módulos •{" "}
                    {course.totalLessonsCount || 0} lecciones •{" "}
                    {course.activeStudents || 0} estudiantes
                  </div>
                  <div
                    className="progress-bar-container"
                    style={{ height: 6, marginTop: 12 }}
                  >
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${course.averageProgress || 0}%` }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 5,
                    }}
                  >
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 18,
          }}
        >
          <CheckCircle2 size={18} style={{ color: "var(--brand-celeste)" }} />
          <h3
            style={{ fontSize: 17, fontWeight: 700, color: "var(--text-main)" }}
          >
            Progreso de estudiantes por curso
          </h3>
        </div>
        {students.length ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {students.map((student) => (
              <article
                key={`${student.id}:${student.courseId}`}
                style={{
                  padding: 14,
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-deep)",
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <StudentAvatar student={student} />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--text-main)",
                      }}
                    >
                      {student.fullName || student.email}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                      {student.courseTitle}
                    </div>
                  </div>
                </div>
                <div
                  className="progress-bar-container"
                  style={{ height: 6, marginTop: 12 }}
                >
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${student.progressPercent}%` }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 5,
                  }}
                >
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
