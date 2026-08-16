"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripService = exports.DEFAULT_TRIP_CATEGORIES = void 0;
const Trip_1 = require("../models/Trip");
const TripParticipant_1 = require("../models/TripParticipant");
const TripCategory_1 = require("../models/TripCategory");
const TripExpense_1 = require("../models/TripExpense");
const User_1 = require("../models/User");
const errorHandler_1 = require("../middleware/errorHandler");
exports.DEFAULT_TRIP_CATEGORIES = [
    { name: 'Transportation', icon: '🚗', color: '#3b82f6' },
    { name: 'Fuel/Petrol', icon: '⛽', color: '#ef4444' },
    { name: 'Flights', icon: '✈️', color: '#0ea5e9' },
    { name: 'Train', icon: '🚆', color: '#8b5cf6' },
    { name: 'Bus', icon: '🚌', color: '#f59e0b' },
    { name: 'Hotel', icon: '🏨', color: '#6366f1' },
    { name: 'Food', icon: '🍔', color: '#f97316' },
    { name: 'Activities', icon: '🏄‍♂️', color: '#10b981' },
    { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
    { name: 'Tickets', icon: '🎫', color: '#14b8a6' },
    { name: 'Sightseeing', icon: '📸', color: '#84cc16' },
    { name: 'Parking', icon: '🅿️', color: '#64748b' },
    { name: 'Tolls', icon: '🛣️', color: '#71717a' },
    { name: 'Medical', icon: '🏥', color: '#f43f5e' },
    { name: 'Emergency', icon: '🚨', color: '#dc2626' },
    { name: 'Other', icon: '📦', color: '#52525b' },
];
class TripService {
    /**
     * Create a new trip along with default categories and the "Me" participant.
     */
    static async createTrip(userId, tripData) {
        const user = await User_1.User.findById(userId);
        if (!user)
            throw (0, errorHandler_1.createError)('User not found', 404);
        const trip = new Trip_1.Trip({
            ...tripData,
            userId,
            status: tripData.status || 'upcoming',
        });
        await trip.save();
        // Create the "Me" participant
        await TripParticipant_1.TripParticipant.create({
            tripId: trip._id,
            userId: user._id,
            name: 'Me',
            isMe: true,
        });
        // Create default categories for this trip
        const defaultCategories = exports.DEFAULT_TRIP_CATEGORIES.map((cat) => ({
            tripId: trip._id,
            userId,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            isDefault: true,
        }));
        await TripCategory_1.TripCategory.insertMany(defaultCategories);
        return trip;
    }
    static async getTrip(userId, tripId) {
        const trip = await Trip_1.Trip.findOne({ _id: tripId, userId });
        if (!trip)
            throw (0, errorHandler_1.createError)('Trip not found', 404);
        return trip;
    }
    static async listTrips(userId, status) {
        const query = { userId };
        if (status)
            query.status = status;
        return await Trip_1.Trip.find(query).sort({ startDate: 1 });
    }
    static async updateTrip(userId, tripId, updateData) {
        const trip = await Trip_1.Trip.findOneAndUpdate({ _id: tripId, userId }, { $set: updateData }, { new: true, runValidators: true });
        if (!trip)
            throw (0, errorHandler_1.createError)('Trip not found', 404);
        return trip;
    }
    static async deleteTrip(userId, tripId) {
        const trip = await Trip_1.Trip.findOneAndDelete({ _id: tripId, userId });
        if (!trip)
            throw (0, errorHandler_1.createError)('Trip not found', 404);
        // Clean up related data
        await TripParticipant_1.TripParticipant.deleteMany({ tripId });
        await TripCategory_1.TripCategory.deleteMany({ tripId });
        await TripExpense_1.TripExpense.deleteMany({ tripId, userId }); // Does not delete from Main Finance, handled by expense service
        return { message: 'Trip deleted successfully' };
    }
    /**
     * Participants Management
     */
    static async addParticipant(userId, tripId, name, avatar) {
        const trip = await this.getTrip(userId, tripId);
        const participant = new TripParticipant_1.TripParticipant({
            tripId: trip._id,
            name,
            avatar,
            isMe: false,
        });
        return await participant.save();
    }
    static async listParticipants(userId, tripId) {
        // Ensure trip belongs to user
        await this.getTrip(userId, tripId);
        return await TripParticipant_1.TripParticipant.find({ tripId }).sort({ isMe: -1, name: 1 });
    }
    /**
     * Categories Management
     */
    static async addCustomCategory(userId, tripId, categoryData) {
        const trip = await this.getTrip(userId, tripId);
        const category = new TripCategory_1.TripCategory({
            ...categoryData,
            tripId: trip._id,
            userId,
            isDefault: false,
        });
        return await category.save();
    }
    static async listCategories(userId, tripId) {
        await this.getTrip(userId, tripId);
        return await TripCategory_1.TripCategory.find({ tripId }).sort({ name: 1 });
    }
}
exports.TripService = TripService;
//# sourceMappingURL=trip.service.js.map