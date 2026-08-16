import mongoose, { Document } from 'mongoose';
export interface ITripCategory extends Document {
    tripId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    name: string;
    budget?: number;
    icon: string;
    color: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const TripCategory: mongoose.Model<ITripCategory, {}, {}, {}, mongoose.Document<unknown, {}, ITripCategory, {}, {}> & ITripCategory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=TripCategory.d.ts.map