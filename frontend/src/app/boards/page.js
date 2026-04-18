'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useTheme, themes } from '../../lib/theme';

const BOARD_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
];

const COLOR_OPTIONS = [
  { label: 'Violeta', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'Rosa', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: 'Celeste', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: 'Verde', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { label: 'Naranja', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { label: 'Lila', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { label: 'Durazno', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { label: 'Fucsia', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
];

export default function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [colorPickerId, setColorPickerId] = useState(null);
  const clickTimers = useRef({});
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const t = dark ? themes.dark : themes.light;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/'); return; }
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    api.getBoards()
      .then(fetched => setBoards(fetched))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const close = () => { setMenuOpenId(null); setColorPickerId(null); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const board = await api.createBoard({ name: newName.trim() });
      setBoards(prev => [...prev, board]);
      setNewName('');
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getInitial = (name) => name ? name[0].toUpperCase() : '?';

  // Drag & drop — guarda en DB al soltar
  const handleDragStart = (i) => setDragIndex(i);
  const handleDragOver = (e, i) => { e.preventDefault(); setOverIndex(i); };
  const handleDrop = async (i) => {
    if (dragIndex === null || dragIndex === i) return;
    const reordered = Array.from(boards);
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(i, 0, moved);
    setBoards(reordered); // actualización optimista
    setDragIndex(null);
    setOverIndex(null);
    try {
      await api.reorderBoards(reordered.map(b => b.id));
    } catch (err) {
      console.error('Error al guardar orden:', err);
    }
  };
  const handleDragEnd = () => { setDragIndex(null); setOverIndex(null); };

  const handleCardClick = (board) => {
    if (dragIndex !== null || editingId === board.id || menuOpenId === board.id) return;
    if (clickTimers.current[board.id]) {
      clearTimeout(clickTimers.current[board.id]);
      clickTimers.current[board.id] = null;
      setEditingId(board.id);
      setEditingName(board.name);
    } else {
      clickTimers.current[board.id] = setTimeout(() => {
        clickTimers.current[board.id] = null;
        router.push(`/boards/${board.id}`);
      }, 250);
    }
  };

  const saveEdit = async (boardId) => {
    if (!editingName.trim()) { setEditingId(null); return; }
    try {
      await api.renameBoard(boardId, editingName.trim());
      setBoards(boards.map(b => b.id === boardId ? { ...b, name: editingName.trim() } : b));
    } catch (err) { console.error(err); }
    setEditingId(null);
  };

  const handleDelete = async (e, boardId) => {
    e.stopPropagation();
    setMenuOpenId(null);
    if (!confirm('¿Eliminar este tablero y todas sus columnas y tareas?')) return;
    try {
      await api.deleteBoard(boardId);
      setBoards(boards.filter(b => b.id !== boardId));
    } catch (err) { console.error(err); }
  };

  const handleDuplicate = async (e, board) => {
    e.stopPropagation();
    setMenuOpenId(null);
    try {
      const newBoard = await api.duplicateBoard(board.id);
      setBoards(prev => [...prev, newBoard]);
    } catch (err) { console.error(err); }
  };

  const handleRename = (e, board) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setEditingId(board.id);
    setEditingName(board.name);
  };

  // Cambio de color — guarda en DB
  const handleColorChange = async (e, boardId, color) => {
    e.stopPropagation();
    setBoards(boards.map(b => b.id === boardId ? { ...b, color } : b)); // optimista
    setColorPickerId(null);
    setMenuOpenId(null);
    try {
      await api.updateBoardColor(boardId, color);
    } catch (err) {
      console.error('Error al guardar color:', err);
    }
  };

  // Color: usa el guardado en DB, o fallback por índice
  const getBoardColor = (board) => board.color || BOARD_COLORS[board.id % BOARD_COLORS.length];

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: "'Inter', system-ui, sans-serif", transition: 'background 0.3s' }}>
      <header style={{
        background: t.headerBg, borderBottom: `1px solid ${t.headerBorder}`,
        padding: '0 32px', height: 64, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'background 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>📋</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: t.text, letterSpacing: '-0.5px' }}>Taskly</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={toggle} style={{ background: dark ? '#334155' : '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 16 }}>
            {dark ? '☀️' : '🌙'}
          </button>
          {user && (
            <>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>{getInitial(user.name)}</div>
              <span style={{ fontSize: 14, color: t.textSub, fontWeight: 500 }}>{user.name}</span>
            </>
          )}
          <button onClick={handleLogout} style={{ background: 'none', border: `1.5px solid ${t.border}`, color: t.textSub, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Cerrar sesión</button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: t.text }}>Mis tableros</h1>
        <p style={{ margin: '0 0 24px', color: t.textSub, fontSize: 15 }}>Organizá tus proyectos y tareas en un solo lugar</p>

        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, marginBottom: 28, alignItems: 'center' }}>
          <input
            style={{ padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${t.inputBorder}`, fontSize: 14, outline: 'none', background: t.inputBg, color: t.text, width: 280, boxSizing: 'border-box' }}
            placeholder="Nombre del nuevo tablero" value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' }} type="submit">➕ Crear tablero</button>
        </form>

        {loading ? <p style={{ color: t.textMuted }}>Cargando...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {boards.map((board, i) => (
              <div
                key={board.id}
                draggable={editingId !== board.id}
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={handleDragEnd}
                onClick={() => editingId !== board.id && handleCardClick(board)}
                style={{
                  borderRadius: 16, padding: 24, position: 'relative',
                  cursor: editingId === board.id ? 'default' : 'pointer',
                  background: getBoardColor(board),
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  minHeight: 140,
                  boxShadow: dragIndex === i ? '0 20px 40px rgba(0,0,0,0.3)' : '0 4px 15px rgba(0,0,0,0.1)',
                  opacity: dragIndex === i ? 0.4 : 1,
                  outline: overIndex === i && dragIndex !== i ? '2px dashed rgba(255,255,255,0.7)' : 'none',
                  transition: 'opacity 0.15s, outline 0.1s, box-shadow 0.2s',
                }}
              >
                {/* Botón menú ⋯ */}
                <button
                  onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setMenuOpenId(menuOpenId === board.id ? null : board.id); setColorPickerId(null); }}
                  style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: 6,
                    color: '#fff', cursor: 'pointer', fontSize: 16, padding: '2px 8px',
                    lineHeight: 1.4, opacity: 0.8,
                  }}
                >⋯</button>

                {/* Dropdown menú */}
                {menuOpenId === board.id && (
                  <div
                    onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                    style={{
                      position: 'absolute', top: 44, right: 12, zIndex: 200,
                      background: '#1e293b', borderRadius: 10, overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)', minWidth: 160,
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {[
                      { icon: '✏️', label: 'Renombrar', action: (e) => handleRename(e, board) },
                      { icon: '📋', label: 'Duplicar', action: (e) => handleDuplicate(e, board) },
                      { icon: '🎨', label: 'Cambiar color', action: (e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setColorPickerId(colorPickerId === board.id ? null : board.id); } },
                      { icon: '🗑️', label: 'Eliminar', action: (e) => handleDelete(e, board.id), danger: true },
                    ].map(({ icon, label, action, danger }) => (
                      <button key={label} onClick={action} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '10px 14px', border: 'none',
                        background: 'none', color: danger ? '#f87171' : '#f1f5f9',
                        cursor: 'pointer', fontSize: 13, textAlign: 'left',
                        borderBottom: label === 'Cambiar color' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <span>{icon}</span> {label}
                      </button>
                    ))}

                    {colorPickerId === board.id && (
                      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {COLOR_OPTIONS.map(({ label, value }) => (
                          <button
                            key={value}
                            title={label}
                            onClick={(e) => { e.nativeEvent.stopImmediatePropagation(); handleColorChange(e, board.id, value); }}
                            style={{
                              width: 28, height: 28, borderRadius: 6,
                              border: getBoardColor(board) === value ? '2px solid white' : '2px solid transparent',
                              background: value, cursor: 'pointer', padding: 0,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  {editingId === board.id ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => saveEdit(board.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(board.id); if (e.key === 'Escape') setEditingId(null); }}
                      onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                      style={{ fontSize: 18, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 6, padding: '2px 8px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                  ) : (
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', paddingRight: 32 }}>{board.name}</p>
                  )}
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>por {board.owner.name}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                    {editingId === board.id ? 'Enter · Esc' : 'Ver tablero'}
                  </span>
                  {editingId !== board.id && <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 20 }}>→</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
