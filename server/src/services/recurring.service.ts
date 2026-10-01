import { Types } from 'mongoose';
import { RecurringTransaction, IRecurringTransaction, RecurringFrequency } from '../models/RecurringTransaction';
import { Income } from '../models/Income';
import { ExpenseService } from './expense.service';

/**
 * Next due date after `current`. Monthly/yearly bills keep the day of month they
 * started on (`anchorDay`), clamped to short months: a bill started on the 31st is
 * due 28/29 Feb and back on the 31st in March. Dates are UTC calendar days, like
 * every other transaction date.
 */
export function nextDueDate(current: Date, frequency: RecurringFrequency, anchorDay: number): Date {
  const y = current.getUTCFullYear();
  const m = current.getUTCMonth();
  const d = current.getUTCDate();
  const clamped = (year: number, month: number) =>
    new Date(Date.UTC(year, month, Math.min(anchorDay, new Date(Date.UTC(year, month + 1, 0)).getUTCDate())));

  switch (frequency) {
    case 'daily': return new Date(Date.UTC(y, m, d + 1));
    case 'weekly': return new Date(Date.UTC(y, m, d + 7));
    case 'monthly': return clamped(y, m + 1);
    case 'yearly': return clamped(y + 1, m);
  }
}

/** Move a bill to its next cycle without recording anything (skip this occurrence). */
export async function skipOccurrence(recurring: IRecurringTransaction) {
  recurring.nextDueDate = nextDueDate(recurring.nextDueDate, recurring.frequency, recurring.startDate.getUTCDate());
  await recurring.save();
  return recurring;
}

/**
 * Record the current occurrence as a real expense/income (dated on its due date, or
 * `date` when given) and move the bill to its next cycle.
 */
export async function recordOccurrence(userId: Types.ObjectId, recurring: IRecurringTransaction, date?: Date) {
  const txDate = date ?? recurring.nextDueDate;
  const base = {
    amount: recurring.amount,
    categoryId: recurring.categoryId,
    description: recurring.description,
    date: txDate,
    recurringId: recurring._id as Types.ObjectId,
  };

  let transaction;
  if (recurring.type === 'expense') {
    transaction = await ExpenseService.createExpense(userId, {
      ...base,
      paymentMethodId: recurring.paymentMethodId,
      status: 'confirmed',
    });
  } else {
    const income = await new Income({ ...base, userId, notes: recurring.notes, status: 'confirmed' }).save();
    transaction = { income: await Income.findById(income._id).populate('categoryId', 'name icon color').lean() };
  }

  await skipOccurrence(recurring);
  return { ...transaction, recurring };
}

export async function findOwnedRecurring(userId: Types.ObjectId, id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return RecurringTransaction.findOne({ _id: id, userId });
}
