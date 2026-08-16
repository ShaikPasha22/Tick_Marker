import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import type { LoginForm } from '../../types';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      const { token, user } = await authApi.login(data);
      setAuth(token, user);
      toast.success(`Welcome back, ${user.name}! 👋`);
      navigate(user.onboardingCompleted ? '/dashboard' : '/onboarding', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-app">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 300 + 50,
                height: Math.random() * 300 + 50,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                transform: 'translate(-50%, -50%)',
                opacity: Math.random() * 0.3,
              }}
            />
          ))}
        </div>
        <div className="relative text-center text-white space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto shadow-glow-lg">
            <span className="text-4xl font-bold">✓</span>
          </div>
          <h1 className="text-4xl font-bold">TickMark</h1>
          <p className="text-lg text-white/80">
            Track habits, build consistency, and reach your goals with powerful analytics.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: 'Habit Types', value: '5' },
              { label: 'View Modes', value: '4' },
              { label: 'Insights', value: '∞' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-white/70 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 lg:max-w-lg flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mx-auto shadow-glow mb-3">
              <span className="text-white font-bold text-xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">TickMark</h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Welcome back</h2>
            <p className="text-surface-500 mt-1">Sign in to continue tracking</p>
          </div>

          {/* Demo hint */}
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 text-sm text-primary-700 dark:text-primary-300">
            <strong>Demo account:</strong> demo@tickmark.app / Demo1234!
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="login-form">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  {...register('email', { required: 'Email is required' })}
                  type="email"
                  id="login-email"
                  placeholder="you@example.com"
                  className="input pl-10"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Forgot password?
              </Link>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
              id="login-submit-btn"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-center text-sm text-surface-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              Create one →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
