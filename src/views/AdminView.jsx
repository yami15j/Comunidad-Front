import { api } from "../services/api";
import { StudentCoursePicker } from "../components/StudentCoursePicker";
import React, { useState, useEffect } from "react";
import {
  Shield,
  Radio,
  Users,
  Plus,
  Edit,
  Crown,
  TrendingUp,
  Search,
  UserPlus,
  ChevronRight,
  Activity,
} from "lucide-react";

export function AdminView({
  courses,
  liveClasses,
  onAddCourse,
  onEditCurriculum,
  onAddLiveClass,
  mentors,
  users = [],
  dashboard = { stats: {}, recentActivity: [] },
  currentUserId,
  onUpdateUserRole,
  onAssignMentor,
  onAssignUserToCourse,
  onCreateUser,
  currentView = "admin-overview",
  onNavigate,
}) {
  const stats = dashboard?.stats || {};
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
      await onAddLiveClass({
        ...liveForm,
        title: liveForm.title.trim(),
        scheduledAt: new Date(liveForm.scheduledAt).toISOString(),
        durationMinutes: Number(liveForm.durationMinutes),
      });
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
    <div className="flex flex-col gap-7">
      {/* Header del CMS */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 [margin-bottom:6px]">
            <span className="badge badge-amber">
              <Shield size={14} />
              <span>Panel de Control Administrativo (CMS)</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-ink">
            Gestión Integral
          </h1>
          <p className="text-muted text-[14px] mt-1">
            Control central de programas, clases en vivo, profesores, alumnos y
            niveles de suscripción.
          </p>
        </div>
      </div>

      {/* Métricas Globales del Negocio */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Users size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.activeStudents || 0}</div>
            <div className="stat-label">Alumnos Activos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Crown size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.totalMentors || 0}</div>
            <div className="stat-label">Mentores Registrados</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Radio size={22} />
          </div>
          <div>
            <div className="stat-value">
              {(stats.scheduledLiveSessions || 0) +
                (stats.activeLiveSessions || 0)}
            </div>
            <div className="stat-label">Sesiones Próximas / En Vivo</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="stat-value">
              {stats.averageCompletionRate || 0}%
            </div>
            <div className="stat-label">Progreso Académico Promedio</div>
          </div>
        </div>
      </div>

      {/* Pestañas de Gestión (sincronizadas 100% con la barra lateral) */}
      <div className="tabs-nav">
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

      {/* ============================================================== */}
      {/* VISTA 1: PANEL GENERAL (OVERVIEW)                               */}
      {/* ============================================================== */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">
          {/* Accesos Rápidos para Administrador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
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
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="[color:var(--emerald-400)]" />
              <h3 className="text-[17px] font-extrabold">
                Actividad Reciente del Negocio
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {recentActivity.length ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex justify-between items-center [padding:12px_14px] [background:var(--bg-deep)] [border-radius:var(--radius-md)] [border:1px_solid_var(--border-subtle)] gap-3"
                  >
                    <div>
                      <div className="text-[13px] font-semibold text-ink">
                        {activity.studentName} completó “{activity.lessonTitle}”
                      </div>
                      <div className="text-[11px] text-subtle">
                        {activity.courseTitle} •{" "}
                        {new Date(activity.occurredAt).toLocaleString("es-EC", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                    <span className="badge badge-emerald text-[11px]">
                      Progreso
                    </span>
                  </div>
                ))
              ) : (
                <div className="[padding:22px] text-center text-muted [border:1px_dashed_var(--border-medium)] [border-radius:var(--radius-md)] text-[13px]">
                  Aún no existen lecciones completadas para mostrar actividad.
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
              <h3 className="text-[18px] font-extrabold">
                Programas y Módulos Curriculares
              </h3>
              <p className="text-[13px] text-muted">
                Crea y gestiona la estructura de cursos, módulos y lecciones de
                video.
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm [gap:6px]"
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
      {activeTab === "live" && (
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h3 className="text-[18px] font-extrabold">
                Agenda de Clases en Vivo & Videoteca
              </h3>
              <p className="text-[13px] text-muted">
                Programa nuevas transmisiones o conviértelas en grabaciones
                disponibles.
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm [gap:6px]"
              onClick={() => setShowScheduleLiveModal(true)}
            >
              <Plus size={16} />
              <span>Agendar Nueva Sesión en Vivo</span>
            </button>
          </div>

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
                    Mentor: {item.mentorName} • Reunion por Zoom
                  </div>
                </div>

                <div className="flex [gap:10px]">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled
                    title="Sube el archivo de Zoom desde Publicar grabacion"
                  >
                    <Radio size={14} />
                    <span>Carga manual desde Zoom</span>
                  </button>
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
          <div className="flex justify-between items-center flex-wrap [gap:14px]">
            <div>
              <h3 className="text-[18px] font-extrabold">
                Usuarios, roles y acceso a cursos
              </h3>
              <p className="text-[13px] text-muted">
                Administra estudiantes, mentores y administradores. Los cambios
                se guardan directamente en la base de datos.
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm [gap:6px]"
              onClick={() => setShowAddStudentModal(true)}
            >
              <UserPlus size={16} />
              <span>Registrar / Invitar Usuario</span>
            </button>
          </div>

          {/* Filtros y Buscador de Estudiantes */}
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex gap-2">
              {[
                ["all", "Todos"],
                ["estudiante", "Estudiantes"],
                ["mentor", "Mentores"],
                ["admin", "Administradores"],
              ].map(([plan, label]) => (
                <button
                  key={plan}
                  onClick={() => setStudentPlanFilter(plan)}
                  style={{
                    border:
                      studentPlanFilter === plan
                        ? "1px solid var(--brand-celeste)"
                        : "1px solid var(--border-subtle)",
                    background:
                      studentPlanFilter === plan
                        ? "rgba(6, 171, 235, 0.15)"
                        : "var(--bg-surface)",
                    color:
                      studentPlanFilter === plan
                        ? "var(--brand-celeste)"
                        : "var(--text-muted)",
                  }}
                  className="[padding:6px_14px] [border-radius:var(--radius-full)] text-[12px] font-semibold cursor-pointer"
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
          <div className="overflow-x-auto [background:var(--bg-surface)] [border-radius:var(--radius-md)] [border:1px_solid_var(--border-subtle)]">
            <div
              className="table-scroll"
              role="region"
              aria-label="Tabla de datos"
              tabIndex={0}
            >
              <table className="w-full border-collapse text-left text-[13px]">
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
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="[border-bottom:1px_solid_var(--border-subtle)]"
                    >
                      <td className="[padding:14px_18px] font-semibold text-ink">
                        {student.name}
                        <div className="text-[11px] text-subtle">
                          {student.email} • Registrado: {student.joined}
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
                        </select>
                        {student.id === currentUserId && (
                          <div className="[margin-top:5px] text-[11px] text-subtle">
                            Tu cuenta administrativa
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {student.role === "estudiante" ? <select
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
                              setUserActionSuccess("Mentor asignado correctamente.");
                            } catch (failure) { setUserActionError(failure.message); }
                            finally { setSavingUserId(null); }
                          }}>
                          <option value="" disabled>Sin mentor asignado</option>
                          {users.filter(account => account.role === "mentor").map(mentor => <option key={mentor.id} value={mentor.id}>{mentor.fullName || mentor.email}</option>)}
                        </select> : <span className="text-xs text-subtle">No aplica</span>}
                      </td>
                      <td className="[padding:14px_18px]">
                        {["admin", "soporte"].includes(student.role) ? (
                          <span className="text-subtle text-[12px]">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Alumno */}
      {showAddStudentModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddStudentModal(false)}
        >
          <div
            className="modal-dialog [max-width:520px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="[padding:20px_24px] [border-bottom:1px_solid_var(--border-subtle)]">
              <h3 className="text-[18px] font-extrabold">
                Registrar Nuevo Usuario
              </h3>
              <p className="text-[12px] text-muted">
                Crea una cuenta y asigna su rol inicial.
              </p>
            </div>

            <form
              onSubmit={handleAddStudentSubmit}
              className="p-6 flex flex-col gap-4"
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

              <div className="flex justify-end [gap:10px] [margin-top:10px]">
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
          </div>
        </div>
      )}

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

      {/* Modal Agendar Clase en Vivo */}
      {showScheduleLiveModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowScheduleLiveModal(false)}
        >
          <div
            className="modal-dialog [max-width:600px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="[padding:20px_24px] [border-bottom:1px_solid_var(--border-subtle)]">
              <h3 className="text-[18px] font-extrabold">
                Agendar Nueva Clase en Vivo
              </h3>
            </div>

            <form
              aria-busy={academicSaving}
              onSubmit={handleScheduleLiveSubmit}
              className="p-6 flex flex-col gap-4"
            >
              {academicError && (
                <p role="alert" className="text-danger">
                  {academicError}
                </p>
              )}

              <div>
                <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                  Curso
                </label>
                <select
                  value={liveForm.courseId}
                  onChange={(e) =>
                    setLiveForm({ ...liveForm, courseId: e.target.value })
                  }
                  className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] [background:var(--bg-deep)] [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                  required
                >
                  <option value="">Selecciona un curso</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                {courses.length === 0 && (
                  <div className="[margin-top:10px] [padding:12px_14px] rounded-2xl bg-warning-soft border border-warning-line text-warning text-[12px] [line-height:1.5]">
                    <div className="font-bold mb-2">
                      Primero necesitas crear un curso.
                    </div>
                    <div className="[margin-bottom:10px]">
                      Cada clase en vivo debe estar vinculada a un curso para
                      poder asignarla a estudiantes y mentores.
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setShowScheduleLiveModal(false);
                        setShowCreateCourseModal(true);
                      }}
                    >
                      Crear mi primer curso
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                  Tema de la Sesión
                </label>
                <input
                  type="text"
                  placeholder="Ej: Auditoría en vivo de Modelos Financieros"
                  value={liveForm.title}
                  onChange={(e) =>
                    setLiveForm({ ...liveForm, title: e.target.value })
                  }
                  className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] [background:var(--bg-deep)] [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 [gap:14px]">
                <div>
                  <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                    Fecha y Horario
                  </label>
                  <input
                    type="datetime-local"
                    value={liveForm.scheduledAt}
                    onChange={(e) =>
                      setLiveForm({ ...liveForm, scheduledAt: e.target.value })
                    }
                    className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] [background:var(--bg-deep)] [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                    required
                  />
                </div>
                <div>
                  <p>Profesor del curso</p>
                  <p>
                    {courses.find((course) => course.id === liveForm.courseId)
                      ?.mentorName || "Selecciona un curso con mentor asignado"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-subtle uppercase block [margin-bottom:6px]">
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={liveForm.durationMinutes}
                  onChange={(e) =>
                    setLiveForm({
                      ...liveForm,
                      durationMinutes: e.target.value,
                    })
                  }
                  className="w-full [padding:10px_12px] [border-radius:var(--radius-sm)] [background:var(--bg-deep)] [border:1px_solid_var(--border-medium)] text-ink text-[13px]"
                  required
                />
              </div>

              <label>
                Enlace de Zoom (opcional)
                <input
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={liveForm.joinUrl || ""}
                  onChange={(e) =>
                    setLiveForm({ ...liveForm, joinUrl: e.target.value })
                  }
                  className="w-full p-3"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>ID de reunión (opcional)<input inputMode="numeric" maxLength={20} placeholder="123 4567 8901" value={liveForm.meetingId} onChange={e => setLiveForm({ ...liveForm, meetingId: e.target.value })} /></label>
                <label>Código de acceso (opcional)<input maxLength={32} autoComplete="off" value={liveForm.meetingPasscode} onChange={e => setLiveForm({ ...liveForm, meetingPasscode: e.target.value })} /></label>
              </div>
              <div className="flex justify-end [gap:10px] [margin-top:10px]">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowScheduleLiveModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={academicSaving || courses.length === 0}
                >
                  Agendar Sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
