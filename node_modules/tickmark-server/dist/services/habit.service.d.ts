import { Types } from 'mongoose';
export declare class HabitService {
    /**
     * Logs a completion for a habit programmatically.
     * Useful for both standard HTTP controllers and AI Command engines.
     */
    static logCompletion(userId: string | Types.ObjectId, data: {
        habitId: string | Types.ObjectId;
        date: string | Date;
        status: 'completed' | 'skipped' | 'failed';
        value?: number;
        note?: string;
    }): Promise<{
        completion: import("mongoose").Document<unknown, {}, import("../models/HabitCompletion").IHabitCompletion, {}, {}> & import("../models/HabitCompletion").IHabitCompletion & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        };
        habit: import("mongoose").Document<unknown, {}, import("../models/Habit").IHabit, {}, {}> & import("../models/Habit").IHabit & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
//# sourceMappingURL=habit.service.d.ts.map