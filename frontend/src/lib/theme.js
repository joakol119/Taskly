'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') setDark(true);
  }, []);

  const toggle = () => {
    setDark(prev => {
      localStorage.setItem('theme', !prev ? 'dark' : 'light');
      return !prev;
    });
  };

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export const themes = {
  light: {
    bg: '#f8fafc',
    surface: '#fff',
    border: '#e2e8f0',
    text: '#0f172a',
    textSub: '#64748b',
    textMuted: '#94a3b8',
    headerBg: '#fff',
    headerBorder: '#e2e8f0',
    inputBg: '#f8fafc',
    inputBorder: '#e2e8f0',
    cardBg: '#fff',
    columnBg: '#f1f5f9',
    taskBg: '#fff',
    taskBorder: '#e2e8f0',
  },
  dark: {
    bg: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
    textSub: '#94a3b8',
    textMuted: '#475569',
    headerBg: '#1e293b',
    headerBorder: '#334155',
    inputBg: '#0f172a',
    inputBorder: '#334155',
    cardBg: '#1e293b',
    columnBg: '#1e293b',
    taskBg: '#0f172a',
    taskBorder: '#334155',
  },
};
