'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
  card: { background: '#fff', borderRadius: 16, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  title: { margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: '#0f172a' },
  subtitle: { margin: '0 0 28px', color: '#64748b', fontSize: 14 },
  input: { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box', background: '#f8fafc' },
  btn: { width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4 },
  toggle: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' },
  toggleBtn: { background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  error: { color: '#ef4444', fontSize: 13, marginBottom: 12 },
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = isLogin
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/boards');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>📋 Taskly</h1>
        <p style={s.subtitle}>{isLogin ? 'Iniciá sesión para continuar' : 'Creá tu cuenta gratis'}</p>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input style={s.input} placeholder="Nombre" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          )}
          <input style={s.input} placeholder="Email" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input style={s.input} placeholder="Contraseña" type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p style={s.error}>{error}</p>}
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Cargando...' : isLogin ? 'Iniciar sesión' : 'Registrarse'}
          </button>
        </form>
        <div style={s.toggle}>
          {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
          <button style={s.toggleBtn} onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Registrate' : 'Iniciá sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
