/**
 * Seed script — creates a demo user with realistic habit data.
 * Run with: npm run seed
 * Demo credentials: demo@tickmark.app / Demo1234!
 */
import mongoose from 'mongoose';
import { subDays, eachDayOfInterval } from 'date-fns';
import { env } from './config/env';
import { User } from './models/User';
import { Habit } from './models/Habit';
import { HabitCompletion } from './models/HabitCompletion';
import { Goal } from './models/Goal';
import { ExpenseCategory, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from './models/ExpenseCategory';
import { PaymentMethod, DEFAULT_PAYMENT_METHODS } from './models/PaymentMethod';
import { Expense } from './models/Expense';
import { Income } from './models/Income';
import { Budget } from './models/Budget';
import { FinancialSettings } from './models/FinancialSettings';

const DEMO_EMAIL = 'demo@tickmark.app';
const DEMO_PASSWORD = 'Demo1234!';

export async function seedDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  }

  // Remove existing demo user
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    await User.deleteOne({ _id: existing._id });
    await Habit.deleteMany({ userId: existing._id });
    await HabitCompletion.deleteMany({ userId: existing._id });
    await Goal.deleteMany({ userId: existing._id });
    await ExpenseCategory.deleteMany({ userId: existing._id });
    await PaymentMethod.deleteMany({ userId: existing._id });
    await Expense.deleteMany({ userId: existing._id });
    await Income.deleteMany({ userId: existing._id });
    await Budget.deleteMany({ userId: existing._id });
    await FinancialSettings.deleteMany({ userId: existing._id });
    console.log('🗑️  Cleared existing demo data');
  }

  // Create demo user
  const user = new User({
    name: 'Alex Demo',
    email: DEMO_EMAIL,
    passwordHash: DEMO_PASSWORD,
    timezone: 'Asia/Kolkata',
    onboardingCompleted: true,
    gamificationEnabled: true,
    xp: 1240,
    level: 5,
  });
  await user.save();
  console.log(`👤 Created demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  const userId = user._id;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Create habits
  const habits = await Habit.insertMany([
    {
      userId,
      name: 'Morning Meditation',
      description: 'Start the day with 10 minutes of mindfulness',
      category: 'Personal Development',
      icon: '🧘',
      color: '#8b5cf6',
      priority: 'high',
      type: 'duration',
      target: 10,
      unit: 'minutes',
      schedule: { frequency: 'daily' },
      reminder: { enabled: true, times: ['06:30'], snoozeMins: 5 },
      status: 'active',
      startDate: subDays(today, 60),
      order: 0,
    },
    {
      userId,
      name: 'Exercise',
      description: 'Workout for at least 30 minutes',
      category: 'Fitness',
      icon: '💪',
      color: '#ef4444',
      priority: 'high',
      type: 'duration',
      target: 30,
      unit: 'minutes',
      schedule: { frequency: 'specific_days', days: [1, 2, 3, 4, 5] },
      reminder: { enabled: true, times: ['07:00'], snoozeMins: 10 },
      status: 'active',
      startDate: subDays(today, 60),
      order: 1,
    },
    {
      userId,
      name: 'Read',
      description: 'Read 20 pages of a book',
      category: 'Learning',
      icon: '📚',
      color: '#f59e0b',
      priority: 'medium',
      type: 'count',
      target: 20,
      unit: 'pages',
      schedule: { frequency: 'daily' },
      reminder: { enabled: true, times: ['21:00'], snoozeMins: 10 },
      status: 'active',
      startDate: subDays(today, 45),
      order: 2,
    },
    {
      userId,
      name: 'Drink Water',
      description: 'Drink at least 2.5 litres of water',
      category: 'Health',
      icon: '💧',
      color: '#06b6d4',
      priority: 'high',
      type: 'quantity',
      target: 2.5,
      unit: 'litres',
      schedule: { frequency: 'daily' },
      status: 'active',
      startDate: subDays(today, 30),
      order: 3,
    },
    {
      userId,
      name: 'No Junk Food',
      description: 'Avoid processed and junk food',
      category: 'Health',
      icon: '🚫',
      color: '#10b981',
      priority: 'medium',
      type: 'avoidance',
      target: 1,
      unit: 'day',
      schedule: { frequency: 'daily' },
      status: 'active',
      startDate: subDays(today, 30),
      order: 4,
    },
    {
      userId,
      name: 'Study Python',
      description: 'Practice coding for 45 minutes',
      category: 'Learning',
      icon: '🐍',
      color: '#3b82f6',
      priority: 'high',
      type: 'duration',
      target: 45,
      unit: 'minutes',
      schedule: { frequency: 'x_per_week', timesPerWeek: 5 },
      status: 'active',
      startDate: subDays(today, 30),
      order: 5,
    },
    {
      userId,
      name: 'Sleep by 11 PM',
      description: 'Go to bed before 11 PM',
      category: 'Sleep',
      icon: '😴',
      color: '#6366f1',
      priority: 'medium',
      type: 'binary',
      target: 1,
      unit: 'times',
      schedule: { frequency: 'daily' },
      status: 'active',
      startDate: subDays(today, 20),
      order: 6,
    },
  ]);

  console.log(`📋 Created ${habits.length} habits`);

  // Generate completions for the past 60 days
  const days = eachDayOfInterval({ start: subDays(today, 59), end: subDays(today, 1) });
  const completions: object[] = [];

  for (const day of days) {
    const utcDay = new Date(day);
    utcDay.setUTCHours(0, 0, 0, 0);
    const dayOfWeek = day.getDay();

    for (const habit of habits) {
      // Determine if scheduled
      let isScheduled = false;
      if (habit.schedule.frequency === 'daily') isScheduled = true;
      else if (habit.schedule.frequency === 'specific_days') {
        isScheduled = (habit.schedule.days || []).includes(dayOfWeek);
      } else if (habit.schedule.frequency === 'x_per_week') {
        isScheduled = Math.random() < 0.7; // ~70% of days
      }

      if (!isScheduled) continue;
      if (utcDay < (habit.startDate as Date)) continue;

      // Simulate realistic completion rates
      const completionChance =
        habit.name === 'Morning Meditation' ? 0.88 :
        habit.name === 'Exercise' ? 0.75 :
        habit.name === 'Read' ? 0.72 :
        habit.name === 'Drink Water' ? 0.85 :
        habit.name === 'No Junk Food' ? 0.80 :
        habit.name === 'Study Python' ? 0.65 :
        habit.name === 'Sleep by 11 PM' ? 0.60 : 0.70;

      const rand = Math.random();
      let status: string;
      let value: number | undefined;

      if (rand < completionChance) {
        status = 'completed';
        if (habit.type === 'duration') value = habit.target as number;
        else if (habit.type === 'quantity') value = habit.target as number;
        else if (habit.type === 'count') value = habit.target as number;
      } else if (rand < completionChance + 0.08) {
        status = 'partial';
        if (habit.type === 'duration') value = Math.round((habit.target as number) * 0.6);
        else if (habit.type === 'quantity') value = parseFloat(((habit.target as number) * 0.6).toFixed(1));
        else if (habit.type === 'count') value = Math.round((habit.target as number) * 0.5);
      } else if (rand < completionChance + 0.10) {
        status = 'skipped';
      } else {
        status = 'missed';
      }

      completions.push({
        habitId: habit._id,
        userId,
        date: utcDay,
        status,
        value,
        completedAt: status === 'completed' ? new Date(utcDay.getTime() + Math.random() * 10 * 3600000) : undefined,
      });
    }
  }

  await HabitCompletion.insertMany(completions, { ordered: false }).catch(() => {});
  console.log(`✅ Seeded ${completions.length} completion records`);

  // Find created habits for linking
  const exerciseHabit = habits.find((h) => h.name === 'Exercise');
  const readHabit = habits.find((h) => h.name === 'Read');
  const pythonHabit = habits.find((h) => h.name === 'Study Python');

  const getCompletionsCount = (habitId: any) => {
    return completions.filter(
      (c: any) => c.habitId.toString() === habitId.toString() && c.status === 'completed'
    ).length;
  };

  // Create goals with linked habits
  const seededGoals = await Goal.insertMany([
    {
      userId,
      title: 'Read 20 Books This Year',
      description: 'Expand knowledge through consistent reading',
      targetValue: 20,
      currentValue: readHabit ? getCompletionsCount(readHabit._id) : 7,
      unit: 'books',
      deadline: new Date(today.getFullYear(), 11, 31),
      status: 'active',
      category: 'Learning',
      habitId: readHabit?._id,
    },
    {
      userId,
      title: 'Exercise 150 Times This Year',
      description: 'Build a consistent fitness routine',
      targetValue: 150,
      currentValue: exerciseHabit ? getCompletionsCount(exerciseHabit._id) : 67,
      unit: 'sessions',
      deadline: new Date(today.getFullYear(), 11, 31),
      status: 'active',
      category: 'Fitness',
      habitId: exerciseHabit?._id,
    },
    {
      userId,
      title: 'Study 200 Hours of Python',
      description: 'Become proficient in Python development',
      targetValue: 200,
      currentValue: pythonHabit ? getCompletionsCount(pythonHabit._id) : 48,
      unit: 'hours',
      deadline: new Date(today.getFullYear(), 11, 31),
      status: 'active',
      category: 'Learning',
      habitId: pythonHabit?._id,
    },
  ]);

  // Update back-reference on habits
  if (exerciseHabit) {
    exerciseHabit.goalId = seededGoals.find((g) => g.title.includes('Exercise'))?._id;
    await exerciseHabit.save();
  }
  if (readHabit) {
    readHabit.goalId = seededGoals.find((g) => g.title.includes('Read'))?._id;
    await readHabit.save();
  }
  if (pythonHabit) {
    pythonHabit.goalId = seededGoals.find((g) => g.title.includes('Study'))?._id;
    await pythonHabit.save();
  }

  console.log('🎯 Created 3 goals and linked them with habits');

  // ─── Finance Seed Data ────────────────────────────────────────────────────

  // Create expense categories
  const expenseCategories = await ExpenseCategory.insertMany(
    DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({ ...cat, userId, type: 'expense', isDefault: true }))
  );

  // Create income categories
  const incomeCategories = await ExpenseCategory.insertMany(
    DEFAULT_INCOME_CATEGORIES.map((cat) => ({ ...cat, userId, type: 'income', isDefault: true }))
  );

  // Create payment methods
  const paymentMethods = await PaymentMethod.insertMany(
    DEFAULT_PAYMENT_METHODS.map((pm) => ({ ...pm, userId }))
  );

  // Financial settings
  await FinancialSettings.create({
    userId,
    openingBalance: 25000,
    currency: 'INR',
    currencySymbol: '₹',
    lowBalanceThreshold: 10000,
    budgetAlertThresholds: [75, 90, 100],
    setupCompleted: true,
  });

  // Map categories by name for easy lookup
  const catMap = new Map(expenseCategories.map((c) => [c.name, c._id]));
  const incCatMap = new Map(incomeCategories.map((c) => [c.name, c._id]));
  const pmMap = new Map(paymentMethods.map((p) => [p.name, p._id]));

  // Generate income for last 3 months
  const incomeRecords: object[] = [];
  for (let m = 2; m >= 0; m--) {
    const d = new Date(today);
    d.setUTCMonth(d.getUTCMonth() - m);
    d.setUTCDate(1);

    incomeRecords.push({
      userId,
      amount: 50000,
      date: new Date(d),
      categoryId: incCatMap.get('Salary'),
      description: 'Monthly Salary',
      status: 'confirmed',
    });

    if (m === 1 || m === 0) {
      const fd = new Date(d);
      fd.setUTCDate(15);
      incomeRecords.push({
        userId,
        amount: Math.round(3000 + Math.random() * 5000),
        date: fd,
        categoryId: incCatMap.get('Freelance'),
        description: 'Freelance project payment',
        status: 'confirmed',
      });
    }
  }
  await Income.insertMany(incomeRecords);

  // Generate realistic expenses for last 60 days
  const expenseData: { name: string; catName: string; pm: string; minAmt: number; maxAmt: number; frequency: number }[] = [
    { name: 'Petrol refill', catName: 'Petrol / Fuel', pm: 'UPI', minAmt: 500, maxAmt: 1500, frequency: 0.25 },
    { name: 'Lunch', catName: 'Food', pm: 'UPI', minAmt: 100, maxAmt: 400, frequency: 0.65 },
    { name: 'Dinner', catName: 'Food', pm: 'Cash', minAmt: 200, maxAmt: 600, frequency: 0.45 },
    { name: 'Groceries', catName: 'Groceries', pm: 'UPI', minAmt: 500, maxAmt: 2000, frequency: 0.15 },
    { name: 'Online shopping', catName: 'Shopping', pm: 'Credit Card', minAmt: 500, maxAmt: 3000, frequency: 0.08 },
    { name: 'Electricity bill', catName: 'Bills', pm: 'UPI', minAmt: 800, maxAmt: 1500, frequency: 0.03 },
    { name: 'Internet bill', catName: 'Subscriptions', pm: 'UPI', minAmt: 700, maxAmt: 900, frequency: 0.03 },
    { name: 'Movie / OTT', catName: 'Entertainment', pm: 'Credit Card', minAmt: 200, maxAmt: 800, frequency: 0.1 },
    { name: 'Medicines', catName: 'Health', pm: 'Cash', minAmt: 100, maxAmt: 600, frequency: 0.06 },
    { name: 'Coffee / Snacks', catName: 'Food', pm: 'Cash', minAmt: 50, maxAmt: 200, frequency: 0.4 },
    { name: 'Transport / Auto', catName: 'Transport', pm: 'Cash', minAmt: 50, maxAmt: 300, frequency: 0.3 },
    { name: 'Clothing', catName: 'Clothes', pm: 'Credit Card', minAmt: 500, maxAmt: 3000, frequency: 0.04 },
  ];

  const expenseRecords: object[] = [];
  const expDays = eachDayOfInterval({ start: subDays(today, 59), end: today });

  for (const day of expDays) {
    const utcDay = new Date(day);
    utcDay.setUTCHours(0, 0, 0, 0);

    for (const ed of expenseData) {
      if (Math.random() > ed.frequency) continue;

      const catId = catMap.get(ed.catName);
      const pmId = pmMap.get(ed.pm);
      if (!catId) continue;

      const amount = Math.round(ed.minAmt + Math.random() * (ed.maxAmt - ed.minAmt));
      expenseRecords.push({
        userId,
        amount,
        date: utcDay,
        categoryId: catId,
        paymentMethodId: pmId,
        description: ed.name,
        status: 'confirmed',
        isRefund: false,
      });
    }
  }

  // Add rent for last 2 months
  for (let m = 1; m >= 0; m--) {
    const rentDay = new Date(today);
    rentDay.setUTCMonth(rentDay.getUTCMonth() - m);
    rentDay.setUTCDate(1);
    rentDay.setUTCHours(0, 0, 0, 0);
    expenseRecords.push({
      userId,
      amount: 12000,
      date: rentDay,
      categoryId: catMap.get('Rent'),
      paymentMethodId: pmMap.get('Bank Transfer'),
      description: 'Monthly Rent',
      status: 'confirmed',
      isRefund: false,
    });
  }

  await Expense.insertMany(expenseRecords, { ordered: false }).catch(() => {});

  // Create a budget for current month
  const now = new Date();
  await Budget.create({
    userId,
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    overall: 40000,
    categoryBudgets: [
      { categoryId: catMap.get('Food'), amount: 8000 },
      { categoryId: catMap.get('Petrol / Fuel'), amount: 5000 },
      { categoryId: catMap.get('Shopping'), amount: 4000 },
      { categoryId: catMap.get('Groceries'), amount: 5000 },
      { categoryId: catMap.get('Entertainment'), amount: 2000 },
      { categoryId: catMap.get('Rent'), amount: 12000 },
    ].filter((cb) => cb.categoryId),
  });

  console.log(`💰 Seeded financial data: ${expenseRecords.length} expenses, ${incomeRecords.length} income records`);
  // ─────────────────────────────────────────────────────────────────────────────

  console.log('\n🎉 Seed complete!');
  console.log(`📧 Email: ${DEMO_EMAIL}`);
  console.log(`🔑 Password: ${DEMO_PASSWORD}`);

  console.log('🎉 Seed complete!\n');
}

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
