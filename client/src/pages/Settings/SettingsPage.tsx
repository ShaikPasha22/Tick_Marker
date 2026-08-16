import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { User, Globe, Monitor, Download, Trash2, LogOut, Sun, Moon, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { authApi } from '../../api/auth';
import type { Theme } from '../../types';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo',
  'Asia/Shanghai', 'Australia/Sydney', 'Asia/Dubai', 'Asia/Singapore',
];

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting, isDirty } } = useForm({
    defaultValues: {
      name: user?.name ?? '',
      timezone: user?.timezone ?? 'UTC',
      weekStartDay: user?.weekStartDay ?? 1,
      gamificationEnabled: user?.gamificationEnabled ?? true,
    },
  });

  const { mutate: saveProfile } = useMutation({
    mutationFn: (data: any) => authApi.updateMe(data),
    onSuccess: (updatedUser: any) => {
      updateUser(updatedUser);
      toast.success('Profile saved!');
    },
    onError: () => toast.error('Failed to save'),
  });

  const { mutate: deleteAccount, isPending: isDeleting } = useMutation({
    mutationFn: authApi.deleteAccount,
    onSuccess: () => { logout(); toast.success('Account deleted'); },
    onError: () => toast.error('Failed to delete account'),
  });

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const token = localStorage.getItem('tickmark_token');
      const res = await fetch(`/api/data/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickmark-export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    }
  };

  const THEME_OPTIONS: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Settings</h2>
        <p className="text-sm text-surface-400">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <section className="card p-5 space-y-4">
        <h3 className="font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <User size={16} /> Profile
        </h3>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-surface-900 dark:text-surface-100">{user?.name}</p>
            <p className="text-sm text-surface-400">{user?.email}</p>
            <p className="text-xs text-surface-400 mt-0.5">Level {user?.level} · {user?.xp} XP</p>
          </div>
        </div>

        <form onSubmit={handleSubmit((d) => saveProfile(d))} className="space-y-4" id="settings-profile-form">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Display Name</label>
            <input {...register('name', { required: true })} id="settings-name" className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Timezone</label>
            <div className="relative">
              <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <select {...register('timezone')} id="settings-timezone" className="input pl-10">
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Week Starts On</label>
            <select {...register('weekStartDay')} id="settings-week-start" className="input">
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-surface-100 dark:border-surface-800">
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Gamification</p>
              <p className="text-xs text-surface-400">XP, levels, and achievements</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input {...register('gamificationEnabled')} type="checkbox" id="settings-gamification" className="sr-only peer" />
              <div className="w-10 h-6 bg-surface-200 rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
            </label>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="btn-primary"
            id="settings-save-profile-btn"
          >
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </motion.button>
        </form>
      </section>

      {/* Theme */}
      <section className="card p-5 space-y-4">
        <h3 className="font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <Monitor size={16} /> Appearance
        </h3>
        <div className="flex gap-3">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              id={`settings-theme-${value}`}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                theme === value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
              }`}
            >
              <Icon size={20} className={theme === value ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500'} />
              <span className="text-xs font-medium text-surface-700 dark:text-surface-300">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Data export */}
      <section className="card p-5 space-y-4">
        <h3 className="font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <Download size={16} /> Data Export
        </h3>
        <p className="text-sm text-surface-500">Download a complete copy of your habit data.</p>
        <div className="flex gap-3">
          <button onClick={() => handleExport('json')} className="btn-ghost" id="settings-export-json">
            Export JSON
          </button>
          <button onClick={() => handleExport('csv')} className="btn-ghost" id="settings-export-csv">
            Export CSV
          </button>
        </div>
      </section>

      {/* Danger zone */}
      <section className="card p-5 space-y-4 border-red-200 dark:border-red-900">
        <h3 className="font-bold text-red-600 flex items-center gap-2">
          <AlertTriangle size={16} /> Danger Zone
        </h3>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100"
          id="settings-logout-btn"
        >
          <LogOut size={16} /> Sign Out
        </button>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
            id="settings-delete-account-btn"
          >
            <Trash2 size={16} /> Delete Account
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-3">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              This will permanently delete your account and all associated data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost text-sm">Cancel</button>
              <button
                onClick={() => deleteAccount()}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                id="settings-confirm-delete-btn"
              >
                {isDeleting ? 'Deleting…' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
