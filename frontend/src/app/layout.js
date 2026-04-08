import { ThemeProvider } from '../lib/theme';

export const metadata = { title: 'Taskly', description: 'Gestor de tareas en equipo' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "'Inter', system-ui, sans-serif" }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
