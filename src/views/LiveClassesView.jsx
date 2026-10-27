import React, { useState } from 'react';
import { 
  Radio, Calendar, Clock, Users, ArrowUpRight, 
  Download, Film, Sparkles, CheckCircle2, ChevronRight, 
  ExternalLink, Bookmark 
} from 'lucide-react';

export function LiveClassesView({ 
  liveClasses, 
  onOpenLiveSession, 
  onNavigate 
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Todas las Sesiones' },
    { id: 'ventas', label: 'Ventas & Crecimiento' },
    { id: 'finanzas', label: 'Finanzas & Escala' },
    { id: 'liderazgo', label: 'Liderazgo Ejecutivo' }
  ];

  const filteredClasses = selectedCategory === 'all' 
    ? liveClasses 
    : liveClasses.filter(c => c.category.toLowerCase().includes(selectedCategory));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header de la Sección */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-live">
              <Radio size={14} />
              <span>Interacción en Tiempo Real</span>
            </span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
            Clases en Vivo & Clínicas de Negocios
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Aprende directamente de mentores en activo, audita tus procesos y resuelve dudas en tiempo real.
          </p>
        </div>

        {/* Acceso Rápido a Videoteca de Grabaciones */}
        <button 
          className="btn btn-secondary"
          onClick={() => onNavigate('replays')}
          style={{ gap: '8px' }}
        >
          <Film size={16} />
          <span>Ver Grabaciones Anteriores (Replays)</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Filtros por Categoría */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              border: selectedCategory === cat.id ? '1px solid var(--brand-celeste)' : '1px solid var(--border-subtle)',
              backgroundColor: selectedCategory === cat.id ? 'var(--brand-celeste-subtle)' : 'var(--bg-surface)',
              color: selectedCategory === cat.id ? 'var(--brand-celeste)' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid de Clases en Vivo (Sólido, Sin Degradados) */}
      {filteredClasses.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Radio size={34} style={{ color: 'var(--brand-celeste)', marginBottom: 12 }} />
          <h3 style={{ color: 'var(--text-main)', marginBottom: 6 }}>No hay sesiones programadas</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Las próximas clases asignadas a tus cursos aparecerán aquí.</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredClasses.map((item) => (
          <div 
            key={item.id}
            className="card"
            style={{
              backgroundColor: item.isToday ? 'var(--brand-celeste-subtle)' : 'var(--bg-surface)',
              border: item.isToday ? '1px solid var(--brand-celeste-border)' : '1px solid var(--border-subtle)',
              borderLeft: item.isToday ? '4px solid var(--brand-celeste)' : '1px solid var(--border-subtle)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              alignItems: 'center'
            }}
          >
            {/* Detalles de la Clase */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span className={item.isToday ? 'badge badge-live' : 'badge badge-emerald'}>
                  {item.badge}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> {item.date} • <Clock size={14} /> {item.time} ({item.duration})
                </span>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', lineHeight: '1.3' }}>
                {item.title}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>
                {item.subtitle}
              </p>

              {/* Mentor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                  src={item.mentorAvatar} 
                  alt={item.mentorName} 
                  style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid var(--brand-celeste)' }} 
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{item.mentorName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--brand-celeste)', fontWeight: 600 }}>Mentor Oficial</div>
                </div>
              </div>
            </div>

            {/* Acciones y Materiales Previos */}
            <div style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Asistencia esperada</span>
                <span style={{ fontSize: '13px', color: 'var(--brand-celeste)', fontWeight: 700 }}>
                  <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {item.attendeesCount} empresarios registrados
                </span>
              </div>

              {/* Botón Principal para Entrar a la Sesión */}
              <button 
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '14px' }}
                onClick={() => onOpenLiveSession(item)}
              >
                <Radio size={16} />
                <span>{item.isToday ? 'Ingresar a Sala en Vivo' : 'Ver Sala y Reservar Asiento'}</span>
              </button>

              {/* Botón secundario para Calendario */}
              <button 
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                onClick={() => alert(`Añadiendo "${item.title}" a tu Google Calendar...`)}
              >
                <Calendar size={14} />
                <span>Agendar en Google Calendar</span>
              </button>

              {/* Materiales preparatorios si existen */}
              {item.deliverables && item.deliverables.length > 0 && (
                <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 600 }}>
                    Material previo para la clase:
                  </div>
                  {item.deliverables.map((deliv, idx) => (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        padding: '4px 0',
                        cursor: 'pointer'
                      }}
                      onClick={() => alert(`Descargando: ${deliv.name}`)}
                    >
                      <span style={{ textDecoration: 'underline' }}>{deliv.name}</span>
                      <Download size={12} style={{ color: 'var(--brand-celeste)' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LiveClassesView;
