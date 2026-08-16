import { Types } from 'mongoose';
import { TripExpense, ITripExpense } from '../models/TripExpense';
import { Expense } from '../models/Expense';
import { TripCategory } from '../models/TripCategory';
import { ExpenseCategory } from '../models/ExpenseCategory';
import { createError } from '../middleware/errorHandler';

export class TripExpenseService {
  /**
   * Syncs a TripExpense with Main Finance.
   * If included, creates/updates the Main Expense.
   * If not included, deletes the Main Expense (if it exists).
   */
  private static async syncWithMainFinance(tripExpense: ITripExpense, userId: string) {
    if (tripExpense.includeInMainFinance) {
      // Find the corresponding Main Finance category
      const tripCategory = await TripCategory.findById(tripExpense.categoryId);
      let mainCategoryId: Types.ObjectId | null = null;
      
      if (tripCategory) {
        // Try to match by name
        const match = await ExpenseCategory.findOne({ userId, name: tripCategory.name, type: 'expense' });
        if (match) {
          mainCategoryId = match._id;
        }
      }

      if (!mainCategoryId) {
        // Fallback to "Travel" or "Other"
        const fallback = await ExpenseCategory.findOne({ userId, name: { $in: ['Travel', 'Other'] }, type: 'expense' });
        mainCategoryId = fallback ? fallback._id : new Types.ObjectId(); // Fallback handles if seed didn't run, though unlikely
      }

      const mainExpenseData = {
        userId: tripExpense.userId,
        amount: tripExpense.amount,
        date: tripExpense.date,
        time: tripExpense.time,
        categoryId: mainCategoryId,
        description: `[Trip] ${tripExpense.description || 'Trip Expense'}`,
        notes: tripExpense.notes,
        status: tripExpense.status === 'planned' ? 'pending' : 'confirmed',
      };

      if (tripExpense.mainFinanceTransactionId) {
        // Update existing
        await Expense.findByIdAndUpdate(tripExpense.mainFinanceTransactionId, { $set: mainExpenseData });
      } else {
        // Create new
        const newMainExpense = new Expense(mainExpenseData);
        await newMainExpense.save();
        tripExpense.mainFinanceTransactionId = newMainExpense._id;
        await tripExpense.save(); // Save the ref back
      }
    } else {
      // If it was previously included, delete it
      if (tripExpense.mainFinanceTransactionId) {
        await Expense.findByIdAndDelete(tripExpense.mainFinanceTransactionId);
        tripExpense.mainFinanceTransactionId = undefined;
        await tripExpense.save();
      }
    }
  }

  static async createExpense(userId: string, tripId: string, expenseData: Partial<ITripExpense>) {
    const expense = new TripExpense({
      ...expenseData,
      userId,
      tripId,
    });
    
    await expense.save();
    
    // Sync to main finance if needed
    if (expense.includeInMainFinance) {
      await this.syncWithMainFinance(expense, userId);
    }
    
    return expense;
  }

  static async updateExpense(userId: string, tripId: string, expenseId: string, updateData: Partial<ITripExpense>) {
    const expense = await TripExpense.findOne({ _id: expenseId, tripId, userId });
    if (!expense) throw createError('Expense not found', 404);

    // Apply updates
    Object.assign(expense, updateData);
    await expense.save();

    // Sync to main finance
    await this.syncWithMainFinance(expense, userId);

    return expense;
  }

  static async deleteExpense(userId: string, tripId: string, expenseId: string) {
    const expense = await TripExpense.findOne({ _id: expenseId, tripId, userId });
    if (!expense) throw createError('Expense not found', 404);

    if (expense.mainFinanceTransactionId) {
      await Expense.findByIdAndDelete(expense.mainFinanceTransactionId);
    }
    await expense.deleteOne();

    return { message: 'Expense deleted successfully' };
  }

  static async listExpenses(userId: string, tripId: string, filters?: any) {
    const query: any = { tripId, userId };
    
    if (filters?.categoryId) query.categoryId = filters.categoryId;
    if (filters?.paidBy) query.paidBy = filters.paidBy;
    if (filters?.includeInMainFinance !== undefined) query.includeInMainFinance = filters.includeInMainFinance;

    return await TripExpense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate('categoryId', 'name icon color')
      .populate('paidBy', 'name avatar isMe');
  }
}
