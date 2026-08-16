import { Types } from 'mongoose';
import { Trip, ITrip } from '../models/Trip';
import { TripParticipant } from '../models/TripParticipant';
import { TripCategory } from '../models/TripCategory';
import { TripExpense } from '../models/TripExpense';
import { User } from '../models/User';
import { createError } from '../middleware/errorHandler';

export const DEFAULT_TRIP_CATEGORIES = [
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

export class TripService {
  /**
   * Create a new trip along with default categories and the "Me" participant.
   */
  static async createTrip(userId: string, tripData: Partial<ITrip>) {
    const user = await User.findById(userId);
    if (!user) throw createError('User not found', 404);

    const trip = new Trip({
      ...tripData,
      userId,
      status: tripData.status || 'upcoming',
    });
    await trip.save();

    // Create the "Me" participant
    await TripParticipant.create({
      tripId: trip._id,
      userId: user._id,
      name: 'Me',
      isMe: true,
    });

    // Create default categories for this trip
    const defaultCategories = DEFAULT_TRIP_CATEGORIES.map((cat) => ({
      tripId: trip._id,
      userId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      isDefault: true,
    }));
    await TripCategory.insertMany(defaultCategories);

    return trip;
  }

  static async getTrip(userId: string, tripId: string) {
    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) throw createError('Trip not found', 404);
    return trip;
  }

  static async listTrips(userId: string, status?: string) {
    const query: any = { userId };
    if (status) query.status = status;
    return await Trip.find(query).sort({ startDate: 1 });
  }

  static async updateTrip(userId: string, tripId: string, updateData: Partial<ITrip>) {
    const trip = await Trip.findOneAndUpdate(
      { _id: tripId, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!trip) throw createError('Trip not found', 404);
    return trip;
  }

  static async deleteTrip(userId: string, tripId: string) {
    const trip = await Trip.findOneAndDelete({ _id: tripId, userId });
    if (!trip) throw createError('Trip not found', 404);

    // Clean up related data
    await TripParticipant.deleteMany({ tripId });
    await TripCategory.deleteMany({ tripId });
    await TripExpense.deleteMany({ tripId, userId }); // Does not delete from Main Finance, handled by expense service

    return { message: 'Trip deleted successfully' };
  }

  /**
   * Participants Management
   */
  static async addParticipant(userId: string, tripId: string, name: string, avatar?: string) {
    const trip = await this.getTrip(userId, tripId);
    const participant = new TripParticipant({
      tripId: trip._id,
      name,
      avatar,
      isMe: false,
    });
    return await participant.save();
  }

  static async listParticipants(userId: string, tripId: string) {
    // Ensure trip belongs to user
    await this.getTrip(userId, tripId);
    return await TripParticipant.find({ tripId }).sort({ isMe: -1, name: 1 });
  }

  /**
   * Categories Management
   */
  static async addCustomCategory(userId: string, tripId: string, categoryData: Partial<any>) {
    const trip = await this.getTrip(userId, tripId);
    const category = new TripCategory({
      ...categoryData,
      tripId: trip._id,
      userId,
      isDefault: false,
    });
    return await category.save();
  }

  static async listCategories(userId: string, tripId: string) {
    await this.getTrip(userId, tripId);
    return await TripCategory.find({ tripId }).sort({ name: 1 });
  }
}
