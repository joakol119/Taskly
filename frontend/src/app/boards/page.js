'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

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

const s = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" },
  header: {
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 32px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandIcon: { fontSize: 24 },
  brandName: { fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  userName: { fontSize: 14, color: '#64748b', fontWeight: 500 },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 14,
  },
  logoutBtn: {
    background: 'none', border: '1.5px solid #e2e8f0', color: '#64748b',
    borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  },
  main: { maxWidth: 1100, margin: '0 auto', padding: '40px 24px' },
  pageTitle: { margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: '#0f172a' },
  pageSubtitle: { margin: '0 0 32px', color: '#64748b', fontSize: 15 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 },
  newCard: {
    borderRadius: 16, padding: 24, border: '2px dashed #cbd5e1',
    background: '#fff', display: 'flex', flexDirection: 'column', gap: 12,
    transition: 'border-color 0.2s',
  },
  newCardTitle: { margin: 0, fontSize: 14, fontWeight: 600, color: '#64748b' },
  input: {
    padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
    fontSize: 14, outline: 'none', background: '#f8fafc', width: '100%', boxSizing: 'border-box',
  },
  btn: {
    padding: '10px', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14,
  },
  boardCard: {
    borderRadius: 16, padding: 24, cursor: 'pointer',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    minHeight: 140, transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  boardName: { margin: 0, fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' },
  boardMeta: { margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  boardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  boardArrow: { color: 'rgba(255,255,255,0.8)', fontSize: 20 },
};

export default function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

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
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.brand}>
          <span style={s.brandIcon}>📋</span>
          <span style={s.brandName}>Taskly</span>
        </div>
        <div style={s.headerRight}>
          {user && (
            <>
              <div style={s.avatar}>{getInitial(user.name)}</div>
              <span style={s.userName}>{user.name}</span>
            </>
          )}
          <button style={s.logoutBtn} onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      <main style={s.main}>
        <h1 style={s.pageTitle}>Mis tableros</h1>
        <p style={s.pageSubtitle}>Organizá tus proyectos y tareas en un solo lugar</p>

        {loading ? <p style={{ color: '#94a3b8' }}>Cargando...</p> : (
          <div style={s.grid}>
            <div style={s.newCard}>
              <p style={s.newCardTitle}>➕ Nuevo tablero</p>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input style={s.input} placeholder="Nombre del tablero" value={newName}
                  onChange={(e) => setNewName(e.target.value)} />
                <button style={s.btn} type="submit">Crear tablero</button>
              </form>
            </div>

            {boards.map((board, i) => (
              <div
                key={board.id}
                style={{ ...s.boardCard, background: BOARD_COLORS[i % BOARD_COLORS.length] }}
                onClick={() => router.push(`/boards/${board.id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'; }}
              >
                <div>
                  <p style={s.boardName}>{board.name}</p>
                  <p style={s.boardMeta}>por {board.owner.name}</p>
                </div>
                <div style={s.boardFooter}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Ver tablero</span>
                  <span style={s.boardArrow}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
