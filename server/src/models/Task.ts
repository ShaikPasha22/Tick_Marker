import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  swotId?: Types.ObjectId;
  swotItemId?: Types.ObjectId;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending', index: true },
    swotId: { type: Schema.Types.ObjectId, ref: 'SwotAnalysis', index: true },
    swotItemId: { type: Schema.Types.ObjectId, ref: 'SwotItem', index: true },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>('Task', TaskSchema);
