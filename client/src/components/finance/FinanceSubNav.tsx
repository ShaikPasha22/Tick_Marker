import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, List, BarChart2, PiggyBank, Tag, Settings, Map } from 'lucide-react';

const tabs = [
  { to: '/finance', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/finance/calendar', icon: Calendar, label: 'Calendar', end: false },
  { to: '/finance/transactions', icon: List, label: 'Transactions', end: false },
  { to: '/finance/analytics', icon: BarChart2, label: 'Analytics', end: false },
  { to: '/finance/budget', icon: PiggyBank, label: 'Budget', end: false },
  { to: '/finance/categories', icon: Tag, label: 'Categories', end: false },
  { to: '/finance/trips', icon: Map, label: 'Trips', end: false },
  { to: '/finance/settings', icon: Settings, label: 'Settings', end: false },
];

export default function FinanceSubNav() {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
      {tabs.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
             ${isActive
               ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
               : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-300'
             }`
          }
          id={`finance-nav-${label.toLowerCase()}`}
        >
          <Icon size={14} />
          {label}
        </NavLink>
      ))}
    </div>
  );
}
