import React, { useState } from 'react';
import { BookOpen, Clock, Layers3, ListVideo, Paperclip, Play } from 'lucide-react';

export function CoursesListView({ courses, onSelectCourse }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...new Set(courses.map((course) => course.category).filter(Boolean))];

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) || (c.tagline || '').toLowerCase().includes(search.toLowerCase()) || (c.mentorName || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px'
            }}
          >
            <span className="badge badge-emerald">
              <BookOpen size={14} />
              <span>Área de aprendizaje</span>
            </span>
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--text-main)'
            }}
          >
            Mis cursos
          </h1>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '14px',
              marginTop: '4px'
            }}
          >
            Accede a los módulos, lecciones, videos y materiales de los cursos donde estás matriculado.
          </p>
        </div>

        {/* Buscador */}
        <div style={{ width: '300px' }}>
          <input
            type="text"
            placeholder="Buscar curso o mentor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Categorías */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              border: selectedCategory === cat ? '1px solid var(--brand-celeste)' : '1px solid var(--border-subtle)',
              backgroundColor: selectedCategory === cat ? 'var(--brand-celeste-subtle)' : 'var(--bg-surface)',
              color: selectedCategory === cat ? 'var(--brand-celeste)' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {cat === 'all' ? 'Todos los cursos' : cat}
          </button>
        ))}
      </div>

      {/* Grid de Cursos (Sin degradados) */}
      {filteredCourses.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <BookOpen size={34} style={{ color: 'var(--brand-celeste)', marginBottom: 12 }} />
          <h3 style={{ color: 'var(--text-main)', marginBottom: 6 }}>No hay cursos disponibles</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Los cursos que te correspondan aparecerán aquí cuando se creen o te matriculen.</p>
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '24px'
        }}
      >
        {filteredCourses.map((course) => {
          const hasContent = course.totalLessonsCount > 0;
          return (
            <div
              key={course.id}
              className={`card ${hasContent ? 'card-interactive' : ''}`}
              onClick={() => hasContent && onSelectCourse(course)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                cursor: hasContent ? 'pointer' : 'default'
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  position: 'relative',
                  height: '190px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  marginBottom: '16px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                <span className="badge badge-emerald" style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  {course.category}
                </span>

                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    right: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#FFFFFF',
                      fontWeight: 600
                    }}
                  >
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {course.estimatedHours}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#FFFFFF',
                      fontWeight: 700
                    }}
                  >
                    {course.totalLessonsCount} lecciones
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--brand-celeste)',
                    fontWeight: 700,
                    marginBottom: '4px'
                  }}
                >
                  Nivel {course.level}
                </div>
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    marginBottom: '8px',
                    lineHeight: '1.3'
                  }}
                >
                  {course.title}
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    lineHeight: '1.5',
                    marginBottom: '16px'
                  }}
                >
                  {course.tagline}
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginBottom: '16px'
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      fontSize: '11px'
                    }}
                  >
                    <Layers3 size={12} /> {course.totalModulesCount} módulos
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      fontSize: '11px'
                    }}
                  >
                    <ListVideo size={12} /> {course.totalLessonsCount} lecciones
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      fontSize: '11px'
                    }}
                  >
                    <Paperclip size={12} /> {course.totalResourcesCount} recursos
                  </span>
                </div>

                {/* Mentor */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: 'auto',
                    marginBottom: '16px'
                  }}
                >
                  <img
                    src={course.mentorAvatar}
                    alt={course.mentorName}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: '1px solid var(--border-medium)'
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--text-main)'
                      }}
                    >
                      {course.mentorName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{course.mentorRole}</div>
                  </div>
                </div>

                {/* Barra de Progreso y Botón */}
                <div
                  style={{
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ width: '130px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        marginBottom: '4px'
                      }}
                    >
                      <span style={{ color: 'var(--text-dim)' }}>Progreso</span>
                      <span
                        style={{
                          color: 'var(--brand-celeste)',
                          fontWeight: 700
                        }}
                      >
                        {course.progressPercent}%
                      </span>
                    </div>
                    <div className="progress-bar-container" style={{ height: '6px' }}>
                      <div className="progress-bar-fill" style={{ width: `${course.progressPercent}%` }} />
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!hasContent}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasContent) onSelectCourse(course);
                    }}
                    style={{ gap: '6px', opacity: hasContent ? 1 : 0.6 }}
                  >
                    <Play size={13} fill="currentColor" />
                    <span>{hasContent ? (course.progressPercent > 0 ? 'Continuar' : 'Empezar') : 'Sin contenido'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CoursesListView;
