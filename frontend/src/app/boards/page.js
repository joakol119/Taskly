'use client';
import { useState, useEffect } from 'react';
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

export default function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const t = dark ? themes.dark : themes.light;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/'); return; }
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    api.getBoards().then(setBoards).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const board = await api.createBoard({ name: newName.trim() });
      setBoards([board, ...boards]);
      setNewName('');
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getInitial = (name) => name ? name[0].toUpperCase() : '?';

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
          <button onClick={toggle} style={{
            background: dark ? '#334155' : '#f1f5f9', border: 'none', borderRadius: 8,
            padding: '8px 12px', cursor: 'pointer', fontSize: 16,
          }}>
            {dark ? '☀️' : '🌙'}
          </button>
          {user && (
            <>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 14,
              }}>{getInitial(user.name)}</div>
              <span style={{ fontSize: 14, color: t.textSub, fontWeight: 500 }}>{user.name}</span>
            </>
          )}
          <button onClick={handleLogout} style={{
            background: 'none', border: `1.5px solid ${t.border}`, color: t.textSub,
            borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
          }}>Cerrar sesión</button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: t.text }}>Mis tableros</h1>
        <p style={{ margin: '0 0 32px', color: t.textSub, fontSize: 15 }}>Organizá tus proyectos y tareas en un solo lugar</p>

        {loading ? <p style={{ color: t.textMuted }}>Cargando...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            <div style={{
              borderRadius: 16, padding: 24, border: `2px dashed ${t.border}`,
              background: t.surface, display: 'flex', flexDirection: 'column', gap: 12, transition: 'background 0.3s',
            }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: t.textSub }}>➕ Nuevo tablero</p>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  style={{
                    padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${t.inputBorder}`,
                    fontSize: 14, outline: 'none', background: t.inputBg, color: t.text, width: '100%', boxSizing: 'border-box',
                  }}
                  placeholder="Nombre del tablero" value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <button style={{
                  padding: '10px', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14,
                }} type="submit">Crear tablero</button>
              </form>
            </div>

            {boards.map((board, i) => (
              <div
                key={board.id}
                style={{
                  borderRadius: 16, padding: 24, cursor: 'pointer',
                  background: BOARD_COLORS[i % BOARD_COLORS.length],
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  minHeight: 140, boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onClick={() => router.push(`/boards/${board.id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'; }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>{board.name}</p>
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>por {board.owner.name}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Ver tablero</span>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 20 }}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
