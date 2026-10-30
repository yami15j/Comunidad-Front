import { EnrollmentStudentFields } from "../components/EnrollmentStudentFields";
import { Dialog } from "../components/ui";
import { AdminCurriculumView } from "./AdminCurriculumView";
import React, { useState } from "react";
export function MentorCoursesView({
  courses,
  students,
  liveClasses,
  onEnroll,
  onPlay,
  onRefresh,
}) {
  const [editingCourse, setEditingCourse] = useState(null);
  const [email, setEmail] = useState({});
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState({});
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
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 border-l-[3px] border-brand py-1 pl-4 sm:pl-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Tu espacio de enseñanza</p>
          <h1 className="!text-2xl font-extrabold leading-tight tracking-tight text-ink sm:!text-[28px]">Mis cursos y estudiantes</h1>
          <p className="mt-2 max-w-xl text-xs leading-6 text-subtle sm:text-sm">Organiza tus contenidos, matricula estudiantes y acompaña su avance.</p>
          <span className="mt-2 inline-block rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-semibold text-muted">{courses.length} {courses.length === 1 ? 'curso asignado' : 'cursos asignados'}</span>
        </div>
      <button
        className="btn btn-secondary self-start shrink-0 !min-h-9 !rounded-xl !px-4 !py-2 !text-xs lg:self-center"
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
      </header>
      {message.refresh && <p role="alert">{message.refresh}</p>}
      {!courses.length && (
        <div className="card academic-workspace">
          <h2>No tienes cursos asignados</h2>
          <p>Cuando se registre un curso a tu cargo aparecera aqui.</p>
        </div>
      )}
      {courses.map((course) => (
        <article className="card grid !gap-4 !space-y-0 !rounded-2xl !p-4 sm:!p-5 [&_details]:!rounded-xl [&_details]:!bg-elevated/30 [&_details]:!p-3 [&_summary]:!text-xs [&_details_p]:text-xs [&_details_p]:leading-6" key={course.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="!text-lg font-bold tracking-tight">{course.title}</h2>
            <button className="btn btn-primary !min-h-9 !rounded-xl !px-4 !py-2 !text-xs" onClick={() => setEditingCourse(course)}>Editar contenido</button>
          </div>
          <p className="-mt-2 text-xs leading-6 text-subtle">{course.description || course.tagline}</p>
          <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-muted">
            <span className="rounded-lg border border-line bg-elevated/50 px-2.5 py-1.5">{course.totalModulesCount || 0} módulos</span>
            <span className="rounded-lg border border-line bg-elevated/50 px-2.5 py-1.5">{course.totalLessonsCount || 0} lecciones</span>
            <span className="rounded-lg border border-brand-line bg-brand-soft px-2.5 py-1.5 text-brand">{course.activeStudents || 0} {course.activeStudents === 1 ? 'estudiante' : 'estudiantes'}</span>
          </div>
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
              <p className="text-subtle">Aún no tiene módulos publicados. Agrega el primero desde Editar contenido.</p>
            )}
          </details>
          <details>
            <summary>Estudiantes matriculados</summary>
            {students
              .filter((student) => student.courseId === course.id)
              .map((student) => (
                <p key={student.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-2">
                  <span className="font-semibold text-ink">{student.fullName || student.email}</span>
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">{student.progressPercent}% completado</span>
                </p>
              ))}
            {!students.some((student) => student.courseId === course.id) && (
              <p>No hay estudiantes matriculados.</p>
            )}
          </details>
          <form
            onSubmit={(event) => enroll(event, course.id)}
            className="!mt-0 grid !gap-3 rounded-xl border border-line bg-elevated/40 p-3 sm:p-4 lg:!grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:!grid-cols-2 md:items-end"
          >
            <EnrollmentStudentFields courseId={course.id} value={email[course.id] || ''} disabled={!!busy}
              onChange={value => setEmail(current => ({ ...current, [course.id]: value }))} />
            <button className="btn btn-primary !min-h-10 !w-full !rounded-xl !px-4 !py-2.5 !text-xs md:!w-auto" disabled={!!busy}>
              {busy === course.id
                ? "Matriculando..."
                : "Matricular en este curso"}
            </button>
          </form>
          {message[course.id] && <p role="status">{message[course.id]}</p>}
          <p className="border-t border-line pt-3 text-[11px] text-subtle">
            {
              liveClasses.filter(
                (session) =>
                  session.courseId === course.id &&
                  session.effectiveStatus !== "ended",
              ).length
            }{" "}
            clases próximas o en curso
          </p>
        </article>
      ))}
      <Dialog open={Boolean(editingCourse)} onClose={() => setEditingCourse(null)} title={editingCourse ? 'Contenido de ' + editingCourse.title : 'Editar contenido'} className="!max-w-2xl !max-h-[78dvh] [&>div:first-child]:!px-5 [&>div:first-child]:!py-3 [&>div:first-child>h2]:!text-sm [&>div:last-child]:!p-4">
        {editingCourse && <AdminCurriculumView key={editingCourse.id} courses={[editingCourse]} initialCourseId={editingCourse.id}
          embedded mentorMode onCourseUpdated={onRefresh} />}
      </Dialog>
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
