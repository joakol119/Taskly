'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function getInitial(name) {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

export default function MembersPanel({ board, currentUserId, onClose, onMembersUpdated }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOwner = board.ownerId === currentUserId;

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.inviteMember(board.id, email.trim());
      setSuccess(`${res.user.name} was added to the board`);
      setEmail('');
      onMembersUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId, name) => {
    if (!confirm(`Remove ${name} from this board?`)) return;
    setRemovingId(userId);
    setError('');
    try {
      await api.removeMember(board.id, userId);
      onMembersUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-lg bg-surface border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-medium tracking-tight">Board members</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            aria-label="Close"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Invite */}
          {isOwner && (
            <div className="space-y-2">
              <label
                htmlFor="invite-email"
                className="block text-xs font-mono uppercase tracking-wider text-text-muted"
              >
                Invite by email
              </label>
              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  id="invite-email"
                  type="email"
                  required
                  autoFocus
                  placeholder="teammate@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-bg border border-border rounded-md text-text placeholder:text-text-subtle focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? '...' : 'Invite'}
                </button>
              </form>
              {error && (
                <div className="px-3 py-2 text-sm rounded-md bg-danger/10 border border-danger/30 text-danger">
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-success/10 border border-success/30 text-success">
                  <span className="text-xs font-mono uppercase">ok</span>
                  <span>{success}</span>
                </div>
              )}
            </div>
          )}

          {/* Members list */}
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-wider text-text-muted">
              Members ({1 + board.members.length})
            </p>

            <div className="space-y-1.5">
              {/* Owner */}
              <div className="flex items-center justify-between p-3 rounded-md bg-bg border border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-accent-soft border border-accent/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-accent">
                      {getInitial(board.owner.name)}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-text truncate">{board.owner.name}</span>
                    <span className="text-xs text-text-subtle truncate">{board.owner.email}</span>
                  </div>
                </div>
                <span className="text-xs font-mono uppercase tracking-wider text-accent bg-accent-soft px-2 py-0.5 rounded flex-shrink-0">
                  Owner
                </span>
              </div>

              {/* Other members */}
              {board.members.map((m) => (
                <div
                  key={m.user.id}
                  className="flex items-center justify-between p-3 rounded-md bg-bg border border-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-text-muted">
                        {getInitial(m.user.name)}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-text truncate">{m.user.name}</span>
                      <span className="text-xs text-text-subtle truncate">{m.user.email}</span>
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleRemove(m.user.id, m.user.name)}
                      disabled={removingId === m.user.id}
                      className="text-xs font-medium text-danger hover:text-danger/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {removingId === m.user.id ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
