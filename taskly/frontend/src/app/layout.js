export const metadata = { title: 'Taskly', description: 'Gestor de tareas en equipo' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "'Inter', system-ui, sans-serif", background: '#f1f5f9' }}>
        {children}
      </body>
    </html>
  );
}
