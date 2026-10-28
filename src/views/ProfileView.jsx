import React, { useState } from "react";
import {
  User,
  Mail,
  MapPin,
  Camera,
  CheckCircle2,
  Save,
  Edit3,
  ArrowLeft,
} from "lucide-react";

export function ProfileView({ user, onUpdateUser, onNavigate }) {
  const roleLabel =
    user.role === "soporte" ? "Soporte" : user.role === "admin"
      ? "Administrador"
      : user.role === "mentor"
        ? "Mentor"
        : "Estudiante";
  const homeView =
    user.role === "soporte" ? "tickets" : user.role === "admin"
      ? "admin-overview"
      : user.role === "mentor"
        ? "mentor-dashboard"
        : "dashboard";
  const profileSubtitle =
    user.role === "soporte" ? "Comunidad del Intercambio • Equipo de soporte" : user.role === "admin"
      ? "Comunidad del Intercambio • Gestión administrativa"
      : user.role === "mentor"
        ? "Comunidad del Intercambio • Perfil profesional del mentor"
        : "Comunidad del Intercambio • Datos académicos";
  // Estado del formulario de edición
  const [formData, setFormData] = useState({
    name: user.name || "",
    title: user.title || "",
    company: user.company || "",
    email: user.email || "",
    phone: user.phone || "",
    location: user.location || "",
    linkedin: user.linkedin || "",
    website: user.website || "",
    bio: user.bio || "",
    avatar:
      user.avatar ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  // Fotografías de muestra ejecutivas listas para usar
  const presetPhotos = [
    {
      label: "Foto 1",
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    },
    {
      label: "Foto 2",
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    },
    {
      label: "Foto 3",
      url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    },
    {
      label: "Foto 4",
      url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    },
    {
      label: "Foto 5",
      url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
    },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError("");
    setIsSaving(true);
    try {
      const saved = await onUpdateUser({ ...formData }, avatarFile);
      setFormData((current) => ({
        ...current,
        ...saved,
        name: saved.name,
        avatar: saved.avatar,
      }));
      setAvatarFile(null);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error) {
      setSaveError(error.message || "No se pudo guardar el perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange("avatar", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      {/* Alerta de confirmación al guardar */}
      {saveSuccess && (
        <div
          style={{
            padding: "14px 20px",
            backgroundColor: "var(--brand-celeste-subtle)",
            border: "1px solid var(--brand-celeste)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "var(--text-main)",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          <CheckCircle2
            size={18}
            style={{ color: "var(--brand-celeste)", flexShrink: 0 }}
          />
          <span>
            ¡Tu perfil y fotografía se han actualizado exitosamente en toda la
            plataforma!
          </span>
        </div>
      )}
      {saveError && (
        <div
          role="alert"
          style={{
            padding: "14px 20px",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "var(--radius-md)",
            color: "#991B1B",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {saveError}
        </div>
      )}

      {/* Encabezado Principal de la Vista (Estilo idéntico a la solicitud) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              backgroundColor: "var(--brand-celeste-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--brand-celeste)",
            }}
          >
            <User size={22} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "var(--text-main)",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Mi Perfil de {roleLabel}
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                margin: "2px 0 0 0",
              }}
            >
              {profileSubtitle}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {onNavigate && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate(homeView)}
              style={{ gap: "6px" }}
              title="Volver a la pantalla de Dashboard"
            >
              <ArrowLeft size={14} />
              <span>Volver</span>
            </button>
          )}

          <button
            className={isEditing ? "btn btn-secondary" : "btn btn-primary"}
            onClick={() => setIsEditing(!isEditing)}
            style={{ gap: "8px", padding: "9px 18px" }}
          >
            <Edit3 size={15} />
            <span>{isEditing ? "Ver Perfil" : "Editar Datos"}</span>
          </button>
        </div>
      </div>

      {/* Tarjeta Principal de Perfil con Fotografía y Descripción */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        {/* Franja superior estética */}
        <div
          style={{
            height: "110px",
            backgroundColor: "#0F172A",
            borderBottom: "2px solid var(--brand-celeste)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "24px",
              bottom: "12px",
              color: "var(--brand-celeste)",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            COMUNIDAD DEL INTERCAMBIO • PERFIL OFICIAL
          </div>
        </div>

        <div style={{ padding: "0 32px 32px 32px" }}>
          {/* Fila del Avatar y Datos Clave */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginTop: "-54px",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "flex-end", gap: "20px" }}
            >
              {/* Fotografía del Estudiante */}
              <div style={{ position: "relative" }}>
                <img
                  src={formData.avatar}
                  alt={formData.name}
                  style={{
                    width: "108px",
                    height: "108px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "4px solid var(--bg-surface)",
                    boxShadow: "var(--shadow-md)",
                    backgroundColor: "var(--bg-surface-elevated)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                  title="Cambiar fotografía de perfil"
                  style={{
                    position: "absolute",
                    bottom: "4px",
                    right: "4px",
                    backgroundColor: "var(--brand-celeste)",
                    color: "#FFFFFF",
                    border: "2px solid var(--bg-surface)",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <Camera size={14} />
                </button>
              </div>

              {/* Nombre, Título y Badges */}
              <div style={{ paddingBottom: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      color: "var(--text-main)",
                      margin: 0,
                    }}
                  >
                    {formData.name}
                  </h2>
                  <span
                    className="badge badge-emerald"
                    style={{ fontSize: "11px" }}
                  >
                    <CheckCircle2 size={12} />
                    <span>Alumno Activo</span>
                  </span>
                  <span
                    className="badge badge-amber"
                    style={{ fontSize: "11px" }}
                  >
                    {user.plan || "Plan Scale Pass"}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--brand-celeste)",
                    marginTop: "4px",
                  }}
                >
                  {formData.title}{" "}
                  {formData.company ? `• ${formData.company}` : ""}
                </div>
              </div>
            </div>

            {/* Datos de Contacto Rápidos */}
            <div
              style={{
                display: "flex",
                gap: "16px",
                fontSize: "13px",
                color: "var(--text-muted)",
                flexWrap: "wrap",
                paddingBottom: "6px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Mail size={14} style={{ color: "var(--brand-celeste)" }} />
                <span>{formData.email}</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <MapPin size={14} style={{ color: "var(--brand-celeste)" }} />
                <span>{formData.location}</span>
              </div>
            </div>
          </div>

          {/* Selector desplegable de fotografía de perfil */}
          {showPhotoPicker && (
            <div
              style={{
                padding: "16px 20px",
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--text-main)",
                  marginBottom: "10px",
                }}
              >
                Selecciona tu fotografía o sube una desde tu computadora:
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  flexWrap: "wrap",
                  marginBottom: "14px",
                }}
              >
                {presetPhotos.map((p, idx) => (
                  <img
                    key={idx}
                    src={p.url}
                    alt={p.label}
                    onClick={() => {
                      handleInputChange("avatar", p.url);
                      setAvatarFile(null);
                    }}
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      cursor: "pointer",
                      border:
                        formData.avatar === p.url
                          ? "3px solid var(--brand-celeste)"
                          : "2px solid var(--border-subtle)",
                      transition: "transform 0.15s ease",
                    }}
                    title={`Elegir ${p.label}`}
                  />
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <label
                  className="btn btn-secondary btn-sm"
                  style={{ cursor: "pointer", gap: "6px" }}
                >
                  <Camera size={14} />
                  <span>Subir foto desde tu equipo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: "none" }}
                  />
                </label>

                <input
                  type="url"
                  placeholder="O pega aquí la URL de tu foto..."
                  value={formData.avatar}
                  onChange={(e) => handleInputChange("avatar", e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: "220px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    border: "1px solid var(--border-medium)",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-main)",
                  }}
                />

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowPhotoPicker(false)}
                >
                  Listo
                </button>
              </div>
            </div>
          )}

          {/* DESCRIPCIÓN DEL PERFIL (Requisito solicitado: Abajo del perfil una descripción) */}
          <div
            style={{
              marginTop: "16px",
              padding: "20px 24px",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-subtle)",
              borderLeft: "4px solid var(--brand-celeste)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Descripción & Biografía Profesional
              </span>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--brand-celeste)",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Editar descripción
              </button>
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-main)",
                lineHeight: "1.6",
                margin: 0,
                fontStyle: "normal",
              }}
            >
              "{formData.bio}"
            </p>
          </div>

          {/* Tarjetas de Métricas de Formación */}
          {user.role === "student" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "14px",
                marginTop: "20px",
              }}
            >
              <div
                style={{
                  padding: "14px 18px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Cursos Activos
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "var(--text-main)",
                    marginTop: "4px",
                  }}
                >
                  {user.stats?.coursesInProgress ?? 0} Programas
                </div>
              </div>

              <div
                style={{
                  padding: "14px 18px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Lecciones Vistas
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "var(--brand-celeste)",
                    marginTop: "4px",
                  }}
                >
                  {user.stats?.completedLessons ?? 0} Completadas
                </div>
              </div>

              <div
                style={{
                  padding: "14px 18px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Horas de Formación
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "var(--text-main)",
                    marginTop: "4px",
                  }}
                >
                  {user.stats?.totalHoursWatched ?? 0} Horas
                </div>
              </div>

              <div
                style={{
                  padding: "14px 18px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Asistencia a Vivos
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "var(--text-main)",
                    marginTop: "4px",
                  }}
                >
                  {user.stats?.attendanceRate || "No medido"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* APARTADO PARA EDITAR EL PERFIL (Formulario de Edición) */}
      {isEditing && (
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--brand-celeste-border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-md)",
            padding: "32px",
          }}
        >
          <div
            style={{
              marginBottom: "24px",
              borderBottom: "1px solid var(--border-subtle)",
              paddingBottom: "16px",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "var(--text-main)",
                margin: "0 0 6px 0",
              }}
            >
              Editar Información de Perfil
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              Actualiza tus datos para que la comunidad te identifique
              correctamente.
            </p>
          </div>

          <form
            onSubmit={handleSave}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Grid de Campos Personales */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "18px",
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
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-medium)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
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
                  Cargo o Título Profesional
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Ej: Fundador & CEO"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-medium)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
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
                  Empresa u Organización
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  placeholder="Ej: ScaleTech LATAM"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-medium)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
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
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-medium)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
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
                  Teléfono / WhatsApp de Contacto
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+52 55 1234 5678"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-medium)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
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
                  Ubicación (Ciudad, País)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="Ej: Madrid, España"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-medium)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Campo: DESCRIPCIÓN Y BIOGRAFÍA */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                  }}
                >
                  Descripción del Perfil / Biografía Personal
                </label>
                <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                  {formData.bio.length} caracteres
                </span>
              </div>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Escribe una breve descripción sobre tu perfil profesional, tus objetivos de negocio y áreas de interés..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-medium)",
                  backgroundColor: "var(--bg-surface-elevated)",
                  color: "var(--text-main)",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
                required
              />
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--text-dim)",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                Esta descripción aparecerá destacada abajo de tu fotografía y
                nombre de perfil.
              </span>
            </div>

            {/* Enlace URL de Fotografía */}
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
                URL de Fotografía de Perfil
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => handleInputChange("avatar", e.target.value)}
                  placeholder="https://..."
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-medium)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowPhotoPicker(true)}
                >
                  <Camera size={14} />
                  <span>Galería</span>
                </button>
              </div>
            </div>

            {/* Botones de Guardar y Cancelar */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "12px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ gap: "8px", padding: "10px 24px" }}
                disabled={isSaving}
              >
                <Save size={15} />
                <span>{isSaving ? "Guardando…" : "Guardar Cambios"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProfileView;
