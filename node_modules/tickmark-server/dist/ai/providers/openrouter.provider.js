"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenRouterProvider = void 0;
const command_types_1 = require("../../commands/command.types");
class OpenRouterProvider {
    constructor() {
        // The user requested an OpenAI model. gpt-4o-mini is fast and great for JSON extraction.
        this.model = 'openai/gpt-4o-mini';
        const key = process.env.OPENROUTER_API_KEY;
        if (!key) {
            console.warn('OPENROUTER_API_KEY is missing');
        }
        this.apiKey = key || '';
    }
    async extractIntent(text, context, history) {
        const today = new Date().toISOString().split('T')[0];
        const schema = {
            type: "object",
            properties: {
                intent: {
                    type: "string",
                    enum: Object.values(command_types_1.Intent),
                    description: "The primary intent of the user. Choose the most specific intent."
                },
                confidence: {
                    type: "string",
                    enum: ["HIGH", "MEDIUM", "LOW"],
                    description: "Confidence in extracting all necessary information correctly."
                },
                reasoning: {
                    type: "string",
                    description: "Brief explanation of why this intent and entities were chosen."
                },
                entities: {
                    type: "object",
                    properties: {
                        amount: { type: "number" },
                        currency: { type: "string" },
                        category: { type: "string" },
                        date: { type: "string", description: "ISO date string (YYYY-MM-DD)" },
                        startDate: { type: "string", description: "ISO date string (YYYY-MM-DD)" },
                        endDate: { type: "string", description: "ISO date string (YYYY-MM-DD)" },
                        duration: { type: "number", description: "Duration in days" },
                        paymentMethod: { type: "string" },
                        description: { type: "string" },
                        habitName: { type: "string" },
                        destination: { type: "string" },
                        budget: { type: "number" },
                        pageTarget: { type: "string", description: "e.g., 'dashboard', 'finance', 'habits', 'analytics', 'settings', 'trip', 'trips'" },
                        targetId: { type: "string", description: "ID or name if navigating to a specific entity" },
                        paidBy: { type: "string", description: "Name of the participant who paid" }
                    }
                }
            },
            required: ["intent", "confidence", "reasoning", "entities"],
            additionalProperties: false
        };
        const systemPrompt = `You are an intelligent Command Orchestrator for TickMark (a finance, habit, and trip tracking app).
The current date is ${today}.

RULES:
1. Extract the user's intent and any relevant entities from the text.
2. If dates are relative ("tomorrow", "next week"), resolve them to absolute ISO dates (YYYY-MM-DD) based on today (${today}).
3. Use context where applicable. If the user asks to navigate, return NAVIGATE and set pageTarget.
4. If a command is ambiguous, return confidence LOW and ask a clarification question in the reasoning.
5. Do NOT reject commands by throwing errors. Attempt to map them to the closest intent or return UNKNOWN.

You MUST return your response as a raw JSON object matching this schema exactly:
${JSON.stringify(schema, null, 2)}

Current application context:
${context ? JSON.stringify(context, null, 2) : 'None'}`;
        const messages = [
            { role: "system", content: systemPrompt }
        ];
        if (history && history.length > 0) {
            history.forEach(msg => messages.push(msg));
        }
        messages.push({ role: "user", content: text });
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'http://localhost:5173',
                    'X-Title': 'TickMark',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    response_format: { type: "json_object" },
                    temperature: 0
                })
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
            }
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No text returned from OpenRouter');
            }
            const result = JSON.parse(content);
            // Ensure enums are mapped correctly
            if (!Object.values(command_types_1.Intent).includes(result.intent)) {
                result.intent = command_types_1.Intent.UNKNOWN;
            }
            return result;
        }
        catch (error) {
            console.error('OpenRouter Provider Error:', error);
            return {
                intent: command_types_1.Intent.UNKNOWN,
                confidence: command_types_1.ConfidenceLevel.LOW,
                reasoning: 'Failed to parse AI response.',
                entities: {},
            };
        }
    }
}
exports.OpenRouterProvider = OpenRouterProvider;
//# sourceMappingURL=openrouter.provider.js.map