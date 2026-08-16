"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfidenceLevel = exports.Intent = void 0;
var Intent;
(function (Intent) {
    // HABITS
    Intent["CREATE_HABIT"] = "CREATE_HABIT";
    Intent["COMPLETE_HABIT"] = "COMPLETE_HABIT";
    Intent["UNCOMPLETE_HABIT"] = "UNCOMPLETE_HABIT";
    Intent["EDIT_HABIT"] = "EDIT_HABIT";
    Intent["DELETE_HABIT"] = "DELETE_HABIT";
    Intent["VIEW_HABITS"] = "VIEW_HABITS";
    // EXPENSES / FINANCE
    Intent["CREATE_EXPENSE"] = "CREATE_EXPENSE";
    Intent["EDIT_EXPENSE"] = "EDIT_EXPENSE";
    Intent["DELETE_EXPENSE"] = "DELETE_EXPENSE";
    Intent["VIEW_EXPENSES"] = "VIEW_EXPENSES";
    Intent["GET_FINANCE_SUMMARY"] = "GET_FINANCE_SUMMARY";
    // TRIPS
    Intent["CREATE_TRIP"] = "CREATE_TRIP";
    Intent["EDIT_TRIP"] = "EDIT_TRIP";
    Intent["DELETE_TRIP"] = "DELETE_TRIP";
    Intent["VIEW_TRIPS"] = "VIEW_TRIPS";
    Intent["COMPLETE_TRIP"] = "COMPLETE_TRIP";
    Intent["REOPEN_TRIP"] = "REOPEN_TRIP";
    Intent["CREATE_TRIP_EXPENSE"] = "CREATE_TRIP_EXPENSE";
    Intent["GET_TRIP_SPENDING"] = "GET_TRIP_SPENDING";
    // NAVIGATION
    Intent["NAVIGATE"] = "NAVIGATE";
    // GENERAL
    Intent["UNKNOWN"] = "UNKNOWN";
})(Intent || (exports.Intent = Intent = {}));
var ConfidenceLevel;
(function (ConfidenceLevel) {
    ConfidenceLevel["HIGH"] = "HIGH";
    ConfidenceLevel["MEDIUM"] = "MEDIUM";
    ConfidenceLevel["LOW"] = "LOW";
})(ConfidenceLevel || (exports.ConfidenceLevel = ConfidenceLevel = {}));
//# sourceMappingURL=command.types.js.map