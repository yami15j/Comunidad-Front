import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Bell,
  Shield,
  User,
  Crown,
  ChevronDown,
  ChevronRight,
  Sparkles,
  LogOut,
  GraduationCap,
} from "lucide-react";

export function Header({
  user,
  currentRole,
  onOpenNotifications,
  unreadCount,
  onOpenMembershipModal,
  onNavigate,
  searchTerm,
  onSearchChange,
  onLogout,
  isSidebarOpen = true,
  onToggleSidebar,
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="header-bar">
      {/* Flechita para abrir el menú cuando esté guardado + Buscador */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {onToggleSidebar && !isSidebarOpen && (
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={onToggleSidebar}
            title="Abrir menú"
            style={{
              padding: 0,
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-main)",
              border: "1px solid var(--border-medium)",
              backgroundColor: "var(--bg-surface)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Buscador corporativo funcional */}
        <div className="header-search">
          <Search className="header-search-icon" size={17} />
          <input
            type="text"
            placeholder={
              currentRole === "soporte" ? "Buscar tickets por asunto..." : currentRole === "mentor"
                ? "Buscar alumnos, preguntas o lecciones..."
                : currentRole === "admin"
                  ? "Buscar cursos, profesores o alumnos..."
                  : "Buscar cursos, lecciones, recursos..."
            }
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Acciones del Header */}
      <div className="header-actions">
        {/* Badge del Rol Activo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {currentRole === "soporte" && <span className="badge badge-emerald">Soporte</span>}
          {currentRole === "student" && (
            <span className="badge badge-emerald" style={{ gap: "6px" }}>
              <User size={13} />
              <span>Estudiante</span>
            </span>
          )}
          {currentRole === "mentor" && (
            <span className="badge badge-emerald" style={{ gap: "6px" }}>
              <GraduationCap size={14} />
              <span>Mentor</span>
            </span>
          )}
          {currentRole === "admin" && (
            <span className="badge badge-amber" style={{ gap: "6px" }}>
              <Shield size={13} />
              <span>Administrador CMS</span>
            </span>
          )}
        </div>

        {/* Badge de Membresía / Plan Activo (Solo para estudiantes) */}
        {currentRole === "student" && (
          <button
            className="badge-membership"
            onClick={onOpenMembershipModal}
            title="Ver o cambiar plan de membresía"
          >
            <Crown size={14} />
            <span>{user.plan}</span>
          </button>
        )}

        {/* Notificaciones */}
        <button
          className="btn btn-secondary btn-sm"
          style={{
            position: "relative",
            padding: "8px 10px",
            borderRadius: "50%",
            width: "38px",
            height: "38px",
          }}
          onClick={onOpenNotifications}
          title="Notificaciones de clases y recursos"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                width: "9px",
                height: "9px",
                backgroundColor: "var(--brand-celeste)",
                borderRadius: "50%",
                border: "2px solid var(--bg-surface)",
              }}
            />
          )}
        </button>

        {/* Perfil del Usuario Activo */}
        <div style={{ position: "relative" }} ref={profileMenuRef}>
          <div
            className="user-pill"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title="Abrir menú de opciones"
            style={{ cursor: "pointer" }}
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="user-avatar"
              onClick={(e) => {
                // Al hacer clic en la foto, navegar directamente a la pantalla de perfil
                e.stopPropagation();
                setShowProfileMenu(false);
                onNavigate("profile");
              }}
              title="Ir a mi pantalla de perfil"
            />
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-plan-tag">
                <Sparkles size={11} />{" "}
                {user.title ? user.title.split("en")[0] : user.role}
              </span>
            </div>
            <ChevronDown
              size={14}
              style={{
                color: "var(--text-dim)",
                transition: "transform 0.2s",
                transform: showProfileMenu ? "rotate(180deg)" : "none",
              }}
            />
          </div>

          {/* Menú desplegable de perfil ("ese recuadro que está saliendo normalmente") */}
          {showProfileMenu && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: "280px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                padding: "16px",
                zIndex: 60,
              }}
            >
              {/* Tarjeta de usuario con foto, nombre y flecha para ir a la pantalla de perfil */}
              <div
                onClick={() => {
                  setShowProfileMenu(false);
                  onNavigate("profile");
                }}
                title="Abrir pantalla de Mi Perfil & Datos"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  marginBottom: "12px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--brand-celeste)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                }}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid var(--brand-celeste)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "var(--text-main)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.name}
                  </div>
                  <div
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "11px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.email}
                  </div>
                  <div
                    style={{
                      color: "var(--brand-celeste)",
                      fontSize: "11px",
                      marginTop: "2px",
                      fontWeight: 600,
                    }}
                  >
                    {user.title}
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  style={{ color: "var(--brand-celeste)", flexShrink: 0 }}
                />
              </div>

              {/* Botón Mi Perfil & Datos que navega a la pantalla de perfil */}
              {
                <button
                  type="button"
                  className="profile-datos-button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate("profile");
                  }}
                  title="Abrir pantalla Mi Perfil & Datos"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    border: "1.5px solid #BAE6FD",
                    backgroundColor: "#F0F9FF",
                    color: "#0284c7",
                    fontWeight: 700,
                    fontSize: "13.5px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    marginBottom: "14px",
                    boxShadow: "0 1px 3px rgba(2, 132, 199, 0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#E0F2FE";
                    e.currentTarget.style.borderColor = "#38BDF8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#F0F9FF";
                    e.currentTarget.style.borderColor = "#BAE6FD";
                  }}
                >
                  <User size={18} color="#0284c7" strokeWidth={2.2} />
                  <span
                    style={{ flex: 1, textAlign: "left", color: "#0284c7" }}
                  >
                    Mi Perfil & Datos
                  </span>
                </button>
              }

              {currentRole === "student" && user.stats && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>Lecciones completadas:</span>
                    <span
                      style={{ fontWeight: 700, color: "var(--text-main)" }}
                    >
                      {user.stats.completedLessons}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>Horas de formación:</span>
                    <span
                      style={{ fontWeight: 700, color: "var(--text-main)" }}
                    >
                      {user.stats.totalHoursWatched}h
                    </span>
                  </div>
                </div>
              )}

              {currentRole === "mentor" && user.stats && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>Alumnos activos:</span>
                    <span
                      style={{ fontWeight: 700, color: "var(--text-main)" }}
                    >
                      {user.stats.activeStudents}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>Progreso promedio:</span>
                    <span
                      style={{ fontWeight: 700, color: "var(--brand-celeste)" }}
                    >
                      {user.stats.averageProgress ?? 0}%
                    </span>
                  </div>
                </div>
              )}

              {currentRole === "admin" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>Alumnos registrados:</span>
                    <span
                      style={{ fontWeight: 700, color: "var(--text-main)" }}
                    >
                      {user.stats?.totalStudents ?? 0}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>Nivel de acceso:</span>
                    <span
                      style={{ fontWeight: 700, color: "var(--brand-celeste)" }}
                    >
                      Administrador
                    </span>
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {currentRole === "student" && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenMembershipModal();
                    }}
                  >
                    Gestionar Membresía
                  </button>
                )}

                <button
                  className="btn btn-secondary btn-sm"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    color: "#DC2626",
                    gap: "6px",
                  }}
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                >
                  <LogOut size={13} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
