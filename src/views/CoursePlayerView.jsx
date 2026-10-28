import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Clock,
  Check,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileArchive,
  Headphones,
  Image as ImageIcon,
  Link2,
  LoaderCircle,
  MessageSquare,
  Presentation,
  Save,
  Send,
} from "lucide-react";

function formatFileSize(sizeBytes) {
  if (sizeBytes === null || sizeBytes === undefined) return "";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 ** 2) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / 1024 ** 2).toFixed(1)} MB`;
}

function ResourceIcon({ type }) {
  if (type === "spreadsheet") return <FileSpreadsheet size={20} />;
  if (type === "presentation") return <Presentation size={20} />;
  if (type === "image") return <ImageIcon size={20} />;
  if (type === "archive") return <FileArchive size={20} />;
  if (type === "audio") return <Headphones size={20} />;
  if (type === "link") return <Link2 size={20} />;
  return <FileText size={20} />;
}

export function CoursePlayerView({
  course,
  initialLessonId,
  onSaveResume,
  onBack,
  onToggleLessonCompletion,
  onLoadLessonVideo,
  onOpenLessonResource,
  onSaveLessonNote,
  onCreateLessonQuestion,
}) {
  const videoRef = useRef(null);
  const celebrationTimer = useRef(null);
  const saveQueue = useRef(Promise.resolve());
  const savedAt = useRef(0);
  const positions = useRef(
    new Map(
      course.resume
        ? [[course.resume.lessonId, course.resume.positionSeconds]]
        : [],
    ),
  );
  const sessionToken = useRef(localStorage.getItem("traction_access_token"));
  const mounted = useRef(true);
  const [resumeError, setResumeError] = useState("");
  const [completionBusy, setCompletionBusy] = useState(false);
  const savePosition = useCallback(
    (lessonId, position) => {
      if (
        !onSaveResume ||
        !lessonId ||
        sessionToken.current !== localStorage.getItem("traction_access_token")
      )
        return;
      saveQueue.current = saveQueue.current
        .catch(() => {})
        .then(() =>
          sessionToken.current === localStorage.getItem("traction_access_token")
            ? onSaveResume(
                course.id,
                lessonId,
                Math.max(0, Math.min(604800, Number(position) || 0)),
              )
            : undefined,
        )
        .then(() => {
          if (mounted.current) setResumeError("");
        })
        .catch((error) => {
          if (mounted.current)
            setResumeError(
              "No se pudo guardar el punto de avance: " + error.message,
            );
        });
    },
    [course.id, onSaveResume],
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(celebrationTimer.current);
    };
  }, []);
  // Find initial lesson or default to first
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const initialLesson =
    allLessons.find((lesson) => lesson.id === initialLessonId) || allLessons[0];
  const [currentLessonId, setCurrentLessonId] = useState(
    initialLesson?.id || null,
  );

  const [activeTab, setActiveTab] = useState("content");
  const [userNote, setUserNote] = useState(initialLesson?.note || "");
  const [noteState, setNoteState] = useState({
    saving: false,
    saved: false,
    error: "",
  });
  const [questionText, setQuestionText] = useState("");
  const [questionState, setQuestionState] = useState({
    saving: false,
    error: "",
    success: "",
  });
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const [playbackState, setPlaybackState] = useState({
    lessonId: null,
    url: "",
    error: "",
  });
  const [openingResourceId, setOpeningResourceId] = useState(null);
  const [resourceError, setResourceError] = useState("");
  const [openModules, setOpenModules] = useState({
    [course.modules[0]?.id]: true,
    [course.modules[1]?.id]: true,
    [course.modules[2]?.id]: true,
    [course.modules[3]?.id]: true,
  });

  // Current lesson object
  const currentLesson =
    allLessons.find((l) => l.id === currentLessonId) || allLessons[0];
  const currentModule = course.modules.find((m) =>
    m.lessons.some((l) => l.id === currentLessonId),
  );
  const currentVideoId = currentLesson?.videoId;
  const currentVideoUrl = currentLesson?.videoUrl;
  const currentLessonKey = currentLesson?.id;
  const hasCurrentPlayback = playbackState.lessonId === currentLessonKey;
  const videoSource =
    currentVideoUrl || (hasCurrentPlayback ? playbackState.url : "");
  const videoError = hasCurrentPlayback ? playbackState.error : "";
  const isVideoLoading = Boolean(
    currentVideoId && !currentVideoUrl && !hasCurrentPlayback,
  );

  useEffect(() => {
    let active = true;
    if (
      !currentLessonKey ||
      currentVideoUrl ||
      !currentVideoId ||
      !onLoadLessonVideo
    ) {
      return () => {
        active = false;
      };
    }

    onLoadLessonVideo({ id: currentLessonKey, videoId: currentVideoId })
      .then((playback) => {
        if (active) {
          setPlaybackState({
            lessonId: currentLessonKey,
            url: playback?.url || "",
            error: "",
          });
        }
      })
      .catch((error) => {
        if (active) {
          setPlaybackState({
            lessonId: currentLessonKey,
            url: "",
            error:
              error.message || "No se pudo cargar el video de esta lección.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [currentLessonKey, currentVideoId, currentVideoUrl, onLoadLessonVideo]);

  useEffect(() => {
    savePosition(
      currentLessonKey,
      positions.current.get(currentLessonKey) || 0,
    );
    const flush = () =>
      savePosition(
        currentLessonKey,
        positions.current.get(currentLessonKey) || 0,
      );
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [currentLessonKey, savePosition]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed, videoSource]);

  const handleSelectLesson = (lessonId) => {
    setCurrentLessonId(lessonId);
    const lesson = allLessons.find((item) => item.id === lessonId);
    setUserNote(lesson?.note || "");
    setNoteState({ saving: false, saved: false, error: "" });
    setQuestionText("");
    setQuestionState({ saving: false, error: "", success: "" });
    setResourceError("");
  };

  const handleOpenResource = async (resource) => {
    if (!onOpenLessonResource) return;
    setOpeningResourceId(resource.id);
    setResourceError("");
    try {
      const access = await onOpenLessonResource(resource);
      const link = document.createElement("a");
      link.href = access.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      if (access.sourceType === "storage")
        link.download = access.fileName || resource.title;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setResourceError(error.message || "No se pudo abrir este recurso.");
    } finally {
      setOpeningResourceId(null);
    }
  };

  const handleSaveNote = async () => {
    if (!currentLesson || !onSaveLessonNote) return;
    setNoteState({ saving: true, saved: false, error: "" });
    try {
      await onSaveLessonNote(course.id, currentLesson.id, userNote);
      setNoteState({ saving: false, saved: true, error: "" });
    } catch (error) {
      setNoteState({
        saving: false,
        saved: false,
        error: error.message || "No se pudo guardar la nota.",
      });
    }
  };

  const handleCreateQuestion = async (event) => {
    event.preventDefault();
    if (!currentLesson || !questionText.trim() || !onCreateLessonQuestion)
      return;
    setQuestionState({ saving: true, error: "", success: "" });
    try {
      await onCreateLessonQuestion(
        course.id,
        currentLesson.id,
        questionText.trim(),
      );
      setQuestionText("");
      setQuestionState({
        saving: false,
        error: "",
        success: "Tu pregunta fue enviada al mentor.",
      });
    } catch (error) {
      setQuestionState({
        saving: false,
        error: error.message || "No se pudo enviar la pregunta.",
        success: "",
      });
    }
  };

  const handleToggleModule = (modId) => {
    setOpenModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  // Find index of current lesson in flattened array
  const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleMarkCompletedAndNext = async () => {
    if (completionBusy) return;
    setCompletionBusy(true);
    try {
      if (!currentLesson.completed) {
        if (
          (await onToggleLessonCompletion(course.id, currentLesson.id)) ===
          false
        )
          return;
        setShowCelebration(true);
        clearTimeout(celebrationTimer.current);
        celebrationTimer.current = setTimeout(
          () => setShowCelebration(false),
          3000,
        );
      }
      if (nextLesson) {
        handleSelectLesson(nextLesson.id);
      }
    } catch (error) {
      setResumeError(error.message || "No se pudo guardar el progreso");
    } finally {
      setCompletionBusy(false);
    }
  };

  if (!currentLesson)
    return (
      <section className="card">
        <h2>Contenido por publicar</h2>
        <p>Este curso todavia no tiene lecciones publicadas.</p>
        <button className="btn btn-secondary" onClick={onBack}>
          Volver a mis cursos
        </button>
      </section>
    );

  return (
    <div className="flex flex-col gap-5">
      {resumeError && <p role="alert">{resumeError}</p>}
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-4 [border-bottom:1px_solid_var(--border-subtle)] flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            className="btn btn-secondary btn-sm [padding:8px_12px]"
            onClick={onBack}
          >
            <ArrowLeft size={16} />
            <span>Volver a Cursos</span>
          </button>
          <div>
            <div className="text-[11px] [color:var(--emerald-400)] font-bold uppercase">
              {course.category} • {currentModule?.title.split(":")[0]}
            </div>
            <h1 className="text-[18px] font-extrabold text-ink">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Course Global Progress Pill */}
        <div className="flex items-center [gap:14px]">
          <div className="text-right">
            <div className="text-[12px] text-muted">Progreso del Programa</div>
            <div className="text-[14px] font-extrabold [color:var(--emerald-400)]">
              {course.progressPercent}% Completado
            </div>
          </div>
          <div className="[width:100px]">
            <div className="progress-bar-container [height:6px]">
              <div
                className="progress-bar-fill"
                style={{ width: `${course.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Cinema Player + Modular Course Sidebar */}
      <div className="player-container">
        {/* Lado Izquierdo: Reproductor de Video y Contenido de la Lección */}
        <div className="flex flex-col gap-6 [min-width:0px]">
          {/* Pantalla de Video */}
          <div className="video-screen-wrapper">
            {isVideoLoading ? (
              <div className="[min-height:360px] grid [place-items:center] text-muted">
                Preparando video seguro…
              </div>
            ) : videoSource ? (
              <video
                ref={videoRef}
                onLoadedMetadata={(e) => {
                  const position = positions.current.get(currentLessonKey) || 0;
                  if (position > 0 && position < e.currentTarget.duration)
                    e.currentTarget.currentTime = position;
                  e.currentTarget.playbackRate = playbackSpeed;
                }}
                onTimeUpdate={(e) => {
                  positions.current.set(
                    currentLessonKey,
                    e.currentTarget.currentTime,
                  );
                  if (Date.now() - savedAt.current > 15000) {
                    savedAt.current = Date.now();
                    savePosition(currentLessonKey, e.currentTarget.currentTime);
                  }
                }}
                onPause={(e) => {
                  positions.current.set(
                    currentLessonKey,
                    e.currentTarget.currentTime,
                  );
                  savePosition(currentLessonKey, e.currentTarget.currentTime);
                }}
                onEnded={(e) => {
                  positions.current.set(
                    currentLessonKey,
                    e.currentTarget.currentTime,
                  );
                  savePosition(currentLessonKey, e.currentTarget.currentTime);
                }}
                key={videoSource}
                src={videoSource}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : (
              <div
                style={{ color: videoError ? "var(--danger-text)" : "var(--text-muted)" }}
                className="[min-height:360px] grid [place-items:center] p-8 text-center"
              >
                {videoError ||
                  (currentLesson.content
                    ? "Leccion de lectura. Encuentra el texto y los materiales debajo."
                    : "Esta leccion todavia no tiene un video publicado.")}
              </div>
            )}

            {/* Banner de Celebración si se marca completada */}
            {showCelebration && (
              <div className="absolute [top:20px] [right:20px] [background:var(--brand-celeste)] text-black [padding:10px_18px] [border-radius:var(--radius-full)] flex items-center gap-2 font-extrabold text-[13px] shadow-panel [animation:fadeIn_0.3s_ease-out]">
                <Sparkles size={16} />
                <span>¡Lección completada! Progreso actualizado</span>
              </div>
            )}
          </div>

          {/* Barra de Controles y Avance de la Lección */}
          <div className="flex items-center justify-between [padding:16px_20px] [background:var(--bg-surface)] [border:1px_solid_var(--border-subtle)] [border-radius:var(--radius-md)] flex-wrap [gap:14px]">
            <div className="flex items-center gap-3">
              <button
                className={
                  `btn btn-sm ${currentLesson?.completed ? "btn-secondary" : "btn-primary"}` +
                  " [padding:8px_16px]"
                }
                disabled={completionBusy}
                onClick={handleMarkCompletedAndNext}
              >
                <CheckCircle2 size={16} />
                <span>
                  {currentLesson?.completed
                    ? "Completada (Ir a Siguiente)"
                    : "Marcar como Completada"}
                </span>
              </button>

              {/* Selector de Velocidad */}
              <div className="flex items-center gap-1 [background:var(--bg-deep)] [padding:4px_8px] [border-radius:var(--radius-sm)] [border:1px_solid_var(--border-subtle)]">
                <span className="text-[11px] text-subtle font-semibold">
                  Velocidad:
                </span>
                {[1, 1.25, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    style={{
                      background:
                        playbackSpeed === spd
                          ? "var(--brand-celeste)"
                          : "transparent",
                      color:
                        playbackSpeed === spd ? "#000000" : "var(--text-muted)",
                    }}
                    className="[border:none] [padding:2px_6px] rounded-xl text-[11px] font-bold cursor-pointer"
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Botones de Navegación Anterior / Siguiente */}
            <div className="flex items-center gap-2">
              <button
                className="btn btn-secondary btn-sm"
                disabled={!prevLesson}
                onClick={() => prevLesson && handleSelectLesson(prevLesson.id)}
                style={{
                  opacity: prevLesson ? 1 : 0.4,
                  cursor: prevLesson ? "pointer" : "not-allowed",
                }}
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={!nextLesson}
                onClick={() => nextLesson && handleSelectLesson(nextLesson.id)}
                style={{
                  opacity: nextLesson ? 1 : 0.4,
                  cursor: nextLesson ? "pointer" : "not-allowed",
                }}
              >
                <span>Siguiente</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Información y Pestañas de la Lección */}
          <div className="card">
            <h2 className="text-[20px] font-extrabold text-ink [margin-bottom:6px]">
              {currentLesson?.title}
            </h2>
            <div className="flex items-center gap-4 text-[13px] text-muted mb-5">
              <span>
                <Clock size={14} className="inline align-middle mr-1" />{" "}
                {currentLesson?.duration}
              </span>
              <span>•</span>
              <span>
                Instructor:{" "}
                <strong className="text-ink">{course.mentorName}</strong>
              </span>
            </div>

            {/* Pestañas */}
            <div className="tabs-nav">
              <button
                className={`tab-btn ${activeTab === "content" ? "active" : ""}`}
                onClick={() => setActiveTab("content")}
              >
                Contenido de la lección
              </button>
              <button
                className={`tab-btn ${activeTab === "resources" ? "active" : ""}`}
                onClick={() => setActiveTab("resources")}
              >
                Recursos y materiales ({currentLesson?.resources?.length || 0})
              </button>
              <button
                className={`tab-btn ${activeTab === "notes" ? "active" : ""}`}
                onClick={() => setActiveTab("notes")}
              >
                Mis notas
              </button>
              <button
                className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
                onClick={() => setActiveTab("questions")}
              >
                Preguntas ({currentLesson?.questions?.length || 0})
              </button>
            </div>

            {/* Contenido de texto de la lección */}
            {activeTab === "content" && (
              <div className="flex flex-col gap-5">
                <div>
                  <h4 className="text-[14px] font-bold text-ink [margin-bottom:6px]">
                    Objetivo de la lección
                  </h4>
                  <p className="text-muted text-[14px] [line-height:1.6]">
                    {currentLesson?.summary}
                  </p>
                </div>

                {currentLesson?.content ? (
                  <div className="p-5 [border-radius:var(--radius-md)] [background:var(--bg-surface-elevated)] [border:1px_solid_var(--border-subtle)] text-ink text-[14px] [line-height:1.8] whitespace-pre-wrap">
                    {currentLesson.content}
                  </div>
                ) : (
                  <div className="p-6 text-center text-subtle text-[13px] [border:1px_dashed_var(--border-medium)] [border-radius:var(--radius-md)]">
                    Esta lección todavía no tiene contenido de lectura
                    publicado.
                  </div>
                )}
              </div>
            )}

            {/* Contenido de Pestaña: Recursos */}
            {activeTab === "resources" && (
              <div className="flex flex-col gap-3">
                {resourceError && (
                  <div
                    role="alert"
                    className="[padding:10px_12px] [border-radius:var(--radius-sm)] bg-danger-soft border border-danger-line text-danger text-[12px]"
                  >
                    {resourceError}
                  </div>
                )}
                {currentLesson?.resources &&
                currentLesson.resources.length > 0 ? (
                  currentLesson.resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between [padding:14px_18px] [background:var(--bg-deep)] [border:1px_solid_var(--border-subtle)] [border-radius:var(--radius-md)]"
                    >
                      <div className="flex items-center gap-3 [min-width:0px]">
                        <div className="[width:38px] [height:38px] [border-radius:var(--radius-sm)] [background:rgba(6,_171,_235,_0.12)] text-brand flex items-center justify-center">
                          <ResourceIcon type={resource.resourceType} />
                        </div>
                        <div className="[min-width:0px]">
                          <div className="flex items-center [gap:7px] flex-wrap">
                            <span className="text-[14px] font-semibold text-ink">
                              {resource.title}
                            </span>
                            <span className="badge badge-emerald text-[11px] [padding:2px_6px]">
                              {resource.kind === "complementary"
                                ? "Complementario"
                                : "Descargable"}
                            </span>
                          </div>
                          {resource.description && (
                            <div className="text-[12px] text-muted [margin-top:3px] [line-height:1.4]">
                              {resource.description}
                            </div>
                          )}
                          <div className="text-[11px] text-subtle [margin-top:3px]">
                            {resource.sourceType === "external"
                              ? "Enlace externo"
                              : formatFileSize(resource.sizeBytes) ||
                                "Archivo del curso"}
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm [flex-shrink:0]"
                        disabled={openingResourceId === resource.id}
                        onClick={() => handleOpenResource(resource)}
                      >
                        {openingResourceId === resource.id ? (
                          <LoaderCircle size={14} className="spin" />
                        ) : resource.sourceType === "external" ? (
                          <ExternalLink size={14} />
                        ) : (
                          <Download size={14} />
                        )}
                        <span>
                          {resource.sourceType === "external"
                            ? "Abrir"
                            : "Descargar"}
                        </span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-subtle text-[13px]">
                    Esta lección no tiene recursos o materiales complementarios
                    publicados.
                  </div>
                )}
              </div>
            )}

            {/* Contenido de Pestaña: Notas privadas persistidas */}
            {activeTab === "notes" && (
              <div>
                <div className="flex justify-between items-center [margin-bottom:10px]">
                  <span className="text-[12px] text-muted">
                    Tus notas se guardan de forma privada en tu cuenta para esta
                    lección.
                  </span>
                  <span className="text-[11px] [color:var(--emerald-400)] font-semibold">
                    {noteState.saved ? (
                      <>
                        <Check size={12} className="inline mr-1" /> Guardado en
                        Supabase
                      </>
                    ) : (
                      "Guardado manual"
                    )}
                  </span>
                </div>
                {noteState.error && (
                  <div
                    role="alert"
                    className="[margin-bottom:10px] text-danger text-[12px]"
                  >
                    {noteState.error}
                  </div>
                )}
                <textarea
                  value={userNote}
                  onChange={(event) => {
                    setUserNote(event.target.value);
                    setNoteState({ saving: false, saved: false, error: "" });
                  }}
                  placeholder="Escribe tus notas ejecutivas, aprendizajes clave y aplicaciones directas para tu empresa..."
                  rows={6}
                  className="w-full [background:var(--bg-deep)] [border:1px_solid_var(--border-medium)] [border-radius:var(--radius-md)] [padding:14px] text-ink [font-family:inherit] text-[14px] [line-height:1.6] outline-none [resize:vertical]"
                />
                <button
                  className="btn btn-primary btn-sm [margin-top:10px]"
                  disabled={noteState.saving}
                  onClick={handleSaveNote}
                >
                  <Save size={14} />
                  <span>
                    {noteState.saving ? "Guardando..." : "Guardar nota"}
                  </span>
                </button>
              </div>
            )}

            {activeTab === "questions" && (
              <div className="flex flex-col [gap:14px]">
                <form
                  onSubmit={handleCreateQuestion}
                  className="p-4 [border:1px_solid_var(--border-subtle)] [border-radius:var(--radius-md)] [background:var(--bg-deep)]"
                >
                  <div className="flex items-center gap-2 [margin-bottom:10px]">
                    <MessageSquare size={16} className="text-brand" />
                    <strong className="text-[14px] text-ink">
                      Consultar al mentor
                    </strong>
                  </div>
                  <textarea
                    value={questionText}
                    onChange={(event) => setQuestionText(event.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Escribe una pregunta relacionada con esta lección..."
                    className="w-full [background:var(--bg-surface)] [border:1px_solid_var(--border-medium)] [border-radius:var(--radius-sm)] p-3 text-ink [font-family:inherit] [resize:vertical]"
                  />
                  {questionState.error && (
                    <div
                      role="alert"
                      className="mt-2 text-danger text-[12px]"
                    >
                      {questionState.error}
                    </div>
                  )}
                  {questionState.success && (
                    <div
                      role="status"
                      className="mt-2 [color:var(--emerald-400)] text-[12px]"
                    >
                      {questionState.success}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm [margin-top:10px]"
                    disabled={
                      questionState.saving || questionText.trim().length < 3
                    }
                  >
                    <Send size={14} />
                    <span>
                      {questionState.saving ? "Enviando..." : "Enviar pregunta"}
                    </span>
                  </button>
                </form>

                {currentLesson?.questions?.length ? (
                  currentLesson.questions.map((question) => (
                    <article
                      key={question.id}
                      className="[padding:14px] [border:1px_solid_var(--border-subtle)] [border-radius:var(--radius-md)] [background:var(--bg-surface-elevated)]"
                    >
                      <div className="flex justify-between [gap:10px]">
                        <div className="text-[13px] text-ink [line-height:1.5]">
                          {question.question}
                        </div>
                        <span
                          className={
                            (question.status === "answered"
                              ? "badge badge-emerald"
                              : "badge badge-amber") +
                            " text-[11px] whitespace-nowrap"
                          }
                        >
                          {question.status === "answered"
                            ? "Respondida"
                            : "Pendiente"}
                        </span>
                      </div>
                      {question.mentorReply && (
                        <div className="[margin-top:10px] p-3 [border-radius:var(--radius-sm)] [background:var(--brand-celeste-subtle)] text-ink text-[12px] [line-height:1.5]">
                          <strong className="text-brand">
                            Respuesta del mentor:{" "}
                          </strong>
                          {question.mentorReply}
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <div className="p-5 text-center text-muted [border:1px_dashed_var(--border-medium)] [border-radius:var(--radius-md)] text-[13px]">
                    Todavía no has enviado preguntas para esta lección.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lado Derecho: Sidebar Modular de Cursos y Lecciones */}
        <div className="modules-sidebar">
          {/* Header del Sidebar Modular */}
          <div className="[padding:18px_20px] [border-bottom:1px_solid_var(--border-subtle)] [background:var(--bg-surface-elevated)]">
            <h3 className="text-[15px] font-bold text-ink mb-1">
              Contenido del Programa
            </h3>
            <p className="text-[12px] text-muted">
              {allLessons.filter((l) => l.completed).length} de{" "}
              {allLessons.length} lecciones completadas
            </p>
          </div>

          {/* Lista de Módulos y Lecciones */}
          <div className="modules-list">
            {course.modules.map((mod) => {
              const isOpen = openModules[mod.id] ?? true;
              const moduleLessonsCompleted = mod.lessons.filter(
                (l) => l.completed,
              ).length;

              return (
                <div key={mod.id} className="module-group">
                  <div
                    className="module-header"
                    onClick={() => handleToggleModule(mod.id)}
                  >
                    <div>
                      <div className="text-[13px] font-bold text-ink">
                        {mod.title}
                      </div>
                      <div className="text-[11px] text-subtle [margin-top:2px]">
                        {moduleLessonsCompleted}/{mod.lessons.length}{" "}
                        completadas
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </div>

                  {/* Lecciones dentro del Módulo */}
                  {isOpen && (
                    <div>
                      {mod.lessons.map((lesson) => {
                        const isCurrent = lesson.id === currentLessonId;

                        return (
                          <div
                            key={lesson.id}
                            className={`lesson-row ${isCurrent ? "active" : ""}`}
                            onClick={() => handleSelectLesson(lesson.id)}
                          >
                            <button
                              className={`lesson-check ${lesson.completed ? "completed" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleLessonCompletion(course.id, lesson.id);
                              }}
                              title={
                                lesson.completed
                                  ? "Marcar como pendiente"
                                  : "Marcar como completada"
                              }
                            >
                              {lesson.completed && (
                                <Check size={12} strokeWidth={3} />
                              )}
                            </button>

                            <div className="[flex:1] [min-width:0px]">
                              <div
                                className="lesson-title text-[12px] [line-height:1.4]"
                                style={{
                                  color: isCurrent
                                    ? "var(--brand-celeste)"
                                    : "var(--text-muted)",
                                }}
                              >
                                {lesson.title}
                              </div>
                              <div className="text-[11px] text-subtle [margin-top:2px]">
                                {lesson.duration}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
