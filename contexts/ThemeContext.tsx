'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

/**
 * @interface ThemeContextType
 * @description Define a forma do contexto de tema.
 */
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

/**
 * @constant ThemeContext
 * @description Contexto React para gerenciar o tema da aplicação (claro, escuro, sistema).
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * @component ThemeProvider
 * @description Provedor de contexto que gerencia o estado do tema, aplica as classes CSS
 * correspondentes e persiste a preferência do usuário no localStorage.
 * @param {{ children: React.ReactNode }} props - Propriedades do componente.
 * @returns {React.ReactElement} O provedor de contexto de tema.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('fisioflow-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    
    let effectiveTheme: 'light' | 'dark';
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      effectiveTheme = systemTheme;
    } else {
      effectiveTheme = theme;
    }
    
    // Apply theme class
    root.classList.add(effectiveTheme);
    setActualTheme(effectiveTheme);
    
    // Save to localStorage
    localStorage.setItem('fisioflow-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        setActualTheme(systemTheme);
        
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(systemTheme);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    actualTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * @hook useTheme
 * @description Hook customizado para acessar o contexto de tema.
 * @returns {ThemeContextType} O estado e as funções do contexto de tema.
 * @throws {Error} Se o hook for usado fora de um `ThemeProvider`.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * @hook useThemeToggle
 * @description Hook customizado que fornece uma lógica para alternar entre os temas.
 * @returns {{theme: Theme, actualTheme: 'light' | 'dark', setTheme: (theme: Theme) => void, toggleTheme: () => void, cycleTheme: () => void}}
 * Um objeto com o estado do tema e funções para alterná-lo.
 */
export function useThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();
  
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };
  
  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };
  
  return {
    theme,
    actualTheme,
    setTheme,
    toggleTheme,
    cycleTheme
  };
}