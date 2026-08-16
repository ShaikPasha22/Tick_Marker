import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<{ password: string; confirm: string }>();

  const onSubmit = async ({ password }: { password: string; confirm: string }) => {
    try {
      const { token: jwt, ...rest } = await authApi.resetPassword(token, password) as any;
      if (jwt) {
        setAuth(jwt, rest.user);
        toast.success('Password updated!');
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Reset failed — link may have expired');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app p-4">
        <div className="card p-8 text-center space-y-3">
          <div className="text-4xl">❌</div>
          <p className="font-semibold text-surface-900 dark:text-surface-100">Invalid reset link</p>
          <p className="text-sm text-surface-500">Please request a new password reset.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-app p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm card p-8 space-y-6"
      >
        <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Choose New Password</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="reset-password-form">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">New Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                {...register('password', { required: true, minLength: { value: 8, message: 'At least 8 characters' } })}
                type="password"
                id="reset-password"
                className="input pl-10"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Confirm</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                {...register('confirm', { validate: (v) => v === watch('password') || 'Passwords do not match' })}
                type="password"
                id="reset-confirm"
                className="input pl-10"
                placeholder="••••••••"
              />
            </div>
            {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
          </div>
          <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={isSubmitting} className="btn-primary w-full" id="reset-submit-btn">
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
