// ============ User ============
export interface User {
  _id: string;
  name: string;
  email: string;
  timezone: string;
  weekStartDay: 0 | 1;
  theme: 'light' | 'dark' | 'system';
  profileImage?: string;
  onboardingCompleted: boolean;
  gamificationEnabled: boolean;
  xp: number;
  level: number;
  createdAt: string;
}

// ============ Habit ============
export type HabitType = 'binary' | 'quantity' | 'count' | 'duration' | 'avoidance';
export type HabitFrequency =
  | 'daily'
  | 'specific_days'
  | 'x_per_week'
  | 'x_per_month'
  | 'every_x_days'
  | 'monthly';
export type HabitStatus = 'active' | 'paused' | 'archived';
export type HabitPriority = 'low' | 'medium' | 'high';

export interface HabitSchedule {
  frequency: HabitFrequency;
  days?: number[];
  timesPerWeek?: number;
  timesPerMonth?: number;
  everyXDays?: number;
}

export interface PausePeriod {
  from: string;
  to: string;
  reason?: string;
}

export interface HabitReminder {
  enabled: boolean;
  times: string[];
  snoozeMins: number;
}

export interface Habit {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  icon: string;
  color: string;
  priority: HabitPriority;
  type: HabitType;
  target: number;
  unit: string;
  schedule: HabitSchedule;
  reminder: HabitReminder;
  status: HabitStatus;
  pausePeriods: PausePeriod[];
  startDate: string;
  endDate?: string;
  goalId?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ============ Completion ============
export type CompletionStatus = 'completed' | 'partial' | 'missed' | 'skipped';

export interface HabitCompletion {
  _id: string;
  habitId: string;
  userId: string;
  date: string;
  status: CompletionStatus;
  value?: number;
  note?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ DayView ============
export interface DayHabitEntry {
  habit: Habit;
  completion: HabitCompletion | null;
}

export interface DayViewResponse {
  date: string;
  habits: DayHabitEntry[];
  totalScheduled: number;
}

// ============ Analytics ============
export interface DaySummary {
  date: string;
  scheduled: number;
  completed: number;
  missed: number;
  skipped: number;
  partial: number;
  completionRate: number;
}

export interface HabitAnalytics {
  habitId: string;
  name: string;
  icon: string;
  color: string;
  completionRate: number;
  totalScheduled: number;
  totalCompleted: number;
  totalMissed: number;
  totalSkipped: number;
  currentStreak: number;
  longestStreak: number;
  averageValue?: number;
  totalValue?: number;
}

export interface StreakResult {
  current: number;
  longest: number;
  lastCompletedDate?: string;
}

export interface DashboardData {
  today: DaySummary;
  weekCompletionRate: number;
  monthCompletionRate: number;
  currentBestStreak: number;
  longestEverStreak: number;
  totalTimeThisWeek: number;
  pendingHabitsCount: number;
  habitsAtRisk: string[];
  streaks: Record<string, StreakResult>;
}

export interface HeatmapDay {
  date: string;
  scheduled: number;
  completed: number;
  rate: number;
}

export interface WeeklyReview {
  thisWeekRate: number;
  lastWeekRate: number;
  improvement: number;
  bestHabit: HabitAnalytics | null;
  worstHabit: HabitAnalytics | null;
  totalTimeMinutes: number;
  bestStreak: number;
  habitCount: number;
}

// ============ Goal ============
export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned';

export interface Goal {
  _id: string;
  userId: string;
  habitId?: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string;
  status: GoalStatus;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ Auth ============
export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  timezone?: string;
}

// ============ UI ============
export type Theme = 'light' | 'dark' | 'system';

export interface ToastOptions {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export const HABIT_CATEGORIES = [
  'Health', 'Fitness', 'Learning', 'Work', 'Productivity',
  'Finance', 'Personal Development', 'Sleep', 'Relationships', 'Other'
] as const;

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const HABIT_ICONS = [
  '🧘', '💪', '📚', '💧', '🏃', '🎯', '✍️', '🍎', '😴', '🧠',
  '💊', '🚴', '🎸', '🌱', '🐍', '💻', '📝', '🎨', '🏋️', '🚶',
  '🥗', '☕', '🧹', '📖', '🎵', '🌞', '💰', '❤️', '🤝', '🌿',
] as const;

export const HABIT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#84cc16',
] as const;

// ============================================================
// FINANCE MODULE TYPES
// ============================================================

export type TransactionStatus = 'confirmed' | 'pending' | 'cancelled';
export type CategoryType = 'expense' | 'income';
export type CategoryStatus = 'active' | 'archived';

export interface ExpenseCategory {
  _id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  type: CategoryType;
  isDefault: boolean;
  status: CategoryStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseTag {
  _id: string;
  userId: string;
  name: string;
  color: string;
  usageCount: number;
}

export interface PaymentMethod {
  _id: string;
  userId: string;
  name: string;
  icon: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface Expense {
  _id: string;
  userId: string;
  amount: number;
  date: string;
  time?: string;
  categoryId: ExpenseCategory | string;
  tagIds: (ExpenseTag | string)[];
  paymentMethodId?: PaymentMethod | string;
  description?: string;
  notes?: string;
  status: TransactionStatus;
  isRefund: boolean;
  refundForExpenseId?: string;
  recurringId?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  _id: string;
  userId: string;
  amount: number;
  date: string;
  time?: string;
  categoryId: ExpenseCategory | string;
  description?: string;
  notes?: string;
  status: TransactionStatus;
  recurringId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  _id: string;
  userId: string;
  year: number;
  month: number;
  overall: number;
  categoryBudgets: { categoryId: string; amount: number }[];
}

export interface FinancialSettings {
  _id: string;
  userId: string;
  openingBalance: number;
  currency: string;
  currencySymbol: string;
  lowBalanceThreshold: number;
  budgetAlertThresholds: number[];
  setupCompleted: boolean;
}

// ─── Analytics types ──────────────────────────────────────────────────────────

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
}

export interface AvailableBalance {
  openingBalance: number;
  totalConfirmedIncome: number;
  totalConfirmedExpenses: number;
  availableBalance: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface DailySpendingItem {
  date: string;
  amount: number;
  incomeAmount: number;
  transactionCount: number;
}

export interface MonthlyDataItem {
  year: number;
  month: number;
  label: string;
  income: number;
  expenses: number;
  netCashFlow: number;
}

export interface BudgetStatusItem {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

export interface BudgetStatus {
  overall: {
    budgeted: number;
    spent: number;
    remaining: number;
    percentage: number;
  };
  categories: BudgetStatusItem[];
}

export interface PaymentMethodBreakdown {
  methodId: string | null;
  name: string;
  icon: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface SpendingVelocity {
  daysElapsed: number;
  totalDaysInMonth: number;
  percentMonthElapsed: number;
  budgetedAmount: number;
  spentAmount: number;
  percentBudgetUsed: number;
  isOverPace: boolean;
  projectedMonthlySpend: number;
}

export interface FinancialInsight {
  id: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  title: string;
  message: string;
  icon: string;
}

export interface FinancialDashboard {
  period: { from: string; to: string };
  summary: FinancialSummary;
  balance: AvailableBalance;
  budgetStatus: BudgetStatus | null;
  categoryBreakdown: CategoryBreakdownItem[];
  dailySpending: DailySpendingItem[];
  recentTransactions: (Expense | Income)[];
  insights: FinancialInsight[];
  velocity: SpendingVelocity | null;
  averageDailySpending: number;
  topCategory: CategoryBreakdownItem | null;
  currencySymbol: string;
}

export interface CalendarDay {
  date: string;
  expenseAmount: number;
  incomeAmount: number;
  transactionCount: number;
}

// Helper: typed transaction entry for combined list
export type TransactionEntry =
  | (Expense & { transactionType: 'expense' })
  | (Income & { transactionType: 'income' });

// ============================================================
// TRIP FINANCE MODULE TYPES
// ============================================================

export type TripStatus = 'upcoming' | 'active' | 'completed' | 'archived';

export interface Trip {
  _id: string;
  userId: string;
  name: string;
  destination?: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  status: TripStatus;
  coverImage?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripParticipant {
  _id: string;
  tripId: string;
  userId?: string;
  name: string;
  avatar?: string;
  isMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TripCategory {
  _id: string;
  tripId: string;
  userId: string;
  name: string;
  budget?: number;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TripExpense {
  _id: string;
  tripId: string;
  userId: string;
  categoryId: TripCategory | string;
  amount: number;
  currency: string;
  date: string;
  time?: string;
  description?: string;
  paidBy: TripParticipant | string;
  paidByType: 'CURRENT_USER' | 'TRIP_PARTICIPANT';
  paymentMethod?: string;
  tags?: string[];
  notes?: string;
  receipt?: string;
  status: 'confirmed' | 'planned';
  includeInMainFinance: boolean;
  mainFinanceTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripAnalyticsSummary {
  trip: Trip;
  summary: {
    totalSpent: number;
    remainingBudget: number;
    budgetUsedPercentage: number;
    paidByMe: number;
    paidByOthers: number;
  };
  metrics: {
    totalDays: number;
    daysElapsed: number;
    daysRemaining: number;
    averageDaily: number;
    suggestedDaily: number;
    projectedFinalCost: number;
  };
  categories: {
    name: string;
    icon: string;
    color: string;
    amount: number;
  }[];
  participants: {
    name: string;
    amount: number;
    isMe: boolean;
  }[];
}


