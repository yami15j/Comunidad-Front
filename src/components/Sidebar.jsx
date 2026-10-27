import React from 'react';
import { 
  LayoutDashboard, BookOpen, Radio, Film, FolderDown, 
  Users, MessageSquare, Shield, 
  Sparkles, Compass, CheckCircle2, LogOut, GraduationCap, 
  HelpCircle, User, ChevronLeft 
} from 'lucide-react';

export function Sidebar({ 
  currentView, 
  onNavigate, 
  currentRole, 
  user, 
  liveClasses = [],
  onLogout,
  isOpen = true,
  onToggleSidebar 
}) {
  const liveNow = liveClasses.find((session) => session.isLiveNow);
  const upcoming = [...liveClasses]
    .filter((session) => session.effectiveStatus === 'scheduled')
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0];
  const liveBadge = liveNow
    ? 'EN VIVO'
    : upcoming
      ? new Date(upcoming.scheduledAt).toLocaleString('es-EC', {
          day: new Date(upcoming.scheduledAt).toDateString() === new Date().toDateString() ? undefined : '2-digit',
          month: new Date(upcoming.scheduledAt).toDateString() === new Date().toDateString() ? undefined : 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;
  const studentNavItems = [
    { id: 'tickets', label: 'Soporte', icon: HelpCircle },
    { id: 'dashboard', label: 'Mi Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Mis Programas', icon: BookOpen },
    { 
      id: 'live', 
      label: 'Clases en Vivo', 
      icon: Radio, 
      badge: liveBadge,
      badgeType: 'badge-live' 
    },
    { id: 'replays', label: 'Videoteca Replays', icon: Film },
    { id: 'library', label: 'Biblioteca & Recursos', icon: FolderDown },
    { id: 'mentors', label: 'Mentores de Élite', icon: Users },
    { id: 'community', label: 'Comunidad & Red', icon: MessageSquare }
  ];

  const mentorNavItems = [
    { id: 'mentor-dashboard', label: 'Panel del Mentor', icon: LayoutDashboard },
    { id: 'profile', label: 'Mi Perfil & Datos', icon: User },
    { 
      id: 'live', 
      label: 'Sala en Vivo (Host)', 
      icon: Radio, 
      badge: liveNow ? 'EN VIVO' : liveBadge,
      badgeType: 'badge-live' 
    },
    { id: 'replays', label: 'Mis Grabaciones (Replays)', icon: Film },
    { id: 'library', label: 'Biblioteca de Recursos', icon: FolderDown },
    { id: 'community', label: 'Comunidad de Alumnos', icon: MessageSquare }
  ];

  const adminNavItems = [
    { id: 'admin-overview', label: 'Panel General', icon: LayoutDashboard },
    { id: 'profile', label: 'Mi Perfil & Datos', icon: User },
    { id: 'admin-courses', label: 'Gestor de Cursos', icon: BookOpen },
    { id: 'admin-live', label: 'Agendar Vivos & Replays', icon: Radio },
    { id: 'admin-users', label: 'Usuarios & Permisos', icon: Users }
  ];

  // Determinar los ítems correspondientes al rol autenticado
  const getNavItems = () => {
    if (currentRole === 'soporte') return [{ id: 'tickets', label: 'Mesa de soporte', icon: HelpCircle }, { id: 'profile', label: 'Mi Perfil & Datos', icon: User }];
    if (currentRole === 'admin') return adminNavItems;
    if (currentRole === 'mentor') return mentorNavItems;
    return studentNavItems;
  };

  const getSectionTitle = () => {
    if (currentRole === 'soporte') return 'SOPORTE';
    if (currentRole === 'admin') return 'ADMINISTRACIÓN & CMS';
    if (currentRole === 'mentor') return 'CLAUSTRO DE MENTORES';
    return 'FORMACIÓN & ACELERACIÓN';
  };

  const navItems = getNavItems();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      {/* Brand & Logo con colores originales respetados */}
      <div 
        className="sidebar-brand" 
        style={{ cursor: 'pointer' }} 
        onClick={() => {
          if (currentRole === 'soporte') onNavigate('tickets');
          else if (currentRole === 'admin') onNavigate('admin-overview');
          else if (currentRole === 'mentor') onNavigate('mentor-dashboard');
          else onNavigate('dashboard');
        }}
      >
        <div className="brand-icon">
          <img 
            src="/logo.png" 
            alt="Comunidad del Intercambio" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div className="brand-title">
          <span className="brand-name">COMUNIDAD</span>
          <span className="brand-subtitle">DEL INTERCAMBIO</span>
        </div>
      </div>

      {/* Navigation List - Con la flechita aquí en la sección */}
      <div className="sidebar-nav">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 12px 6px'
        }}>
          <span className="sidebar-section-title" style={{ padding: 0 }}>
            {getSectionTitle()}
          </span>

          {/* Flechita para guardar el menú */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              title="Guardar menú"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--brand-celeste)';
                e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={18} className="nav-icon" />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`nav-badge ${item.badgeType}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {/* Botón Cerrar Sesión para cambiar de rol o salir */}
        <button 
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}
          onClick={onLogout}
          title="Cerrar sesión y volver al login"
        >
          <LogOut size={13} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
