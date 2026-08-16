import mongoose, { Document } from 'mongoose';
export interface ITripParticipant extends Document {
    tripId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    name: string;
    avatar?: string;
    isMe: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const TripParticipant: mongoose.Model<ITripParticipant, {}, {}, {}, mongoose.Document<unknown, {}, ITripParticipant, {}, {}> & ITripParticipant & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=TripParticipant.d.ts.map