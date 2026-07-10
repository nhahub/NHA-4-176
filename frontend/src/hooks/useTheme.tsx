import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

type Theme = 'dark' | 'light';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: 'dark',
  toggleTheme: () => undefined,
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('foodads-theme') as Theme) ?? 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('foodads-theme', theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')) }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

