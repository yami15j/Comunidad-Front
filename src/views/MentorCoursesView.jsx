import React, { useState } from "react";
export function MentorCoursesView({
  courses,
  students,
  liveClasses,
  onEnroll,
  onSchedule,
  onPlay,
  onRefresh,
}) {
  const [email, setEmail] = useState({});
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState({});
  const [schedule, setSchedule] = useState({
    courseId: "",
    title: "",
    scheduledAt: "",
    durationMinutes: 60,
    joinUrl: "",
  });
  const [playing, setPlaying] = useState(null);
  async function enroll(event, courseId) {
    event.preventDefault();
    if (busy) return;
    setBusy(courseId);
    setMessage({});
    try {
      await onEnroll(courseId, email[courseId].trim());
      setMessage({ [courseId]: "Estudiante matriculado correctamente." });
      setEmail((current) => ({ ...current, [courseId]: "" }));
    } catch (error) {
      setMessage({ [courseId]: error.message });
    } finally {
      setBusy(null);
    }
  }
  async function scheduleClass(event) {
    event.preventDefault();
    if (busy) return;
    setBusy("schedule");
    setMessage({});
    try {
      await onSchedule({
        ...schedule,
        scheduledAt: new Date(schedule.scheduledAt).toISOString(),
        durationMinutes: Number(schedule.durationMinutes),
      });
      setMessage({
        schedule: "Clase publicada. Tus estudiantes ya pueden verla.",
      });
      setSchedule((current) => ({ ...current, title: "", joinUrl: "" }));
    } catch (error) {
      setMessage({ schedule: error.message });
    } finally {
      setBusy(null);
    }
  }
  async function play(lesson) {
    try {
      const result = await onPlay(lesson.videoId);
      setPlaying({ title: lesson.title, url: result.url });
    } catch (error) {
      setMessage({ [lesson.id]: error.message });
    }
  }
  return (
    <section className="academic-workspace grid gap-5 mb-6">
      <h1>Mis cursos y estudiantes</h1>
      <p>
        Estos son los cursos que impartes. Puedes consultar el contenido,
        matricular estudiantes registrados y programar clases sin solicitar
        aprobacion.
      </p>
      <button
        className="btn btn-secondary"
        onClick={async () => {
          try {
            await onRefresh();
          } catch (error) {
            setMessage({ refresh: error.message });
          }
        }}
      >
        Actualizar mis cursos
      </button>
      {message.refresh && <p role="alert">{message.refresh}</p>}
      {!courses.length && (
        <div className="card academic-workspace">
          <h2>No tienes cursos asignados</h2>
          <p>Cuando se registre un curso a tu cargo aparecera aqui.</p>
        </div>
      )}
      {courses.map((course) => (
        <article className="card grid gap-3" key={course.id}>
          <h2>{course.title}</h2>
          <p>{course.description || course.tagline}</p>
          <p>
            {course.totalModulesCount || 0} modulos ?{" "}
            {course.totalLessonsCount || 0} lecciones ?{" "}
            {course.activeStudents || 0} estudiantes
          </p>
          <details>
            <summary>Ver contenido que voy a impartir</summary>
            {course.modules?.length ? (
              course.modules.map((module) => (
                <section key={module.id}>
                  <h3>{module.title}</h3>
                  {module.lessons.map((lesson) => (
                    <details key={lesson.id}>
                      <summary>{lesson.title}</summary>
                      <p>{lesson.summary}</p>
                      <p className="whitespace-pre-wrap">{lesson.content}</p>
                      {lesson.videoId && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => play(lesson)}
                        >
                          Revisar video
                        </button>
                      )}
                      {message[lesson.id] && (
                        <p role="alert">{message[lesson.id]}</p>
                      )}
                    </details>
                  ))}
                </section>
              ))
            ) : (
              <p>Aun no tiene modulos publicados.</p>
            )}
          </details>
          <details>
            <summary>Estudiantes matriculados</summary>
            {students
              .filter((student) => student.courseId === course.id)
              .map((student) => (
                <p key={student.id}>
                  {student.fullName || student.email} ?{" "}
                  {student.progressPercent}% completado
                </p>
              ))}
            {!students.some((student) => student.courseId === course.id) && (
              <p>No hay estudiantes matriculados.</p>
            )}
          </details>
          <form
            onSubmit={(event) => enroll(event, course.id)}
            className="grid gap-2"
          >
            <label>
              Matricular estudiante por correo
              <input
                type="email"
                required
                disabled={!!busy}
                value={email[course.id] || ""}
                onChange={(e) =>
                  setEmail((current) => ({
                    ...current,
                    [course.id]: e.target.value,
                  }))
                }
                placeholder="Correo de una cuenta de estudiante registrada"
              />
            </label>
            <button className="btn btn-primary" disabled={!!busy}>
              {busy === course.id
                ? "Matriculando..."
                : "Matricular en este curso"}
            </button>
          </form>
          {message[course.id] && <p role="status">{message[course.id]}</p>}
          <p>
            {
              liveClasses.filter(
                (session) =>
                  session.courseId === course.id &&
                  session.effectiveStatus !== "ended",
              ).length
            }{" "}
            clases proximas o en curso
          </p>
        </article>
      ))}
      <section className="card">
        <h2>Programar una clase en Zoom</h2>
        <form onSubmit={scheduleClass} className="grid gap-3">
          <label>
            Curso
            <select
              required
              disabled={!!busy}
              value={schedule.courseId}
              onChange={(e) =>
                setSchedule({ ...schedule, courseId: e.target.value })
              }
            >
              <option value="">Selecciona un curso</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Titulo
            <input
              required
              minLength={3}
              value={schedule.title}
              onChange={(e) =>
                setSchedule({ ...schedule, title: e.target.value })
              }
            />
          </label>
          <label>
            Fecha y hora local
            <input
              type="datetime-local"
              required
              value={schedule.scheduledAt}
              onChange={(e) =>
                setSchedule({ ...schedule, scheduledAt: e.target.value })
              }
            />
          </label>
          <label>
            Duracion en minutos
            <input
              type="number"
              min={15}
              max={480}
              required
              value={schedule.durationMinutes}
              onChange={(e) =>
                setSchedule({ ...schedule, durationMinutes: e.target.value })
              }
            />
          </label>
          <label>
            Enlace de Zoom (opcional)
            <input
              type="url"
              placeholder="https://zoom.us/j/..."
              value={schedule.joinUrl}
              onChange={(e) =>
                setSchedule({ ...schedule, joinUrl: e.target.value })
              }
            />
          </label>
          <button
            className="btn btn-primary"
            disabled={!!busy || !courses.length}
          >
            Programar clase
          </button>
          {message.schedule && <p role="status">{message.schedule}</p>}
        </form>
      </section>
      {playing && (
        <div className="modal-backdrop">
          <section
            className="modal-dialog [max-width:900px] [width:90vw] p-5"
            role="dialog"
            aria-modal="true"
            aria-label={playing.title}
          >
            <button
              className="btn btn-secondary"
              onClick={() => setPlaying(null)}
            >
              Cerrar video
            </button>
            <h2>{playing.title}</h2>
            <video src={playing.url} controls autoPlay className="w-full" />
          </section>
        </div>
      )}
    </section>
  );
}
