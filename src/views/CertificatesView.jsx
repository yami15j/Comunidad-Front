import React from "react";
import { Award, Download, Share2, ShieldCheck } from "lucide-react";

export function CertificatesView({ user }) {
  const certificateData = {
    id: "TRX-CERT-2026-8941",
    courseTitle:
      "Especialización en Machine de Ventas B2B & Prospección Outbound",
    issueDate: "14 de Septiembre, 2026",
    recipient: user.name,
    company: "ScaleTech",
    hours: "18 Horas Académicas y Prácticas",
    grade: "Distinción de Honor",
    director: "Dirección Académica Traction",
    mentor: "Sofía Valenzuela",
  };

  return (
    <div className="flex flex-col gap-7">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 [margin-bottom:6px]">
          <span className="badge badge-amber">
            <Award size={14} />
            <span>Acreditaciones Oficiales</span>
          </span>
        </div>
        <h1 className="text-2xl sm:text-[28px] font-extrabold text-ink">
          Certificaciones & Diplomas Ejecutivos
        </h1>
        <p className="text-muted text-[14px] mt-1">
          Acreditaciones verificables que respaldan tus competencias operativas
          y de liderazgo comercial.
        </p>
      </div>

      {/* Diploma Ejecutivo en Formato Sólido y Corporativo (Sin Degradados) */}
      <div className="bg-surface [border:2px_solid_var(--brand-celeste-border)] shadow-panel [border-radius:var(--radius-lg)] [padding:44px_36px] relative">
        {/* Encabezado del Certificado */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center [gap:10px] bg-brand-soft [padding:7px_18px] [border-radius:var(--radius-full)] [border:1px_solid_var(--brand-celeste-border)] mb-4">
            <ShieldCheck size={18} className="text-brand" />
            <span className="text-[12px] font-extrabold [letter-spacing:0.12em] text-brand uppercase">
              COMUNIDAD DEL INTERCAMBIO
            </span>
          </div>

          <h2 className="text-[20px] font-medium text-muted [letter-spacing:0.02em]">
            Por cuanto se certifica que
          </h2>

          <div className="text-2xl sm:text-[32px] font-extrabold text-ink [margin:10px_0_4px] [letter-spacing:-0.01em]">
            {certificateData.recipient}
          </div>

          <div className="text-[14px] text-brand font-semibold">
            {certificateData.company}
          </div>
        </div>

        {/* Cuerpo del Diploma */}
        <div className="text-center [max-width:680px] [margin:0_auto_32px]">
          <p className="text-[14.5px] text-muted [line-height:1.6]">
            Ha completado satisfactoriamente los requisitos curriculares,
            evaluaciones prácticas y defensa de modelo comercial del programa:
          </p>
          <div className="text-[20px] font-extrabold text-ink [margin-top:10px] [line-height:1.4]">
            {certificateData.courseTitle}
          </div>
          <div className="text-[12px] text-subtle mt-2">
            {certificateData.hours} • Calificación:{" "}
            <strong>{certificateData.grade}</strong>
          </div>
        </div>

        {/* Firmas y Sello de Validación */}
        <div className="flex justify-between items-end pt-7 [border-top:1px_solid_var(--border-subtle)] flex-wrap gap-5">
          <div>
            <div className="text-[14px] font-bold text-ink">
              {certificateData.mentor}
            </div>
            <div className="text-[11px] text-subtle">
              Mentor Líder del Programa
            </div>
          </div>

          {/* Sello Corporativo Central */}
          <div className="text-center">
            <div className="[width:56px] [height:56px] rounded-full bg-brand flex items-center justify-center text-on-brand shadow-panel [margin:0_auto_6px]">
              <Award size={28} />
            </div>
            <div className="text-[11px] text-brand font-extrabold [letter-spacing:0.08em]">
              SELLO DE EXCELENCIA
            </div>
          </div>

          <div className="text-right">
            <div className="text-[12px] text-muted">
              ID de Verificación Oficial:
            </div>
            <div className="text-[12px] [font-family:monospace] text-brand font-bold">
              {certificateData.id}
            </div>
            <div className="text-[11px] text-subtle">
              {certificateData.issueDate}
            </div>
          </div>
        </div>
      </div>

      {/* Botones de Exportación */}
      <div className="flex justify-center gap-4 flex-wrap">
        <button
          className="btn btn-primary gap-2"
          onClick={() =>
            alert(
              `Generando e imprimiendo certificado PDF oficial (${certificateData.id})...`,
            )
          }
        >
          <Download size={16} />
          <span>Descargar Diploma Oficial (PDF)</span>
        </button>

        <button
          className="btn btn-secondary gap-2"
          onClick={() =>
            alert(
              "Generando enlace para añadir insignia a tu perfil de LinkedIn...",
            )
          }
        >
          <Share2 size={16} />
          <span>Añadir a LinkedIn Profile</span>
        </button>
      </div>
    </div>
  );
}

export default CertificatesView;
