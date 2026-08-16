import { useLocation } from 'react-router-dom';
import { Sun, Moon, Monitor, Mic } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useCommandStore } from '../../store/useCommandStore';
import type { Theme } from '../../types';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/track': 'Today\'s Habits',
  '/habits': 'My Habits',
  '/analytics': 'Analytics',
  '/goals': 'Goals',
  '/settings': 'Settings',
};

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const THEME_CYCLE: Theme[] = ['light', 'dark', 'system'];

export default function Header() {
  const location = useLocation();
  const { theme, setTheme } = useUIStore();
  const { user } = useAuthStore();
  const { openAssistant } = useCommandStore();

  const title = PAGE_TITLES[location.pathname] || 'TickMark';

  const cycleTheme = () => {
    const idx = THEME_CYCLE.indexOf(theme);
    setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]);
  };

  const ThemeIcon = THEME_ICONS[theme];

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-custom bg-white/80 dark:bg-surface-950/80 backdrop-blur-sm shrink-0">
      {/* Title */}
      <div className="md:hidden flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-xs">✓</span>
        </div>
        <span className="font-bold text-surface-900 dark:text-surface-50">TickMark</span>
      </div>

      <h2 className="hidden md:block text-base font-semibold text-surface-900 dark:text-surface-100">
        {title}
      </h2>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Voice Assistant Toggle */}
        <button
          onClick={openAssistant}
          title="Voice Assistant"
          className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors touch-target flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
          aria-label="Open Voice Assistant"
        >
          <Mic size={18} />
        </button>

        {/* XP display */}
        {user?.gamificationEnabled && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <span>⚡</span>
            <span>{user.xp} XP</span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          id="header-theme-toggle"
          title={`Theme: ${theme}`}
          className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors touch-target flex items-center justify-center"
          aria-label="Toggle theme"
        >
          <ThemeIcon size={18} className="text-surface-600 dark:text-surface-400" />
        </button>
      </div>
    </header>
  );
}
