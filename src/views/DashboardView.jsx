import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Megaphone,
  Play,
  Radio,
  Sparkles,
  UserRound,
} from 'lucide-react';

const dateFormatter = new Intl.DateTimeFormat('es-EC', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const announcementDateFormatter = new Intl.DateTimeFormat('es-EC', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function getCountdown(scheduledAt, currentTime) {
  const target = new Date(scheduledAt).getTime();
  const difference = target - currentTime;
  if (!Number.isFinite(target) || difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference % 86_400_000) / 3_600_000),
    minutes: Math.floor((difference % 3_600_000) / 60_000),
    seconds: Math.floor((difference % 60_000) / 1_000),
  };
}

function MetricCard({ icon: Icon, value, label, accent = 'var(--brand-celeste)' }) {
  return (
    <div className="stat-card" style={{ minWidth: '170px', flex: '1 1 170px' }}>
      <div className="stat-icon-wrapper" style={{ color: accent }}>
        <Icon size={20} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div
      style={{
        padding: '34px 22px',
        border: '1px dashed var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
        color: 'var(--text-muted)',
      }}
    >
      <Icon size={28} style={{ marginBottom: '10px', color: 'var(--brand-celeste)' }} />
      <div style={{ color: 'var(--text-main)', fontWeight: 700, marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '13px', lineHeight: 1.5 }}>{description}</div>
    </div>
  );
}

