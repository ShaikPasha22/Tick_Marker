"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripAnalyticsService = void 0;
const Trip_1 = require("../models/Trip");
const TripExpense_1 = require("../models/TripExpense");
const errorHandler_1 = require("../middleware/errorHandler");
class TripAnalyticsService {
    static async getDashboard(userId, tripId) {
        const trip = await Trip_1.Trip.findOne({ _id: tripId, userId });
        if (!trip)
            throw (0, errorHandler_1.createError)('Trip not found', 404);
        const expenses = await TripExpense_1.TripExpense.find({ tripId, userId, status: 'confirmed' })
            .populate('categoryId', 'name icon color')
            .populate('paidBy', 'name isMe');
        let totalSpent = 0;
        let paidByMe = 0;
        let paidByOthers = 0;
        const categorySpending = {};
        const participantSpending = {};
        expenses.forEach((expense) => {
            totalSpent += expense.amount;
            // Participant breakdown
            const participant = expense.paidBy;
            if (participant) {
                if (participant.isMe) {
                    paidByMe += expense.amount;
                }
                else {
                    paidByOthers += expense.amount;
                }
                const pId = participant._id.toString();
                if (!participantSpending[pId]) {
                    participantSpending[pId] = { name: participant.name, amount: 0, isMe: participant.isMe };
                }
                participantSpending[pId].amount += expense.amount;
            }
            // Category breakdown
            const category = expense.categoryId;
            if (category) {
                const cId = category._id.toString();
                if (!categorySpending[cId]) {
                    categorySpending[cId] = { name: category.name, color: category.color, icon: category.icon, amount: 0 };
                }
                categorySpending[cId].amount += expense.amount;
            }
        });
        const categories = Object.values(categorySpending).sort((a, b) => b.amount - a.amount);
        const participants = Object.values(participantSpending).sort((a, b) => b.amount - a.amount);
        const now = new Date();
        const startDate = new Date(trip.startDate);
        const endDate = new Date(trip.endDate);
        // Days logic
        const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        let daysElapsed = 0;
        if (now >= startDate) {
            if (now > endDate) {
                daysElapsed = totalDays;
            }
            else {
                daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            }
        }
        const daysRemaining = Math.max(0, totalDays - daysElapsed);
        const remainingBudget = trip.budget - totalSpent;
        const budgetUsedPercentage = trip.budget > 0 ? (totalSpent / trip.budget) * 100 : 0;
        const averageDaily = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
        const suggestedDaily = daysRemaining > 0 ? remainingBudget / daysRemaining : remainingBudget;
        const projectedFinalCost = totalSpent + (averageDaily * daysRemaining);
        return {
            trip: {
                name: trip.name,
                destination: trip.destination,
                budget: trip.budget,
                currency: trip.currency,
                startDate: trip.startDate,
                endDate: trip.endDate,
                status: trip.status,
            },
            summary: {
                totalSpent,
                remainingBudget,
                budgetUsedPercentage,
                paidByMe,
                paidByOthers,
            },
            metrics: {
                totalDays,
                daysElapsed,
                daysRemaining,
                averageDaily,
                suggestedDaily,
                projectedFinalCost,
            },
            categories,
            participants,
        };
    }
}
exports.TripAnalyticsService = TripAnalyticsService;
//# sourceMappingURL=trip-analytics.service.js.map