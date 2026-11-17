import { SavedLessonDetails } from "../components/SavedLessonDetails";
import "./AdminCurriculumView.css";
import { ArrowLeft, ImagePlus, Trash2, CheckCircle2, X, RefreshCw } from "lucide-react";
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
  onBack,
  embedded = false,
  mentorMode = false,
}) {
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [removeCover, setRemoveCover] = useState(false);
  useEffect(() => { if (!coverFile) { setCoverPreview(""); return; } const url = URL.createObjectURL(coverFile); setCoverPreview(url); return () => URL.revokeObjectURL(url); }, [coverFile]);
  const [recordingsCatalog, setRecordingsCatalog] = useState(null);
  const [recordingsRevision, setRecordingsRevision] = useState(0);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [recordingsError, setRecordingsError] = useState("");
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
  useEffect(() => { if (!success) return; const timer = setTimeout(() => setSuccess(""), 4500); return () => clearTimeout(timer); }, [success]);
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
    setCoverFile(null); setRemoveCover(false);
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
  useEffect(() => {
    const refresh = () => setRecordingsRevision(value => value + 1);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  useEffect(() => {
    if (!courseId || panel !== "lesson") return;
    const controller = new AbortController();
    setRecordingsLoading(true); setRecordingsError("");
    api.videos.list({ signal: controller.signal }).then(videos => {
      if (!controller.signal.aborted) setRecordingsCatalog({ courseId, videos: videos.filter(video => (video.courseId || video.course_id) === courseId && video.status === "ready") });
    }).catch(error => { if (!controller.signal.aborted) setRecordingsError(error.message || "No se pudieron cargar las clases grabadas."); }).finally(() => { if (!controller.signal.aborted) setRecordingsLoading(false); });
    return () => controller.abort();
  }, [courseId, panel, recordingsRevision]);
  const availableRecordings = recordingsCatalog?.courseId === courseId ? recordingsCatalog.videos : data?.videos || [];
  async function action(work, message) {
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await work();
      setSuccess({ message, savedAt: Date.now() });
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
    <section className={`academic-workspace curriculum-editor grid ${!embedded ? "curriculum-fullpage" : ""} ${embedded ? "!gap-3" : "!gap-4"}`}>
      {embedded && <div className="rounded-xl border border-brand-line bg-brand-soft/50 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand">Prepara tu clase</p>
        <p className="mt-1 text-xs text-subtle">Organiza los módulos, crea las lecciones y adjunta sus materiales.</p>
        {data && <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold text-muted">
          <span className="rounded-full bg-surface px-2 py-1">{data.modules.length} {data.modules.length === 1 ? "módulo" : "módulos"}</span>
          <span className="rounded-full bg-surface px-2 py-1">{lessons.length} {lessons.length === 1 ? "lección" : "lecciones"}</span>
          <span className="rounded-full bg-surface px-2 py-1">{lessons.filter(lesson => lesson.is_published).length} publicadas</span>
        </div>}
      </div>}
      {!embedded && <header className="space-y-4">
        {onBack && <button type="button" disabled={busy} className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-brand" onClick={onBack}><ArrowLeft size={16} />Volver a cursos</button>}
        <div className="border-b border-line pb-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Editor de contenido</p><h1 className="mt-1 !text-2xl">{data?.course.title || courses.find(course => course.id === courseId)?.title || "Contenido del curso"}</h1><p className="mt-2 text-xs text-subtle">Organiza los módulos, edita las lecciones y administra sus materiales.</p></div>
      </header>}
      {!embedded && <div className="flex flex-col justify-between gap-3 py-1 sm:flex-row sm:items-end"><label className="w-full sm:max-w-md">
        Curso que estás editando
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
      {success && <div role="status" className="fixed right-4 top-5 z-[150] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-2xl border border-emerald-200 bg-surface p-4 shadow-xl shadow-slate-900/10 motion-safe:animate-[view-enter_200ms_ease_both] sm:right-6">
        <CheckCircle2 size={21} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-xs font-bold text-ink">Guardado exitosamente</p><p className="mt-1 text-xs leading-5 text-muted">{success.message}</p></div><button type="button" aria-label="Cerrar notificaci?n de guardado" className="shrink-0 rounded-lg p-1 text-subtle hover:bg-elevated hover:text-ink" onClick={() => setSuccess("")}><X size={15} /></button>
      </div>}
      {courseId && !data && !error && <p>Cargando contenido...</p>}
      {data && (
        <div className="grid min-w-0 items-start gap-4">
          <nav aria-label="Secciones del editor" className="curriculum-sections grid gap-2 sm:grid-cols-3">
            {[{ id: "outline", label: "Módulos y lecciones", description: "Organiza los temas y las clases." }, { id: "materials", label: "Materiales de las lecciones", description: "Adjunta documentos y enlaces." }, ...(!mentorMode ? [{ id: "settings", label: "Información del curso", description: "Edita el título y el mentor." }] : [])].map((tab, index) => {
              const active = panel === tab.id || (tab.id === "outline" && ["module", "lesson"].includes(panel));
              return <button key={tab.id} type="button" disabled={busy} aria-current={active ? "page" : undefined} onClick={() => setPanel(tab.id)} className={"flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition " + (active ? "border-brand-line bg-brand-soft text-brand" : "border-line bg-surface text-muted hover:border-brand-line")}><span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-elevated/70 text-[10px] font-bold">{index + 1}</span><span><span className="block text-xs font-bold">{tab.label}</span><span className="mt-1 block text-[10px] font-normal leading-4 text-subtle">{tab.description}</span></span></button>;
            })}
          </nav>
          {["module", "lesson"].includes(panel) && <div className="flex flex-wrap items-center justify-between gap-2"><button type="button" disabled={busy} className="text-xs font-semibold text-brand hover:underline" onClick={() => setPanel("outline")}>Volver a módulos y lecciones</button><p className="text-xs text-subtle">{data.course.title}{panel === "lesson" && moduleId ? " / " + data.modules.find(m => m.id === moduleId)?.title : ""}</p></div>}
          {!mentorMode && panel === "settings" && <article className="card">
            <h2>Datos del curso y mentor responsable</h2>
            <p className="text-xs leading-5 text-subtle">Configura la presentación del programa. Sus módulos y lecciones se editan en la primera sección.</p>
            <section className="!my-5 grid gap-4 border-y border-line py-4 sm:grid-cols-[180px_minmax(0,1fr)]" aria-label="Portada del curso">
              <div className="flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-line bg-elevated/40">{!removeCover && (coverPreview || data.course.thumbnail_url) ? <img src={coverPreview || data.course.thumbnail_url} alt="Portada del curso" className="h-full w-full object-contain" /> : <div className="text-center text-subtle"><ImagePlus size={24} className="mx-auto" /><p className="mt-1 text-[10px]">Sin portada propia</p></div>}</div>
              <div className="min-w-0"><p className="text-xs font-bold">Imagen del curso</p><p className="mt-1 text-[10px] text-subtle">JPG, PNG o WebP de hasta 5 MB.</p><div className="mt-3 flex flex-wrap items-center gap-2"><label className="relative !inline-flex cursor-pointer !rounded-lg !border !border-line !px-3 !py-2 !text-[11px] !font-semibold !text-brand"><span>{data.course.thumbnail_url || coverFile ? "Cambiar imagen" : "Seleccionar imagen"}</span><input className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Cambiar imagen del curso" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (!file) return; if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setError("Usa JPG, PNG o WebP de hasta 5 MB."); event.target.value = ""; return; } setError(""); setCoverFile(file); setRemoveCover(false); }} /></label>{(data.course.thumbnail_url || coverFile) && !removeCover && <button type="button" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-danger" disabled={busy} onClick={() => { setCoverFile(null); setRemoveCover(true); }}><Trash2 size={13} />Eliminar imagen</button>}</div>
              {(coverFile || removeCover) && <div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" className="btn btn-primary" disabled={busy} onClick={() => action(async () => { if (removeCover) await api.courses.removeCover(courseId); else await api.courses.uploadCover(courseId, coverFile); }, removeCover ? "Imagen del curso eliminada." : "Imagen del curso actualizada.")}>{busy ? "Guardando..." : "Guardar imagen"}</button><button type="button" className="text-xs text-subtle" disabled={busy} onClick={() => { setCoverFile(null); setRemoveCover(false); }}>Cancelar</button></div>}
              {coverFile && <p className="mt-2 truncate text-[10px] text-subtle">{coverFile.name}</p>}{removeCover && <p className="mt-2 text-[10px] text-danger">La portada se quitará al guardar.</p>}</div>
            </section>
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
          {panel === "outline" && <article className="card curriculum-outline">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="!bg-transparent !p-0 !text-base">Estructura del curso</h2><p className="mt-1 text-xs text-subtle">Crea un módulo para cada tema y agrega sus lecciones debajo.</p></div><button type="button" className="btn btn-primary" disabled={busy} onClick={() => { setEditingModule(null); setModuleForm({ title: "", position: Math.max(-1, ...data.modules.map(m => m.position)) + 1 }); setPanel("module"); }}>Crear módulo</button></div>
            {!data.modules.length && <p className="rounded-xl border border-dashed border-line p-5 text-xs text-subtle">Empieza creando un módulo. Después podrás agregar sus lecciones.</p>}
            {data.modules.map((module) => (
              <section key={module.id} className="curriculum-module rounded-xl border border-line bg-elevated/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-brand">Módulo {module.position + 1}</p><h3 className="mt-1 !text-base">{module.title}</h3><p className="mt-1 text-[11px] text-subtle">{module.lessons.length} {module.lessons.length === 1 ? "lección en este tema" : "lecciones en este tema"}</p></div>
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
                {module.lessons.length > 0 && <div className="curriculum-lesson-columns hidden sm:grid"><span>Lecciones del módulo</span><span>Publicación</span><span className="text-right">Acciones</span></div>}
                {!module.lessons.length && <p className="py-4 text-xs text-subtle">Agrega la primera lección para vincular su video.</p>}
                {module.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="curriculum-lesson mt-3 rounded-lg border border-line bg-surface p-3"
                  >
                    <div className="min-w-0"><p className="text-xs font-semibold text-ink"><span className="mr-2 text-subtle">Lección {lesson.position + 1}</span>{lesson.title}</p><p className="mt-1 text-[10px] text-subtle">{lesson.duration_minutes} min de duración <span className="mx-1">·</span>{lesson.resources.length} {lesson.resources.length === 1 ? "material adjunto" : "materiales adjuntos"}</p></div>
                    <span className={"w-fit rounded-md px-2 py-1 text-[10px] font-semibold " + (lesson.is_published ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>{lesson.is_published ? "Visible para estudiantes" : "Borrador sin publicar"}</span>
                    <div className="curriculum-lesson-actions flex flex-wrap items-center gap-3 sm:justify-end"><button type="button" disabled={busy} className="btn btn-secondary" onClick={() => editLesson(module, lesson)}>Editar lección</button><button type="button" disabled={busy} className="text-xs font-semibold text-brand hover:underline" onClick={() => { setResourceLessonId(lesson.id); setPanel("materials"); }}>Ver materiales</button></div>
                  </div>
                ))}
                <button type="button" className="mt-3 rounded-xl border border-dashed border-brand-line px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-soft" disabled={busy} onClick={() => { selectModule(module.id); setPanel("lesson"); }}>+ Agregar lección</button>
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
                      durationMinutes: availableRecordings.find(video => video.id === lessonForm.videoId)?.durationSeconds ? Math.ceil(availableRecordings.find(video => video.id === lessonForm.videoId).durationSeconds / 60) : Number(lessonForm.durationMinutes),
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
                Video principal de esta lección ? Clases grabadas
                <select
                  aria-label="Clase grabada para esta lección"
                  disabled={busy || recordingsLoading}
                  value={lessonForm.videoId || ""}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, videoId: e.target.value })
                  }
                >
                  <option value="">{recordingsLoading ? "Cargando clases grabadas..." : "Sin video: lección de texto"}</option>
                  {lessonForm.videoId && !availableRecordings.some(video => video.id === lessonForm.videoId) && <option value={lessonForm.videoId}>Video vinculado no disponible</option>}
                  {availableRecordings.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="space-y-2 md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2"><button type="button" disabled={busy || recordingsLoading} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand disabled:opacity-50" onClick={() => setRecordingsRevision(value => value + 1)}><RefreshCw size={12} className={recordingsLoading ? "animate-spin" : ""} />{recordingsLoading ? "Actualizando..." : "Actualizar grabaciones"}</button></div>
                {recordingsError && <p role="alert" className="text-xs">{recordingsError}</p>}
                {!availableRecordings.length && <p className="rounded-lg bg-elevated/60 px-3 py-2 text-[11px] text-muted">Este curso aún no tiene grabaciones disponibles. Publica el video en {mentorMode ? "Mis grabaciones" : "Clases y grabaciones"}, seleccionando este mismo curso, y actualiza la lista.</p>}
              </div>
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
            <h2>Materiales de las lecciones</h2><p className="!mt-1 text-[11px] leading-5 text-subtle">Selecciona una lección para consultar o agregar archivos y enlaces.</p>
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
                {lessons.find(lesson => lesson.id === resourceLessonId) && <SavedLessonDetails expanded key={resourceLessonId} lesson={lessons.find(lesson => lesson.id === resourceLessonId)} video={data.videos.find(video => video.id === lessons.find(lesson => lesson.id === resourceLessonId)?.video_id)} />}

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
