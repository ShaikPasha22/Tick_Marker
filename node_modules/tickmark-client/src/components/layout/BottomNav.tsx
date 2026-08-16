import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, BarChart3, BookOpen, Plus, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/track', icon: CheckSquare, label: 'Track' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/habits', icon: BookOpen, label: 'Habits' },
];

export default function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 dark:bg-surface-900/90 backdrop-blur-lg border-t border-surface-200 dark:border-surface-800 pb-safe z-40">
      <div className="flex items-center justify-around px-2 pt-1 pb-1">
        {navItems.slice(0, 2).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            id={`bottom-nav-${label.toLowerCase()}`}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 touch-target
               ${isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-surface-500 dark:text-surface-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Center FAB — Add Habit */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate('/habits?create=1')}
          className="relative -top-5 w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 shadow-glow flex items-center justify-center touch-target"
          id="bottom-nav-add-habit-fab"
          aria-label="Add Habit"
        >
          <Plus size={24} className="text-white" strokeWidth={2.5} />
        </motion.button>

        {navItems.slice(2).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            id={`bottom-nav-${label.toLowerCase()}`}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 touch-target
               ${isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-surface-500 dark:text-surface-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
