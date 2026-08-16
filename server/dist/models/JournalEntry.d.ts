import mongoose, { Document, Types } from 'mongoose';
export interface IJournalEntry extends Document {
    userId: Types.ObjectId;
    date: Date;
    mood?: 1 | 2 | 3 | 4 | 5;
    energy?: 1 | 2 | 3 | 4 | 5;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const JournalEntry: mongoose.Model<IJournalEntry, {}, {}, {}, mongoose.Document<unknown, {}, IJournalEntry, {}, {}> & IJournalEntry & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=JournalEntry.d.ts.map