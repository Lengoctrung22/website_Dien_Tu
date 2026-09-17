export type BannerThemeKey = 'purple' | 'blue' | 'cyan' | 'rose' | 'emerald' | 'amber' | 'dark';

export interface BannerTheme {
  key: BannerThemeKey;
  label: string;
  gradient: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
  previewClass: string;
}

/**
 * BANNER_THEMES
 * Static dictionary defining all 7 gradient presets.
 * Keeping Tailwind CSS class strings literal in source code
 * prevents Tailwind JIT from purging gradient styles.
 */
export const BANNER_THEMES: Record<BannerThemeKey, BannerTheme> = {
  purple: {
    key: 'purple',
    label: 'Tím Cyber',
    gradient: 'from-purple-600/80 via-indigo-950/70 to-transparent',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/30',
    accentColor: '#a855f7',
    previewClass: 'from-purple-600 via-indigo-950 to-slate-950',
  },
  blue: {
    key: 'blue',
    label: 'Xanh Sapphire ROG',
    gradient: 'from-blue-600/80 via-indigo-900/60 to-transparent',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/30',
    accentColor: '#3b82f6',
    previewClass: 'from-blue-600 via-indigo-900 to-slate-950',
  },
  cyan: {
    key: 'cyan',
    label: 'Xanh Băng Cyber',
    gradient: 'from-cyan-600/80 via-slate-900/80 to-transparent',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/30',
    accentColor: '#06b6d4',
    previewClass: 'from-cyan-600 via-slate-900 to-slate-950',
  },
  rose: {
    key: 'rose',
    label: 'Đỏ Gaming',
    gradient: 'from-rose-600/80 via-red-950/70 to-transparent',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/30',
    accentColor: '#f43f5e',
    previewClass: 'from-rose-600 via-red-950 to-slate-950',
  },
  emerald: {
    key: 'emerald',
    label: 'Xanh Ngọc Aurora',
    gradient: 'from-emerald-600/80 via-teal-950/70 to-transparent',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    accentColor: '#10b981',
    previewClass: 'from-emerald-600 via-teal-950 to-slate-950',
  },
  amber: {
    key: 'amber',
    label: 'Cam Solar',
    gradient: 'from-amber-600/80 via-orange-950/70 to-transparent',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    accentColor: '#f59e0b',
    previewClass: 'from-amber-600 via-orange-950 to-slate-950',
  },
  dark: {
    key: 'dark',
    label: 'Đen Minimal',
    gradient: 'from-slate-800/80 via-slate-950/80 to-transparent',
    badgeBg: 'bg-slate-700/30',
    badgeText: 'text-slate-300',
    badgeBorder: 'border-slate-600/40',
    accentColor: '#64748b',
    previewClass: 'from-slate-800 via-slate-900 to-slate-950',
  },
};

export const BANNER_THEME_KEYS: BannerThemeKey[] = [
  'purple',
  'blue',
  'cyan',
  'rose',
  'emerald',
  'amber',
  'dark',
];

export function getBannerTheme(themeKey?: string): BannerTheme {
  if (themeKey && themeKey in BANNER_THEMES) {
    return BANNER_THEMES[themeKey as BannerThemeKey];
  }
  return BANNER_THEMES.purple;
}
