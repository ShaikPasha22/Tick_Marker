import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string }>();

  const onSubmit = async ({ email }: { email: string }) => {
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent!');
    } catch {
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm card p-8 space-y-6"
      >
        <Link to="/login" className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700">
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Reset Password</h2>
          <p className="text-sm text-surface-500 mt-1">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-3 py-4">
            <div className="text-4xl">📬</div>
            <p className="font-semibold text-surface-900 dark:text-surface-100">Check your inbox!</p>
            <p className="text-sm text-surface-500">
              If an account exists with that email, you'll receive a reset link within a few minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="forgot-password-form">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  {...register('email', { required: 'Email required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })}
                  type="email"
                  id="forgot-email"
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={isSubmitting} className="btn-primary w-full" id="forgot-submit-btn">
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
