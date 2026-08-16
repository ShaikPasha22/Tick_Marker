export declare enum Intent {
    CREATE_HABIT = "CREATE_HABIT",
    COMPLETE_HABIT = "COMPLETE_HABIT",
    UNCOMPLETE_HABIT = "UNCOMPLETE_HABIT",
    EDIT_HABIT = "EDIT_HABIT",
    DELETE_HABIT = "DELETE_HABIT",
    VIEW_HABITS = "VIEW_HABITS",
    CREATE_EXPENSE = "CREATE_EXPENSE",
    EDIT_EXPENSE = "EDIT_EXPENSE",
    DELETE_EXPENSE = "DELETE_EXPENSE",
    VIEW_EXPENSES = "VIEW_EXPENSES",
    GET_FINANCE_SUMMARY = "GET_FINANCE_SUMMARY",
    CREATE_TRIP = "CREATE_TRIP",
    EDIT_TRIP = "EDIT_TRIP",
    DELETE_TRIP = "DELETE_TRIP",
    VIEW_TRIPS = "VIEW_TRIPS",
    COMPLETE_TRIP = "COMPLETE_TRIP",
    REOPEN_TRIP = "REOPEN_TRIP",
    CREATE_TRIP_EXPENSE = "CREATE_TRIP_EXPENSE",
    GET_TRIP_SPENDING = "GET_TRIP_SPENDING",
    NAVIGATE = "NAVIGATE",
    UNKNOWN = "UNKNOWN"
}
export declare enum ConfidenceLevel {
    HIGH = "HIGH",
    MEDIUM = "MEDIUM",
    LOW = "LOW"
}
export interface CommandEntities {
    amount?: number;
    currency?: string;
    category?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    duration?: number;
    description?: string;
    paymentMethod?: string;
    paidBy?: string;
    habitName?: string;
    destination?: string;
    budget?: number;
    pageTarget?: 'dashboard' | 'habits' | 'finance' | 'goals' | 'analytics' | 'settings' | string;
    targetId?: string;
}
export interface CommandContext {
    currentRoute: string;
    activeId?: string;
    localDate: string;
    timezone: string;
}
export interface StructuredIntent {
    intent: Intent;
    entities: CommandEntities;
    confidence: ConfidenceLevel;
    reasoning: string;
}
export interface CommandExecutionResult {
    success: boolean;
    message: string;
    actionRequired?: 'CONFIRMATION_NEEDED' | 'CLARIFICATION_NEEDED';
    missingFields?: string[];
    data?: any;
}
//# sourceMappingURL=command.types.d.ts.map