import { api } from "../services/api";
import { zoomLink } from "../services/studentContent";
import { Dialog } from "../components/ui";
import { StudentCoursePicker } from "../components/StudentCoursePicker";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Eye,
  EyeOff,
  Edit,
  Search,
  UserPlus,
  ChevronRight,
  Activity,
  Trash2,
} from "lucide-react";

export function AdminView({
  courses,
  liveClasses,
  onAddCourse,
  onEditCurriculum,
  onAddLiveClass,
  onUpdateLiveClass,
  onDeleteLiveClass,
  recordingPanel,
  mentors,
  users = [],
  dashboard = { stats: {}, recentActivity: [] },
  currentUserId,
  onUpdateUserRole,
  onAssignMentor,
  onAssignUserToCourse,
  onCreateUser,
  onEditUser,
  onDeleteUser,
  currentView = "admin-overview",
  onNavigate,
}) {
  const stats = dashboard?.stats || {};
  const [editingLiveId, setEditingLiveId] = useState(null);
  const [liveNotice, setLiveNotice] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deletingSession, setDeletingSession] = useState(false);
  const [deleteSessionError, setDeleteSessionError] = useState("");
  const [expandedSession, setExpandedSession] = useState(null);
  const recentActivity = dashboard?.recentActivity || [];
  const defaultSchedule = () => {
    const date = new Date(Date.now() + 60 * 60 * 1000);
    date.setMinutes(0, 0, 0);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };
  // Sync tab with sidebar currentView
  const getInitialTab = () => {
    if (currentView === "admin-courses") return "courses";
    if (currentView === "admin-live") return "live";
    if (currentView === "admin-users") return "users";
    return "overview";
  };

  const activeTab = getInitialTab();
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showScheduleLiveModal, setShowScheduleLiveModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
  const [editUserForm, setEditUserForm] = useState({});
  const [editUserError, setEditUserError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [userActionError, setUserActionError] = useState("");
  const [userActionSuccess, setUserActionSuccess] = useState("");
  const [assignmentSelections, setAssignmentSelections] = useState({});
  const [savingUserId, setSavingUserId] = useState(null);
  const [academicSaving, setAcademicSaving] = useState(false);
  const [academicError, setAcademicError] = useState("");

  const handleTabChange = (tab) => {
    if (onNavigate) {
      if (tab === "courses") onNavigate("admin-courses");
      else if (tab === "live") onNavigate("admin-live");
      else if (tab === "users") onNavigate("admin-users");
      else onNavigate("admin-overview");
    }
  };

  // Form states for new Course
  const [courseForm, setCourseForm] = useState({
    title: "",
    tagline: "",
    category: "Ventas Estratégicas",
    level: "Avanzado",
    docenteId: "",
    mentorName: "",
  });

  // Form states for new Live Class
  const [liveForm, setLiveForm] = useState(() => ({
    courseId: "",
    title: "",
    subtitle: "",
    docenteId: "",
    mentorName: "",
    scheduledAt: defaultSchedule(),
    durationMinutes: 75,
    joinUrl: "",
    meetingId: "",
    meetingPasscode: "",
    category: "Ventas & Crecimiento",
  }));

  const students = users.map((item) => ({
    id: item.id,
    name: item.fullName,
    company: item.company || "Sin empresa registrada",
    email: item.email,
    role: item.role,
    mentorId: item.mentorId || "",
    phone: item.phone || "",
    location: item.location || "",
    status: "Activo",
    joined: item.createdAt
      ? new Date(item.createdAt).toLocaleDateString("es-EC")
      : "Fecha no disponible",
  }));
  const availableMentors = users.filter(account => account.role === "mentor")
    .sort((left, right) => (left.fullName || left.email).localeCompare(right.fullName || right.email, "es"));

  // Student filter & search state
  const [studentSearch, setStudentSearch] = useState("");
  const [studentPlanFilter, setStudentPlanFilter] = useState("all");

  // New student form
  const [newStudentForm, setNewStudentForm] = useState({
    name: "",
    company: "",
    email: "",
    role: "estudiante",
    password: "",
  });

  const handleCreateCourseSubmit = async (event) => {
    event.preventDefault();
    if (academicSaving) return;
    setAcademicSaving(true);
    setAcademicError("");
    try {
      await onAddCourse({
        title: courseForm.title.trim(),
        tagline: courseForm.tagline,
        category: courseForm.category,
        level: courseForm.level,
        contentType: courseForm.contentType || "course",
        docenteId: courseForm.docenteId || undefined,
      });
      setShowCreateCourseModal(false);
      setCourseForm((current) => ({ ...current, title: "", tagline: "" }));
    } catch (error) {
      setAcademicError(error.message);
    } finally {
      setAcademicSaving(false);
    }
  };
  const handleScheduleLiveSubmit = async (event) => {
    event.preventDefault();
    if (academicSaving) return;
    setAcademicSaving(true);
    setAcademicError("");
    try {
      const input = {
        ...liveForm,
        title: liveForm.title.trim(),
        scheduledAt: new Date(liveForm.scheduledAt).toISOString(),
        durationMinutes: Number(liveForm.durationMinutes),
      };
      if (editingLiveId) await onUpdateLiveClass(editingLiveId, input);
      else await onAddLiveClass(input);
      setLiveNotice(editingLiveId ? "Cambios guardados. La agenda ya está actualizada." : "Clase programada correctamente.");
      setShowScheduleLiveModal(false);
    } catch (error) {
      setAcademicError(error.message);
    } finally {
      setAcademicSaving(false);
    }
  };

  const handleUpdateStudentPlan = async (studentId, newRole) => {
    setUserActionError("");
    setUserActionSuccess("");
    setSavingUserId(studentId);
    try {
      await onUpdateUserRole(studentId, newRole);
      setUserActionSuccess("Rol actualizado y guardado correctamente.");
    } catch (error) {
      setUserActionError(error.message || "No se pudo actualizar el rol.");
    } finally {
      setSavingUserId(null);
    }
  };

  const [enrollmentRevision, setEnrollmentRevision] = useState(0);
  const [enrollmentData, setEnrollmentData] = useState({ items: [], loading: true, error: '' });
  useEffect(() => {
    if (currentView !== 'admin-users') return;
    const controller = new AbortController();
    async function load() {
      setEnrollmentData(previous => ({ ...previous, loading: true, error: '' }));
      try {
        const items = [];
        let page = 0;
        while (!controller.signal.aborted) {
          const result = await api.administration.access({ page }, { signal: controller.signal });
          items.push(...result.items);
          if (items.length >= result.total || !result.items.length) break;
          page++;
        }
        if (!controller.signal.aborted) setEnrollmentData({ items, loading: false, error: '' });
      } catch (error) {
        if (!controller.signal.aborted) setEnrollmentData({ items: [], loading: false, error: error.message });
      }
    }
    load();
    return () => controller.abort();
  }, [currentView, enrollmentRevision]);

  const handleAssignCourse = async (account) => {
    if (savingUserId !== null) return;
    const selection = assignmentSelections[account.id];
    const courseIds = Array.isArray(selection) ? selection : selection ? [selection] : [];
    if (!courseIds.length) return;
    setUserActionError("");
    setUserActionSuccess("");
    setSavingUserId(account.id);
    try {
      const failed = [];
      let saved = 0;
      for (const courseId of courseIds) {
        try {
          const enrollment = await onAssignUserToCourse(account.id, account.role, courseId);
          if (account.role === "estudiante") setEnrollmentData(previous => ({
            ...previous,
            items: [...previous.items.filter(row => !(row.student_id === account.id && row.course_id === courseId)),
            { student_id: account.id, course_id: courseId, status: 'active', access_type: 'full', expires_at: null, ...enrollment }],
          }));
          saved++;
        } catch (error) {
          failed.push({ id: courseId, message: error.message || "No se pudo guardar la matrícula." });
        }
      }
      setAssignmentSelections(current => ({
        ...current,
        [account.id]: account.role === "estudiante" ? failed.map(item => item.id) : failed[0]?.id || "",
      }));
      if (failed.length) setUserActionError(
        `No se guardaron ${failed.length} asignaciones: ` + failed.map(item => `${courses.find(course => course.id === item.id)?.title || item.id}: ${item.message}`).join('; '),
      );
      if (saved) {
        setUserActionSuccess(
          account.role === "mentor" || account.role === "docente"
            ? "Mentor asignado al curso."
            : `Estudiante matriculado en ${saved} ${saved === 1 ? "curso" : "cursos"}.`,
        );
      }
    } catch (error) {
      setUserActionError(error.message || "No se pudo guardar la asignación.");
    } finally {
      setSavingUserId(null);
    }
  };

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    if (!newStudentForm.name.trim() || !newStudentForm.email.trim()) return;
    setUserActionError("");
    setSavingUserId("new");
    try {
      await onCreateUser({
        fullName: newStudentForm.name,
        company: newStudentForm.company,
        email: newStudentForm.email,
        role: newStudentForm.role,
        password: newStudentForm.password,
      });
      setNewStudentForm({
        name: "",
        company: "",
        email: "",
        role: "estudiante",
        password: "",
      });
      setShowAddStudentModal(false);
      setUserActionSuccess("Usuario creado y guardado correctamente.");
    } catch (error) {
      setUserActionError(error.message || "No se pudo crear el usuario.");
    } finally {
      setSavingUserId(null);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.company.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesPlan =
      studentPlanFilter === "all" || s.role === studentPlanFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Header del CMS */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="border-l-[3px] border-brand py-1 pl-4 sm:pl-5">
          <div className="flex items-center gap-2 [margin-bottom:6px]">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
              <span>Panel administrativo</span>
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">
            {activeTab === "live" ? "Agenda de Clases en Vivo & Videoteca" : "Gestión Integral"}
          </h1>
          <p className="mt-2 max-w-xl text-xs leading-6 text-subtle">
            {activeTab === "live" ? "Cada clase guarda su fecha y acceso a Zoom. Las grabaciones se publican por separado y pueden asociarse a esta clase." : "Administra tus programas, organiza las clases y acompaña el avance de la comunidad."}
          </p>
        </div>
      </div>

      {/* Métricas Globales del Negocio */}
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4 [&_.stat-card]:!rounded-none [&_.stat-card]:!border-0 [&_.stat-card]:!border-l-2 [&_.stat-card]:!border-l-brand/20 [&_.stat-card]:!bg-transparent [&_.stat-card]:!shadow-none [&_.stat-card]:!px-3 [&_.stat-card]:!py-2 [&_.stat-value]:!text-brand [&_.stat-card>div]:flex [&_.stat-card>div]:w-full [&_.stat-card>div]:items-center [&_.stat-card>div]:gap-3 [&_.stat-value]:shrink-0 [&_.stat-value]:!text-xl [&_.stat-value]:!leading-none [&_.stat-value]:!tracking-tight [&_.stat-label]:!mt-0 [&_.stat-label]:!text-[10px] [&_.stat-label]:!leading-4">
        <div className="stat-card">
          <div>
            <div className="stat-value">{stats.activeStudents || 0}</div>
            <div className="stat-label">Alumnos Activos</div>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{stats.totalMentors || 0}</div>
            <div className="stat-label">Mentores Registrados</div>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">
              {(stats.scheduledLiveSessions || 0) +
                (stats.activeLiveSessions || 0)}
            </div>
            <div className="stat-label">Sesiones Próximas / En Vivo</div>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">
              {stats.averageCompletionRate || 0}%
            </div>
            <div className="stat-label">Progreso Académico Promedio</div>
          </div>
        </div>
      </div>

      {/* Pestañas de Gestión (sincronizadas 100% con la barra lateral) */}
      {activeTab !== "live" && (
      <div className="tabs-nav !gap-1 !rounded-xl !border !border-line !bg-elevated/40 !p-1.5 [&_.tab-btn]:!rounded-lg [&_.tab-btn]:!border-0 [&_.tab-btn]:!px-3 [&_.tab-btn]:!py-2 [&_.tab-btn]:!text-[11px] [&_.tab-btn.active]:!bg-surface [&_.tab-btn.active]:!text-brand [&_.tab-btn.active]:shadow-sm">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => handleTabChange("overview")}
        >
          Panel General
        </button>
        <button
          className={`tab-btn ${activeTab === "courses" ? "active" : ""}`}
          onClick={() => handleTabChange("courses")}
        >
          Gestor de Cursos ({courses.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "live" ? "active" : ""}`}
          onClick={() => handleTabChange("live")}
        >
          Agendar Vivos & Replays ({liveClasses.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => handleTabChange("users")}
        >
          Usuarios & Permisos ({students.length})
        </button>
      </div>
      )}

      {/* ============================================================== */}
      {/* VISTA 1: PANEL GENERAL (OVERVIEW)                               */}
      {/* ============================================================== */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">
          {/* Accesos Rápidos para Administrador */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 [&_.card]:!rounded-2xl [&_.card]:!p-4 [&_.card_h4]:!text-sm [&_.card_p]:!text-[11px] [&_.card_p]:!leading-5 [&_.badge]:!text-[9px]">
            <div
              className="card card-interactive cursor-pointer [background:var(--bg-surface)]"
              onClick={() => handleTabChange("courses")}
            >
              <div className="flex justify-between items-center [margin-bottom:10px]">
                <span className="badge badge-emerald">Cursos</span>
                <ChevronRight size={16} />
              </div>
              <h4 className="text-[16px] font-bold text-ink">
                Publicar o Modificar Cursos
              </h4>
              <p className="text-[13px] text-muted mt-1">
                {stats.totalCourses ?? courses.length} programas registrados en
                la plataforma.
              </p>
            </div>

            <div
              className="card card-interactive cursor-pointer [background:var(--bg-surface)]"
              onClick={() => handleTabChange("live")}
            >
              <div className="flex justify-between items-center [margin-bottom:10px]">
                <span className="badge badge-amber">Clases en Vivo</span>
                <ChevronRight size={16} />
              </div>
              <h4 className="text-[16px] font-bold text-ink">
                Agendar Nueva Clase en Vivo
              </h4>
              <p className="text-[13px] text-muted mt-1">
                {(stats.scheduledLiveSessions || 0) +
                  (stats.activeLiveSessions || 0)}{" "}
                sesiones próximas o activas.
              </p>
            </div>

            <div
              className="card card-interactive cursor-pointer [background:var(--bg-surface)]"
              onClick={() => handleTabChange("users")}
            >
              <div className="flex justify-between items-center [margin-bottom:10px]">
                <span className="badge badge-purple">Accesos</span>
                <ChevronRight size={16} />
              </div>
              <h4 className="text-[16px] font-bold text-ink">
                Gestionar usuarios y accesos
              </h4>
              <p className="text-[13px] text-muted mt-1">
                {stats.totalUsers ?? students.length} cuentas registradas en la
                plataforma.
              </p>
            </div>
          </div>

          {/* Actividad Reciente de la Escuela */}
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-panel sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
              <div className="flex items-center gap-2">
              <Activity size={15} className="text-brand" />
              <h3 className="text-sm font-bold tracking-tight text-ink">
                Actividad reciente
              </h3>
              </div>
              <span className="rounded-full bg-elevated px-2.5 py-1 text-[10px] font-semibold text-subtle">{recentActivity.length} registros</span>
            </div>

            <div className="flex flex-col gap-3">
              {recentActivity.length ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-elevated/40 px-3 py-3 transition-colors hover:border-brand/25"
                  >
                    <div>
                      <div className="text-xs font-semibold leading-5 text-ink">
                        {activity.studentName} completó “{activity.lessonTitle}”
                      </div>
                      <div className="mt-1 text-[10px] leading-5 text-subtle">
                        {activity.courseTitle} •{" "}
                        {new Date(activity.occurredAt).toLocaleString("es-EC", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                    <span className="rounded-full border border-brand-line bg-brand-soft px-2 py-1 text-[9px] font-semibold text-brand">
                      Progreso
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-elevated/40 px-4 py-5 text-center">
                  <p className="text-xs font-semibold text-muted">La actividad de tu comunidad aparecerá aquí</p>
                  <p className="mx-auto mt-1 max-w-md text-[11px] leading-5 text-subtle">Cuando un estudiante complete una lección, podrás ver su avance en este espacio.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VISTA 2: GESTOR DE CURSOS & MÓDULOS                             */}
      {/* ============================================================== */}
      {activeTab === "courses" && (
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Programas y Módulos Curriculares
              </h3>
              <p className="mt-1 max-w-xl text-xs leading-5 text-subtle">
                Crea y gestiona la estructura de cursos, módulos y lecciones de
                video.
              </p>
            </div>
            <button
              className="btn btn-primary !min-h-9 !rounded-xl !px-4 !py-2 !text-xs"
              onClick={() => setShowCreateCourseModal(true)}
            >
              <Plus size={16} />
              <span>Crear nuevo curso</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between [padding:16px_20px] [background:var(--bg-surface)] [border:1px_solid_var(--border-subtle)] [border-radius:var(--radius-md)] flex-wrap gap-4"
              >
                <div className="flex items-center [gap:14px]">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="[width:60px] [height:45px] [border-radius:var(--radius-sm)] object-cover"
                  />
                  <div>
                    <h4 className="text-[15px] font-bold text-ink">
                      {course.title}
                    </h4>
                    <div className="text-[12px] text-muted">
                      Mentor:{" "}
                      <strong className="text-ink">{course.mentorName}</strong>{" "}
                      • {course.category} • {course.estimatedHours}
                    </div>
                  </div>
                </div>

                <div className="flex items-center [gap:10px]">
                  <span className="badge badge-emerald">Registrado</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onEditCurriculum(course)}
                    title="Crear y editar modulos, lecciones y recursos"
                  >
                    <Edit size={14} />
                    <span>Abrir editor curricular</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VISTA 3: GESTIÓN DE CLASES EN VIVO & REPLAYS                    */}
      {/* ============================================================== */}
      {activeTab === "live" && recordingPanel}
      {activeTab === "live" && (
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <h2 className="text-lg font-bold tracking-tight text-ink">Clases en vivo</h2>
            <button
              className="btn btn-primary btn-sm [gap:6px]"
              onClick={() => { setEditingLiveId(null); setAcademicError(""); setLiveForm({ courseId: "", title: "", scheduledAt: defaultSchedule(), durationMinutes: 60, joinUrl: "", meetingId: "", meetingPasscode: "" }); setShowScheduleLiveModal(true); }}
            >
              <Plus size={16} />
              <span>Agendar Nueva Sesión en Vivo</span>
            </button>
          </div>

          {liveNotice && <p role="status" className="w-fit rounded-xl border border-success-line bg-success-soft px-3 py-2 text-xs text-success">{liveNotice}</p>}
          <div className="flex flex-col [gap:14px]">
            {liveClasses.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between [padding:16px_20px] [background:var(--bg-surface)] [border:1px_solid_var(--border-subtle)] [border-radius:var(--radius-md)] flex-wrap gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-live text-[11px]">
                      {item.badge}
                    </span>
                    <span className="text-[12px] text-muted">
                      {item.date} • {item.time}
                    </span>
                  </div>
                  <h4 className="text-[15px] font-bold text-ink">
                    {item.title}
                  </h4>
                  <div className="text-[12px] text-subtle">
                    {courses.find(course => course.id === item.courseId)?.title} · Mentor: {item.mentorName}
                  </div>
                  <p className={`mt-2 text-[11px] font-semibold ${item.joinUrl ? "text-success" : "text-subtle"}`}>{item.joinUrl ? "Enlace de Zoom guardado" : "Sin enlace de Zoom"}</p>
                  {(item.effectiveStatus === "ended" || item.status === "ended") && <p className="mt-1 max-w-lg text-[11px] text-subtle">La fecha de esta clase ya pasó. Guardar un enlace no cambia su horario ni crea una grabación.</p>}
                  {expandedSession === item.id && <div className="mt-3 max-w-xl space-y-2 rounded-xl border border-line bg-elevated/50 p-3 text-xs">
                    {zoomLink(item.joinUrl) ? <a href={zoomLink(item.joinUrl)} target="_blank" rel="noopener noreferrer" className="block break-all font-medium text-brand underline">{item.joinUrl}</a> : <p>No hay un enlace de Zoom válido guardado.</p>}
                    {item.meetingId && <p>ID de reunión: <span className="select-text font-mono">{item.meetingId}</span></p>}
                    {item.meetingPasscode && <p>Código de acceso: <span className="select-text font-mono">{item.meetingPasscode}</span></p>}
                  </div>}
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 border-t border-line pt-3 sm:w-auto sm:border-0 sm:pt-0">
                  <button type="button" title={expandedSession === item.id ? "Ocultar acceso a Zoom" : "Ver acceso a Zoom"} aria-label={expandedSession === item.id ? "Ocultar acceso a Zoom" : "Ver acceso a Zoom"} className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${expandedSession === item.id ? "border-brand bg-brand text-white" : "border-brand-line bg-brand-soft text-brand hover:border-brand hover:bg-brand hover:text-white"}`} aria-expanded={expandedSession === item.id} onClick={() => setExpandedSession(expandedSession === item.id ? null : item.id)}>{expandedSession === item.id ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}</button>
                  {onUpdateLiveClass && item.status !== "ended" && <button type="button" title="Editar clase" aria-label={`Editar clase ${item.title}`} className="inline-flex min-h-9 items-center justify-center rounded-xl border border-line bg-brand-soft !size-9 !p-0 text-[11px] font-medium text-brand transition-colors hover:border-brand-line hover:bg-elevated hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" onClick={() => {
                    const date = new Date(item.scheduledAt);
                    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                    setEditingLiveId(item.id); setAcademicError("");
                    setLiveForm({ courseId: item.courseId, title: item.title, scheduledAt: local, durationMinutes: item.durationMinutes || 60, joinUrl: item.joinUrl || "", meetingId: item.meetingId || "", meetingPasscode: item.meetingPasscode || "" });
                    setShowScheduleLiveModal(true);
                  }}><Edit size={16} /></button>}
                  {onDeleteLiveClass && <button type="button" title="Eliminar clase" aria-label={`Eliminar clase ${item.title}`} className="inline-flex size-9 items-center justify-center rounded-xl border border-danger-line bg-danger-soft text-danger transition hover:bg-danger hover:text-white" onClick={() => { setDeleteSessionError(""); setSessionToDelete(item); }}><Trash2 size={16} /></button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VISTA 4: ESTUDIANTES & GESTIÓN DE ACCESOS POR MEMBRESÍA         */}
      {/* ============================================================== */}
      {activeTab === "users" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-[18px] font-extrabold">
                Usuarios, roles y acceso a cursos
              </h3>
              <p className="text-[13px] text-muted">
                Administra estudiantes, mentores y administradores. Los cambios
                se guardan directamente en la base de datos.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-secondary !min-h-9 !rounded-xl !px-3 !py-2 !text-xs" disabled={savingUserId !== null} onClick={() => {
              setNewStudentForm({ name: "", company: "", email: "", role: "mentor", password: "" });
              setShowAddStudentModal(true);
            }}>Registrar mentor</button>
            <button
              className="btn btn-primary btn-sm [gap:6px]"
              onClick={() => setShowAddStudentModal(true)}
            >
              <UserPlus size={16} />
              <span>Registrar / Invitar Usuario</span>
            </button>
            </div>
          </div>

          {/* Filtros y Buscador de Estudiantes */}
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                ["all", "Todos"],
                ["estudiante", "Estudiantes"],
                ["mentor", "Mentores"],
                ["admin", "Administradores"],
                ["soporte", "Soporte"],
              ].map(([plan, label]) => (
                <button
                  key={plan}
                  onClick={() => setStudentPlanFilter(plan)}
                  aria-pressed={studentPlanFilter === plan}
                  className={'rounded-lg border px-3 py-2 text-[11px] font-semibold transition-colors ' + (studentPlanFilter === plan ? 'border-brand bg-brand text-on-brand shadow-sm' : 'border-line bg-surface text-subtle hover:border-brand/30 hover:text-brand')}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-[280px] max-w-full">
              <Search
                size={15}
                className="absolute [left:12px] [top:50%] [transform:translateY(-50%)] text-subtle"
              />
              <input
                type="text"
                placeholder="Buscar por nombre, empresa o email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full [padding:8px_12px_8px_36px] [border-radius:var(--radius-sm)] [background:var(--bg-surface)] [border:1px_solid_var(--border-subtle)] text-ink text-[12px] outline-none"
              />
            </div>
          </div>

          {userActionError && (
            <div
              role="alert"
              className="[padding:12px_14px] rounded-2xl bg-danger-soft border border-danger-line text-danger text-[13px]"
            >
              {userActionError}
            </div>
          )}
          {userActionSuccess && (
            <div
              role="status"
              className="[padding:12px_14px] rounded-2xl bg-success-soft border border-success-line text-success text-[13px]"
            >
              {userActionSuccess}
            </div>
          )}

          {/* Tabla de Estudiantes */}
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-panel [&_th]:!px-3 [&_th]:!py-3 [&_th]:text-[10px] [&_th]:uppercase [&_th]:tracking-wider [&_td]:!px-3 [&_td]:!py-3 [&_select]:!min-h-9 [&_select]:!rounded-xl [&_select]:!px-3 [&_select]:!py-2 [&_select]:!text-[11px] [&_.btn]:!min-h-8 [&_.btn]:!rounded-xl [&_.btn]:!py-1.5 [&_.btn]:!text-[10px]">
            <div
              className="table-scroll"
              role="region"
              aria-label="Tabla de datos"
              tabIndex={0}
            >
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="[border-bottom:1px_solid_var(--border-subtle)] [background:var(--bg-deep)] text-subtle">
                    <th className="[padding:14px_18px] font-bold">Usuario</th>
                    <th className="[padding:14px_18px] font-bold">Datos</th>
                    <th className="[padding:14px_18px] font-bold">
                      Rol y permisos
                    </th>
                    <th className="px-4 py-3 font-bold">Mentor asignado</th>
                    <th className="[padding:14px_18px] font-bold">
                      Asignación a cursos
                    </th>
                    <th className="px-3 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-line transition-colors last:border-b-0 hover:bg-elevated/40"
                    >
                      <td className="px-3 py-3 text-ink">
                        <div className="min-w-48 max-w-72 border-l-2 border-brand/25 pl-3">
                          <p className="break-words text-xs font-semibold leading-5 tracking-tight">{student.name || "Usuario sin nombre"}</p>
                          <p className="mt-1 select-text break-all text-[11px] font-normal leading-4 text-subtle">{student.email}</p>
                          <p className="mt-2 text-[9px] font-normal leading-4 text-subtle/80"><span className="mr-1 text-subtle/60">Registro</span>{student.joined}</p>
                        </div>
                      </td>
                      <td className="[padding:14px_18px]">
                        <div className="text-muted">{student.company}</div>
                        {student.phone && (
                          <div className="text-[11px] text-subtle">
                            {student.phone}
                          </div>
                        )}
                        {student.location && (
                          <div className="text-[11px] text-subtle">
                            {student.location}
                          </div>
                        )}
                      </td>
                      <td className="[padding:14px_18px]">
                        <select
                          value={student.role}
                          onChange={(e) =>
                            handleUpdateStudentPlan(student.id, e.target.value)
                          }
                          disabled={
                            student.id === currentUserId ||
                            savingUserId === student.id
                          }
                          className="[background:var(--bg-deep)] [border:1px_solid_var(--border-subtle)] [border-radius:var(--radius-sm)] text-ink [padding:6px_12px] text-[12px] cursor-pointer"
                        >
                          <option value="estudiante">Estudiante</option>
                          <option value="mentor">Mentor</option>
                          <option value="admin">Administrador</option>
                          <option value="soporte">Soporte</option>
                        </select>
                        {student.id === currentUserId && (
                          <div className="[margin-top:5px] text-[11px] text-subtle">
                            Tu cuenta administrativa
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {student.role === "estudiante" ? <div className="min-w-44 space-y-1.5"><select
                          aria-label={`Mentor de ${student.name}`}
                          className="min-w-40 rounded-lg border border-line bg-elevated px-3 py-2 text-xs text-ink"
                          value={student.mentorId}
                          disabled={savingUserId !== null}
                          onChange={async event => {
                            const mentorId = event.target.value;
                            if (!mentorId) return;
                            setSavingUserId(student.id); setUserActionError(""); setUserActionSuccess("");
                            try {
                              await onAssignMentor(student.id, mentorId);
                              const mentor = availableMentors.find(account => account.id === mentorId);
                              setUserActionSuccess(`${mentor?.fullName || mentor?.email || "Mentor"} asignado a ${student.name}.`);
                            } catch (failure) { setUserActionError(failure.message); }
                            finally { setSavingUserId(null); }
                          }}>
                          <option value="" disabled>Selecciona un mentor</option>
                          {availableMentors.map(mentor => <option key={mentor.id} value={mentor.id}>{mentor.fullName || "Sin nombre registrado"} · Mentor</option>)}
                        </select>
                          <p className="text-[10px] font-normal leading-4 text-subtle">{availableMentors.length} {availableMentors.length === 1 ? "mentor disponible" : "mentores disponibles"}. Selecciona otro para cambiar la asignación.</p>
                          {availableMentors.find(mentor => mentor.id === student.mentorId)?.email && <details key={student.mentorId} className="text-[10px] text-subtle">
                            <summary className="w-fit cursor-pointer font-semibold text-brand">Ver correo del mentor</summary>
                            <p className="mt-1.5 select-text break-all rounded-lg border border-line bg-elevated/40 px-2 py-1.5">{availableMentors.find(mentor => mentor.id === student.mentorId).email}</p>
                          </details>}
                        </div> : <span className="text-xs text-subtle">No aplica</span>}
                      </td>
                      <td className="[padding:14px_18px]">
                        {["admin", "soporte"].includes(student.role) ? (
                          <span className="inline-flex rounded-full border border-line bg-elevated/50 px-2.5 py-1 text-[10px] font-semibold text-subtle">
                            {student.role === "admin"
                              ? "Acceso global"
                              : "Mesa de soporte"}
                          </span>
                        ) : (
                          <div className="flex flex-col gap-2 min-w-0 sm:min-w-[280px]">
                            {student.role === "estudiante" ? <StudentCoursePicker
                              student={student} courses={courses} enrollments={enrollmentData.items}
                              selected={Array.isArray(assignmentSelections[student.id]) ? assignmentSelections[student.id] : []}
                              onChange={ids => setAssignmentSelections(current => ({ ...current, [student.id]: ids }))}
                              loading={enrollmentData.loading} error={enrollmentData.error}
                              onRetry={() => setEnrollmentRevision(value => value + 1)} busy={savingUserId !== null} /> :
                              <select
                                aria-label={`Curso de ${student.name}`}
                                disabled={savingUserId !== null}
                                value={assignmentSelections[student.id] || ""}
                                onChange={(e) =>
                                  setAssignmentSelections((current) => ({
                                    ...current,
                                    [student.id]: e.target.value,
                                  }))
                                }
                                className="[flex:1] [background:var(--bg-deep)] [border:1px_solid_var(--border-subtle)] [border-radius:var(--radius-sm)] text-ink [padding:6px_8px] text-[12px]"
                              >
                                <option value="">Seleccionar curso</option>
                                {courses.map((course) => (
                                  <option key={course.id} value={course.id}>
                                    {course.title}
                                  </option>
                                ))}
                              </select>}
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={
                                (student.role === "estudiante" ? !assignmentSelections[student.id]?.length || enrollmentData.loading || Boolean(enrollmentData.error) : !assignmentSelections[student.id]) ||
                                savingUserId !== null
                              }
                              onClick={() => handleAssignCourse(student)}
                            >
                              {savingUserId === student.id ? "Guardando..." : student.role === "mentor" ||
                                student.role === "docente"
                                ? "Asignar"
                                : `Matricular en ${assignmentSelections[student.id]?.length || 0} ${assignmentSelections[student.id]?.length === 1 ? "curso" : "cursos"}`}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                        <button type="button" aria-label={`Editar usuario: ${student.name}`} title="Editar usuario" disabled={savingUserId !== null}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-brand-line bg-brand-soft/50 text-brand transition-colors hover:bg-brand-soft disabled:opacity-30"
                          onClick={() => {
                            const account = users.find(row => row.id === student.id);
                            setUserToEdit(account); setEditUserError("");
                            setEditUserForm({ fullName: account.fullName || "", company: account.company || "", title: account.title || "", phone: account.phone || "", location: account.location || "" });
                          }}><Edit size={15} /></button>
                        <button type="button" aria-label={`Eliminar usuario: ${student.name}`} title={student.id === currentUserId ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"}
                          disabled={student.id === currentUserId || savingUserId !== null}
                          onClick={() => { setDeleteError(""); setUserToDelete(student); }}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-danger-line bg-danger-soft/50 text-danger transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-30">
                          <Trash2 size={15} />
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Dialog open={Boolean(userToEdit)} onClose={() => { if (savingUserId === null) setUserToEdit(null); }} title="Editar usuario" className="!max-w-lg">
        <p className="mb-4 break-all text-xs text-subtle">{userToEdit?.email}</p>
        <form className="grid gap-3 sm:grid-cols-2 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[11px] [&_label]:font-semibold [&_input]:w-full [&_input]:!rounded-xl [&_input]:!py-2 [&_input]:!text-xs" onSubmit={async event => {
          event.preventDefault();
          if (!userToEdit || savingUserId !== null) return;
          setSavingUserId(userToEdit.id); setEditUserError('');
          try { await onEditUser(userToEdit.id, editUserForm); setUserToEdit(null); setUserActionSuccess('Perfil actualizado correctamente.'); }
          catch (error) { setEditUserError(error.message || 'No se pudo guardar el perfil.'); }
          finally { setSavingUserId(null); }
        }}>
          {[['fullName', 'Nombre completo'], ['company', 'Empresa / Negocio'], ['title', 'Cargo o especialidad'], ['phone', 'Teléfono'], ['location', 'Ubicación']].map(([key, label]) => <label key={key} className={key === 'fullName' ? 'sm:col-span-2' : ''}>{label}<input name={key} type={key === 'phone' ? 'tel' : 'text'} required={key === 'fullName'} minLength={key === 'fullName' ? 2 : undefined} maxLength={key === 'phone' ? 40 : 160} disabled={savingUserId !== null} value={editUserForm[key] || ''} onChange={event => setEditUserForm(previous => ({ ...previous, [key]: event.target.value }))} /></label>)}
          {editUserError && <p role="alert" className="sm:col-span-2 text-xs">{editUserError}</p>}
          <div className="mt-2 flex justify-end gap-2 border-t border-line pt-3 sm:col-span-2">
            <button type="button" className="btn btn-secondary !text-xs" disabled={savingUserId !== null} onClick={() => setUserToEdit(null)}>Cancelar</button>
            <button className="btn btn-primary !text-xs" disabled={savingUserId !== null}>{savingUserId !== null ? 'Guardando...' : 'Guardar cambios'}</button>
          </div>
        </form>
      </Dialog>
      <Dialog open={Boolean(userToDelete)} onClose={() => { if (savingUserId === null) setUserToDelete(null); }} title="Eliminar usuario" className="!max-w-sm">
        <p className="text-sm font-semibold text-ink">{userToDelete?.name}</p>
        <p className="mt-1 break-all text-xs text-subtle">{userToDelete?.email}</p>
        <p className="mt-4 text-xs leading-6 text-muted">Se eliminarán permanentemente la cuenta, sus matrículas, progreso, notas y tickets asociados. Sus cursos permanecerán; si es mentor, quedarán sin esa asignación. Esta acción no se puede deshacer.</p>
        {deleteError && <p role="alert" className="mt-3 text-xs">{deleteError}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary !text-xs" disabled={savingUserId !== null} onClick={() => setUserToDelete(null)}>Cancelar</button>
          <button type="button" className="btn border border-danger-line bg-danger-soft text-danger !text-xs" disabled={savingUserId !== null} onClick={async () => {
            if (!userToDelete || savingUserId !== null) return;
            setSavingUserId(userToDelete.id); setDeleteError("");
            try {
              await onDeleteUser(userToDelete.id);
              setUserActionSuccess("Usuario eliminado correctamente."); setUserActionError("");
              setUserToDelete(null); setEnrollmentRevision(value => value + 1);
            } catch (error) { setDeleteError(error.message || "No se pudo eliminar el usuario."); }
            finally { setSavingUserId(null); }
          }}>{savingUserId !== null ? "Eliminando..." : "Eliminar definitivamente"}</button>
        </div>
      </Dialog>
      {/* Modal Registrar Alumno */}
      <Dialog open={showAddStudentModal} onClose={() => { if (savingUserId !== 'new') setShowAddStudentModal(false); }} title="Registrar nuevo usuario" className="!max-w-lg [&>div:first-child]:!px-5 [&>div:first-child]:!py-3 [&>div:first-child>h2]:!text-sm [&>div:last-child]:!p-4">
        <p className="mb-4 text-xs text-subtle">Crea una cuenta y asigna su rol inicial.</p>
        {userActionError && <p role="alert" className="mb-3 text-xs">{userActionError}</p>}
            <form
              onSubmit={handleAddStudentSubmit}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 [&_label]:!mb-1.5 [&_label]:!text-[10px] [&_label]:!normal-case [&_input]:!rounded-xl [&_input]:!px-3 [&_input]:!py-2 [&_input]:!text-xs [&_select]:!rounded-xl [&_select]:!px-3 [&_select]:!py-2 [&_select]:!text-xs [&_.btn]:!min-h-9 [&_.btn]:!rounded-xl [&_.btn]:!px-3 [&_.btn]:!py-2 [&_.btn]:!text-xs [&>div:nth-of-type(3)]:sm:col-span-2"
            >
              <div>
                <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Daniel Castillo"
                  value={newStudentForm.name}
                  onChange={(e) =>
                    setNewStudentForm({
                      ...newStudentForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] [background:var(--bg-deep)] [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                  Empresa / Negocio
                </label>
                <input
                  type="text"
                  placeholder="Ej: InnoScale B2B"
                  value={newStudentForm.company}
                  onChange={(e) =>
                    setNewStudentForm({
                      ...newStudentForm,
                      company: e.target.value,
                    })
                  }
                  className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] [background:var(--bg-deep)] [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                  Correo Corporativo
                </label>
                <input
                  type="email"
                  autoComplete="off"
                  placeholder="daniel@innoscale.com"
                  value={newStudentForm.email}
                  onChange={(e) =>
                    setNewStudentForm({
                      ...newStudentForm,
                      email: e.target.value,
                    })
                  }
                  className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] [background:var(--bg-deep)] [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                  Rol asignado
                </label>
                <select
                  value={newStudentForm.role}
                  onChange={(e) =>
                    setNewStudentForm({
                      ...newStudentForm,
                      role: e.target.value,
                    })
                  }
                  className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] [background:var(--bg-deep)] [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                  Contraseña temporal
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  placeholder="Mínimo 8 caracteres"
                  value={newStudentForm.password}
                  onChange={(e) =>
                    setNewStudentForm({
                      ...newStudentForm,
                      password: e.target.value,
                    })
                  }
                  className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] [background:var(--bg-deep)] [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-line pt-3 sm:col-span-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddStudentModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingUserId === "new"}
                >
                  {savingUserId === "new" ? "Guardando…" : "Registrar Usuario"}
                </button>
              </div>
            </form>
      </Dialog>

      {/* Modal Crear Curso */}
      {showCreateCourseModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowCreateCourseModal(false)}
        >
          <div
            className="modal-dialog [max-width:600px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="[padding:20px_24px] [border-bottom:1px_solid_var(--border-subtle)]">
              <h3 className="text-[18px] font-extrabold">
                Publicar Nuevo Programa Curricular
              </h3>
            </div>

            <form
              aria-busy={academicSaving}
              onSubmit={handleCreateCourseSubmit}
              className="p-6 flex flex-col gap-4"
            >
              {academicError && (
                <p role="alert" className="text-danger">
                  {academicError}
                </p>
              )}

              <label>
                Tipo de contenido
                <select
                  value={courseForm.contentType || "course"}
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
              <div>
                <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                  Título del Programa
                </label>
                <input
                  type="text"
                  placeholder="Ej: Levantamiento de Capital Serie A para Startups"
                  value={courseForm.title}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, title: e.target.value })
                  }
                  className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] [background:var(--bg-deep)] [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                  Tagline / Promesa de Valor
                </label>
                <input
                  type="text"
                  placeholder="Ej: Prepara tu Data Room, métricas de retención y pitch deck institucional."
                  value={courseForm.tagline}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, tagline: e.target.value })
                  }
                  className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] [background:var(--bg-deep)] [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 [gap:14px]">
                <div>
                  <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                    Categoría
                  </label>
                  <select
                    value={courseForm.category}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, category: e.target.value })
                    }
                    className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] [background:var(--bg-deep)] [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                  >
                    <option value="Ventas Estratégicas">
                      Ventas Estratégicas
                    </option>
                    <option value="Finanzas & Runway">Finanzas & Runway</option>
                    <option value="Growth & Producto">Growth & Producto</option>
                    <option value="Liderazgo & Equipos">
                      Liderazgo & Equipos
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                    Mentor Asignado
                  </label>
                  <select
                    value={courseForm.docenteId || ""}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        docenteId: e.target.value,
                      })
                    }
                    className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] [background:var(--bg-deep)] [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                  >
                    <option value="">Asignar mentor despues</option>
                    {mentors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end [gap:10px] [margin-top:10px]">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowCreateCourseModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={academicSaving}
                >
                  Crear Programa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Dialog open={Boolean(sessionToDelete)} onClose={() => { if (!deletingSession) setSessionToDelete(null); }} title="Eliminar clase" className="!max-w-sm">
        <p className="text-sm font-semibold">{sessionToDelete?.title}</p><p className="mt-2 text-xs leading-6 text-subtle">Se eliminar? la sesi?n de la agenda. Las grabaciones publicadas se conservar?n. Esta acci?n no se puede deshacer.</p>
        {deleteSessionError && <p role="alert" className="mt-3">{deleteSessionError}</p>}
        <div className="mt-5 flex justify-end gap-2"><button disabled={deletingSession} className="btn btn-secondary" onClick={() => setSessionToDelete(null)}>Cancelar</button><button disabled={deletingSession} className="btn !gap-2 !bg-danger !text-white" onClick={async () => {
          if (deletingSession) return;
          setDeletingSession(true); setDeleteSessionError("");
          try { await onDeleteLiveClass(sessionToDelete.id); setSessionToDelete(null); setLiveNotice("Clase eliminada correctamente."); }
          catch (error) { setDeleteSessionError(error.message); }
          finally { setDeletingSession(false); }
        }}><Trash2 size={14} />{deletingSession ? "Eliminando..." : "Eliminar clase"}</button></div>
      </Dialog>
      <Dialog open={showScheduleLiveModal} onClose={() => { if (!academicSaving) setShowScheduleLiveModal(false); }} title={editingLiveId ? "Editar clase" : "Programar clase"} className="!max-w-xl !rounded-2xl [&>div:first-child]:!px-5 [&>div:first-child]:!py-4 [&>div:last-child]:!p-0">
        <form aria-busy={academicSaving} onSubmit={handleScheduleLiveSubmit} className="grid gap-4 p-5 [&_label]:grid [&_label]:min-w-0 [&_label]:gap-1.5 [&_label]:text-[11px] [&_label]:font-semibold [&_label]:text-muted [&_input]:!h-10 [&_input]:w-full [&_input]:min-w-0 [&_input]:!rounded-xl [&_input]:!border-line [&_input]:!bg-surface [&_input]:!px-3 [&_input]:!py-2 [&_input]:!text-xs [&_select]:!h-10 [&_select]:w-full [&_select]:min-w-0 [&_select]:!rounded-xl [&_select]:!border-line [&_select]:!bg-surface [&_select]:!px-3 [&_select]:!py-2 [&_select]:!text-xs">
          <p className="text-xs leading-5 text-subtle">Organiza el horario y los datos de ingreso en un solo lugar.</p>
          {academicError && <p role="alert" className="!text-xs">{academicError}</p>}
          <fieldset disabled={academicSaving} className="grid min-w-0 gap-4 disabled:opacity-60">
            <label>Curso<select required disabled={Boolean(editingLiveId)} value={liveForm.courseId} onChange={e => setLiveForm({ ...liveForm, courseId: e.target.value })}><option value="">Selecciona un curso</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
            {!courses.length && <div className="rounded-xl border border-warning-line bg-warning-soft p-3 text-xs text-warning">Primero necesitas un curso. <button type="button" className="font-semibold underline" onClick={() => { setShowScheduleLiveModal(false); setShowCreateCourseModal(true); }}>Crear curso</button></div>}
            {liveForm.courseId && <p className="-mt-2 text-[11px] text-subtle">Mentor: <span className="font-medium text-muted">{courses.find(course => course.id === liveForm.courseId)?.mentorName || "Por asignar"}</span></p>}
            <label>Tema de la sesión<input required minLength={3} type="text" placeholder="Ej. Taller de redacción" value={liveForm.title} onChange={e => setLiveForm({ ...liveForm, title: e.target.value })} /></label>
            <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
              <label>Fecha y hora local<input required type="datetime-local" value={liveForm.scheduledAt} onChange={e => setLiveForm({ ...liveForm, scheduledAt: e.target.value })} /></label>
              <label>Duración (min)<input required type="number" min="15" max="480" step="15" value={liveForm.durationMinutes} onChange={e => setLiveForm({ ...liveForm, durationMinutes: e.target.value })} /></label>
            </div>
            <fieldset className="grid min-w-0 gap-3 rounded-2xl border border-brand-line bg-brand-soft/40 p-4">
              <legend className="px-2 text-[10px] font-bold uppercase tracking-widest text-brand">Acceso a Zoom</legend>
              <label>Enlace de la reunión <span className="sr-only">(opcional)</span><input type="url" placeholder="https://zoom.us/j/..." value={liveForm.joinUrl || ""} onChange={e => setLiveForm({ ...liveForm, joinUrl: e.target.value })} /></label>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <label>ID de reunión<input inputMode="numeric" maxLength={20} placeholder="123 4567 8901" value={liveForm.meetingId} onChange={e => setLiveForm({ ...liveForm, meetingId: e.target.value })} /></label>
                <label>Código de acceso<input maxLength={32} autoComplete="off" placeholder="Código para invitados" value={liveForm.meetingPasscode} onChange={e => setLiveForm({ ...liveForm, meetingPasscode: e.target.value })} /></label>
              </div>
              <p className="text-[10px] leading-5 text-subtle">Estos datos son opcionales. Permiten a tus estudiantes ingresar a la clase por Zoom.</p>
            </fieldset>
          </fieldset>
          <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4 [&_button]:!min-h-9 [&_button]:!rounded-xl [&_button]:!px-4 [&_button]:!py-2 [&_button]:!text-xs">
            <button type="button" disabled={academicSaving} className="btn btn-secondary !shadow-none" onClick={() => setShowScheduleLiveModal(false)}>Cancelar</button>
            <button type="submit" disabled={academicSaving || !courses.length} className="btn btn-primary">{academicSaving ? "Guardando..." : editingLiveId ? "Guardar cambios" : "Programar clase"}</button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
