import React, { useState } from 'react';
import { Users, Star, BookOpen, Radio, Sparkles, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';

export function MentorsView({ mentors, onSelectCourse, courses }) {
  const [selectedMentor, setSelectedMentor] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-emerald">
            <Users size={14} />
            <span>Red de Mentores de Élite</span>
          </span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
          Mentores & Operadores de Negocios
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          No te enseñan teóricos. Aprendes de fundadores, directores y ejecutivos que han escalado empresas reales.
        </p>
      </div>

      {/* Grid de Mentores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {mentors.map((mentor) => (
          <div 
            key={mentor.id}
            className="card card-interactive"
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
              <img 
                src={mentor.avatar} 
                alt={mentor.name} 
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: 'var(--radius-md)',
                  objectFit: 'cover',
                  border: '2px solid var(--brand-celeste)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>{mentor.name}</h3>
                  <ShieldCheck size={16} style={{ color: 'var(--brand-celeste)' }} title="Mentor Verificado" />
                </div>
                <div style={{ fontSize: '13px', color: 'var(--brand-celeste)', fontWeight: 600, marginTop: '2px' }}>
                  {mentor.role}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  {mentor.company}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
              {mentor.bio}
            </p>

            {/* Especialidades */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
              {mentor.specialties.map((spec, i) => (
                <span 
                  key={i} 
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {spec}
                </span>
              ))}
            </div>

            {/* Footer con Stats y Acción */}
            <div style={{
              marginTop: 'auto',
              paddingTop: '14px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-dim)' }}>
                <span>★ <strong style={{ color: 'var(--brand-celeste)' }}>{mentor.rating}</strong></span>
                <span>•</span>
                <span>{mentor.studentsCount} alumnos</span>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedMentor(mentor)}
              >
                Ver Perfil Completo
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detalle de Mentor */}
      {selectedMentor && (
        <div className="modal-backdrop" onClick={() => setSelectedMentor(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <img 
                src={selectedMentor.avatar} 
                alt={selectedMentor.name}
                style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid var(--brand-celeste)' }}
              />
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{selectedMentor.name}</h2>
                <div style={{ color: 'var(--brand-celeste)', fontWeight: 600, fontSize: '13px' }}>
                  {selectedMentor.role} • {selectedMentor.company}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  ★ {selectedMentor.rating} valoración promedio • {selectedMentor.studentsCount} empresarios entrenados
                </div>
              </div>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px' }}>
                  Trayectoria y Filosofía
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  {selectedMentor.bio}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px' }}>
                  Programas y Clases a su Cargo
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                        Machine de Ventas B2B & Prospección Outbound
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-celeste)' }}>12 Lecciones • Programa Activo</div>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedMentor(null);
                        onSelectCourse(courses[0]);
                      }}
                    >
                      Ir al Curso
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-elevated)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedMentor(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
