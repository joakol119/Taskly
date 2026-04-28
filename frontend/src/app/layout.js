import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '../lib/theme';
import { ToastProvider } from '../components/Toast';
import './globals.css';

export const metadata = {
  title: 'Taskly - The task manager built for developers',
  description: 'Turn GitHub issues into actionable tasks. Powered by AI.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}