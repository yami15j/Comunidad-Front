import React, { useState, useEffect } from "react";
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
  onBack,
  onToggleLessonCompletion,
  onLoadLessonVideo,
  onOpenLessonResource,
  onSaveLessonNote,
  onCreateLessonQuestion,
}) {
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

  const handleMarkCompletedAndNext = () => {
    if (!currentLesson.completed) {
      onToggleLessonCompletion(course.id, currentLesson.id);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
    if (nextLesson) {
      handleSelectLesson(nextLesson.id);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Breadcrumb & Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border-subtle)",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onBack}
            style={{ padding: "8px 12px" }}
          >
            <ArrowLeft size={16} />
            <span>Volver a Cursos</span>
          </button>
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--emerald-400)",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {course.category} • {currentModule?.title.split(":")[0]}
            </div>
            <h1
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "var(--text-main)",
              }}
            >
              {course.title}
            </h1>
          </div>
        </div>

        {/* Course Global Progress Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Progreso del Programa
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: "var(--emerald-400)",
              }}
            >
              {course.progressPercent}% Completado
            </div>
          </div>
          <div style={{ width: "100px" }}>
            <div className="progress-bar-container" style={{ height: "6px" }}>
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            minWidth: 0,
          }}
        >
          {/* Pantalla de Video */}
          <div className="video-screen-wrapper">
            {isVideoLoading ? (
              <div
                style={{
                  minHeight: "360px",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--text-muted)",
                }}
              >
                Preparando video seguro…
              </div>
            ) : videoSource ? (
              <video
                key={videoSource}
                src={videoSource}
                controls
                autoPlay
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                playbackRate={playbackSpeed}
              />
            ) : (
              <div
                style={{
                  minHeight: "360px",
                  display: "grid",
                  placeItems: "center",
                  padding: "32px",
                  textAlign: "center",
                  color: videoError ? "#B91C1C" : "var(--text-muted)",
                }}
              >
                {videoError ||
                  "Esta lección todavía no tiene un video publicado."}
              </div>
            )}

            {/* Banner de Celebración si se marca completada */}
            {showCelebration && (
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "var(--brand-celeste)",
                  color: "#000000",
                  padding: "10px 18px",
                  borderRadius: "var(--radius-full)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 800,
                  fontSize: "13px",
                  boxShadow: "var(--shadow-lg)",
                  animation: "fadeIn 0.3s ease-out",
                }}
              >
                <Sparkles size={16} />
                <span>¡Lección completada! Progreso actualizado</span>
              </div>
            )}
          </div>

          {/* Barra de Controles y Avance de la Lección */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                className={`btn btn-sm ${currentLesson?.completed ? "btn-secondary" : "btn-primary"}`}
                onClick={handleMarkCompletedAndNext}
                style={{ padding: "8px 16px" }}
              >
                <CheckCircle2 size={16} />
                <span>
                  {currentLesson?.completed
                    ? "Completada (Ir a Siguiente)"
                    : "Marcar como Completada"}
                </span>
              </button>

              {/* Selector de Velocidad */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "var(--bg-deep)",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    fontWeight: 600,
                  }}
                >
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
                      border: "none",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Botones de Navegación Anterior / Siguiente */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "var(--text-main)",
                marginBottom: "6px",
              }}
            >
              {currentLesson?.title}
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                fontSize: "13px",
                color: "var(--text-muted)",
                marginBottom: "20px",
              }}
            >
              <span>
                <Clock
                  size={14}
                  style={{
                    display: "inline",
                    verticalAlign: "middle",
                    marginRight: "4px",
                  }}
                />{" "}
                {currentLesson?.duration}
              </span>
              <span>•</span>
              <span>
                Instructor:{" "}
                <strong style={{ color: "var(--text-main)" }}>
                  {course.mentorName}
                </strong>
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div>
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--text-main)",
                      marginBottom: "6px",
                    }}
                  >
                    Objetivo de la lección
                  </h4>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "14px",
                      lineHeight: "1.6",
                    }}
                  >
                    {currentLesson?.summary}
                  </p>
                </div>

                {currentLesson?.content ? (
                  <div
                    style={{
                      padding: "20px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-main)",
                      fontSize: "14px",
                      lineHeight: 1.8,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {currentLesson.content}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "24px",
                      textAlign: "center",
                      color: "var(--text-dim)",
                      fontSize: "13px",
                      border: "1px dashed var(--border-medium)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    Esta lección todavía no tiene contenido de lectura
                    publicado.
                  </div>
                )}
              </div>
            )}

            {/* Contenido de Pestaña: Recursos */}
            {activeTab === "resources" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {resourceError && (
                  <div
                    role="alert"
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "#FEF2F2",
                      border: "1px solid #FECACA",
                      color: "#B91C1C",
                      fontSize: "12px",
                    }}
                  >
                    {resourceError}
                  </div>
                )}
                {currentLesson?.resources &&
                currentLesson.resources.length > 0 ? (
                  currentLesson.resources.map((resource) => (
                    <div
                      key={resource.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 18px",
                        background: "var(--bg-deep)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "var(--radius-sm)",
                            background: "rgba(6, 171, 235, 0.12)",
                            color: "var(--brand-celeste)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ResourceIcon type={resource.resourceType} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "7px",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "var(--text-main)",
                              }}
                            >
                              {resource.title}
                            </span>
                            <span
                              className="badge badge-emerald"
                              style={{ fontSize: "9px", padding: "2px 6px" }}
                            >
                              {resource.kind === "complementary"
                                ? "Complementario"
                                : "Descargable"}
                            </span>
                          </div>
                          {resource.description && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "var(--text-muted)",
                                marginTop: "3px",
                                lineHeight: 1.4,
                              }}
                            >
                              {resource.description}
                            </div>
                          )}
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--text-dim)",
                              marginTop: "3px",
                            }}
                          >
                            {resource.sourceType === "external"
                              ? "Enlace externo"
                              : formatFileSize(resource.sizeBytes) ||
                                "Archivo del curso"}
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={openingResourceId === resource.id}
                        onClick={() => handleOpenResource(resource)}
                        style={{ flexShrink: 0 }}
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
                  <div
                    style={{
                      padding: "24px",
                      textAlign: "center",
                      color: "var(--text-dim)",
                      fontSize: "13px",
                    }}
                  >
                    Esta lección no tiene recursos o materiales complementarios
                    publicados.
                  </div>
                )}
              </div>
            )}

            {/* Contenido de Pestaña: Notas privadas persistidas */}
            {activeTab === "notes" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{ fontSize: "12px", color: "var(--text-muted)" }}
                  >
                    Tus notas se guardan de forma privada en tu cuenta para esta
                    lección.
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--emerald-400)",
                      fontWeight: 600,
                    }}
                  >
                    {noteState.saved ? (
                      <>
                        <Check
                          size={12}
                          style={{ display: "inline", marginRight: "4px" }}
                        />{" "}
                        Guardado en Supabase
                      </>
                    ) : (
                      "Guardado manual"
                    )}
                  </span>
                </div>
                {noteState.error && (
                  <div
                    role="alert"
                    style={{ marginBottom: 10, color: "#B91C1C", fontSize: 12 }}
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
                  style={{
                    width: "100%",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border-medium)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px",
                    color: "var(--text-main)",
                    fontFamily: "inherit",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  disabled={noteState.saving}
                  onClick={handleSaveNote}
                  style={{ marginTop: 10 }}
                >
                  <Save size={14} />
                  <span>
                    {noteState.saving ? "Guardando..." : "Guardar nota"}
                  </span>
                </button>
              </div>
            )}

            {activeTab === "questions" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <form
                  onSubmit={handleCreateQuestion}
                  style={{
                    padding: 16,
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-deep)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <MessageSquare
                      size={16}
                      style={{ color: "var(--brand-celeste)" }}
                    />
                    <strong style={{ fontSize: 14, color: "var(--text-main)" }}>
                      Consultar al mentor
                    </strong>
                  </div>
                  <textarea
                    value={questionText}
                    onChange={(event) => setQuestionText(event.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Escribe una pregunta relacionada con esta lección..."
                    style={{
                      width: "100%",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-medium)",
                      borderRadius: "var(--radius-sm)",
                      padding: 12,
                      color: "var(--text-main)",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                  {questionState.error && (
                    <div
                      role="alert"
                      style={{ marginTop: 8, color: "#B91C1C", fontSize: 12 }}
                    >
                      {questionState.error}
                    </div>
                  )}
                  {questionState.success && (
                    <div
                      role="status"
                      style={{
                        marginTop: 8,
                        color: "var(--emerald-400)",
                        fontSize: 12,
                      }}
                    >
                      {questionState.success}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={
                      questionState.saving || questionText.trim().length < 3
                    }
                    style={{ marginTop: 10 }}
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
                      style={{
                        padding: 14,
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                        background: "var(--bg-surface-elevated)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            color: "var(--text-main)",
                            lineHeight: 1.5,
                          }}
                        >
                          {question.question}
                        </div>
                        <span
                          className={
                            question.status === "answered"
                              ? "badge badge-emerald"
                              : "badge badge-amber"
                          }
                          style={{ fontSize: 10, whiteSpace: "nowrap" }}
                        >
                          {question.status === "answered"
                            ? "Respondida"
                            : "Pendiente"}
                        </span>
                      </div>
                      {question.mentorReply && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: 12,
                            borderRadius: "var(--radius-sm)",
                            background: "var(--brand-celeste-subtle)",
                            color: "var(--text-main)",
                            fontSize: 12,
                            lineHeight: 1.5,
                          }}
                        >
                          <strong style={{ color: "var(--brand-celeste)" }}>
                            Respuesta del mentor:{" "}
                          </strong>
                          {question.mentorReply}
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <div
                    style={{
                      padding: 20,
                      textAlign: "center",
                      color: "var(--text-muted)",
                      border: "1px dashed var(--border-medium)",
                      borderRadius: "var(--radius-md)",
                      fontSize: 13,
                    }}
                  >
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
          <div
            style={{
              padding: "18px 20px",
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--bg-surface-elevated)",
            }}
          >
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text-main)",
                marginBottom: "4px",
              }}
            >
              Contenido del Programa
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
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
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "var(--text-main)",
                        }}
                      >
                        {mod.title}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-dim)",
                          marginTop: "2px",
                        }}
                      >
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

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                className="lesson-title"
                                style={{
                                  fontSize: "12px",
                                  color: isCurrent
                                    ? "var(--brand-celeste)"
                                    : "var(--text-muted)",
                                  lineHeight: "1.4",
                                }}
                              >
                                {lesson.title}
                              </div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "var(--text-dim)",
                                  marginTop: "2px",
                                }}
                              >
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
