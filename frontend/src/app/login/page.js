'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: 24,
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '48px 44px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 },
  logoIcon: { fontSize: 32 },
  logoText: { fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-1px' },
  title: { margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#0f172a' },
  subtitle: { margin: '0 0 28px', color: '#64748b', fontSize: 14 },
  label: {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#475569',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
    background: '#f8fafc', marginBottom: 16, boxSizing: 'border-box',
  },
  btn: {
    width: '100%', padding: '14px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
    marginTop: 4, boxShadow: '0 4px 15px rgba(102,126,234,0.5)',
  },
  toggle: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' },
  toggleBtn: {
    background: 'none', border: 'none', color: '#6366f1',
    fontWeight: 700, cursor: 'pointer', fontSize: 14,
  },
  error: {
    color: '#ef4444', fontSize: 13, marginBottom: 16,
    padding: '10px 12px', background: '#fef2f2', borderRadius: 8,
  },
  features: { display: 'flex', justifyContent: 'center', gap: 20, marginTop: 28, flexWrap: 'wrap' },
  feature: { fontSize: 12, color: '#94a3b8' },
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
        <div style={s.logo}>
          <span style={s.logoIcon}>📋</span>
          <span style={s.logoText}>Taskly</span>
        </div>

        <h2 style={s.title}>{isLogin ? 'Bienvenido de vuelta' : 'Crear cuenta gratis'}</h2>
        <p style={s.subtitle}>{isLogin ? 'Iniciá sesión para continuar' : 'Sin tarjeta de crédito requerida'}</p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <label style={s.label}>Nombre</label>
              <input style={s.input} placeholder="Tu nombre" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </>
          )}
          <label style={s.label}>Email</label>
          <input style={s.input} placeholder="tu@email.com" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label style={s.label}>Contraseña</label>
          <input style={s.input} placeholder="••••••••" type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p style={s.error}>⚠️ {error}</p>}
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Cargando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        <div style={s.toggle}>
          {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
          <button style={s.toggleBtn} onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Registrate gratis' : 'Iniciá sesión'}
          </button>
        </div>

        <div style={s.features}>
          {['🗂️ Tableros', '🎯 Drag & drop', '👥 Equipos'].map(f => (
            <div key={f} style={s.feature}>{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
