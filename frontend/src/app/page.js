'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#080b14', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#f1f5f9', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,900;1,9..40,300&family=Syne:wght@700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 20px 48px; display: flex; align-items: center; justify-content: space-between; transition: all 0.3s; }
        .nav.scrolled { background: rgba(8,11,20,0.85); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 14px 48px; }

        .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 120px 24px 80px; position: relative; }

        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc; borderRadius: 999px; padding: 6px 16px; fontSize: 13px; fontWeight: 500; marginBottom: 32px; opacity: 0; transform: translateY(16px); transition: all 0.6s 0.1s; }
        .hero-badge.visible { opacity: 1; transform: translateY(0); }

        .hero h1 { font-family: 'Syne', sans-serif; font-size: clamp(40px, 6vw, 72px); font-weight: 800; line-height: 1.08; letter-spacing: -1px; opacity: 0; transform: translateY(24px); transition: all 0.7s 0.2s; }
        .hero h1.visible { opacity: 1; transform: translateY(0); }

        .gradient-text { background: linear-gradient(135deg, #6366f1, #a78bfa, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        .hero p { font-size: clamp(16px, 2.5vw, 20px); color: #94a3b8; max-width: 540px; line-height: 1.7; margin: 24px auto 0; font-weight: 300; opacity: 0; transform: translateY(24px); transition: all 0.7s 0.35s; }
        .hero p.visible { opacity: 1; transform: translateY(0); }

        .cta-group { display: flex; gap: 14px; margin-top: 44px; opacity: 0; transform: translateY(24px); transition: all 0.7s 0.5s; }
        .cta-group.visible { opacity: 1; transform: translateY(0); }

        .btn-primary { padding: 14px 32px; border-radius: 12px; border: none; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-weight: 700; font-size: 15px; cursor: pointer; box-shadow: 0 0 40px rgba(99,102,241,0.35); transition: all 0.2s; font-family: inherit; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 60px rgba(99,102,241,0.5); }

        .btn-secondary { padding: 14px 32px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: #cbd5e1; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .btn-secondary:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }

        .glow { position: absolute; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%); top: 50%; left: 50%; transform: translate(-50%, -60%); pointer-events: none; }

        .preview { margin: 0 auto; max-width: 900px; width: 100%; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 40px 100px rgba(0,0,0,0.6); opacity: 0; transform: translateY(32px); transition: all 0.8s 0.7s; background: #0f172a; }
        .preview.visible { opacity: 1; transform: translateY(0); }

        .preview-bar { background: #1e293b; padding: 12px 16px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .preview-dot { width: 10px; height: 10px; border-radius: 50%; }

        .preview-board { padding: 20px; display: flex; gap: 12px; overflow: hidden; }
        .preview-col { background: #1e293b; border-radius: 10px; width: 180px; min-width: 180px; padding: 12px; }
        .preview-col-title { font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .preview-card { background: #0f172a; border-radius: 7px; padding: 10px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.05); }
        .preview-card-title { font-size: 12px; color: #e2e8f0; font-weight: 500; }
        .preview-label { display: inline-block; border-radius: 999px; padding: 2px 8px; font-size: 10px; font-weight: 600; margin-bottom: 6px; }

        .features { padding: 100px 24px; max-width: 1100px; margin: 0 auto; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 60px; }
        .feature-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 28px; transition: all 0.3s; }
        .feature-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(99,102,241,0.3); transform: translateY(-3px); }
        .feature-icon { font-size: 28px; margin-bottom: 14px; }
        .feature-title { font-size: 16px; font-weight: 700; color: #f1f5f9; margin-bottom: 8px; }
        .feature-desc { font-size: 14px; color: #64748b; line-height: 1.65; font-weight: 300; }

        .section-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #6366f1; margin-bottom: 16px; }
        .section-title { font-family: 'Syne', sans-serif; font-size: clamp(32px, 5vw, 48px); font-weight: 800; letter-spacing: -1px; line-height: 1.1; }

        .cta-section { text-align: center; padding: 100px 24px; border-top: 1px solid rgba(255,255,255,0.06); position: relative; }
        .cta-glow { position: absolute; width: 500px; height: 300px; background: radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%); top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; }

        .footer { padding: 32px 48px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; }
        .footer-text { font-size: 13px; color: #475569; }

        @media (max-width: 600px) {
          .nav { padding: 16px 20px; }
          .cta-group { flex-direction: column; align-items: center; }
          .preview-board { gap: 8px; }
          .preview-col { width: 140px; min-width: 140px; }
          .footer { flex-direction: column; gap: 12px; text-align: center; }
        }
      `}</style>

      {/* Nav */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>📋</span>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Taskly</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" style={{ padding: '9px 20px', fontSize: 14 }} onClick={() => router.push('/login')}>
            Iniciar sesión
          </button>
          <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 14 }} onClick={() => router.push('/login')}>
            Empezar gratis
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="glow" />

        <div className={`hero-badge ${visible ? 'visible' : ''}`}>
          ✦ Gestión de proyectos simplificada
        </div>

        <h1 className={visible ? 'visible' : ''}>
          Organizá tu trabajo<br />
          <span className="gradient-text">sin el caos.</span>
        </h1>

        <p className={visible ? 'visible' : ''}>
          Taskly es un tablero Kanban moderno para equipos que quieren moverse rápido. Creá tableros, mové tareas, colaborá en tiempo real.
        </p>

        <div className={`cta-group ${visible ? 'visible' : ''}`}>
          <button className="btn-primary" onClick={() => router.push('/login')}>
            Crear cuenta gratis →
          </button>
          <button className="btn-secondary" onClick={() => router.push('/login')}>
            Ver demo
          </button>
        </div>

        {/* Preview del app */}
        <div className={`preview ${visible ? 'visible' : ''}`} style={{ marginTop: 64 }}>
          <div className="preview-bar">
            <div className="preview-dot" style={{ background: '#ef4444' }} />
            <div className="preview-dot" style={{ background: '#f59e0b' }} />
            <div className="preview-dot" style={{ background: '#22c55e' }} />
            <span style={{ marginLeft: 12, fontSize: 12, color: '#475569' }}>Taskly — Mi Proyecto</span>
          </div>
          <div className="preview-board">
            {[
              { title: 'Por hacer', color: '#6366f1', tasks: [{ label: 'Diseño', lcolor: '#6366f1', text: 'Crear wireframes' }, { label: 'Dev', lcolor: '#06b6d4', text: 'Setup del proyecto' }] },
              { title: 'En progreso', color: '#f59e0b', tasks: [{ label: 'Dev', lcolor: '#06b6d4', text: 'API de autenticación' }, { label: 'Diseño', lcolor: '#6366f1', text: 'Sistema de colores' }] },
              { title: 'Revisión', color: '#8b5cf6', tasks: [{ label: 'QA', lcolor: '#22c55e', text: 'Tests unitarios' }] },
              { title: 'Listo', color: '#22c55e', tasks: [{ label: 'Dev', lcolor: '#06b6d4', text: 'Base de datos' }, { label: 'Diseño', lcolor: '#6366f1', text: 'Logo final' }] },
            ].map(col => (
              <div key={col.title} className="preview-col">
                <div className="preview-col-title" style={{ color: col.color }}>{col.title}</div>
                {col.tasks.map((task, i) => (
                  <div key={i} className="preview-card">
                    <div className="preview-label" style={{ background: task.lcolor + '20', color: task.lcolor }}>{task.label}</div>
                    <div className="preview-card-title">{task.text}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div style={{ textAlign: 'center', marginBottom: 0 }}>
          <p className="section-label">Características</p>
          <h2 className="section-title">Todo lo que necesitás<br />para trabajar mejor</h2>
        </div>
        <div className="features-grid">
          {[
            { icon: '🎯', title: 'Drag & Drop intuitivo', desc: 'Mové tareas entre columnas con un simple arrastre. Sin fricciones, sin complicaciones.' },
            { icon: '👥', title: 'Colaboración en equipo', desc: 'Invitá miembros a tus tableros y trabajen juntos en tiempo real desde cualquier lugar.' },
            { icon: '🏷️', title: 'Etiquetas y prioridades', desc: 'Organizá tareas con etiquetas de colores personalizadas para identificar prioridades de un vistazo.' },
            { icon: '📅', title: 'Fechas de vencimiento', desc: 'Asignale fechas límite a cada tarea y recibí alertas visuales cuando se acerca el deadline.' },
            { icon: '🌙', title: 'Modo oscuro', desc: 'Interfaz adaptable con modo oscuro y claro. Diseñada para largas jornadas de trabajo.' },
            { icon: '⚡', title: 'Rápido y confiable', desc: 'Construido con Next.js y PostgreSQL. Performance de primera para equipos que no pueden esperar.' },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="cta-section">
        <div className="cta-glow" />
        <p className="section-label">Empezá hoy</p>
        <h2 className="section-title" style={{ marginBottom: 20 }}>
          Tu equipo lo va a<br />
          <span className="gradient-text">agradecer.</span>
        </h2>
        <p style={{ color: '#64748b', fontSize: 16, marginBottom: 36, fontWeight: 300 }}>
          Gratis para siempre. Sin tarjeta de crédito.
        </p>
        <button className="btn-primary" style={{ fontSize: 16, padding: '16px 40px' }} onClick={() => router.push('/login')}>
          Crear cuenta gratis →
        </button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📋</span>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15 }}>Taskly</span>
        </div>
        <p className="footer-text">Hecho con ♥ por Joaquín · 2026</p>
        <p className="footer-text">Next.js · Node.js · PostgreSQL</p>
      </footer>
    </div>
  );
}
