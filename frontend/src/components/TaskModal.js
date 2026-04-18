'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';

const LABEL_COLORS = [
  { color: '#ef4444', name: 'Rojo' },
  { color: '#f97316', name: 'Naranja' },
  { color: '#eab308', name: 'Amarillo' },
  { color: '#22c55e', name: 'Verde' },
  { color: '#3b82f6', name: 'Azul' },
  { color: '#8b5cf6', name: 'Violeta' },
  { color: '#ec4899', name: 'Rosa' },
  { color: '#64748b', name: 'Gris' },
];

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { margin: 0, color: '#f1f5f9', fontSize: 16, fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer', lineHeight: 1 },
  label: { display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16 },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  saveBtn: { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  deleteBtn: { padding: '10px 16px', borderRadius: 8, border: 'none', background: '#ef444420', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  error: { color: '#ef4444', fontSize: 13, marginBottom: 12 },
};

export default function TaskModal({ task, onClose, onUpdated, onDeleted }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [labels, setLabels] = useState(task.labels || []);
  const [labelText, setLabelText] = useState('');
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].color);
  const selectedColorRef = useRef(LABEL_COLORS[0].color);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    selectedColorRef.current = color;
  };

  const addLabel = (colorOverride) => {
    if (!labelText.trim()) return;
    setLabels(prev => [...prev, { text: labelText.trim(), color: colorOverride }]);
    setLabelText('');
  };

  const removeLabel = (i) => setLabels(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!title.trim()) { setError('El título es obligatorio'); return; }
    setLoading(true);
    try {
      const updated = await api.updateTask(task.id, { title: title.trim(), description: description.trim(), labels });
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await api.deleteTask(task.id);
      onDeleted(task.id);
      onClose();
    } catch (err) { setError(err.message); }
  };

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <p style={s.title}>Editar tarea</p>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <label style={s.label}>Título</label>
        <input style={s.input} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />

        <label style={s.label}>Descripción</label>
        <textarea style={s.textarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Agregá una descripción..." />

        <label style={s.label}>Etiquetas</label>

        {labels.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {labels.map((lbl, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: lbl.color + '30', border: `1px solid ${lbl.color}`,
                color: lbl.color, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 600,
              }}>
                {lbl.text}
                <button onClick={() => removeLabel(i)} style={{ background: 'none', border: 'none', color: lbl.color, cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {LABEL_COLORS.map(({ color }) => (
              <button key={color} onClick={(e) => { e.stopPropagation(); handleColorSelect(color); }} style={{
                width: 22, height: 22, borderRadius: '50%', background: color,
                border: selectedColor === color ? '2px solid white' : '2px solid transparent',
                cursor: 'pointer', padding: 0,
                outline: selectedColor === color ? `2px solid ${color}` : 'none', outlineOffset: 1,
              }} />
            ))}
          </div>
          <input
            style={{ ...s.input, marginBottom: 0, flex: 1 }}
            placeholder="Nombre de la etiqueta..."
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addLabel(selectedColorRef.current)}
          />
          <button onClick={() => addLabel(selectedColorRef.current)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#334155', color: '#f1f5f9', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>
            + Agregar
          </button>
        </div>

        {error && <p style={s.error}>{error}</p>}

        <div style={s.actions}>
          <button style={s.deleteBtn} onClick={handleDelete}>🗑️ Eliminar</button>
          <button style={{ ...s.saveBtn, opacity: loading ? 0.7 : 1 }} onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