export function DashboardView({
  user,
  courses,
  liveClasses,
  announcements = [],
  onSelectCourse,
  onOpenLiveSession,
  onNavigate,
}) {
  const upcomingClasses = useMemo(() => {
    return [...liveClasses]
      .filter((liveClass) => liveClass.effectiveStatus !== 'ended')
      .sort((left, right) => {
        const leftDate = new Date(left.scheduledAt || left.createdAt).getTime();
        const rightDate = new Date(right.scheduledAt || right.createdAt).getTime();
        return leftDate - rightDate;
      });
  }, [liveClasses]);
  const featuredLive = upcomingClasses[0];
  const featuredStatus = featuredLive?.effectiveStatus;
  const featuredScheduledAt = featuredLive?.scheduledAt;
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const countdown = getCountdown(featuredScheduledAt, currentTime);

  useEffect(() => {
    if (!featuredScheduledAt || featuredStatus === 'live') return undefined;
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [featuredScheduledAt, featuredStatus]);

  const activeCourse = courses.find((course) => (
    course.totalLessonsCount > 0 && course.progressPercent > 0 && course.progressPercent < 100
  )) || courses.find((course) => course.totalLessonsCount > 0);
  const nextLesson = activeCourse?.modules
    .flatMap((courseModule) => courseModule.lessons)
    .find((lesson) => !lesson.completed);
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'estudiante';
  const stats = user?.stats || {};
  const hoursWatched = Number(stats.totalHoursWatched || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ maxWidth: '620px' }}>
          <span className="badge badge-emerald" style={{ marginBottom: '10px' }}>
            <Sparkles size={13} />
            <span>Panel del estudiante</span>
          </span>
          <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text-main)' }}>
            Hola, {firstName} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '6px', lineHeight: 1.6 }}>
            Consulta tus cursos, retoma tu aprendizaje y revisa lo próximo en tu agenda.
          </p>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <CheckCircle2 size={15} style={{ color: 'var(--brand-celeste)' }} />
          Progreso sincronizado con tu cuenta
        </div>
      </section>

      <section style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }} aria-label="Resumen del estudiante">
        <MetricCard icon={BookOpen} value={stats.enrolledCourses ?? courses.length} label="Cursos inscritos" />
        <MetricCard icon={CheckCircle2} value={stats.completedLessons ?? 0} label="Lecciones completadas" />
        <MetricCard icon={GraduationCap} value={`${stats.averageProgress ?? 0}%`} label="Progreso promedio" />
        <MetricCard icon={Clock3} value={`${hoursWatched.toLocaleString('es-EC')} h`} label="Tiempo completado" />
      </section>

      {featuredLive && (
        <section className="live-banner" aria-labelledby="next-class-title">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              alignItems: 'center',
            }}
          >
            <div>
              <span className="badge badge-live" style={{ marginBottom: '12px' }}>
                <Radio size={14} />
                <span>{featuredLive.effectiveStatus === 'live' ? 'EN VIVO AHORA' : 'PRÓXIMA CLASE'}</span>
              </span>
              <h2 id="next-class-title" style={{ fontSize: '23px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
                {featuredLive.title}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>
                {featuredLive.subtitle}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', color: 'var(--text-main)', fontSize: '13px', fontWeight: 650 }}>
                <CalendarDays size={16} style={{ color: 'var(--brand-celeste)' }} />
                {Number.isNaN(new Date(featuredLive.scheduledAt).getTime())
                  ? 'Fecha por confirmar'
                  : dateFormatter.format(new Date(featuredLive.scheduledAt))}
                <span style={{ color: 'var(--text-dim)' }}>• {featuredLive.duration}</span>
              </div>
            </div>

            <div
              style={{
                padding: '22px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-surface-elevated)',
              }}
            >
              {featuredLive.effectiveStatus === 'live' ? (
                <div style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 800, color: 'var(--brand-celeste)' }}>
                  La sala ya está abierta
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                  {[
                    ['Días', countdown.days],
                    ['Horas', countdown.hours],
                    ['Min', countdown.minutes],
                    ['Seg', countdown.seconds],
                  ].map(([label, value]) => (
                    <div key={label} style={{ flex: 1, minWidth: 50, textAlign: 'center' }}>
                      <div style={{ fontSize: '25px', fontWeight: 800, color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
                        {String(value).padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => onOpenLiveSession(featuredLive)}>
                <Radio size={16} />
                <span>{featuredLive.effectiveStatus === 'live' ? 'Entrar a la clase' : 'Ver detalles de la clase'}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {activeCourse && (
        <section
          className="card"
          style={{
            padding: '24px 28px',
            borderLeft: '4px solid var(--brand-celeste)',
            borderColor: 'var(--brand-celeste-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 360px' }}>
              <div style={{ color: 'var(--brand-celeste)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '7px' }}>
                Continuar aprendiendo
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>{activeCourse.title}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '5px' }}>
                {nextLesson ? `Siguiente lección: ${nextLesson.title}` : 'Has completado todas las lecciones publicadas.'}
              </p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '15px' }}>
                <div className="progress-bar-container" style={{ flex: 1, height: '8px' }}>
                  <div className="progress-bar-fill" style={{ width: `${activeCourse.progressPercent}%` }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-celeste)', whiteSpace: 'nowrap' }}>
                  {activeCourse.progressPercent}%
                </span>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => onSelectCourse(activeCourse)}>
              <Play size={17} fill="currentColor" />
              <span>Retomar curso</span>
            </button>
          </div>
        </section>
      )}

      <section aria-labelledby="courses-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '16px', marginBottom: '17px', flexWrap: 'wrap' }}>
          <div>
            <h2 id="courses-title" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>Mis cursos</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '3px' }}>Solo aparecen los cursos asociados a tu matrícula.</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('courses')}>
            Ver todos <ArrowRight size={14} />
          </button>
        </div>

        {courses.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px' }}>
            {courses.map((course) => {
              const hasContent = course.totalLessonsCount > 0;
              return (
                <article key={course.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '150px', position: 'relative', overflow: 'hidden' }}>
                    <img src={course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span className="badge badge-emerald" style={{ position: 'absolute', top: '12px', left: '12px' }}>{course.category}</span>
                  </div>
                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 750, color: 'var(--text-main)', lineHeight: 1.35 }}>{course.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5, marginTop: '7px' }}>{course.tagline}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginTop: '16px' }}>
                      {course.mentorAvatar ? (
                        <img src={course.mentorAvatar} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--brand-celeste-subtle)', color: 'var(--brand-celeste)' }}>
                          <UserRound size={15} />
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 650 }}>{course.mentorName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{course.mentorRole}</div>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '13px', marginTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '7px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {hasContent ? `${course.completedLessonsCount} de ${course.totalLessonsCount} lecciones` : 'Contenido por publicar'}
                        </span>
                        <span style={{ color: 'var(--brand-celeste)', fontWeight: 700 }}>{course.progressPercent}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${course.progressPercent}%` }} />
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={!hasContent}
                      onClick={() => hasContent && onSelectCourse(course)}
                      style={{ marginTop: '16px', width: '100%', opacity: hasContent ? 1 : 0.6 }}
                    >
                      {hasContent ? 'Abrir curso' : 'Esperando contenido'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="Aún no tienes cursos asignados"
            description="Cuando el administrador registre tu matrícula, el curso aparecerá aquí automáticamente."
          />
        )}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '22px' }}>
        <section className="card" aria-labelledby="schedule-title">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 id="schedule-title" style={{ fontSize: '18px', fontWeight: 750, color: 'var(--text-main)' }}>Próximas clases</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '3px' }}>Agenda de tus cursos inscritos</p>
            </div>
            <CalendarDays size={20} style={{ color: 'var(--brand-celeste)' }} />
          </div>

          {upcomingClasses.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcomingClasses.slice(0, 4).map((liveClass) => (
                <button
                  type="button"
                  key={liveClass.id}
                  onClick={() => onOpenLiveSession(liveClass)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'inherit',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', display: 'grid', placeItems: 'center', background: 'var(--brand-celeste-subtle)', color: 'var(--brand-celeste)', flexShrink: 0 }}>
                    {liveClass.effectiveStatus === 'live' ? <Radio size={18} /> : <CalendarDays size={18} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: 700 }}>{liveClass.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '3px' }}>
                      {liveClass.date} • {liveClass.time} • {liveClass.duration}
                    </div>
                  </div>
                  <ArrowRight size={15} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                </button>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('live')} style={{ marginTop: '4px' }}>
                Ver agenda completa
              </button>
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Sin clases programadas"
              description="Las nuevas sesiones aparecerán aquí cuando sean agendadas."
            />
          )}
        </section>

        <section className="card" aria-labelledby="news-title">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 id="news-title" style={{ fontSize: '18px', fontWeight: 750, color: 'var(--text-main)' }}>Novedades</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '3px' }}>Anuncios generales y de tus cursos</p>
            </div>
            <Bell size={20} style={{ color: 'var(--brand-celeste)' }} />
          </div>

          {announcements.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {announcements.map((announcement) => (
                <article key={announcement.id} style={{ padding: '13px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-elevated)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--brand-celeste)', fontSize: '11px', fontWeight: 700 }}>
                      {announcement.courseTitle || 'Comunidad'}
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '10px', whiteSpace: 'nowrap' }}>
                      {announcementDateFormatter.format(new Date(announcement.publishedAt))}
                    </span>
                  </div>
                  <h3 style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: 700, lineHeight: 1.4 }}>{announcement.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.5, marginTop: '5px' }}>{announcement.body}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Megaphone}
              title="No hay novedades por ahora"
              description="Los anuncios publicados en Supabase aparecerán aquí automáticamente."
            />
          )}
        </section>
      </div>
    </div>
  );
}

export default DashboardView;
