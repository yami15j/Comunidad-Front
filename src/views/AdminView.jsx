import "./AdminView.css";
import { api } from "../services/api";
import { zoomLink } from "../services/studentContent";
import { Avatar, Dialog } from "../components/ui";
import { CourseAssignmentsView } from "./CourseAssignmentsView";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Eye,
  Edit,
  Search,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Activity,
  Trash2,
  ImagePlus,
  Upload,
  ArrowLeft,
  CheckCircle2,
  X,
  TriangleAlert,
  GraduationCap,
} from "lucide-react";

function sessionCalendar(item) {
  const date = new Date(item.scheduledAt);
  if (Number.isNaN(date.getTime())) return { day: item.date?.split(" ")[0] || "--", month: item.date?.split(" ")[1] || "Fecha", year: "" };
  return { day: date.toLocaleDateString("es-EC", { day: "2-digit" }), month: date.toLocaleDateString("es-EC", { month: "short" }).replace(".", ""), year: date.getFullYear() };
}

export function AdminView({
  courses,
  liveClasses,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  onUploadCourseCover,
  onEditCurriculum,
  onAddLiveClass,
  onUpdateLiveClass,
  onDeleteLiveClass,
  recordingPanel,
  recordingsLibrary,
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
  const [editingCourse, setEditingCourse] = useState(null);
  const [newCourseImage, setNewCourseImage] = useState(null);
  const [newCoursePreview, setNewCoursePreview] = useState("");
  useEffect(() => { if (!newCourseImage) { setNewCoursePreview(""); return; } const url = URL.createObjectURL(newCourseImage); setNewCoursePreview(url); return () => URL.revokeObjectURL(url); }, [newCourseImage]);
  const [coverCourse, setCoverCourse] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState("");
  useEffect(() => { if (!coverFile) { setCoverPreview(""); return; } const url = URL.createObjectURL(coverFile); setCoverPreview(url); return () => URL.revokeObjectURL(url); }, [coverFile]);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(false);
  const [deleteCourseError, setDeleteCourseError] = useState("");
  const [livePage, setLivePage] = useState(0);
  const [liveSearch, setLiveSearch] = useState("");
  const [liveStatusFilter, setLiveStatusFilter] = useState("");
  const [editingLiveId, setEditingLiveId] = useState(null);
  const [liveNotice, setLiveNotice] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deletingSession, setDeletingSession] = useState(false);
  const [deleteSessionError, setDeleteSessionError] = useState("");
  const [accessSession, setAccessSession] = useState(null);
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
  const [courseSearch, setCourseSearch] = useState("");
  const [courseCategory, setCourseCategory] = useState("");
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
  useEffect(() => {
    if (!userActionSuccess) return;
    const timer = setTimeout(() => setUserActionSuccess(""), 4500);
    return () => clearTimeout(timer);
  }, [userActionSuccess]);
  const [assignmentAccountId, setAssignmentAccountId] = useState(null);
  const [enrollmentRemovals, setEnrollmentRemovals] = useState({});
  const [assignmentSelections, setAssignmentSelections] = useState({});
  const [savingUserId, setSavingUserId] = useState(null);
  const [savingAllUsers, setSavingAllUsers] = useState(false);
  const [userDrafts, setUserDrafts] = useState({});
  const stageUser = (id, patch) => setUserDrafts(current => ({ ...current, [id]: { ...current[id], ...patch } }));
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
    role: userDrafts[item.id]?.role ?? item.role,
    mentorId: userDrafts[item.id]?.mentorId ?? item.mentorId ?? "",
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
      const saveCourse = editingCourse ? input => onEditCourse(editingCourse.id, input) : onAddCourse;
      await saveCourse({
        title: courseForm.title.trim(),
        image: newCourseImage,
        tagline: courseForm.tagline,
        category: courseForm.category,
        level: courseForm.level,
        contentType: courseForm.contentType || "course",
        docenteId: courseForm.docenteId || undefined,
      });
      setShowCreateCourseModal(false);
      setUserActionSuccess(editingCourse ? "Curso actualizado correctamente." : "Curso creado correctamente.");
      setEditingCourse(null);
      setNewCourseImage(null);
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

  const saveUserDraft = async student => {
    if (savingUserId !== null) return;
    const original = users.find(account => account.id === student.id);
    const draft = userDrafts[student.id] || {};
    setSavingUserId(student.id); setUserActionError(""); setUserActionSuccess("");
    try {
      if (draft.role !== undefined && draft.role !== original.role) {
        await onUpdateUserRole(student.id, draft.role);
        setUserDrafts(current => { const next = { ...current, [student.id]: { ...current[student.id] } }; delete next[student.id].role; return next; });
      }
      if (student.role === "estudiante" && draft.mentorId !== undefined && draft.mentorId !== (original.mentorId || "")) {
        await onAssignMentor(student.id, draft.mentorId);
      }
      setUserDrafts(current => { const next = { ...current }; delete next[student.id]; return next; });
      setUserActionSuccess("Cambios guardados correctamente.");
      return true;
    } catch (error) { setUserActionError(error.message || "No se pudieron guardar los cambios. Puedes reintentar."); return false; }
    finally { setSavingUserId(null); }
  };

  const savePendingUsers = async () => {
    if (savingAllUsers || savingUserId !== null) return;
    setSavingAllUsers(true);
    try {
      for (const student of students.filter(account => userDrafts[account.id])) {
        if (!await saveUserDraft(student)) break;
      }
    } finally { setSavingAllUsers(false); }
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
    const removals = account.role === "estudiante" ? enrollmentRemovals[account.id] || [] : [];
    if (!courseIds.length && !removals.length) return false;
    setUserActionError("");
    setUserActionSuccess("");
    setSavingUserId(account.id);
    try {
      const failed = [];
      let saved = 0;
      for (const courseId of courseIds) {
        try {
          const existing = enrollmentData.items.find(item => item.student_id === account.id && item.course_id === courseId);
          const enrollment = account.role === "estudiante" && existing?.status === "suspended"
            ? await api.administration.updateAccess(existing.id, { status: "active", accessType: existing.access_type || "full", expiresAt: existing.expires_at || null })
            : await onAssignUserToCourse(account.id, account.role, courseId);
          if (account.role === "estudiante") setEnrollmentData(previous => ({
            ...previous,
            items: [...previous.items.filter(row => !(row.student_id === account.id && row.course_id === courseId)),
            { ...existing, student_id: account.id, course_id: courseId, status: 'active', access_type: existing?.access_type || 'full', expires_at: existing?.expires_at || null, ...enrollment }],
          }));
          saved++;
        } catch (error) {
          failed.push({ id: courseId, message: error.message || "No se pudo guardar la matrícula." });
        }
      }
      const failedRemovals = [];
      for (const courseId of removals) {
        try {
          const row = enrollmentData.items.find(item => item.student_id === account.id && item.course_id === courseId);
          if (!row?.id) throw new Error("No se pudo identificar la matrícula. Actualiza e intenta nuevamente.");
          const updated = await api.administration.updateAccess(row.id, { status: "suspended", accessType: row.access_type || "full", expiresAt: row.expires_at || null });
          setEnrollmentData(previous => ({ ...previous, items: previous.items.map(item => item.id === row.id ? { ...item, status: "suspended", suspension_count: updated?.suspension_count ?? (item.suspension_count || 0) + 1 } : item) }));
        } catch (error) { failedRemovals.push(courseId); failed.push({ id: courseId, message: error.message }); }
      }
      setEnrollmentRemovals(current => ({ ...current, [account.id]: failedRemovals }));
      setAssignmentSelections(current => ({
        ...current,
        [account.id]: failed.filter(item => !failedRemovals.includes(item.id)).map(item => item.id),
      }));
      if (failed.length) setUserActionError(
        `No se guardaron ${failed.length} asignaciones: ` + failed.map(item => `${courses.find(course => course.id === item.id)?.title || item.id}: ${item.message}`).join('; '),
      );
      if (removals.length > failedRemovals.length) setUserActionSuccess("Acceso al curso retirado correctamente.");
      if (saved) {
        setUserActionSuccess(
          account.role === "mentor" || account.role === "docente"
            ? "Mentor asignado al curso."
            : `Estudiante matriculado en ${saved} ${saved === 1 ? "curso" : "cursos"}.`,
        );
      }
      return failed.length === 0;
    } catch (error) {
      setUserActionError(error.message || "No se pudo guardar la asignación.");
      return false;
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

  const filteredLiveClasses = liveClasses.filter(item => (!liveStatusFilter || (item.effectiveStatus || item.status) === liveStatusFilter) && [item.title, item.mentorName, courses.find(course => course.id === item.courseId)?.title].join(" ").toLocaleLowerCase().includes(liveSearch.toLocaleLowerCase()));
  const livePageCount = Math.max(1, Math.ceil(filteredLiveClasses.length / 8));
  const currentLivePage = Math.min(livePage, livePageCount - 1);
  const visibleLiveClasses = filteredLiveClasses.slice(currentLivePage * 8, (currentLivePage + 1) * 8);

  return (
    <div className="flex flex-col gap-5">
      {userActionSuccess && <div role="status" className="fixed right-4 top-5 z-[150] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-2xl border border-emerald-200 bg-surface p-4 shadow-xl shadow-slate-900/10 motion-safe:animate-[view-enter_200ms_ease_both] sm:right-6">
        <CheckCircle2 size={21} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
        <div className="min-w-0 flex-1"><p className="text-xs font-bold text-ink">Cambios realizados</p><p className="mt-1 text-xs leading-5 text-muted">{userActionSuccess}</p></div>
        <button type="button" aria-label="Cerrar notificaci?n" className="shrink-0 rounded-lg p-1 text-subtle transition hover:bg-elevated hover:text-ink" onClick={() => setUserActionSuccess("")}><X size={15} /></button>
      </div>}
      {activeTab !== "users" && !showCreateCourseModal && <>
      {activeTab !== "courses" && activeTab !== "live" && <>
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

      </>}
      {/* Métricas Globales del Negocio */}
      {activeTab !== "courses" && activeTab !== "live" && <>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4 [&_.stat-card]:!rounded-none [&_.stat-card]:!border-0 [&_.stat-card]:!border-l-2 [&_.stat-card]:!border-l-brand/20 [&_.stat-card]:!bg-transparent [&_.stat-card]:!shadow-none [&_.stat-card]:!px-3 [&_.stat-card]:!py-2 [&_.stat-value]:!text-brand [&_.stat-card>div]:flex [&_.stat-card>div]:w-full [&_.stat-card>div]:items-center [&_.stat-card>div]:gap-3 [&_.stat-value]:shrink-0 [&_.stat-value]:!text-xl [&_.stat-value]:!leading-none [&_.stat-value]:!tracking-tight [&_.stat-label]:!mt-0 [&_.stat-label]:!text-[10px] [&_.stat-label]:!leading-4">
        <div className="stat-card"><div><div className="stat-value">{stats.activeStudents || 0}</div><div className="stat-label">Alumnos Activos</div></div></div>
        <div className="stat-card"><div><div className="stat-value">{stats.totalMentors || 0}</div><div className="stat-label">Mentores Registrados</div></div></div>
        <div className="stat-card"><div><div className="stat-value">{(stats.scheduledLiveSessions || 0) + (stats.activeLiveSessions || 0)}</div><div className="stat-label">Sesiones Próximas / En Vivo</div></div></div>
        <div className="stat-card"><div><div className="stat-value">{stats.averageCompletionRate || 0}%</div><div className="stat-label">Progreso Académico Promedio</div></div></div>
      </div>
      </>}


      {/* Pestañas de Gestión (sincronizadas 100% con la barra lateral) */}
      {activeTab !== "live" && activeTab !== "courses" && (
      <div className="tabs-nav !gap-2 !rounded-none !border-0 !border-b !border-line !bg-transparent !p-0 [&_.tab-btn]:!rounded-none [&_.tab-btn]:!border-0 [&_.tab-btn]:!border-b-2 [&_.tab-btn]:!border-transparent [&_.tab-btn]:!px-3 [&_.tab-btn]:!py-3 [&_.tab-btn]:!text-[11px] [&_.tab-btn.active]:!border-brand [&_.tab-btn.active]:!bg-transparent [&_.tab-btn.active]:!text-brand [&_.tab-btn.active]:!shadow-none">
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

      </>}

      {/* ============================================================== */}
      {/* VISTA 1: PANEL GENERAL (OVERVIEW)                               */}
      {/* ============================================================== */}
      {activeTab === "overview" && !showCreateCourseModal && (
        <div className="flex flex-col gap-6">
          {/* Accesos Rápidos para Administrador */}
          <section aria-label="Accesos rápidos">
            <h3 className="mb-3 text-xs font-semibold text-subtle">Gestiona tu plataforma</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { tab: "courses", label: "Cursos y programas", description: "Organiza el contenido de tus cursos", count: stats.totalCourses ?? courses.length, unit: "cursos", color: "text-brand bg-brand-soft" },
                { tab: "live", label: "Clases y grabaciones", description: "Agenda sesiones y publica videos", count: (stats.scheduledLiveSessions || 0) + (stats.activeLiveSessions || 0), unit: "sesiones", color: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300" },
                { tab: "users", label: "Usuarios y permisos", description: "Administra estudiantes y accesos", count: stats.totalUsers ?? students.length, unit: "cuentas", color: "text-violet-700 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300" },
              ].map(item => <button key={item.tab} type="button" onClick={() => handleTabChange(item.tab)} className="group rounded-xl border border-line bg-surface p-4 text-left transition hover:border-brand-line hover:shadow-sm focus-visible:outline-2 focus-visible:outline-brand"><div className="mb-3 flex items-center justify-between"><span className={"rounded-md px-2 py-1 text-[10px] font-semibold " + item.color}>{item.count} {item.unit}</span><ChevronRight size={15} className="text-subtle transition group-hover:translate-x-0.5 group-hover:text-brand" /></div><h4 className="text-sm font-bold text-ink">{item.label}</h4><p className="mt-1 text-[11px] leading-5 text-subtle">{item.description}</p></button>)}
            </div>
          </section>

          {/* Actividad Reciente de la Escuela */}
          <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
              <div className="flex items-center gap-2">
              <Activity size={15} className="text-brand" />
              <h3 className="text-sm font-bold tracking-tight text-ink">
                Actividad reciente
              </h3>
              </div>
              <span className="rounded-full bg-elevated px-2.5 py-1 text-[10px] font-semibold text-subtle">{recentActivity.length} {recentActivity.length === 1 ? "registro" : "registros"}</span>
            </div>

            <div className="flex flex-col divide-y divide-line/60">
              {recentActivity.length ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={activity.studentName} src={activity.studentAvatar || users.find(account => account.id === activity.studentId)?.avatarUrl} className="size-9 shrink-0" />
                      <div className="min-w-0">
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
      {activeTab === "courses" && !showCreateCourseModal && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="relative w-full sm:mr-auto sm:max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" /><input type="search" aria-label="Buscar cursos y programas" placeholder="Buscar curso o mentor..." value={courseSearch} onChange={event => setCourseSearch(event.target.value)} className="w-full !rounded-xl !bg-surface !pl-9 !text-xs" /></div>
            <div className="flex items-center gap-3"><span className="text-[11px] text-subtle">{courses.length} {courses.length === 1 ? "curso" : "cursos"}</span><select aria-label="Categoría de cursos" className="!rounded-xl !text-xs" value={courseCategory} onChange={event => setCourseCategory(event.target.value)}><option value="">Todas las categorías</option>{[...new Set(courses.map(course => course.category).filter(Boolean))].map(category => <option key={category}>{category}</option>)}</select></div>

            <button
              className="btn btn-primary !min-h-9 !rounded-xl !px-4 !py-2 !text-xs"
              onClick={() => { setEditingCourse(null); setNewCourseImage(null); setAcademicError(""); setCourseForm({ title: "", tagline: "", category: "Ventas Estratégicas", level: "Avanzado", docenteId: "", contentType: "course" }); setShowCreateCourseModal(true); }}
            >
              <Plus size={16} />
              <span>Crear nuevo curso</span>
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line bg-elevated/40 px-5 py-3 text-[9px] font-bold uppercase tracking-wider text-subtle"><span>Curso y programa</span><span>Acciones</span></div>
            {courses.filter(course => (!courseCategory || course.category === courseCategory) && [course.title, course.mentorName].join(" ").toLocaleLowerCase().includes(courseSearch.toLocaleLowerCase())).map((course) => (
              <div
                key={course.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-line/70 px-5 py-4 transition last:border-b-0 hover:bg-brand-soft/20"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="size-14 shrink-0 !rounded-md border border-line/50 object-cover"
                  />
                  <div>
                    <h4 className="break-words text-[13px] font-bold tracking-tight text-ink">
                      {course.title}
                    </h4>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-subtle"><span className="font-medium text-muted">{course.mentorName || "Por asignar"}</span><span className="size-0.5 rounded-full bg-line-strong" /><span>{course.category || "Sin categoría"}</span><span className="size-0.5 rounded-full bg-line-strong" /><span>{course.estimatedHours || "Contenido en preparación"}</span></div>
                  </div>
                </div>

                <div className="flex items-center [gap:10px]">

                  <button
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-brand-soft px-3 py-1.5 text-[11px] font-bold text-brand transition hover:bg-brand hover:text-on-brand"
                    onClick={() => onEditCurriculum(course)}
                    title="Editar contenido del curso"
                  >
                    <Edit size={14} />
                    <span>Editar</span>
                  </button>
                  <button type="button" aria-label={`Eliminar curso: ${course.title}`} title="Eliminar curso" className="inline-flex size-9 items-center justify-center text-rose-600 transition hover:text-rose-800" onClick={() => { setDeleteCourseError(""); setCourseToDelete(course); }}><Trash2 size={18} /></button>
                </div>
              </div>
            ))}

            {!courses.some(course => (!courseCategory || course.category === courseCategory) && [course.title, course.mentorName].join(" ").toLocaleLowerCase().includes(courseSearch.toLocaleLowerCase())) && <p className="px-5 py-10 text-center text-xs text-subtle">No hay cursos para esta búsqueda.</p>}          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VISTA 3: GESTIÓN DE CLASES EN VIVO & REPLAYS                    */}
      {/* ============================================================== */}
      {activeTab === "live" && !showCreateCourseModal && <p className="text-xs leading-5 text-subtle">Programa tus clases en vivo y comparte las grabaciones.</p>}
      {activeTab === "live" && !showCreateCourseModal && recordingPanel}
      {activeTab === "live" && !showCreateCourseModal && recordingsLibrary}
      {activeTab === "live" && !showCreateCourseModal && (
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <h2 className="text-base font-bold tracking-tight text-ink">Clases en vivo <span className="ml-1 text-xs font-medium text-subtle">({liveClasses.length})</span></h2>
            <button
              className="btn btn-primary btn-sm [gap:6px]"
              onClick={() => { setEditingLiveId(null); setAcademicError(""); setLiveForm({ courseId: "", title: "", scheduledAt: defaultSchedule(), durationMinutes: 60, joinUrl: "", meetingId: "", meetingPasscode: "" }); setShowScheduleLiveModal(true); }}
            >
              <Plus size={16} />
              <span>Agendar Nueva Sesión en Vivo</span>
            </button>
          </div>

          {liveNotice && <p role="status" className="w-fit rounded-xl border border-success-line bg-success-soft px-3 py-2 text-xs text-success">{liveNotice}</p>}
          <div className="flex flex-wrap items-center gap-3"><div className="relative w-full sm:max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" /><input aria-label="Buscar clases en vivo" type="search" placeholder="Buscar clase, curso o mentor..." className="w-full !rounded-xl !bg-surface !pl-9 !text-xs" value={liveSearch} onChange={event => { setLiveSearch(event.target.value); setLivePage(0); }} /></div><select aria-label="Estado de clases en vivo" value={liveStatusFilter} onChange={event => { setLiveStatusFilter(event.target.value); setLivePage(0); }} className="!rounded-xl !text-xs"><option value="">Todos los estados</option><option value="scheduled">Programadas</option><option value="live">En vivo</option><option value="ended">Finalizadas</option><option value="cancelled">Canceladas</option></select></div>
          <div className="grid items-start gap-5 lg:grid-cols-2">
            {[visibleLiveClasses.slice(0, Math.ceil(visibleLiveClasses.length / 2)), visibleLiveClasses.slice(Math.ceil(visibleLiveClasses.length / 2))].map((column, index) => <div key={index} className="min-w-0 space-y-3">
            {column.map((item) => (
              <div
                key={item.id}
                className="relative grid grid-cols-[48px_minmax(0,1fr)] items-start gap-x-3 sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-x-3"
              >
                <div className="relative z-10 flex flex-col items-center overflow-hidden rounded-xl border border-line bg-surface text-center shadow-sm"><span className="w-full bg-brand-soft py-1 text-[9px] font-bold uppercase tracking-widest text-brand">{sessionCalendar(item).month}</span><strong className="py-1 text-xl font-extrabold leading-6 tracking-tight text-ink">{sessionCalendar(item).day}</strong><span className="pb-1 text-[8px] text-subtle">{sessionCalendar(item).year}</span></div>
                <div className="min-w-0 rounded-t-xl border-x border-t border-line bg-surface px-3 pb-1 pt-2">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={"inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-semibold " + ((item.effectiveStatus || item.status) === "ended" ? "bg-elevated text-subtle" : (item.effectiveStatus || item.status) === "live" ? "bg-success-soft text-success" : "bg-brand-soft text-brand")}>
                      {item.badge}
                    </span>
                    <span className="text-[10px] font-medium text-subtle">
                      {item.time}
                    </span>
                  </div>
                  <h4 className="text-[13px] font-bold tracking-tight text-ink">
                    {item.title}
                  </h4>
                  <div className="mt-1 text-[10px] text-subtle">
                    {courses.find(course => course.id === item.courseId)?.title} · Mentor: {item.mentorName}
                  </div>

                </div>

                <div className="col-start-2 -mt-px flex flex-wrap items-center gap-2 rounded-b-xl border-x border-b border-line bg-surface px-3 pb-1.5 pt-1">
                  <button type="button" title="Ver acceso a Zoom" aria-label={"Ver acceso a Zoom: " + item.title} aria-haspopup="dialog" className="mr-auto inline-flex min-h-7 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-soft px-2 text-[10px] font-semibold text-brand transition hover:bg-brand hover:text-on-brand" onClick={() => setAccessSession(item)}><Eye size={13} />Ver acceso</button>
                  {onUpdateLiveClass && item.status !== "ended" && <button type="button" title="Editar clase" aria-label={`Editar clase ${item.title}`} className="inline-flex min-h-7 items-center justify-center rounded-lg border-0 bg-transparent !size-7 !p-0 text-[11px] font-medium text-brand transition-colors hover:border-brand-line hover:bg-elevated hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" onClick={() => {
                    const date = new Date(item.scheduledAt);
                    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                    setEditingLiveId(item.id); setAcademicError("");
                    setLiveForm({ courseId: item.courseId, title: item.title, scheduledAt: local, durationMinutes: item.durationMinutes || 60, joinUrl: item.joinUrl || "", meetingId: item.meetingId || "", meetingPasscode: item.meetingPasscode || "" });
                    setShowScheduleLiveModal(true);
                  }}><Edit size={16} /></button>}
                  {onDeleteLiveClass && <button type="button" title="Eliminar clase" aria-label={`Eliminar clase ${item.title}`} className="inline-flex size-7 items-center justify-center rounded-lg border-0 bg-transparent text-danger transition hover:bg-danger hover:text-white" onClick={() => { setDeleteSessionError(""); setSessionToDelete(item); }}><Trash2 size={16} /></button>}
                </div>
              </div>
            ))}
            </div>)}
          </div>
          {!visibleLiveClasses.length && <p className="py-8 text-center text-xs text-subtle">No hay clases para estos filtros.</p>}
          <div className="flex items-center justify-between gap-3 text-[11px] text-subtle"><p>{filteredLiveClasses.length} {filteredLiveClasses.length === 1 ? "clase" : "clases"}</p>{livePageCount > 1 && <nav aria-label="Páginas de clases en vivo" className="flex items-center gap-3"><button type="button" className="icon-button !size-8" aria-label="Página anterior de clases" disabled={currentLivePage === 0} onClick={() => setLivePage(currentLivePage - 1)}><ChevronLeft size={15} /></button><span>{currentLivePage + 1} de {livePageCount}</span><button type="button" className="icon-button !size-8" aria-label="Página siguiente de clases" disabled={currentLivePage === livePageCount - 1} onClick={() => setLivePage(currentLivePage + 1)}><ChevronRight size={15} /></button></nav>}</div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VISTA 4: ESTUDIANTES & GESTIÓN DE ACCESOS POR MEMBRESÍA         */}
      {/* ============================================================== */}
      {activeTab === "users" && !assignmentAccountId && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full sm:w-[420px] max-w-full">
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
            <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-secondary !min-h-9 !rounded-xl !px-3 !py-2 !text-xs" disabled={savingAllUsers || savingUserId !== null} onClick={() => {
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

            <button type="button" className="btn btn-primary min-w-28" disabled={savingAllUsers || savingUserId !== null || !Object.keys(userDrafts).length} onClick={savePendingUsers}>{savingAllUsers ? "Guardando..." : "Guardar"}</button>
          </div>

          {userActionError && (
            <div
              role="alert"
              className="[padding:12px_14px] rounded-2xl bg-danger-soft border border-danger-line text-danger text-[13px]"
            >
              {userActionError}
            </div>
          )}


          {/* Tabla de Estudiantes */}
          <div className="admin-users-card overflow-hidden rounded-2xl border border-line bg-surface shadow-panel [&_th]:!px-3 [&_th]:!py-3 [&_th]:text-[10px] [&_th]:uppercase [&_th]:tracking-wider [&_td]:!px-3 [&_td]:!py-3 [&_select]:!min-h-9 [&_select]:!rounded-xl [&_select]:!px-3 [&_select]:!py-2 [&_select]:!text-[11px] [&_.btn]:!min-h-8 [&_.btn]:!rounded-xl [&_.btn]:!py-1.5 [&_.btn]:!text-[10px]">
            <div
              className="table-scroll"
              role="region"
              aria-label="Tabla de datos"
              tabIndex={0}
            >
              <table className="admin-users-table w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="[border-bottom:1px_solid_var(--border-subtle)] [background:var(--bg-deep)] text-subtle">
                    <th className="[padding:14px_18px] font-bold">Usuario</th>
                    <th className="[padding:14px_18px] font-bold">Correo</th>
                    <th className="[padding:14px_18px] font-bold">Fecha de registro</th>
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
                      <td data-label="Usuario" className="px-3 py-3 text-ink">
                        <div className="min-w-0 border-l-2 border-brand/25 pl-3">
                          <p className="break-words text-xs font-semibold leading-5 tracking-tight">{student.name || "Usuario sin nombre"}</p>
                        </div>
                      </td>
                      <td data-label="Correo" className="[padding:14px_18px]">
                        <span className="select-text break-all text-xs text-muted">{student.email || "Sin correo"}</span>
                      </td>
                      <td data-label="Fecha de registro" className="[padding:14px_18px]">
                        <span className="whitespace-nowrap text-xs tabular-nums text-subtle">{student.joined}</span>
                      </td>
                      <td data-label="Rol y permisos" className="[padding:14px_18px]">
                        <select
                          value={student.role}
                          aria-label={`Rol de ${student.name}`}
                          onChange={(e) =>
                            stageUser(student.id, { role: e.target.value, mentorId: undefined })
                          }
                          disabled={
                            student.id === currentUserId || savingAllUsers ||
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
                      <td data-label="Mentor asignado" className="px-4 py-3">
                        {student.role === "estudiante" ? <div className="min-w-0 space-y-1.5"><select
                          aria-label={`Mentor de ${student.name}`}
                          className="min-w-0 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-xs text-ink"
                          value={student.mentorId}
                          disabled={savingAllUsers || savingUserId !== null}
                          onChange={event => stageUser(student.id, { mentorId: event.target.value })}
                          >
                          <option value="" disabled>Selecciona un mentor</option>
                          {availableMentors.map(mentor => <option key={mentor.id} value={mentor.id}>{mentor.fullName || "Sin nombre registrado"} · Mentor</option>)}
                        </select>
                          {availableMentors.find(mentor => mentor.id === student.mentorId)?.email && <details key={student.mentorId} className="text-[10px] text-subtle">
                            <summary className="w-fit cursor-pointer font-semibold text-brand">Ver correo del mentor</summary>
                            <p className="mt-1.5 select-text break-all rounded-lg border border-line bg-elevated/40 px-2 py-1.5">{availableMentors.find(mentor => mentor.id === student.mentorId).email}</p>
                          </details>}
                        </div> : <span className="text-xs text-subtle">No aplica</span>}
                      </td>
                      <td data-label="Asignación a cursos" className="[padding:14px_18px]">
                        {["admin", "soporte"].includes(student.role) ? (
                          <span className="text-xs font-bold text-ink">
                            {student.role === "admin"
                              ? "Acceso global"
                              : "Mesa de soporte"}
                          </span>
                        ) : (
                          <button type="button" disabled={savingAllUsers || savingUserId !== null || Boolean(userDrafts[student.id]?.role)} onClick={() => setAssignmentAccountId(student.id)} className="text-left text-xs font-bold text-brand transition hover:text-brand-hover">Gestionar cursos<span className="mt-1 block text-[10px] font-normal text-subtle">Ver y editar asignaciones</span></button>
                        )}
                      </td>
                      <td data-label="Acciones" className="px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                        {userDrafts[student.id] && <><button type="button" className="admin-user-cancel text-xs text-subtle" disabled={savingAllUsers || savingUserId !== null} onClick={() => { setUserDrafts(current => { const next = { ...current }; delete next[student.id]; return next; }); setAssignmentSelections(current => ({ ...current, [student.id]: [] })); }}>Cancelar</button></>}
                        <button type="button" aria-label={`Editar usuario: ${student.name}`} title="Editar usuario" disabled={savingAllUsers || savingUserId !== null}
                          className="inline-flex size-8 items-center justify-center border-0 bg-transparent text-brand transition-colors hover:text-brand-hover disabled:opacity-30"
                          onClick={() => {
                            const account = users.find(row => row.id === student.id);
                            setUserToEdit(account); setEditUserError("");
                            setEditUserForm({ fullName: account.fullName || "", company: account.company || "", title: account.title || "", phone: account.phone || "", location: account.location || "" });
                          }}><Edit size={15} /></button>
                        <button type="button" aria-label={`Eliminar usuario: ${student.name}`} title={student.id === currentUserId ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"}
                          disabled={student.id === currentUserId || savingUserId !== null}
                          onClick={() => { setDeleteError(""); setUserToDelete(student); }}
                          className="inline-flex size-8 items-center justify-center border-0 bg-transparent text-danger transition-colors hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-30">
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

      {activeTab === "users" && assignmentAccountId && students.find(account => account.id === assignmentAccountId) && <CourseAssignmentsView key={assignmentAccountId}
        account={students.find(account => account.id === assignmentAccountId)} courses={courses} enrollments={enrollmentData.items}
        selected={Array.isArray(assignmentSelections[assignmentAccountId]) ? assignmentSelections[assignmentAccountId] : []}
        removed={enrollmentRemovals[assignmentAccountId] || []}
        onSelect={ids => setAssignmentSelections(current => ({ ...current, [assignmentAccountId]: ids }))}
        onRemove={ids => setEnrollmentRemovals(current => ({ ...current, [assignmentAccountId]: ids }))}
        onBack={() => setAssignmentAccountId(null)} onSave={() => handleAssignCourse(students.find(account => account.id === assignmentAccountId))}
        busy={savingUserId !== null} loading={enrollmentData.loading} error={enrollmentData.error} onRetry={() => setEnrollmentRevision(value => value + 1)} />}

      <Dialog open={Boolean(accessSession)} onClose={() => setAccessSession(null)} title="Acceso a la clase" className="!max-w-sm !overflow-hidden !rounded-xl [&>div:first-child]:!px-5 [&>div:first-child]:!py-3.5 [&>div:first-child]:!bg-elevated/40 [&>div:last-child]:!p-5">
        <p className="text-sm font-bold text-ink">{accessSession?.title}</p><p className="mt-1 text-[11px] text-subtle">{accessSession?.date} · {accessSession?.time}</p>
        {zoomLink(accessSession?.joinUrl) ? <>
          <dl className="my-4 grid grid-cols-2 gap-3 border-y border-line py-3"><div><dt className="text-[10px] text-subtle">ID de reunión</dt><dd className="mt-1 select-text break-all font-mono text-xs font-semibold text-ink">{accessSession?.meetingId || "No indicado"}</dd></div><div><dt className="text-[10px] text-subtle">Código de acceso</dt><dd className="mt-1 select-text break-all font-mono text-xs font-semibold text-ink">{accessSession?.meetingPasscode || "No requerido"}</dd></div></dl>
          <a href={zoomLink(accessSession?.joinUrl)} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full !rounded-xl !text-xs">Abrir en Zoom ↗</a>
          <details className="mt-3"><summary className="cursor-pointer text-[10px] font-semibold text-subtle">Ver enlace completo</summary><a href={zoomLink(accessSession?.joinUrl)} target="_blank" rel="noopener noreferrer" className="mt-2 block break-all text-[10px] leading-5 text-brand">{accessSession?.joinUrl}</a></details>
        </> : <p className="mt-4 rounded-xl bg-elevated p-3 text-xs leading-5 text-muted">Esta clase aún no tiene un enlace de Zoom válido. Puedes agregarlo desde Editar clase.</p>}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-3">
          <button type="button" onClick={() => setAccessSession(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-muted transition hover:bg-elevated">Cerrar</button>
          {!zoomLink(accessSession?.joinUrl) && onUpdateLiveClass && accessSession?.status !== "ended" && <button type="button" className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white transition hover:brightness-110" onClick={() => {
            const item = accessSession;
            const date = new Date(item.scheduledAt);
            const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            setEditingLiveId(item.id); setAcademicError("");
            setLiveForm({ courseId: item.courseId, title: item.title, scheduledAt: local, durationMinutes: item.durationMinutes || 60, joinUrl: item.joinUrl || "", meetingId: item.meetingId || "", meetingPasscode: item.meetingPasscode || "" });
            setAccessSession(null); setShowScheduleLiveModal(true);
          }}>Agregar enlace</button>}
        </div>
      </Dialog>

      <Dialog open={Boolean(coverCourse)} onClose={() => { if (!coverBusy) setCoverCourse(null); }} title="Imagen del curso" className="!max-w-md !rounded-2xl">
        <p className="mb-3 text-sm font-bold">{coverCourse?.title}</p>
        <img src={coverPreview || coverCourse?.thumbnail} alt="Vista previa de la portada" className="mb-4 aspect-video w-full rounded-xl bg-elevated object-cover" />
        <label className="grid gap-2 text-xs font-semibold text-muted">Seleccionar imagen<input aria-label="Seleccionar portada del curso" type="file" accept="image/jpeg,image/png,image/webp" disabled={coverBusy} onChange={event => { const file = event.target.files?.[0]; if (!file) return; if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setCoverError("Usa JPG, PNG o WebP de hasta 5 MB."); event.target.value = ""; return; } setCoverError(""); setCoverFile(file); }} /></label>
        <p className="mt-2 text-[11px] text-subtle">JPG, PNG o WebP. Máximo 5 MB. Recomendado: formato horizontal.</p>
        {coverError && <p role="alert" className="mt-3 text-xs">{coverError}</p>}
        <div className="mt-4 flex justify-end gap-2"><button type="button" className="btn btn-secondary" disabled={coverBusy} onClick={() => setCoverCourse(null)}>Cancelar</button><button type="button" className="btn btn-primary" disabled={coverBusy || !coverFile} onClick={async () => { if (!coverFile || coverBusy) return; setCoverBusy(true); setCoverError(""); try { await onUploadCourseCover(coverCourse.id, coverFile); setCoverCourse(null); setCoverFile(null); setUserActionSuccess("Imagen del curso actualizada."); } catch (error) { setCoverError(error.message || "No se pudo subir la imagen."); } finally { setCoverBusy(false); } }}>{coverBusy ? "Guardando..." : "Guardar imagen"}</button></div>
      </Dialog>

      <Dialog open={Boolean(courseToDelete)} onClose={() => { if (!deletingCourse) setCourseToDelete(null); }} title="Eliminar curso" className="!max-w-sm !rounded-xl">
        <p className="text-sm font-bold text-ink">{courseToDelete?.title}</p>
        <p className="mt-3 text-xs leading-6 text-muted">Se eliminarán el curso, sus módulos, lecciones, matrículas, progreso y sesiones asociadas. Esta acción no se puede deshacer.</p>
        {deleteCourseError && <p role="alert" className="mt-3 text-xs">{deleteCourseError}</p>}
        <div className="mt-4 flex justify-end gap-2"><button type="button" disabled={deletingCourse} className="btn btn-secondary !text-xs" onClick={() => setCourseToDelete(null)}>Cancelar</button><button type="button" disabled={deletingCourse} className="btn bg-rose-600 text-white hover:bg-rose-700 !text-xs" onClick={async () => {
          if (deletingCourse || !courseToDelete) return;
          setDeletingCourse(true); setDeleteCourseError("");
          try { await onDeleteCourse(courseToDelete.id); setCourseToDelete(null); setEnrollmentRevision(value => value + 1); setUserActionSuccess("Curso eliminado correctamente."); }
          catch (error) { setDeleteCourseError(error.message || "No se pudo eliminar el curso."); }
          finally { setDeletingCourse(false); }
        }}><Trash2 size={14} />{deletingCourse ? "Eliminando..." : "Eliminar curso"}</button></div>
      </Dialog>

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
          {[['fullName', 'Nombre completo'], ['company', 'Empresa / Negocio'], ['title', 'Cargo o especialidad'], ['phone', 'Teléfono'], ['location', 'Ubicación']].map(([key, label]) => <label key={key} className={key === 'fullName' ? 'sm:col-span-2' : ''}>{label}<input name={key} type={key === 'phone' ? 'tel' : 'text'} required={key === 'fullName'} minLength={key === 'fullName' ? 2 : undefined} maxLength={key === 'phone' ? 40 : 160} disabled={savingAllUsers || savingUserId !== null} value={editUserForm[key] || ''} onChange={event => setEditUserForm(previous => ({ ...previous, [key]: event.target.value }))} /></label>)}
          {editUserError && <p role="alert" className="sm:col-span-2 text-xs">{editUserError}</p>}
          <div className="mt-2 flex justify-end gap-2 border-t border-line pt-3 sm:col-span-2">
            <button type="button" className="btn btn-secondary !text-xs" disabled={savingAllUsers || savingUserId !== null} onClick={() => setUserToEdit(null)}>Cancelar</button>
            <button className="btn btn-primary !text-xs" disabled={savingAllUsers || savingUserId !== null}>{savingUserId !== null ? 'Guardando...' : 'Guardar cambios'}</button>
          </div>
        </form>
      </Dialog>
      <Dialog open={Boolean(userToDelete)} onClose={() => { if (savingUserId === null) setUserToDelete(null); }} title={<span className="flex items-center gap-2 sm:gap-2"><span className="min-w-0"><span className="block text-base font-bold tracking-tight">¿Eliminar este usuario?</span></span></span>} className="!max-w-[370px] !rounded-xl [&>div:first-child]:relative [&>div:first-child]:justify-center [&>div:first-child]:text-center [&>div:first-child>button]:absolute [&>div:first-child>button]:right-2 [&>div:first-child>button]:top-1 [&>div:first-child>h2]:px-5 [&>div:first-child]:items-start [&>div:first-child]:border-0 [&>div:first-child]:!pb-1 [&>div:first-child]:!px-4 [&>div:first-child]:!pt-3 sm:[&>div:first-child]:!px-4 sm:[&>div:first-child]:!pt-3 [&>div:last-child]:!px-3 [&>div:last-child]:!pt-0 [&>div:last-child]:!pb-3 sm:[&>div:last-child]:!px-3 sm:[&>div:last-child]:!pb-3">
        <div className="relative top-2 flex flex-wrap items-center gap-2 pb-2 pt-0">
          <Avatar name={userToDelete?.name || ""} src={users.find(account => account.id === userToDelete?.id)?.avatarUrl} className="relative left-0.5 size-7 !bg-slate-200 !text-slate-600 sm:size-7" />
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="break-words text-xs font-bold tracking-tight text-ink sm:text-xs">{userToDelete?.name}</p><span className="shrink-0 inline-flex items-center gap-2 rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-800"><GraduationCap size={15} />{({ estudiante: "Estudiante", mentor: "Mentor", admin: "Administrador", soporte: "Soporte" })[userToDelete?.role] || "Usuario"}</span></div><p className="mt-1 break-all text-[11px] text-muted sm:text-[11px]">{userToDelete?.email}</p></div>

        </div>
        <div className="mt-2 flex items-start gap-2.5 text-rose-600 dark:text-rose-400"><TriangleAlert size={20} strokeWidth={1.7} className="relative left-0.5 mt-1 shrink-0" aria-hidden="true" /><div className="border-l border-rose-300 py-1 pl-3 dark:border-rose-700"><p className="text-xs font-bold text-rose-600 dark:text-rose-400 sm:text-xs">Esta acción es irreversible</p><p className="mt-1 text-[11px] leading-5 sm:text-xs">Se eliminarán la cuenta, las matrículas y el progreso. Esta información no se podrá recuperar.</p></div></div>
        {deleteError && <p role="alert" className="mt-2 text-xs">{deleteError}</p>}
        <div className="mt-2 flex flex-row justify-end gap-2">
          <button type="button" className="btn btn-secondary !min-h-9 !px-3 !py-2 !text-xs sm:min-w-0" disabled={savingAllUsers || savingUserId !== null} onClick={() => setUserToDelete(null)}>Cancelar</button>
          <button type="button" className="btn !min-h-9 !px-3 !py-2 !text-xs border border-rose-600 bg-rose-600 text-white shadow-sm shadow-rose-600/15 hover:border-rose-700 hover:bg-rose-700 sm:min-w-0" disabled={savingAllUsers || savingUserId !== null} onClick={async () => {
            if (!userToDelete || savingUserId !== null) return;
            setSavingUserId(userToDelete.id); setDeleteError("");
            try {
              await onDeleteUser(userToDelete.id);
              setUserActionSuccess("Usuario eliminado correctamente."); setUserActionError("");
              setUserToDelete(null); setEnrollmentRevision(value => value + 1);
            } catch (error) { setDeleteError(error.message || "No se pudo eliminar el usuario."); }
            finally { setSavingUserId(null); }
          }}><Trash2 size={17} />{savingUserId !== null ? "Eliminando..." : "Eliminar definitivamente"}</button>
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

      {showCreateCourseModal && <section className="space-y-5" aria-label={editingCourse ? "Editar curso" : "Crear nuevo curso"}>
        <button type="button" disabled={academicSaving} onClick={() => setShowCreateCourseModal(false)} className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-brand"><ArrowLeft size={16} />Volver a cursos</button>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Cursos y programas</p><h1 className="mt-1 !text-2xl">{editingCourse ? "Editar curso" : "Crear nuevo curso"}</h1><p className="mt-2 text-xs text-subtle">Dale una portada, define sus detalles y asigna un mentor.</p></div>
          <div className="flex items-center gap-2"><button type="button" disabled={academicSaving} className="btn btn-secondary" onClick={() => setShowCreateCourseModal(false)}>Cancelar</button><button type="submit" form="admin-create-course" disabled={academicSaving} className="btn btn-primary">{academicSaving ? "Guardando..." : editingCourse ? "Guardar cambios" : "Guardar curso"}</button></div>
        </div>
        {academicError && <p role="alert">{academicError}</p>}
        <form id="admin-create-course" aria-busy={academicSaving} onSubmit={handleCreateCourseSubmit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)]">
          <fieldset disabled={academicSaving} className="min-w-0 space-y-5 rounded-2xl border border-line bg-surface p-5 sm:p-6 [&_input]:!rounded-xl [&_input]:!bg-elevated/30 [&_input]:!text-xs [&_select]:w-full [&_select]:!rounded-xl [&_select]:!bg-elevated/30 [&_select]:!text-xs [&_label]:!text-[11px] [&_label]:!normal-case [&_label]:!tracking-normal">
            <div className="border-b border-line pb-4"><h2 className="!text-base">Información del curso</h2><p className="mt-1 text-[11px] text-subtle">Completa los datos que verán tus estudiantes.</p></div>
              <label className="grid gap-2 text-xs font-semibold text-muted">
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
                  Descripción del curso
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
                    {courseForm.category && !["Ventas Estratégicas", "Finanzas & Runway", "Growth & Producto", "Liderazgo & Equipos"].includes(courseForm.category) && <option value={courseForm.category}>{courseForm.category}</option>}
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
                    <option value="">Asignar mentor después</option>
                    {mentors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.fullName || m.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>


          </fieldset>
          <aside className="min-w-0 space-y-4">
              <section className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="flex items-center justify-between border-b border-line px-4 py-3"><span className="text-xs font-bold text-ink">Portada del curso</span><span className="rounded-md bg-elevated px-2 py-1 text-[9px] font-medium text-subtle">Opcional</span></div>
                {(newCoursePreview || editingCourse?.thumbnail) ? <>
                  <div className="bg-elevated/40 p-3"><img src={newCoursePreview || editingCourse?.thumbnail} alt="Vista previa del curso" className="aspect-video max-h-48 w-full rounded-xl bg-elevated object-contain" /></div>
                  <div className="flex items-center justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="truncate text-[11px] font-semibold text-ink">{newCourseImage?.name || "Portada actual"}</p><p className="mt-0.5 text-[10px] text-subtle">{newCourseImage ? (newCourseImage.size / 1024 / 1024).toFixed(2) + " MB" : "Selecciona otra imagen para cambiarla"}</p></div><div className="flex shrink-0 items-center gap-3"><label className="relative cursor-pointer rounded-lg border border-line px-3 py-1.5 text-[11px] font-semibold text-brand transition hover:bg-brand-soft">Cambiar imagen<input className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" type="file" aria-label="Imagen del nuevo curso" accept="image/jpeg,image/png,image/webp" disabled={academicSaving} onChange={event => { const file = event.target.files?.[0]; if (!file) return; if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setAcademicError("Usa JPG, PNG o WebP de hasta 5 MB."); event.target.value = ""; return; } setAcademicError(""); setNewCourseImage(file); }} /></label><button type="button" disabled={academicSaving || !newCourseImage} aria-label="Quitar imagen del curso" title="Quitar imagen" className="rounded-lg p-2 text-danger transition hover:bg-danger-soft" onClick={() => setNewCourseImage(null)}><Trash2 size={15} /></button></div></div>
                </> : <label className="relative m-3 flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-brand-line bg-brand-soft/30 px-4 py-6 text-center transition hover:border-brand hover:bg-brand-soft/60 focus-within:ring-2 focus-within:ring-brand">
                  <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-surface text-brand shadow-sm"><ImagePlus size={21} strokeWidth={1.7} /></span><span className="text-xs font-bold text-ink">Selecciona la portada de tu curso</span><span className="mt-1.5 text-[10px] text-subtle">JPG, PNG o WebP · Hasta 5 MB</span><span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-bold text-on-brand"><Upload size={13} />Elegir imagen</span><input className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" type="file" aria-label="Imagen del nuevo curso" accept="image/jpeg,image/png,image/webp" disabled={academicSaving} onChange={event => { const file = event.target.files?.[0]; if (!file) return; if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setAcademicError("Usa JPG, PNG o WebP de hasta 5 MB."); event.target.value = ""; return; } setAcademicError(""); setNewCourseImage(file); }} />
                </label>}
              </section>
            <div className="rounded-xl border border-brand-line/50 bg-brand-soft/40 p-4"><p className="text-xs font-bold text-brand">El siguiente paso</p><p className="mt-2 text-[11px] leading-5 text-muted">Después de crear el curso podrás agregar módulos, lecciones y recursos desde Editar.</p></div>
          </aside>

        </form>
      </section>}

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
