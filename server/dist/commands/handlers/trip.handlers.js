"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const command_registry_1 = require("../registry/command.registry");
const command_types_1 = require("../command.types");
const trip_service_1 = require("../../services/trip.service");
const trip_expense_service_1 = require("../../services/trip-expense.service");
const TripCategory_1 = require("../../models/TripCategory");
const TripParticipant_1 = require("../../models/TripParticipant");
const Trip_1 = require("../../models/Trip");
class CreateTripHandler {
    async execute(userId, intentData, context) {
        const { destination, startDate, endDate, budget, currency } = intentData.entities;
        const missingFields = [];
        if (!destination)
            missingFields.push('destination');
        if (!startDate)
            missingFields.push('startDate');
        if (!endDate)
            missingFields.push('endDate');
        if (missingFields.length > 0) {
            return {
                success: false,
                message: `I need a bit more information to create the trip. Please provide: ${missingFields.join(', ')}.`,
                actionRequired: 'CLARIFICATION_NEEDED',
                missingFields
            };
        }
        const result = await trip_service_1.TripService.createTrip(userId.toString(), {
            name: `${destination} Trip`,
            destination: destination,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            budget: budget || 0,
            currency: currency || 'INR',
            status: 'upcoming'
        });
        return {
            success: true,
            message: `Created your trip to ${destination} from ${startDate} to ${endDate}.`,
            data: result
        };
    }
}
class CreateTripExpenseHandler {
    async execute(userId, intentData, context) {
        const { amount, category, date, description, currency, paidBy } = intentData.entities;
        if (!amount) {
            return { success: false, message: 'I need to know the amount.', actionRequired: 'CLARIFICATION_NEEDED', missingFields: ['amount'] };
        }
        // Resolve context trip
        let tripId = context?.activeId;
        if (!tripId) {
            // Find the most recent active trip
            const trips = await Trip_1.Trip.find({ userId: userId.toString(), status: { $ne: 'completed' } }).sort({ startDate: 1 });
            if (trips.length > 0) {
                tripId = trips[0]._id.toString();
            }
            else {
                return { success: false, message: 'You don\'t have any active trips to add an expense to.' };
            }
        }
        // Resolve participant
        let participantId;
        if (paidBy) {
            const participants = await TripParticipant_1.TripParticipant.find({ tripId });
            const matched = participants.find(p => p.name.toLowerCase().includes(paidBy.toLowerCase()));
            if (matched) {
                participantId = matched._id.toString();
            }
            else {
                // Create participant
                const newPart = await trip_service_1.TripService.addParticipant(userId.toString(), tripId, paidBy);
                participantId = newPart._id.toString();
            }
        }
        else {
            // Default to "Me"
            const me = await TripParticipant_1.TripParticipant.findOne({ tripId, isMe: true });
            if (me)
                participantId = me._id.toString();
        }
        // Resolve category
        let categoryId;
        if (category) {
            const categories = await TripCategory_1.TripCategory.find({ tripId });
            const matched = categories.find(c => c.name.toLowerCase().includes(category.toLowerCase()));
            if (matched) {
                categoryId = matched._id.toString();
            }
            else {
                const newCat = await trip_service_1.TripService.addCustomCategory(userId.toString(), tripId, { name: category, icon: '💰', color: '#6366f1' });
                categoryId = newCat._id.toString();
            }
        }
        const result = await trip_expense_service_1.TripExpenseService.createExpense(userId.toString(), tripId, {
            amount,
            categoryId: categoryId ? new mongoose_1.Types.ObjectId(categoryId) : undefined,
            paidBy: participantId ? new mongoose_1.Types.ObjectId(participantId) : undefined,
            date: date ? new Date(date) : new Date(),
            description: description || 'Added via Voice',
            currency: currency,
            status: 'confirmed',
            includeInMainFinance: true // Default true
        });
        return {
            success: true,
            message: `Added ${currency || '₹'}${amount} expense to the trip.`,
            data: result
        };
    }
}
command_registry_1.CommandRegistry.register(command_types_1.Intent.CREATE_TRIP, new CreateTripHandler());
command_registry_1.CommandRegistry.register(command_types_1.Intent.CREATE_TRIP_EXPENSE, new CreateTripExpenseHandler());
// We will register other Trip intents later as needed
//# sourceMappingURL=trip.handlers.js.map