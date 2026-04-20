import { ThemeProvider } from '../lib/theme';
import { ToastProvider } from '../components/Toast';

export const metadata = { title: 'Taskly', description: 'Gestor de tareas en equipo' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "'Inter', system-ui, sans-serif" }}>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
