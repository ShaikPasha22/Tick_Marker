import mongoose, { Schema, Document } from 'mongoose';

export interface ITripParticipant extends Document {
  tripId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // Optional, if they are an app user
  name: string;
  avatar?: string;
  isMe: boolean; // Flag to identify the creator/owner participant easily
  createdAt: Date;
  updatedAt: Date;
}

const tripParticipantSchema = new Schema(
  {
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    avatar: { type: String },
    isMe: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TripParticipant = mongoose.model<ITripParticipant>('TripParticipant', tripParticipantSchema);
