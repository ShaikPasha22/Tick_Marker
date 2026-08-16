import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, User, Mail, Lock, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  timezone: string;
}

// Common timezones
const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo',
  'Asia/Shanghai', 'Australia/Sydney', 'Asia/Dubai', 'Asia/Singapore',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: { timezone: TIMEZONES.includes(userTimezone) ? userTimezone : 'UTC' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { token, user } = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        timezone: data.timezone,
      });
      setAuth(token, user);
      toast.success(`Account created! Welcome, ${user.name}! 🎉`);
      navigate('/onboarding', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mx-auto shadow-glow mb-3">
            <span className="text-white font-bold text-xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Create your account</h1>
          <p className="text-surface-500 mt-1 text-sm">Start building better habits today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 card p-6" id="register-form">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name too short' } })}
                id="register-name"
                placeholder="Alex Johnson"
                className="input pl-10"
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                })}
                type="email"
                id="register-email"
                placeholder="you@example.com"
                className="input pl-10"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Timezone
            </label>
            <div className="relative">
              <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <select {...register('timezone')} id="register-timezone" className="input pl-10 appearance-none">
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'At least 8 characters' },
                })}
                type={showPassword ? 'text' : 'password'}
                id="register-password"
                placeholder="••••••••"
                className="input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (v) => v === watch('password') || 'Passwords do not match',
                })}
                type="password"
                id="register-confirm-password"
                placeholder="••••••••"
                className="input pl-10"
              />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full mt-2"
            id="register-submit-btn"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </motion.button>

          <p className="text-center text-xs text-surface-400 mt-3">
            By creating an account, you agree to our Terms and Privacy Policy.
          </p>
        </form>

        <p className="text-center text-sm text-surface-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
            Sign in →
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
