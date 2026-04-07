'use client';
import { useState } from 'react';
import { api } from '../lib/api';

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { margin: 0, color: '#f1f5f9', fontSize: 16, fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' },
  label: { display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  inviteRow: { display: 'flex', gap: 8, marginBottom: 24 },
  input: { flex: 1, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, outline: 'none' },
  inviteBtn: { padding: '10px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' },
  error: { color: '#ef4444', fontSize: 13, marginBottom: 12 },
  success: { color: '#10b981', fontSize: 13, marginBottom: 12 },
  membersList: { display: 'flex', flexDirection: 'column', gap: 10 },
  memberRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a', borderRadius: 8, padding: '10px 14px' },
  memberInfo: { display: 'flex', flexDirection: 'column' },
  memberName: { color: '#f1f5f9', fontSize: 14, fontWeight: 500 },
  memberEmail: { color: '#64748b', fontSize: 12 },
  ownerBadge: { background: '#3b82f620', color: '#3b82f6', fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '3px 8px' },
  removeBtn: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
};

export default function MembersPanel({ board, currentUserId, onClose, onMembersUpdated }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOwner = board.ownerId === currentUserId;

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.inviteMember(board.id, email.trim());
      setSuccess(`${res.user.name} fue agregado al tablero`);
      setEmail('');
      onMembersUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId, name) => {
    if (!confirm(`¿Eliminar a ${name} del tablero?`)) return;
    try {
      await api.removeMember(board.id, userId);
      onMembersUpdated();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <p style={s.title}>👥 Miembros del tablero</p>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {isOwner && (
          <>
            <label style={s.label}>Invitar por email</label>
            <form onSubmit={handleInvite} style={s.inviteRow}>
              <input
                style={s.input}
                placeholder="email@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
              <button style={{ ...s.inviteBtn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                {loading ? '...' : 'Invitar'}
              </button>
            </form>
            {error && <p style={s.error}>{error}</p>}
            {success && <p style={s.success}>✓ {success}</p>}
          </>
        )}

        <label style={s.label}>Integrantes ({1 + board.members.length})</label>
        <div style={s.membersList}>
          <div style={s.memberRow}>
            <div style={s.memberInfo}>
              <span style={s.memberName}>{board.owner.name}</span>
              <span style={s.memberEmail}>{board.owner.email}</span>
            </div>
            <span style={s.ownerBadge}>Dueño</span>
          </div>
          {board.members.map((m) => (
            <div key={m.user.id} style={s.memberRow}>
              <div style={s.memberInfo}>
                <span style={s.memberName}>{m.user.name}</span>
                <span style={s.memberEmail}>{m.user.email}</span>
              </div>
              {isOwner && (
                <button style={s.removeBtn} onClick={() => handleRemove(m.user.id, m.user.name)}>
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
