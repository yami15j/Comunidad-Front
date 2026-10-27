import React from 'react';
import { X, Bell, CheckCircle2, Radio, FolderDown, Film, ExternalLink } from 'lucide-react';

export function NotificationsModal({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkAllAsRead, 
  onNotificationClick 
}) {
  if (!isOpen) return null;

  const getIcon = (type) => {
    switch(type) {
      case 'live': return <Radio size={16} style={{ color: 'var(--brand-celeste)' }} />;
      case 'resource': return <FolderDown size={16} style={{ color: 'var(--text-main)' }} />;
      case 'replay': return <Film size={16} style={{ color: 'var(--brand-celeste)' }} />;
      default: return <Bell size={16} style={{ color: 'var(--brand-celeste)' }} />;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} style={{ color: 'var(--brand-celeste)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Notificaciones</h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto' }}>
          {notifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => onNotificationClick(notif)}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: notif.read ? 'var(--bg-surface)' : 'var(--brand-celeste-subtle)',
                border: notif.read ? '1px solid var(--border-subtle)' : '1px solid var(--brand-celeste-border)',
                cursor: 'pointer',
                display: 'flex',
                gap: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {getIcon(notif.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: notif.read ? 600 : 700, color: notif.read ? 'var(--text-muted)' : 'var(--text-main)' }}>
                    {notif.title}
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{notif.time}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {notif.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface-elevated)'
        }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onMarkAllAsRead}
          >
            <CheckCircle2 size={14} />
            <span>Marcar todas como leídas</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationsModal;
