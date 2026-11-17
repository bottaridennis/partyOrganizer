import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const read = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(read);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('pp-theme', next);
      } catch {}
      return next;
    });
  }, []);

  return { theme, toggle };
}
