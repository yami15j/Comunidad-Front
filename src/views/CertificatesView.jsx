import React from 'react';
import { Award, Download, Share2, ShieldCheck, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';

export function CertificatesView({ user }) {
  const certificateData = {
    id: "TRX-CERT-2026-8941",
    courseTitle: "Especialización en Machine de Ventas B2B & Prospección Outbound",
    issueDate: "14 de Septiembre, 2026",
    recipient: user.name,
    company: "ScaleTech",
    hours: "18 Horas Académicas y Prácticas",
    grade: "Distinción de Honor",
    director: "Dirección Académica Traction",
    mentor: "Sofía Valenzuela"
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-amber">
            <Award size={14} />
            <span>Acreditaciones Oficiales</span>
          </span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
          Certificaciones & Diplomas Ejecutivos
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Acreditaciones verificables que respaldan tus competencias operativas y de liderazgo comercial.
        </p>
      </div>

      {/* Diploma Ejecutivo en Formato Sólido y Corporativo (Sin Degradados) */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '2px solid var(--brand-celeste-border)',
        boxShadow: 'var(--shadow-lg)',
        borderRadius: 'var(--radius-lg)',
        padding: '44px 36px',
        position: 'relative'
      }}>
        {/* Encabezado del Certificado */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--brand-celeste-subtle)',
            padding: '7px 18px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--brand-celeste-border)',
            marginBottom: '16px'
          }}>
            <ShieldCheck size={18} style={{ color: 'var(--brand-celeste)' }} />
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--brand-celeste)', textTransform: 'uppercase' }}>
              COMUNIDAD DEL INTERCAMBIO
            </span>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
            Por cuanto se certifica que
          </h2>

          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', margin: '10px 0 4px', letterSpacing: '-0.01em' }}>
            {certificateData.recipient}
          </div>

          <div style={{ fontSize: '14px', color: 'var(--brand-celeste)', fontWeight: 600 }}>
            {certificateData.company}
          </div>
        </div>

        {/* Cuerpo del Diploma */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 32px' }}>
          <p style={{ fontSize: '14.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Ha completado satisfactoriamente los requisitos curriculares, evaluaciones prácticas y defensa de modelo comercial del programa:
          </p>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: '10px', lineHeight: '1.4' }}>
            {certificateData.courseTitle}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '8px' }}>
            {certificateData.hours} • Calificación: <strong>{certificateData.grade}</strong>
          </div>
        </div>

        {/* Firmas y Sello de Validación */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingTop: '28px',
          borderTop: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{certificateData.mentor}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Mentor Líder del Programa</div>
          </div>

          {/* Sello Corporativo Central */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-celeste)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: 'var(--shadow-sm)',
              margin: '0 auto 6px'
            }}>
              <Award size={28} />
            </div>
            <div style={{ fontSize: '10px', color: 'var(--brand-celeste)', fontWeight: 800, letterSpacing: '0.08em' }}>
              SELLO DE EXCELENCIA
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID de Verificación Oficial:</div>
            <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--brand-celeste)', fontWeight: 700 }}>
              {certificateData.id}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{certificateData.issueDate}</div>
          </div>
        </div>
      </div>

      {/* Botones de Exportación */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <button 
          className="btn btn-primary"
          onClick={() => alert(`Generando e imprimiendo certificado PDF oficial (${certificateData.id})...`)}
          style={{ gap: '8px' }}
        >
          <Download size={16} />
          <span>Descargar Diploma Oficial (PDF)</span>
        </button>

        <button 
          className="btn btn-secondary"
          onClick={() => alert('Generando enlace para añadir insignia a tu perfil de LinkedIn...')}
          style={{ gap: '8px' }}
        >
          <Share2 size={16} />
          <span>Añadir a LinkedIn Profile</span>
        </button>
      </div>
    </div>
  );
}

export default CertificatesView;
