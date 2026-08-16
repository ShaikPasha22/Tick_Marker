import { Types } from 'mongoose';
import { ITrip } from '../models/Trip';
export declare const DEFAULT_TRIP_CATEGORIES: {
    name: string;
    icon: string;
    color: string;
}[];
export declare class TripService {
    /**
     * Create a new trip along with default categories and the "Me" participant.
     */
    static createTrip(userId: string, tripData: Partial<ITrip>): Promise<import("mongoose").Document<unknown, {}, ITrip, {}, {}> & ITrip & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static getTrip(userId: string, tripId: string): Promise<import("mongoose").Document<unknown, {}, ITrip, {}, {}> & ITrip & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static listTrips(userId: string, status?: string): Promise<(import("mongoose").Document<unknown, {}, ITrip, {}, {}> & ITrip & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static updateTrip(userId: string, tripId: string, updateData: Partial<ITrip>): Promise<import("mongoose").Document<unknown, {}, ITrip, {}, {}> & ITrip & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static deleteTrip(userId: string, tripId: string): Promise<{
        message: string;
    }>;
    /**
     * Participants Management
     */
    static addParticipant(userId: string, tripId: string, name: string, avatar?: string): Promise<import("mongoose").Document<unknown, {}, import("../models/TripParticipant").ITripParticipant, {}, {}> & import("../models/TripParticipant").ITripParticipant & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static listParticipants(userId: string, tripId: string): Promise<(import("mongoose").Document<unknown, {}, import("../models/TripParticipant").ITripParticipant, {}, {}> & import("../models/TripParticipant").ITripParticipant & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * Categories Management
     */
    static addCustomCategory(userId: string, tripId: string, categoryData: Partial<any>): Promise<import("mongoose").Document<unknown, {}, import("../models/TripCategory").ITripCategory, {}, {}> & import("../models/TripCategory").ITripCategory & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static listCategories(userId: string, tripId: string): Promise<(import("mongoose").Document<unknown, {}, import("../models/TripCategory").ITripCategory, {}, {}> & import("../models/TripCategory").ITripCategory & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
//# sourceMappingURL=trip.service.d.ts.map