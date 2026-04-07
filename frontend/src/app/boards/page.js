'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9' },
  header: { background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title: { margin: 0, fontSize: 20, fontWeight: 800 },
  logoutBtn: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 },
  main: { maxWidth: 900, margin: '32px auto', padding: '0 24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginTop: 24 },
  boardCard: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.2s, box-shadow 0.2s' },
  boardName: { margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' },
  boardMeta: { margin: '6px 0 0', fontSize: 12, color: '#94a3b8' },
  newCard: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '2px dashed #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 },
  input: { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none' },
  btn: { padding: '10px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  sectionTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' },
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

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.title}>📋 Taskly</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && <span style={{ fontSize: 14, color: '#94a3b8' }}>Hola, {user.name}</span>}
          <button style={s.logoutBtn} onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>
      <main style={s.main}>
        <h2 style={s.sectionTitle}>Mis tableros</h2>
        {loading ? <p style={{ color: '#94a3b8' }}>Cargando...</p> : (
          <div style={s.grid}>
            <form onSubmit={handleCreate} style={s.newCard}>
              <input style={s.input} placeholder="Nombre del tablero" value={newName}
                onChange={(e) => setNewName(e.target.value)} />
              <button style={s.btn} type="submit">+ Crear tablero</button>
            </form>
            {boards.map((board) => (
              <div key={board.id} style={s.boardCard} onClick={() => router.push(`/boards/${board.id}`)}>
                <p style={s.boardName}>{board.name}</p>
                <p style={s.boardMeta}>por {board.owner.name}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
