import mongoose, { Document } from 'mongoose';
export interface ITrip extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    destination?: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    budget: number;
    currency: string;
    status: 'upcoming' | 'active' | 'completed' | 'archived';
    coverImage?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Trip: mongoose.Model<ITrip, {}, {}, {}, mongoose.Document<unknown, {}, ITrip, {}, {}> & ITrip & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Trip.d.ts.map