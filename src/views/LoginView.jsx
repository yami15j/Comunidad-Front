import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function LoginView({ onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await onRegister({ fullName: fullName.trim(), email: email.trim(), password });
      } else {
        await onLogin({ email: email.trim(), password, rememberMe });
      }
    } catch (submitError) {
      setError(submitError.message || 'No se pudo completar la operación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-main)',
      color: 'var(--text-main)',
      position: 'relative'
    }}>
      {/* Barra superior */}
      <header style={{
        height: '64px',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            backgroundColor: '#0F172A',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            border: '1px solid #1E293B',
            flexShrink: 0
          }}>
            <img 
              src="/logo.png" 
              alt="Comunidad del Intercambio" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
            COMUNIDAD <span style={{ color: 'var(--brand-celeste)' }}>DEL INTERCAMBIO</span>
          </span>
        </div>
      </header>

      {/* Contenedor Principal: Tarjeta Centrada de Login */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '42px 36px'
        }}>
          {/* Logo y Encabezado del Formulario */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#0F172A',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              margin: '0 auto 18px auto',
              border: '1px solid #1E293B',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)'
            }}>
              <img 
                src="/logo.png" 
                alt="Comunidad del Intercambio" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em', marginBottom: '6px' }}>
              {isRegistering ? 'Crear cuenta' : 'Iniciar Sesión'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Comunidad del Intercambio • Formación & Negocios
            </p>
          </div>

          {/* Formulario de Login Limpio */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {isRegistering && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                  minLength={2}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>
            )}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Contraseña
                </label>
                <span style={{ fontSize: '11px', color: 'var(--brand-celeste)', cursor: 'pointer', fontWeight: 600 }}>
                  ¿Olvidaste tu contraseña?
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce tu contraseña"
                  minLength={isRegistering ? 8 : undefined}
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)' }}>
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--brand-celeste)', cursor: 'pointer' }}
                />
                <span>Recordar mi sesión</span>
              </label>
            </div>

            {error && (
              <div role="alert" style={{ padding: '10px 12px', borderRadius: '8px', color: '#991B1B', background: '#FEF2F2', border: '1px solid #FECACA', fontSize: '12px' }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '4px', justifyContent: 'center' }}
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Conectando…' : isRegistering ? 'Crear cuenta' : 'Ingresar al Portal'}</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setIsRegistering((value) => !value); setError(''); }}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isRegistering ? 'Ya tengo una cuenta' : 'Crear una cuenta nueva'}
            </button>
          </form>
        </div>
      </main>

      {/* Footer corporativo */}
      <footer style={{
        padding: '16px 24px',
        textAlign: 'center',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '12px',
        color: 'var(--text-dim)',
        backgroundColor: 'var(--bg-surface)'
      }}>
        © 2026 Comunidad del Intercambio • Todos los derechos reservados • Enfoque Corporativo
      </footer>
    </div>
  );
}

export default LoginView;
