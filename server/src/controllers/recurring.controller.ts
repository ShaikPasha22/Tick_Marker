import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { RecurringTransaction } from '../models/RecurringTransaction';
import { ExpenseCategory } from '../models/ExpenseCategory';
import { findOwnedRecurring, recordOccurrence, skipOccurrence } from '../services/recurring.service';
import { toUTCDayStart } from '../services/financialAnalytics.service';

const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];
const populate = (q: any) => q.populate('categoryId', 'name icon color').populate('paymentMethodId', 'name icon');

/** Validate and normalise the editable fields of a recurring bill/income. */
async function parseBody(userId: Types.ObjectId, body: any, partial: boolean) {
  const out: Record<string, unknown> = {};
  const has = (k: string) => body[k] !== undefined;

  if (!partial || has('type')) {
    if (!['expense', 'income'].includes(body.type)) throw createError('type must be expense or income', 400);
    out.type = body.type;
  }
  if (!partial || has('amount')) {
    const amount = Number(body.amount);
    if (!(amount > 0)) throw createError('amount must be greater than 0', 400);
    out.amount = amount;
  }
  if (!partial || has('description')) {
    if (!body.description?.trim()) throw createError('description is required', 400);
    out.description = body.description.trim();
  }
  if (!partial || has('frequency')) {
    if (!FREQUENCIES.includes(body.frequency)) throw createError('frequency must be daily, weekly, monthly or yearly', 400);
    out.frequency = body.frequency;
  }
  if (!partial || has('categoryId')) {
    if (!Types.ObjectId.isValid(body.categoryId)) throw createError('categoryId is required', 400);
    const category = await ExpenseCategory.findOne({ _id: body.categoryId, userId });
    if (!category) throw createError('Category not found', 404);
    out.categoryId = category._id;
  }
  if (has('paymentMethodId')) {
    out.paymentMethodId = body.paymentMethodId && Types.ObjectId.isValid(body.paymentMethodId)
      ? new Types.ObjectId(body.paymentMethodId)
      : undefined;
  }
  if (has('notes')) out.notes = body.notes || undefined;
  if (has('isActive')) out.isActive = Boolean(body.isActive);
  for (const key of ['startDate', 'nextDueDate']) {
    if (has(key)) {
      const d = new Date(body[key]);
      if (isNaN(d.getTime())) throw createError(`${key} is not a valid date`, 400);
      out[key] = toUTCDayStart(d);
    }
  }
  if (!partial && !out.startDate) throw createError('startDate is required', 400);
  return out;
}

// GET /api/finance/recurring
export const getRecurring = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const recurring = await populate(RecurringTransaction.find({ userId }).sort({ isActive: -1, nextDueDate: 1 })).lean();
    res.json({ recurring });
  } catch (error) { next(error); }
};

// POST /api/finance/recurring
export const createRecurring = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const data = await parseBody(userId, req.body, false);
    const created = await new RecurringTransaction({
      ...data,
      userId,
      nextDueDate: data.nextDueDate ?? data.startDate, // first occurrence is the start date
    }).save();
    res.status(201).json({ recurring: await populate(RecurringTransaction.findById(created._id)).lean() });
  } catch (error) { next(error); }
};

// PATCH /api/finance/recurring/:id
export const updateRecurring = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const recurring = await findOwnedRecurring(userId, req.params.id);
    if (!recurring) throw createError('Recurring transaction not found', 404);
    recurring.set(await parseBody(userId, req.body, true));
    await recurring.save();
    res.json({ recurring: await populate(RecurringTransaction.findById(recurring._id)).lean() });
  } catch (error) { next(error); }
};

// DELETE /api/finance/recurring/:id — transactions already recorded from it are kept
export const deleteRecurring = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const recurring = await findOwnedRecurring(userId, req.params.id);
    if (!recurring) throw createError('Recurring transaction not found', 404);
    await recurring.deleteOne();
    res.json({ message: 'Recurring transaction deleted' });
  } catch (error) { next(error); }
};

// POST /api/finance/recurring/:id/pay — record this occurrence and move to the next due date
export const payRecurring = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const recurring = await findOwnedRecurring(userId, req.params.id);
    if (!recurring) throw createError('Recurring transaction not found', 404);
    if (!recurring.isActive) throw createError('This recurring transaction is paused', 400);
    const date = req.body?.date ? toUTCDayStart(new Date(req.body.date)) : undefined;
    if (date && isNaN(date.getTime())) throw createError('date is not a valid date', 400);
    res.status(201).json(await recordOccurrence(userId, recurring, date));
  } catch (error) { next(error); }
};

// POST /api/finance/recurring/:id/skip — move to the next due date without recording
export const skipRecurring = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const recurring = await findOwnedRecurring(userId, req.params.id);
    if (!recurring) throw createError('Recurring transaction not found', 404);
    res.json({ recurring: await skipOccurrence(recurring) });
  } catch (error) { next(error); }
};
