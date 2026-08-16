import { Types } from 'mongoose';
import { Expense } from '../models/Expense';
import { ExpenseCategory } from '../models/ExpenseCategory';
import { PaymentMethod } from '../models/PaymentMethod';
import { detectUnusualSpending } from './financialAnalytics.service';
import { createError } from '../middleware/errorHandler';

export class ExpenseService {
  /**
   * Creates an expense programmatically.
   * Useful for both standard HTTP controllers and AI Command engines.
   */
  static async createExpense(
    userId: Types.ObjectId,
    data: {
      amount: number;
      categoryId?: string | Types.ObjectId;
      date?: Date | string;
      description?: string;
      currency?: string;
      paymentMethodId?: string | Types.ObjectId;
      tagIds?: (string | Types.ObjectId)[];
      status?: 'confirmed' | 'pending' | 'cancelled';
    }
  ) {
    if (data.categoryId) {
      const cat = await ExpenseCategory.findOne({ _id: data.categoryId, userId });
      if (!cat) {
        throw createError('Category not found or not owned by user', 403);
      }
    }

    const expense = new Expense({
      ...data,
      userId,
      categoryId: data.categoryId ? new Types.ObjectId(data.categoryId) : undefined,
      tagIds: (data.tagIds ?? []).map((id) => new Types.ObjectId(id)),
      paymentMethodId: data.paymentMethodId ? new Types.ObjectId(data.paymentMethodId) : undefined,
    });

    await expense.save();

    let unusualWarning = null;
    if (data.categoryId && expense.amount) {
      unusualWarning = await detectUnusualSpending(userId, new Types.ObjectId(data.categoryId), expense.amount);
    }

    const populated = await Expense.findById(expense._id)
      .populate('categoryId', 'name icon color')
      .populate('tagIds', 'name color')
      .populate('paymentMethodId', 'name icon')
      .lean();

    return { expense: populated, unusualWarning };
  }
}
