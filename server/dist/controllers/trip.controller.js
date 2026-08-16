"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = exports.deleteExpense = exports.updateExpense = exports.listExpenses = exports.createExpense = exports.addCategory = exports.listCategories = exports.listParticipants = exports.addParticipant = exports.deleteTrip = exports.updateTrip = exports.listTrips = exports.getTrip = exports.createTrip = void 0;
const trip_service_1 = require("../services/trip.service");
const trip_expense_service_1 = require("../services/trip-expense.service");
const trip_analytics_service_1 = require("../services/trip-analytics.service");
// Trip Controllers
const createTrip = async (req, res, next) => {
    try {
        const trip = await trip_service_1.TripService.createTrip(req.userId, req.body);
        res.status(201).json({ status: 'success', data: { trip } });
    }
    catch (error) {
        next(error);
    }
};
exports.createTrip = createTrip;
const getTrip = async (req, res, next) => {
    try {
        const trip = await trip_service_1.TripService.getTrip(req.userId, req.params.tripId);
        res.json({ status: 'success', data: { trip } });
    }
    catch (error) {
        next(error);
    }
};
exports.getTrip = getTrip;
const listTrips = async (req, res, next) => {
    try {
        const trips = await trip_service_1.TripService.listTrips(req.userId, req.query.status);
        res.json({ status: 'success', data: { trips } });
    }
    catch (error) {
        next(error);
    }
};
exports.listTrips = listTrips;
const updateTrip = async (req, res, next) => {
    try {
        const trip = await trip_service_1.TripService.updateTrip(req.userId, req.params.tripId, req.body);
        res.json({ status: 'success', data: { trip } });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTrip = updateTrip;
const deleteTrip = async (req, res, next) => {
    try {
        await trip_service_1.TripService.deleteTrip(req.userId, req.params.tripId);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTrip = deleteTrip;
// Participant Controllers
const addParticipant = async (req, res, next) => {
    try {
        const participant = await trip_service_1.TripService.addParticipant(req.userId, req.params.tripId, req.body.name, req.body.avatar);
        res.status(201).json({ status: 'success', data: { participant } });
    }
    catch (error) {
        next(error);
    }
};
exports.addParticipant = addParticipant;
const listParticipants = async (req, res, next) => {
    try {
        const participants = await trip_service_1.TripService.listParticipants(req.userId, req.params.tripId);
        res.json({ status: 'success', data: { participants } });
    }
    catch (error) {
        next(error);
    }
};
exports.listParticipants = listParticipants;
// Category Controllers
const listCategories = async (req, res, next) => {
    try {
        const categories = await trip_service_1.TripService.listCategories(req.userId, req.params.tripId);
        res.json({ status: 'success', data: { categories } });
    }
    catch (error) {
        next(error);
    }
};
exports.listCategories = listCategories;
const addCategory = async (req, res, next) => {
    try {
        const category = await trip_service_1.TripService.addCustomCategory(req.userId, req.params.tripId, req.body);
        res.status(201).json({ status: 'success', data: { category } });
    }
    catch (error) {
        next(error);
    }
};
exports.addCategory = addCategory;
// Expense Controllers
const createExpense = async (req, res, next) => {
    try {
        const expense = await trip_expense_service_1.TripExpenseService.createExpense(req.userId, req.params.tripId, req.body);
        res.status(201).json({ status: 'success', data: { expense } });
    }
    catch (error) {
        next(error);
    }
};
exports.createExpense = createExpense;
const listExpenses = async (req, res, next) => {
    try {
        const expenses = await trip_expense_service_1.TripExpenseService.listExpenses(req.userId, req.params.tripId, req.query);
        res.json({ status: 'success', data: { expenses } });
    }
    catch (error) {
        next(error);
    }
};
exports.listExpenses = listExpenses;
const updateExpense = async (req, res, next) => {
    try {
        const expense = await trip_expense_service_1.TripExpenseService.updateExpense(req.userId, req.params.tripId, req.params.expenseId, req.body);
        res.json({ status: 'success', data: { expense } });
    }
    catch (error) {
        next(error);
    }
};
exports.updateExpense = updateExpense;
const deleteExpense = async (req, res, next) => {
    try {
        await trip_expense_service_1.TripExpenseService.deleteExpense(req.userId, req.params.tripId, req.params.expenseId);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteExpense = deleteExpense;
// Analytics Controller
const getDashboard = async (req, res, next) => {
    try {
        const dashboard = await trip_analytics_service_1.TripAnalyticsService.getDashboard(req.userId, req.params.tripId);
        res.json({ status: 'success', data: dashboard });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboard = getDashboard;
//# sourceMappingURL=trip.controller.js.map