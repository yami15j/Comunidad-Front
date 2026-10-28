import React from "react";
import { X, Crown, Check, Sparkles } from "lucide-react";

export function MembershipModal({
  isOpen,
  onClose,
  plans,
  currentTier,
  onSelectTier,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog [max-width:880px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="[padding:24px_28px] [border-bottom:1px_solid_var(--border-subtle)] flex items-center justify-between">
          <div>
            <div className="badge badge-emerald [margin-bottom:6px]">
              <Crown size={12} />
              <span>Niveles de Membresía</span>
            </div>
            <h2 className="text-[22px] font-extrabold text-ink">
              Elige tu Plan de Membresía
            </h2>
          </div>
          <button
            onClick={onClose}
            className="[background:none] [border:none] text-muted cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-7 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentTier;
            return (
              <div
                key={plan.id}
                style={{
                  backgroundColor: isCurrent
                    ? "var(--brand-celeste-subtle)"
                    : "var(--bg-surface)",
                  border: isCurrent
                    ? "2px solid var(--brand-celeste)"
                    : "1px solid var(--border-subtle)",
                }}
                className="[border-radius:var(--radius-lg)] p-6 flex flex-col relative shadow-panel"
              >
                {isCurrent && (
                  <div className="absolute [top:-12px] [left:50%] [transform:translateX(-50%)] bg-brand text-white text-[11px] font-extrabold [padding:3px_12px] [border-radius:var(--radius-full)] uppercase [letter-spacing:0.05em]">
                    Plan Actual
                  </div>
                )}

                <div className="mb-4">
                  <span
                    style={{
                      color: isCurrent
                        ? "var(--brand-celeste)"
                        : "var(--text-dim)",
                    }}
                    className="text-[11px] uppercase [letter-spacing:0.08em] font-bold"
                  >
                    {plan.badge}
                  </span>
                  <h3 className="text-[20px] font-extrabold text-ink mt-1">
                    {plan.name}
                  </h3>
                  <div className="text-[24px] font-extrabold text-ink mt-2">
                    {plan.price}
                  </div>
                  <p className="text-[12px] text-muted mt-2 [line-height:1.4]">
                    {plan.description}
                  </p>
                </div>

                <div className="[height:1px] [background:var(--border-subtle)] [margin:14px_0]" />

                <div className="[flex:1] flex flex-col [gap:10px] mb-5">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px]">
                      <Check
                        size={16}
                        className="text-brand [flex-shrink:0] [margin-top:2px]"
                      />
                      <span className="text-muted">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={
                    `btn ${isCurrent ? "btn-secondary" : "btn-primary"}` +
                    " w-full text-[13px]"
                  }

                  onClick={() => {
                    onSelectTier(plan.id, plan.name);
                    onClose();
                  }}
                >
                  {isCurrent ? "Plan Seleccionado" : "Cambiar a este Plan"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="[padding:16px_28px] [border-top:1px_solid_var(--border-subtle)] bg-elevated flex items-center justify-between text-[12px] text-subtle">
          <div className="flex items-center [gap:6px]">
            <Sparkles size={14} className="text-brand" />
            <span>
              Facturación transparente para empresas. Cancela o cambia de nivel
              en cualquier momento.
            </span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default MembershipModal;
