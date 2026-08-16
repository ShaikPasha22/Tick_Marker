import mongoose, { Document, Types } from 'mongoose';
export interface IPaymentMethod extends Document {
    userId: Types.ObjectId;
    name: string;
    icon: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PaymentMethod: mongoose.Model<IPaymentMethod, {}, {}, {}, mongoose.Document<unknown, {}, IPaymentMethod, {}, {}> & IPaymentMethod & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const DEFAULT_PAYMENT_METHODS: {
    name: string;
    icon: string;
    isDefault: boolean;
}[];
//# sourceMappingURL=PaymentMethod.d.ts.map