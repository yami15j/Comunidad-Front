import React, { useEffect, useState, useCallback } from "react";
import { api } from "../services/api";
const blankLesson = (position = 0) => ({
  title: "",
  summary: "",
  content: "",
  position,
  durationMinutes: 0,
  videoId: "",
  isPublished: false,
});
export function AdminCurriculumView({
  courses,
  mentors,
  initialCourseId,
  onCourseUpdated,
  embedded = false,
}) {
  const [courseId, setCourseId] = useState(initialCourseId || "");
  const [loadedData, setData] = useState(null);
  const [courseForm, setCourseForm] = useState(null);
  const [moduleForm, setModuleForm] = useState({ title: "", position: 0 });
  const [editingModule, setEditingModule] = useState(null);
  const [moduleId, setModuleId] = useState("");
  const [lessonForm, setLessonForm] = useState(blankLesson());
  const [editingLesson, setEditingLesson] = useState(null);
  const [resourceLessonId, setResourceLessonId] = useState("");
  const [linkForm, setLinkForm] = useState({
    title: "",
    externalUrl: "",
    kind: "download",
    resourceType: "document",
    isPublished: false,
  });
  const [file, setFile] = useState(null);
  const [fileTitle, setFileTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const data = loadedData?.course.id === courseId ? loadedData : null;
  const load = useCallback(async (id, signal, reset = false) => {
    const next = await api.administration.curriculum(id, { signal });
    if (signal?.aborted) return;
    if (reset) {
      setError("");
      setSuccess("");
      setModuleId("");
      setEditingModule(null);
      setEditingLesson(null);
      setResourceLessonId("");
      setLessonForm(blankLesson());
    }
    setData(next);
    setCourseForm({
      title: next.course.title,
      description: next.course.description,
      contentType: next.course.content_type || "course",
      category: next.course.category || "",
      level: next.course.level || "",
      docenteId: next.course.docente_id || "",
    });
    setModuleForm({
      title: "",
      position: Math.max(-1, ...next.modules.map((m) => m.position)) + 1,
    });
    return next;
  }, []);
  useEffect(() => {
    if (!courseId) return;
    const controller = new AbortController();
    // eslint-disable-next-line react/set-state-in-effect -- All editor updates follow the awaited remote curriculum response.
    load(courseId, controller.signal, true).catch((e) => {
      if (e.name !== "AbortError") setError(e.message);
    });
    if (!embedded) window.history.replaceState(
      {},
      "",
      window.location.pathname + "?curso=" + encodeURIComponent(courseId),
    );
    return () => controller.abort();
  }, [courseId, load, embedded]);
  async function action(work, message) {
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await work();
      setSuccess(message);
      try {
        await load(courseId);
      } catch (e) {
        setError("Guardado, pero no se pudo actualizar la vista: " + e.message);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const lessons =
    data?.modules.flatMap((m) =>
      m.lessons.map((l) => ({ ...l, moduleTitle: m.title })),
    ) || [];
  function selectModule(id) {
    setModuleId(id);
    setEditingLesson(null);
    const module = data.modules.find((m) => m.id === id);
    setLessonForm(
      blankLesson(
        Math.max(-1, ...(module?.lessons || []).map((l) => l.position)) + 1,
      ),
    );
  }
  function editLesson(module, lesson) {
    setModuleId(module.id);
    setEditingLesson(lesson.id);
    setLessonForm({
      title: lesson.title,
      summary: lesson.summary,
      content: lesson.content_text,
      position: lesson.position,
      durationMinutes: lesson.duration_minutes,
      videoId: lesson.video_id || "",
      isPublished: lesson.is_published,
    });
  }
  return (
    <section className="academic-workspace grid gap-5">
      {!embedded && <h1>Editor de cursos, modulos y lecciones</h1>}
      {!embedded && <label>
        Curso o programa
        <select
          value={courseId}
          disabled={busy}
          onChange={(e) => {
            setError("");
            setSuccess("");
            setCourseId(e.target.value);
          }}
        >
          <option value="">Selecciona un curso</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </label>}
      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
      {courseId && !data && !error && <p>Cargando contenido...</p>}
      {data && (
        <>
          <details className="card" open={embedded || undefined}>
            <summary>Datos del curso y profesor asignado</summary>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                action(async () => {
                  await api.administration.updateCourse(courseId, {
                    ...courseForm,
                    docenteId: courseForm.docenteId || undefined,
                  });
                  await onCourseUpdated?.();
                }, "Curso actualizado.");
              }}
            >
              <label>
                Titulo
                <input
                  required
                  minLength={3}
                  value={courseForm.title}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, title: e.target.value })
                  }
                />
              </label>
              <label>
                Descripcion
                <textarea
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      description: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Tipo
                <select
                  value={courseForm.contentType}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      contentType: e.target.value,
                    })
                  }
                >
                  <option value="course">Curso</option>
                  <option value="masterclass">Masterclass</option>
                  <option value="workshop">Taller</option>
                </select>
              </label>
              <label>
                Categoria
                <input
                  value={courseForm.category}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, category: e.target.value })
                  }
                />
              </label>
              <label>
                Nivel
                <input
                  value={courseForm.level}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, level: e.target.value })
                  }
                />
              </label>
              <label>
                Profesor
                <select
                  value={courseForm.docenteId}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, docenteId: e.target.value })
                  }
                >
                  <option value="">Sin asignar</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-primary" disabled={busy}>
                Guardar curso
              </button>
            </form>
          </details>
          <article className="card">
            <h2>{editingModule ? "Editar modulo" : "Crear modulo"}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                action(async () => {
                  await api.administration.saveModule(
                    courseId,
                    { ...moduleForm, position: Number(moduleForm.position) },
                    editingModule,
                  );
                  setEditingModule(null);
                }, "Modulo guardado.");
              }}
            >
              <label>
                Titulo
                <input
                  required
                  minLength={2}
                  value={moduleForm.title}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, title: e.target.value })
                  }
                />
              </label>
              <label>
                Orden (desde 0)
                <input
                  type="number"
                  min={0}
                  required
                  value={moduleForm.position}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, position: e.target.value })
                  }
                />
              </label>
              <button className="btn btn-primary" disabled={busy}>
                Guardar modulo
              </button>
              {editingModule && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingModule(null);
                    setModuleForm({
                      title: "",
                      position:
                        Math.max(-1, ...data.modules.map((m) => m.position)) +
                        1,
                    });
                  }}
                >
                  Cancelar edicion
                </button>
              )}
            </form>
          </article>
          <article className="card">
            <h2>Contenido registrado</h2>
            {!data.modules.length && <p>Este curso aun no tiene modulos.</p>}
            {data.modules.map((module) => (
              <section key={module.id}>
                <h3>
                  {module.position}. {module.title}
                </h3>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingModule(module.id);
                    setModuleForm({
                      title: module.title,
                      position: module.position,
                    });
                  }}
                >
                  Editar modulo
                </button>
                {module.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-3 [border-bottom:1px_solid_var(--border-subtle)]"
                  >
                    <strong>
                      {lesson.position}. {lesson.title}
                    </strong>
                    <p>
                      {lesson.is_published ? "Publicada" : "Borrador"} |{" "}
                      {lesson.duration_minutes} min | {lesson.resources.length}{" "}
                      recursos
                    </p>
                    <button
                      className="btn btn-secondary"
                      onClick={() => editLesson(module, lesson)}
                    >
                      Editar leccion
                    </button>
                  </div>
                ))}
              </section>
            ))}
          </article>
          <article className="card">
            <h2>{editingLesson ? "Editar leccion" : "Crear leccion"}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                action(async () => {
                  await api.administration.saveLesson(
                    moduleId,
                    {
                      ...lessonForm,
                      position: Number(lessonForm.position),
                      durationMinutes: Number(lessonForm.durationMinutes),
                      videoId: lessonForm.videoId || null,
                    },
                    editingLesson,
                  );
                  setEditingLesson(null);
                  setLessonForm(blankLesson(Number(lessonForm.position) + 1));
                }, "Leccion guardada. Solo las publicadas se muestran al estudiante.");
              }}
            >
              <label>
                Modulo
                <select
                  required
                  value={moduleId}
                  disabled={!!editingLesson}
                  onChange={(e) => selectModule(e.target.value)}
                >
                  <option value="">Selecciona un modulo</option>
                  {data.modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Titulo
                <input
                  required
                  minLength={2}
                  maxLength={160}
                  value={lessonForm.title}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, title: e.target.value })
                  }
                />
              </label>
              <label>
                Resumen
                <textarea
                  value={lessonForm.summary}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, summary: e.target.value })
                  }
                />
              </label>
              <label>
                Texto de la leccion
                <textarea
                  rows={7}
                  value={lessonForm.content}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, content: e.target.value })
                  }
                />
              </label>
              <label>
                Video publicado del mismo curso
                <select
                  value={lessonForm.videoId || ""}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, videoId: e.target.value })
                  }
                >
                  <option value="">Sin video: leccion de texto</option>
                  {data.videos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
              </label>
              <p>
                Los videos se cargan desde Agendar Vivos & Replays, en Publicar
                grabacion.
              </p>
              <label>
                Duracion (minutos)
                <input
                  required
                  type="number"
                  min={0}
                  max={1440}
                  value={lessonForm.durationMinutes}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      durationMinutes: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Orden (desde 0)
                <input
                  required
                  type="number"
                  min={0}
                  value={lessonForm.position}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, position: e.target.value })
                  }
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={lessonForm.isPublished}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      isPublished: e.target.checked,
                    })
                  }
                />{" "}
                Publicada para estudiantes con acceso al contenido
              </label>
              <button className="btn btn-primary" disabled={busy || !moduleId}>
                Guardar leccion
              </button>
              {editingLesson && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => selectModule(moduleId)}
                >
                  Crear otra leccion
                </button>
              )}
            </form>
          </article>
          <article className="card">
            <h2>Materiales descargables y complementarios</h2>
            <label>
              Leccion
              <select
                value={resourceLessonId}
                onChange={(e) => setResourceLessonId(e.target.value)}
              >
                <option value="">Selecciona una leccion</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.moduleTitle} / {l.title}
                  </option>
                ))}
              </select>
            </label>
            {resourceLessonId && (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    action(async () => {
                      await api.administration.resourceLink(
                        resourceLessonId,
                        linkForm,
                      );
                      setLinkForm({ ...linkForm, title: "", externalUrl: "" });
                    }, "Enlace guardado.");
                  }}
                >
                  <h3>Agregar enlace</h3>
                  <label>
                    Titulo
                    <input
                      required
                      minLength={2}
                      value={linkForm.title}
                      onChange={(e) =>
                        setLinkForm({ ...linkForm, title: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    URL
                    <input
                      type="url"
                      required
                      value={linkForm.externalUrl}
                      onChange={(e) =>
                        setLinkForm({
                          ...linkForm,
                          externalUrl: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Uso
                    <select
                      value={linkForm.kind}
                      onChange={(e) =>
                        setLinkForm({ ...linkForm, kind: e.target.value })
                      }
                    >
                      <option value="download">Recurso descargable</option>
                      <option value="complementary">
                        Material complementario
                      </option>
                    </select>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={linkForm.isPublished}
                      onChange={(e) =>
                        setLinkForm({
                          ...linkForm,
                          isPublished: e.target.checked,
                        })
                      }
                    />{" "}
                    Publicar recurso
                  </label>
                  <button className="btn btn-primary" disabled={busy}>
                    Guardar enlace
                  </button>
                </form>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    action(
                      () =>
                        api.administration.resourceUpload(
                          resourceLessonId,
                          file,
                          fileTitle,
                        ),
                      "Archivo cargado como borrador. Puedes publicarlo en la lista.",
                    );
                  }}
                >
                  <h3>Subir archivo (hasta 25 MB)</h3>
                  <label>
                    Titulo
                    <input
                      value={fileTitle}
                      onChange={(e) => setFileTitle(e.target.value)}
                    />
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.zip,.txt,.png,.jpg,.jpeg,.webp,.mp3,.wav,.ogg"
                    onChange={(e) => setFile(e.target.files[0] || null)}
                  />
                  <button className="btn btn-primary" disabled={busy || !file}>
                    Subir material
                  </button>
                </form>
                {(
                  lessons.find((l) => l.id === resourceLessonId)?.resources ||
                  []
                ).map((r) => (
                  <div key={r.id}>
                    <strong>{r.title}</strong>
                    <p>{r.is_published ? "Publicado" : "Borrador"}</p>
                    <button
                      className="btn btn-secondary"
                      disabled={busy}
                      onClick={() =>
                        action(
                          () =>
                            api.administration.resourceState(
                              r.id,
                              !r.is_published,
                            ),
                          "Estado del material actualizado.",
                        )
                      }
                    >
                      {r.is_published
                        ? "Retirar publicacion"
                        : "Publicar recurso"}
                    </button>
                  </div>
                ))}
              </>
            )}
          </article>
        </>
      )}
    </section>
  );
}
