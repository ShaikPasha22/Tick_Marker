import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, BarChart3, Target,
  Settings, Zap, LogOut, Plus, Wallet
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/track', icon: CheckSquare, label: 'Track' },
  { to: '/habits', icon: Zap, label: 'Habits' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/goals', icon: Target, label: 'Goals' },
];

const financeNavItems = [
  { to: '/finance', icon: Wallet, label: 'Finance' },
];

const settingsNavItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar-custom border-r border-custom shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-custom">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-glow">
          <span className="text-white font-bold text-base">✓</span>
        </div>
        <div>
          <h1 className="font-bold text-surface-900 dark:text-surface-50 text-base leading-tight">TickMark</h1>
          <p className="text-xs text-surface-400">Habits & Finance</p>
        </div>
      </div>

      {/* Add Habit CTA */}
      <div className="px-4 pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/habits?create=1')}
          className="btn-primary w-full justify-center gap-2"
          id="sidebar-add-habit-btn"
        >
          <Plus size={16} />
          Add Habit
        </motion.button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              id={`sidebar-nav-${label.toLowerCase()}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Finance section */}
        <div className="mt-4 pt-4 border-t border-custom">
          <p className="px-3 mb-2 text-[10px] font-bold text-surface-400 uppercase tracking-widest">Finance</p>
          <div className="space-y-0.5">
            {financeNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-link ${isActive || window.location.pathname.startsWith('/finance') ? 'active' : ''}`}
                id={`sidebar-nav-${label.toLowerCase()}`}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="mt-2">
          {settingsNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              id={`sidebar-nav-${label.toLowerCase()}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 border-t border-custom pt-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{user?.name}</p>
            <p className="text-xs text-surface-400 truncate">Lv {user?.level} · {user?.xp} XP</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="nav-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          id="sidebar-logout-btn"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
