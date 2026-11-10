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
  mentors = [],
  initialCourseId,
  onCourseUpdated,
  embedded = false,
  mentorMode = false,
}) {
  const [panel, setPanel] = useState("outline");
  const [resourceMode, setResourceMode] = useState("link");
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
      setPanel("outline");
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
        await onCourseUpdated?.();
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
    setPanel("lesson");
    setResourceLessonId(lesson.id);
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
    <section className={`academic-workspace curriculum-editor grid ${embedded ? "!gap-3" : "!gap-4"}`}>
      {embedded && <div className="rounded-xl border border-brand-line bg-brand-soft/50 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand">Prepara tu clase</p>
        <p className="mt-1 text-xs text-subtle">Organiza los módulos, crea las lecciones y adjunta sus materiales.</p>
        {data && <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold text-muted">
          <span className="rounded-full bg-surface px-2 py-1">{data.modules.length} módulos</span>
          <span className="rounded-full bg-surface px-2 py-1">{lessons.length} lecciones</span>
          <span className="rounded-full bg-surface px-2 py-1">{lessons.filter(lesson => lesson.is_published).length} publicadas</span>
        </div>}
      </div>}
      {!embedded && <header className="border-l-[3px] border-brand py-1 pl-4 sm:pl-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Contenido académico</p>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-[28px]">Editor de cursos, módulos y lecciones</h1>
        <p className="mt-2 max-w-xl text-xs leading-6 text-subtle">Organiza tus programas, prepara las lecciones y publica sus materiales.</p>
      </header>}
      {!embedded && <div className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 sm:flex-row sm:items-end"><label className="w-full sm:max-w-md">
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
      </label>
        {data && <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-subtle">
          <span className="rounded-full bg-elevated px-2.5 py-1.5">{data.modules.length} módulos</span>
          <span className="rounded-full bg-elevated px-2.5 py-1.5">{lessons.length} lecciones</span>
          <span className="rounded-full bg-brand-soft px-2.5 py-1.5 text-brand">{lessons.filter(lesson => lesson.is_published).length} publicadas</span>
        </div>}
      </div>}
      {error && <p role="alert">{error}</p>}
      {success && <p role="status" className="rounded-xl border border-success-line bg-success-soft px-3 py-2 text-xs text-success">{success}</p>}
      {courseId && !data && !error && <p>Cargando contenido...</p>}
      {data && (
        <div className="grid min-w-0 items-start gap-4">
          <nav aria-label="Secciones del editor" className="flex flex-wrap gap-1 rounded-2xl border border-line bg-surface p-1.5">
            {[{ id: "outline", label: "Contenido del curso" }, { id: "materials", label: "Materiales" }, ...(!mentorMode ? [{ id: "settings", label: "Datos del curso" }] : [])].map(tab => {
              const active = panel === tab.id || (tab.id === "outline" && ["module", "lesson"].includes(panel));
              return <button key={tab.id} type="button" disabled={busy} aria-current={active ? "page" : undefined} onClick={() => setPanel(tab.id)} className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${active ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-elevated"}`}>{tab.label}</button>;
            })}
          </nav>
          {["module", "lesson"].includes(panel) && <div className="flex flex-wrap items-center justify-between gap-2"><button type="button" disabled={busy} className="text-xs font-semibold text-brand hover:underline" onClick={() => setPanel("outline")}>Volver al contenido del curso</button><p className="text-xs text-subtle">{data.course.title}{panel === "lesson" && moduleId ? " / " + data.modules.find(m => m.id === moduleId)?.title : ""}</p></div>}
          {!mentorMode && panel === "settings" && <article className="card">
            <h2>Datos del curso y mentor responsable</h2>
            <p className="text-xs leading-5 text-subtle">Configura la presentación del programa. Sus módulos y lecciones se editan en Contenido del curso.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                action(async () => {
                  await api.administration.updateCourse(courseId, {
                    ...courseForm,
                    docenteId: courseForm.docenteId || undefined,
                  });
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
          </article>}
          {panel === "module" && <article className="card">
            <h2>{editingModule ? "Editar módulo" : "Crear módulo"}</h2>
            <p className="text-xs text-subtle">Un módulo agrupa las lecciones de un mismo tema.</p>
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
                  setPanel("outline");
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
                Posición en la lista
                <input
                  type="number"
                  min={1}
                  required
                  value={Number(moduleForm.position) + 1}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, position: Number(e.target.value) - 1 })
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
          </article>}
          {panel === "outline" && <article className="card">
            <div className="flex justify-end"><button type="button" className="btn btn-primary" disabled={busy} onClick={() => { setEditingModule(null); setModuleForm({ title: "", position: Math.max(-1, ...data.modules.map(m => m.position)) + 1 }); setPanel("module"); }}>Crear módulo</button></div>
            {!data.modules.length && <p className="rounded-xl border border-dashed border-line p-5 text-xs text-subtle">Empieza creando un módulo. Después podrás agregar sus lecciones.</p>}
            {data.modules.map((module) => (
              <section key={module.id} className="rounded-xl border border-line bg-elevated/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><h3>
                  Módulo {module.position + 1}: {module.title}
                </h3>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setPanel("module");
                    setEditingModule(module.id);
                    setModuleForm({
                      title: module.title,
                      position: module.position,
                    });
                  }}
                >
                  Editar módulo
                </button>
                </div>
                <p className="mt-1 text-[11px] text-subtle">{module.lessons.length} {module.lessons.length === 1 ? "lección" : "lecciones"}</p>
                {!module.lessons.length && <p className="py-4 text-xs text-subtle">Agrega la primera lección para vincular su video.</p>}
                {module.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="mt-3 rounded-lg border border-line bg-surface p-3"
                  >
                    <strong className="text-xs font-semibold text-ink">
                      Lección {lesson.position + 1}: {lesson.title}
                    </strong>
                    <p className="my-2 !text-[10px] !text-subtle">
                      <span className={`mr-2 rounded-full px-2 py-0.5 font-semibold ${lesson.is_published ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{lesson.is_published ? "Publicada" : "Borrador"}</span>
                      {lesson.duration_minutes} min | {lesson.resources.length}{" "}
                      recursos
                    </p>
                    <button
                      className="btn btn-secondary"
                      onClick={() => editLesson(module, lesson)}
                    >
                      Editar lección
                    </button>
                    <button type="button" disabled={busy} className="ml-3 text-xs font-semibold text-brand hover:underline" onClick={() => { setResourceLessonId(lesson.id); setPanel("materials"); }}>Materiales</button>
                  </div>
                ))}
                <button type="button" className="mt-3 rounded-xl border border-dashed border-brand-line px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-soft" disabled={busy} onClick={() => { selectModule(module.id); setPanel("lesson"); }}>Agregar lección a este módulo</button>
              </section>
            ))}
          </article>}
          {panel === "lesson" && <article className="card lesson-editor-card w-full max-w-4xl">
            <h2>{editingLesson ? "Editar lección" : "Crear lección"}</h2>
            <p className="text-xs leading-5 text-subtle">Completa el título, selecciona el video del curso y decide si la lección está lista para estudiantes.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (lessonForm.summary.length > 2000) {
                  setError("El resumen admite hasta 2.000 caracteres. Mueve el contenido largo al campo Texto de la lección.");
                  return;
                }
                if (lessonForm.content.length > 100000) {
                  setError("El texto de la lección admite hasta 100.000 caracteres. Divide el contenido en varias lecciones o adjunta un archivo.");
                  return;
                }
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
                  setPanel("outline");
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
                  aria-label="Resumen de la lección"
                  aria-invalid={lessonForm.summary.length > 2000}
                  aria-describedby="lesson-summary-help"
                  value={lessonForm.summary}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, summary: e.target.value })
                  }
                />
                <span id="lesson-summary-help" className={`text-[10px] font-normal ${lessonForm.summary.length > 2000 ? "text-danger" : "text-subtle"}`}>
                  {lessonForm.summary.length}/2.000 caracteres. Escribe una descripción breve; el contenido completo va en Texto de la lección.
                </span>
                {lessonForm.summary.length > 2000 && <button type="button" className="btn btn-secondary"
                  onClick={() => {
                    setLessonForm(current => ({ ...current, content: [current.summary, current.content].filter(Boolean).join("\n\n"), summary: "" }));
                    setError("");
                  }}>Mover el resumen al texto de la lección</button>}
              </label>
              <label>
                Texto de la leccion
                <textarea
                  rows={3}
                  aria-label="Texto de la lección"
                  maxLength={100000}
                  value={lessonForm.content}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, content: e.target.value })
                  }
                />
              </label>
              <label>
                Video principal de esta lección
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
                {mentorMode ? "Los videos se suben desde Mis grabaciones. Después puedes asociarlos a esta lección." : "Los videos se cargan desde Agendar Vivos & Replays, en Publicar grabación."}
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
                Posición en la lista
                <input
                  required
                  type="number"
                  min={1}
                  value={Number(lessonForm.position) + 1}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, position: Number(e.target.value) - 1 })
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
          </article>}
          {panel === "materials" && <article className="card">
            <h2>Materiales de la lección</h2>
            <p className="text-xs leading-5 text-subtle">Adjunta documentos o enlaces de apoyo. El video principal se asigna al editar la lección.</p>
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
                <div className="mt-4 flex flex-wrap gap-2" aria-label="Tipo de material">
                  <button type="button" aria-pressed={resourceMode === "link"} onClick={() => setResourceMode("link")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${resourceMode === "link" ? "bg-brand text-white" : "bg-elevated text-muted"}`}>Agregar enlace</button>
                  <button type="button" aria-pressed={resourceMode === "file"} onClick={() => setResourceMode("file")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${resourceMode === "file" ? "bg-brand text-white" : "bg-elevated text-muted"}`}>Subir documento</button>
                </div>
                {resourceMode === "link" && <form
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
                </form>}
                {resourceMode === "file" && <form
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
                </form>}
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
          </article>}
        </div>
      )}
    </section>
  );
}
