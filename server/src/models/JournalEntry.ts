import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IJournalEntry extends Document {
  userId: Types.ObjectId;
  date: Date;
  mood?: 1 | 2 | 3 | 4 | 5; // 1=terrible, 5=amazing
  energy?: 1 | 2 | 3 | 4 | 5;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    mood: { type: Number, min: 1, max: 5 },
    energy: { type: Number, min: 1, max: 5 },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

JournalEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

export const JournalEntry = mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);
