import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { habitsApi } from '../../api/habits';


// Template habit groups
const HABIT_TEMPLATES = [
  {
    id: 'morning',
    label: 'Morning Routine',
    icon: '🌅',
    habits: [
      { name: 'Drink Water', type: 'quantity', target: 1, unit: 'glass', icon: '💧', color: '#06b6d4', category: 'Health', schedule: { frequency: 'daily' } },
      { name: 'Exercise', type: 'duration', target: 30, unit: 'minutes', icon: '💪', color: '#ef4444', category: 'Fitness', schedule: { frequency: 'daily' } },
      { name: 'Meditation', type: 'duration', target: 10, unit: 'minutes', icon: '🧘', color: '#8b5cf6', category: 'Personal Development', schedule: { frequency: 'daily' } },
    ],
  },
  {
    id: 'study',
    label: 'Study Routine',
    icon: '📚',
    habits: [
      { name: 'Read', type: 'duration', target: 30, unit: 'minutes', icon: '📖', color: '#f59e0b', category: 'Learning', schedule: { frequency: 'daily' } },
      { name: 'Study', type: 'duration', target: 60, unit: 'minutes', icon: '✍️', color: '#3b82f6', category: 'Learning', schedule: { frequency: 'daily' } },
    ],
  },
  {
    id: 'health',
    label: 'Healthy Lifestyle',
    icon: '❤️',
    habits: [
      { name: 'Drink 2L Water', type: 'quantity', target: 2, unit: 'litres', icon: '💧', color: '#06b6d4', category: 'Health', schedule: { frequency: 'daily' } },
      { name: 'No Junk Food', type: 'avoidance', target: 1, unit: 'day', icon: '🚫', color: '#10b981', category: 'Health', schedule: { frequency: 'daily' } },
      { name: 'Sleep on Time', type: 'binary', target: 1, unit: 'times', icon: '😴', color: '#6366f1', category: 'Sleep', schedule: { frequency: 'daily' } },
    ],
  },
  {
    id: 'fitness',
    label: 'Fitness',
    icon: '🏋️',
    habits: [
      { name: 'Workout', type: 'duration', target: 45, unit: 'minutes', icon: '🏋️', color: '#ef4444', category: 'Fitness', schedule: { frequency: 'specific_days', days: [1, 3, 5] } },
      { name: 'Walk 10,000 Steps', type: 'count', target: 10000, unit: 'steps', icon: '🚶', color: '#10b981', category: 'Fitness', schedule: { frequency: 'daily' } },
    ],
  },
];

const STEPS = ['Welcome', 'Templates', 'Customize', 'Done'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleTemplate = (id: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const finish = async () => {
    setIsLoading(true);
    try {
      // Create selected template habits
      const selectedHabits = HABIT_TEMPLATES
        .filter((t) => selectedTemplates.includes(t.id))
        .flatMap((t) => t.habits);

      for (const habit of selectedHabits) {
        await habitsApi.create(habit as any);
      }

      // Mark onboarding complete
      await authApi.updateMe({ onboardingCompleted: true });
      updateUser({ onboardingCompleted: true });

      toast.success('You\'re all set! Let\'s build some habits 🎉');
      navigate('/dashboard', { replace: true });
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const skip = async () => {
    try {
      await authApi.updateMe({ onboardingCompleted: true });
      updateUser({ onboardingCompleted: true });
      navigate('/dashboard', { replace: true });
    } catch {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-surface-100 dark:bg-surface-800">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="text-center space-y-6"
              >
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mx-auto shadow-glow-lg text-4xl">
                  🎯
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
                    Welcome, {user?.name?.split(' ')[0]}! 👋
                  </h1>
                  <p className="text-surface-500 mt-3 text-lg leading-relaxed">
                    Let's set up your first habits. This takes less than a minute.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {[
                    { emoji: '🔥', label: 'Build Streaks' },
                    { emoji: '📊', label: 'Track Analytics' },
                    { emoji: '🏆', label: 'Earn Achievements' },
                  ].map(({ emoji, label }) => (
                    <div key={label} className="card p-4 text-center">
                      <div className="text-2xl mb-2">{emoji}</div>
                      <p className="font-medium text-surface-700 dark:text-surface-300">{label}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="btn-primary px-10 py-3 text-base">
                  Get Started <ArrowRight size={18} />
                </button>
                <br />
                <button onClick={skip} className="text-sm text-surface-400 hover:text-surface-600">
                  Skip and set up manually
                </button>
              </motion.div>
            )}

            {/* Step 1: Template selection */}
            {step === 1 && (
              <motion.div
                key="templates"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                    Choose your routines
                  </h2>
                  <p className="text-surface-500 mt-1">
                    Select templates to get started quickly. You can customize everything later.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {HABIT_TEMPLATES.map((template) => {
                    const isSelected = selectedTemplates.includes(template.id);
                    return (
                      <motion.button
                        key={template.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => toggleTemplate(template.id)}
                        id={`onboarding-template-${template.id}`}
                        className={`card p-4 text-left transition-all ${
                          isSelected
                            ? 'border-primary-500 ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:border-primary-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{template.icon}</span>
                            <span className="font-semibold text-surface-900 dark:text-surface-100">{template.label}</span>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                              <Check size={14} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {template.habits.map((h) => (
                            <span key={h.name} className="text-xs px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                              {h.icon} {h.name}
                            </span>
                          ))}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="btn-ghost">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button onClick={() => setStep(2)} className="btn-primary flex-1 justify-center">
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Summary */}
            {step === 2 && (
              <motion.div
                key="customize"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                    You're ready to go!
                  </h2>
                  <p className="text-surface-500 mt-1">
                    Here's what we'll set up for you:
                  </p>
                </div>

                {selectedTemplates.length === 0 ? (
                  <div className="card p-6 text-center text-surface-400">
                    <p>No templates selected. You can add habits from the Habits page.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {HABIT_TEMPLATES.filter((t) => selectedTemplates.includes(t.id)).map((template) => (
                      <div key={template.id} className="card p-4">
                        <div className="flex items-center gap-2 mb-2 font-semibold text-surface-900 dark:text-surface-100">
                          {template.icon} {template.label}
                        </div>
                        <div className="space-y-1">
                          {template.habits.map((h) => (
                            <div key={h.name} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                              <Check size={14} className="text-emerald-500 shrink-0" />
                              {h.icon} {h.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-ghost">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={finish}
                    disabled={isLoading}
                    className="btn-primary flex-1 justify-center"
                    id="onboarding-finish-btn"
                  >
                    {isLoading ? 'Setting up...' : (
                      <><Sparkles size={16} /> Start Tracking!</>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
