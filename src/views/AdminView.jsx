import React, { useState } from "react";
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
  onAddLiveClass,
  mentors,
  users = [],
  dashboard = { stats: {}, recentActivity: [] },
  currentUserId,
  onUpdateUserRole,
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
    mentorName: mentors[0]?.name || "",
    estimatedHours: "6.5 horas",
  });

  // Form states for new Live Class
  const [liveForm, setLiveForm] = useState(() => ({
    courseId: "",
    title: "",
    subtitle: "",
    mentorName: mentors[0]?.name || "",
    scheduledAt: defaultSchedule(),
    durationMinutes: 75,
    joinUrl: "https://zoom.us/j/traction-live-new",
    category: "Ventas & Crecimiento",
  }));

  const students = users.map((item) => ({
    id: item.id,
    name: item.fullName,
    company: item.company || "Sin empresa registrada",
    email: item.email,
    role: item.role,
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

  const handleCreateCourseSubmit = async (e) => {
    e.preventDefault();
    if (!courseForm.title.trim()) return;

    const newCourseObj = {
      id: `course_${Date.now()}`,
      title: courseForm.title,
      tagline: courseForm.tagline,
      category: courseForm.category,
      level: courseForm.level,
      mentorName: courseForm.mentorName,
      mentorRole: "Mentor Oficial",
      mentorAvatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
      thumbnail:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
      progressPercent: 0,
      completedLessonsCount: 0,
      totalLessonsCount: 8,
      estimatedHours: courseForm.estimatedHours,
      isEnrolled: true,
      rating: 5.0,
      modules: [],
    };

    await onAddCourse(newCourseObj);
    setShowCreateCourseModal(false);
    setCourseForm({
      title: "",
      tagline: "",
      category: "Ventas Estratégicas",
      level: "Avanzado",
      mentorName: mentors[0]?.name || "",
      estimatedHours: "6.5 horas",
    });
  };

  const handleScheduleLiveSubmit = async (e) => {
    e.preventDefault();
    if (!liveForm.title.trim()) return;

    const newLiveObj = {
      id: `live_${Date.now()}`,
      courseId: liveForm.courseId,
      title: liveForm.title,
      subtitle: liveForm.subtitle,
      mentorName: liveForm.mentorName,
      mentorAvatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      date: liveForm.date,
      scheduledAt: new Date(liveForm.scheduledAt).toISOString(),
      durationMinutes: Number(liveForm.durationMinutes),
      isToday: false,
      isLiveNow: false,
      joinUrl: liveForm.joinUrl,
      attendeesCount: 0,
      category: liveForm.category,
      badge: "Programada",
    };

    await onAddLiveClass(newLiveObj);
    setShowScheduleLiveModal(false);
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

  const handleAssignCourse = async (account) => {
    const courseId = assignmentSelections[account.id];
    if (!courseId) return;
    setUserActionError("");
    setUserActionSuccess("");
    setSavingUserId(account.id);
    try {
      await onAssignUserToCourse(account.id, account.role, courseId);
      setUserActionSuccess(
        account.role === "mentor" || account.role === "docente"
          ? "Mentor asignado al curso."
          : "Estudiante matriculado en el curso.",
      );
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
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header del CMS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <span className="badge badge-amber">
              <Shield size={14} />
              <span>Panel de Control Administrativo (CMS)</span>
            </span>
          </div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "var(--text-main)",
            }}
          >
            Gestión Integral de Traction
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "14px",
              marginTop: "4px",
            }}
          >
            Control central de programas, clases en vivo, profesores, alumnos y
            niveles de suscripción.
          </p>
        </div>
      </div>

      {/* Métricas Globales del Negocio */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{
              background: "rgba(6, 171, 235, 0.14)",
              color: "var(--brand-celeste)",
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.activeStudents || 0}</div>
            <div className="stat-label">Alumnos Activos</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{
              background: "var(--bg-surface-elevated)",
              color: "var(--text-main)",
            }}
          >
            <Crown size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.totalMentors || 0}</div>
            <div className="stat-label">Mentores Registrados</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{
              background: "rgba(6, 171, 235, 0.10)",
              color: "var(--brand-celeste-light)",
            }}
          >
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
          <div
            className="stat-icon-wrapper"
            style={{ background: "rgba(139, 92, 246, 0.15)", color: "#A78BFA" }}
          >
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
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Accesos Rápidos para Administrador */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            <div
              className="card card-interactive"
              onClick={() => handleTabChange("courses")}
              style={{ cursor: "pointer", background: "var(--bg-surface)" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <span className="badge badge-emerald">Cursos</span>
                <ChevronRight size={16} />
              </div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--text-main)",
                }}
              >
                Publicar o Modificar Cursos
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginTop: "4px",
                }}
              >
                {stats.totalCourses ?? courses.length} programas registrados en
                la plataforma.
              </p>
            </div>

            <div
              className="card card-interactive"
              onClick={() => handleTabChange("live")}
              style={{ cursor: "pointer", background: "var(--bg-surface)" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <span className="badge badge-amber">Clases en Vivo</span>
                <ChevronRight size={16} />
              </div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--text-main)",
                }}
              >
                Agendar Nueva Clase en Vivo
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginTop: "4px",
                }}
              >
                {(stats.scheduledLiveSessions || 0) +
                  (stats.activeLiveSessions || 0)}{" "}
                sesiones próximas o activas.
              </p>
            </div>

            <div
              className="card card-interactive"
              onClick={() => handleTabChange("users")}
              style={{ cursor: "pointer", background: "var(--bg-surface)" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <span className="badge badge-purple">Accesos</span>
                <ChevronRight size={16} />
              </div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--text-main)",
                }}
              >
                Gestionar Membresías de Alumnos
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginTop: "4px",
                }}
              >
                {stats.totalUsers ?? students.length} cuentas registradas en la
                plataforma.
              </p>
            </div>
          </div>

          {/* Actividad Reciente de la Escuela */}
          <div className="card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <Activity size={18} style={{ color: "var(--emerald-400)" }} />
              <h3 style={{ fontSize: "17px", fontWeight: 800 }}>
                Actividad Reciente del Negocio
              </h3>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {recentActivity.length ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      background: "var(--bg-deep)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--text-main)",
                        }}
                      >
                        {activity.studentName} completó “{activity.lessonTitle}”
                      </div>
                      <div
                        style={{ fontSize: "11px", color: "var(--text-dim)" }}
                      >
                        {activity.courseTitle} •{" "}
                        {new Date(activity.occurredAt).toLocaleString("es-EC", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                    <span
                      className="badge badge-emerald"
                      style={{ fontSize: "11px" }}
                    >
                      Progreso
                    </span>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "22px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    border: "1px dashed var(--border-medium)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "13px",
                  }}
                >
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
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 800 }}>
                Programas y Módulos Curriculares
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Crea y gestiona la estructura de cursos, módulos y lecciones de
                video.
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreateCourseModal(true)}
              style={{ gap: "6px" }}
            >
              <Plus size={16} />
              <span>Publicar Nuevo Curso</span>
            </button>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {courses.map((course) => (
              <div
                key={course.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "14px" }}
                >
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    style={{
                      width: "60px",
                      height: "45px",
                      borderRadius: "var(--radius-sm)",
                      objectFit: "cover",
                    }}
                  />
                  <div>
                    <h4
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "var(--text-main)",
                      }}
                    >
                      {course.title}
                    </h4>
                    <div
                      style={{ fontSize: "12px", color: "var(--text-muted)" }}
                    >
                      Mentor:{" "}
                      <strong style={{ color: "var(--text-main)" }}>
                        {course.mentorName}
                      </strong>{" "}
                      • {course.category} • {course.estimatedHours}
                    </div>
                  </div>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span className="badge badge-emerald">Registrado</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled
                    title="El editor curricular se conectará en la siguiente fase"
                  >
                    <Edit size={14} />
                    <span>Editor curricular pendiente</span>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 800 }}>
                Agenda de Clases en Vivo & Videoteca
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Programa nuevas transmisiones o conviértelas en grabaciones
                disponibles.
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowScheduleLiveModal(true)}
              style={{ gap: "6px" }}
            >
              <Plus size={16} />
              <span>Agendar Nueva Sesión en Vivo</span>
            </button>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {liveClasses.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      className="badge badge-live"
                      style={{ fontSize: "11px" }}
                    >
                      {item.badge}
                    </span>
                    <span
                      style={{ fontSize: "12px", color: "var(--text-muted)" }}
                    >
                      {item.date} • {item.time}
                    </span>
                  </div>
                  <h4
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--text-main)",
                    }}
                  >
                    {item.title}
                  </h4>
                  <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                    Mentor: {item.mentorName} • Sala privada de LiveKit
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled
                    title="La grabación automática se conectará en la fase de LiveKit Egress"
                  >
                    <Radio size={14} />
                    <span>Grabación no configurada</span>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 800 }}>
                Usuarios, roles y acceso a cursos
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Administra estudiantes, mentores y administradores. Los cambios
                se guardan directamente en la base de datos.
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddStudentModal(true)}
              style={{ gap: "6px" }}
            >
              <UserPlus size={16} />
              <span>Registrar / Invitar Usuario</span>
            </button>
          </div>

          {/* Filtros y Buscador de Estudiantes */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", gap: "8px" }}>
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
                    padding: "6px 14px",
                    borderRadius: "var(--radius-full)",
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
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ position: "relative", width: "280px" }}>
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-dim)",
                }}
              />
              <input
                type="text"
                placeholder="Buscar por nombre, empresa o email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-main)",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {userActionError && (
            <div
              role="alert"
              style={{
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#991B1B",
                fontSize: "13px",
              }}
            >
              {userActionError}
            </div>
          )}
          {userActionSuccess && (
            <div
              role="status"
              style={{
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#ECFDF5",
                border: "1px solid #6EE7B7",
                color: "#065F46",
                fontSize: "13px",
              }}
            >
              {userActionSuccess}
            </div>
          )}

          {/* Tabla de Estudiantes */}
          <div
            style={{
              overflowX: "auto",
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                    background: "var(--bg-deep)",
                    color: "var(--text-dim)",
                  }}
                >
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>
                    Usuario
                  </th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>
                    Datos
                  </th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>
                    Rol y permisos
                  </th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>
                    Asignación a curso
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                  >
                    <td
                      style={{
                        padding: "14px 18px",
                        fontWeight: 600,
                        color: "var(--text-main)",
                      }}
                    >
                      {student.name}
                      <div
                        style={{ fontSize: "11px", color: "var(--text-dim)" }}
                      >
                        {student.email} • Registrado: {student.joined}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ color: "var(--text-muted)" }}>
                        {student.company}
                      </div>
                      {student.phone && (
                        <div
                          style={{ fontSize: "11px", color: "var(--text-dim)" }}
                        >
                          {student.phone}
                        </div>
                      )}
                      {student.location && (
                        <div
                          style={{ fontSize: "11px", color: "var(--text-dim)" }}
                        >
                          {student.location}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <select
                        value={student.role}
                        onChange={(e) =>
                          handleUpdateStudentPlan(student.id, e.target.value)
                        }
                        disabled={
                          student.id === currentUserId ||
                          savingUserId === student.id
                        }
                        style={{
                          background: "var(--bg-deep)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-main)",
                          padding: "6px 12px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        <option value="estudiante">Estudiante</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Administrador</option>
                      </select>
                      {student.id === currentUserId && (
                        <div
                          style={{
                            marginTop: 5,
                            fontSize: 10,
                            color: "var(--text-dim)",
                          }}
                        >
                          Tu cuenta administrativa
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      {student.role === "admin" ? (
                        <span
                          style={{ color: "var(--text-dim)", fontSize: 12 }}
                        >
                          Acceso global
                        </span>
                      ) : (
                        <div style={{ display: "flex", gap: 8, minWidth: 280 }}>
                          <select
                            value={assignmentSelections[student.id] || ""}
                            onChange={(e) =>
                              setAssignmentSelections((current) => ({
                                ...current,
                                [student.id]: e.target.value,
                              }))
                            }
                            style={{
                              flex: 1,
                              background: "var(--bg-deep)",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: "var(--radius-sm)",
                              color: "var(--text-main)",
                              padding: "6px 8px",
                              fontSize: 12,
                            }}
                          >
                            <option value="">Seleccionar curso</option>
                            {courses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.title}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={
                              !assignmentSelections[student.id] ||
                              savingUserId === student.id
                            }
                            onClick={() => handleAssignCourse(student)}
                          >
                            {student.role === "mentor" ||
                            student.role === "docente"
                              ? "Asignar"
                              : "Matricular"}
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
      )}

      {/* Modal Registrar Alumno */}
      {showAddStudentModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddStudentModal(false)}
        >
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px" }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 800 }}>
                Registrar Nuevo Usuario
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Crea una cuenta y asigna su rol inicial.
              </p>
            </div>

            <form
              onSubmit={handleAddStudentSubmit}
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
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
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                  }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
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
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
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
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                  }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
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
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                  }}
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
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
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
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
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 800 }}>
                Publicar Nuevo Programa Curricular
              </h3>
            </div>

            <form
              onSubmit={handleCreateCourseSubmit}
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Título del Programa
                </label>
                <input
                  type="text"
                  placeholder="Ej: Levantamiento de Capital Serie A para Startups"
                  value={courseForm.title}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, title: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                  }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Tagline / Promesa de Valor
                </label>
                <input
                  type="text"
                  placeholder="Ej: Prepara tu Data Room, métricas de retención y pitch deck institucional."
                  value={courseForm.tagline}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, tagline: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text-dim)",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Categoría
                  </label>
                  <select
                    value={courseForm.category}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, category: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-deep)",
                      border: "1px solid var(--border-medium)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                    }}
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
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text-dim)",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Mentor Asignado
                  </label>
                  <select
                    value={courseForm.mentorName}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        mentorName: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-deep)",
                      border: "1px solid var(--border-medium)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                    }}
                  >
                    {mentors.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowCreateCourseModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
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
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 800 }}>
                Agendar Nueva Clase en Vivo
              </h3>
            </div>

            <form
              onSubmit={handleScheduleLiveSubmit}
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Curso
                </label>
                <select
                  value={liveForm.courseId}
                  onChange={(e) =>
                    setLiveForm({ ...liveForm, courseId: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                  }}
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
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "#FFF7ED",
                      border: "1px solid #FED7AA",
                      color: "#9A3412",
                      fontSize: "12px",
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: "8px" }}>
                      Primero necesitas crear un curso.
                    </div>
                    <div style={{ marginBottom: "10px" }}>
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
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Tema de la Sesión
                </label>
                <input
                  type="text"
                  placeholder="Ej: Auditoría en vivo de Modelos Financieros"
                  value={liveForm.title}
                  onChange={(e) =>
                    setLiveForm({ ...liveForm, title: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                  }}
                  required
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text-dim)",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Fecha y Horario
                  </label>
                  <input
                    type="datetime-local"
                    value={liveForm.scheduledAt}
                    onChange={(e) =>
                      setLiveForm({ ...liveForm, scheduledAt: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-deep)",
                      border: "1px solid var(--border-medium)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                    }}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text-dim)",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Mentor
                  </label>
                  <select
                    value={liveForm.mentorName}
                    onChange={(e) =>
                      setLiveForm({ ...liveForm, mentorName: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-deep)",
                      border: "1px solid var(--border-medium)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                    }}
                  >
                    {mentors.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
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
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                  }}
                  required
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
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
                  disabled={courses.length === 0}
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
