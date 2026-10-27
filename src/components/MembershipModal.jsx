import React from 'react';
import { X, Crown, Check, Sparkles, Shield, ArrowRight } from 'lucide-react';

export function MembershipModal({ 
  isOpen, 
  onClose, 
  plans, 
  currentTier, 
  onSelectTier 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '880px' }}>
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div className="badge badge-emerald" style={{ marginBottom: '6px' }}>
              <Crown size={12} />
              <span>Niveles de Membresía</span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>Elige tu Plan de Membresía</h2>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        <div style={{ padding: '28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {plans.map((plan) => {
            const isCurrent = plan.id === currentTier;
            return (
              <div 
                key={plan.id}
                style={{
                  backgroundColor: isCurrent ? 'var(--brand-celeste-subtle)' : 'var(--bg-surface)',
                  border: isCurrent ? '2px solid var(--brand-celeste)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {isCurrent && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--brand-celeste)',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 12px',
                    borderRadius: 'var(--radius-full)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Plan Actual
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <span style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: isCurrent ? 'var(--brand-celeste)' : 'var(--text-dim)',
                    fontWeight: 700
                  }}>
                    {plan.badge}
                  </span>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{plan.name}</h3>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }}>
                    {plan.price}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                    {plan.description}
                  </p>
                </div>

                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '14px 0' }} />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {plan.features.map((feature, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px' }}>
                      <Check size={16} style={{ color: 'var(--brand-celeste)', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ color: 'var(--text-muted)' }}>{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  className={`btn ${isCurrent ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ width: '100%', fontSize: '13px' }}
                  onClick={() => {
                    onSelectTier(plan.id, plan.name);
                    onClose();
                  }}
                >
                  {isCurrent ? 'Plan Seleccionado' : 'Cambiar a este Plan'}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--text-dim)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} style={{ color: 'var(--brand-celeste)' }} />
            <span>Facturación transparente para empresas. Cancela o cambia de nivel en cualquier momento.</span>
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
