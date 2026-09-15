'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/useTheme';

export default function ThemeToggle() {
  const { isDark } = useTheme();

  const toggle = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('techgear_theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('techgear_theme', 'dark');
    }
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-xl transition-all border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
      title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
    </button>
  );
}
