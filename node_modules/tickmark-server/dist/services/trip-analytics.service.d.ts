export declare class TripAnalyticsService {
    static getDashboard(userId: string, tripId: string): Promise<{
        trip: {
            name: string;
            destination: string | undefined;
            budget: number;
            currency: string;
            startDate: Date;
            endDate: Date;
            status: "active" | "archived" | "completed" | "upcoming";
        };
        summary: {
            totalSpent: number;
            remainingBudget: number;
            budgetUsedPercentage: number;
            paidByMe: number;
            paidByOthers: number;
        };
        metrics: {
            totalDays: number;
            daysElapsed: number;
            daysRemaining: number;
            averageDaily: number;
            suggestedDaily: number;
            projectedFinalCost: number;
        };
        categories: {
            name: string;
            color: string;
            icon: string;
            amount: number;
        }[];
        participants: {
            name: string;
            amount: number;
            isMe: boolean;
        }[];
    }>;
}
//# sourceMappingURL=trip-analytics.service.d.ts.map