'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useToast } from './Toast';

const LABEL_COLORS = [
  { color: '#ef4444', name: 'Red' },
  { color: '#f97316', name: 'Orange' },
  { color: '#eab308', name: 'Yellow' },
  { color: '#22c55e', name: 'Green' },
  { color: '#3b82f6', name: 'Blue' },
  { color: '#8b5cf6', name: 'Violet' },
  { color: '#ec4899', name: 'Pink' },
  { color: '#64748b', name: 'Gray' },
];

function formatForInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0, 16);
}

export default function TaskModal({ task, onClose, onUpdated, onDeleted }) {
  const toast = useToast();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [labels, setLabels] = useState(task.labels || []);
  const [labelText, setLabelText] = useState('');
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].color);
  const selectedColorRef = useRef(LABEL_COLORS[0].color);
  const [dueDate, setDueDate] = useState(formatForInput(task.dueDate));
  const [done, setDone] = useState(task.done || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    selectedColorRef.current = color;
  };

  const addLabel = (colorOverride) => {
    if (!labelText.trim()) return;
    setLabels((prev) => [...prev, { text: labelText.trim(), color: colorOverride }]);
    setLabelText('');
  };

  const removeLabel = (i) => {
    setLabels((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const updated = await api.updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        labels,
        dueDate: dueDate || null,
        done,
      });
      onUpdated(updated);
      toast({ message: 'Task updated' });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      await api.deleteTask(task.id);
      onDeleted(task.id);
      toast({ message: 'Task deleted', type: 'warning' });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const getDueDateStatus = () => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: 'Overdue', tone: 'danger' };
    if (diffDays === 0) return { text: 'Today', tone: 'warning' };
    if (diffDays <= 2) return { text: `In ${diffDays} day${diffDays > 1 ? 's' : ''}`, tone: 'warning' };
    return { text: `In ${diffDays} days`, tone: 'success' };
  };

  const dueDateStatus = getDueDateStatus();

  const toneStyles = {
    danger: 'bg-danger/10 border-danger/30 text-danger',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    success: 'bg-success/10 border-success/30 text-success',
  };

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-lg bg-surface border border-border shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-medium tracking-tight">Edit task</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            aria-label="Close"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {/* Done toggle */}
          <button
            type="button"
            onClick={() => setDone(!done)}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-md border transition-colors ${
              done
                ? 'bg-success/10 border-success/30 text-success hover:bg-success/15'
                : 'bg-bg border-border text-text-muted hover:border-border-strong hover:text-text'
            }`}
          >
            <span
              className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                done ? 'bg-success' : 'bg-transparent border border-border-strong'
              }`}
            >
              {done && (
                <svg className="w-3 h-3 text-bg" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 111.42-1.42L8 12.59l7.29-7.3a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
            <span className="text-sm font-medium">
              {done ? 'Marked as done' : 'Mark as done'}
            </span>
          </button>

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="task-title" className="block text-xs font-mono uppercase tracking-wider text-text-muted">
              Title
            </label>
            <input
              id="task-title"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 text-sm bg-bg border border-border rounded-md text-text placeholder:text-text-subtle focus:outline-none focus:border-accent transition-colors ${
                done ? 'line-through opacity-60' : ''
              }`}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="task-description" className="block text-xs font-mono uppercase tracking-wider text-text-muted">
              Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-md text-text placeholder:text-text-subtle focus:outline-none focus:border-accent transition-colors resize-y min-h-[80px]"
            />
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <label htmlFor="task-due" className="block text-xs font-mono uppercase tracking-wider text-text-muted">
              Due date
            </label>
            <div className="flex items-center gap-2">
              <input
                id="task-due"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="flex-1 px-3 py-2 text-sm bg-bg border border-border rounded-md text-text focus:outline-none focus:border-accent transition-colors"
              />
              {dueDate && (
                <button
                  onClick={() => setDueDate('')}
                  className="w-9 h-9 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
                  aria-label="Clear due date"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              )}
            </div>
            {dueDateStatus && (
              <div className={`inline-flex items-center px-2 py-0.5 text-xs font-mono uppercase tracking-wider rounded border ${toneStyles[dueDateStatus.tone]}`}>
                {dueDateStatus.text}
              </div>
            )}
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-text-muted">
              Labels
            </label>

            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {labels.map((lbl, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border"
                    style={{
                      backgroundColor: `${lbl.color}20`,
                      borderColor: `${lbl.color}60`,
                      color: lbl.color,
                    }}
                  >
                    {lbl.text}
                    <button
                      onClick={() => removeLabel(i)}
                      className="leading-none hover:opacity-70 transition-opacity"
                      style={{ color: lbl.color }}
                      aria-label={`Remove label ${lbl.text}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-shrink-0">
                {LABEL_COLORS.map(({ color, name }) => (
                  <button
                    key={color}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColorSelect(color);
                    }}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      outline: selectedColor === color ? `2px solid ${color}` : 'none',
                      outlineOffset: '2px',
                    }}
                    aria-label={`Select ${name} color`}
                    title={name}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Label name..."
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addLabel(selectedColorRef.current);
                  }
                }}
                className="flex-1 px-3 py-2 text-sm bg-bg border border-border rounded-md text-text placeholder:text-text-subtle focus:outline-none focus:border-accent transition-colors"
              />
              <button
                onClick={() => addLabel(selectedColorRef.current)}
                disabled={!labelText.trim()}
                className="px-3 py-2 text-sm font-medium bg-surface-2 border border-border text-text rounded-md hover:border-border-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                + Add
              </button>
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 text-sm rounded-md bg-danger/10 border border-danger/30 text-danger">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0">
          <button
            onClick={handleDelete}
            className="px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10 rounded-md transition-colors"
          >
            Delete
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-text text-bg rounded-md hover:bg-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
