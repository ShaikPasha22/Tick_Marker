"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const genai_1 = require("@google/genai");
const command_types_1 = require("../../commands/command.types");
class GeminiProvider {
    constructor() {
        this.ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    async extractIntent(text) {
        const today = new Date().toISOString().split('T')[0];
        const responseSchema = {
            type: genai_1.Type.OBJECT,
            properties: {
                intent: {
                    type: genai_1.Type.STRING,
                    enum: ['CREATE_EXPENSE', 'COMPLETE_HABIT', 'UNKNOWN'],
                    description: 'The primary intent of the user.',
                },
                confidence: {
                    type: genai_1.Type.STRING,
                    enum: ['HIGH', 'MEDIUM', 'LOW'],
                    description: 'Confidence in extracting all necessary information correctly.',
                },
                reasoning: {
                    type: genai_1.Type.STRING,
                    description: 'Brief explanation of why this intent and entities were chosen.',
                },
                entities: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        amount: { type: genai_1.Type.NUMBER, description: 'The monetary amount for expenses.' },
                        currency: { type: genai_1.Type.STRING, description: 'Currency code, e.g., INR, USD.' },
                        category: { type: genai_1.Type.STRING, description: 'Category of the expense, e.g., Petrol, Food.' },
                        date: { type: genai_1.Type.STRING, description: 'ISO date string (YYYY-MM-DD).' },
                        paymentMethod: { type: genai_1.Type.STRING, description: 'How it was paid, e.g., UPI, Cash, Card.' },
                        description: { type: genai_1.Type.STRING, description: 'Additional details about the expense.' },
                        habitName: { type: genai_1.Type.STRING, description: 'The name of the habit for habit completions.' },
                    },
                },
            },
            required: ['intent', 'confidence', 'reasoning', 'entities'],
        };
        const prompt = `You are the NLP engine for a personal tracking app called TickMark.
The current date is ${today}.
Extract the user's intent and any relevant entities from the following text.
If the date mentioned is relative (like "yesterday" or "tomorrow"), resolve it to an absolute ISO date (YYYY-MM-DD) based on today (${today}).

User text: "${text}"`;
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: responseSchema,
                    temperature: 0,
                },
            });
            if (!response.text) {
                throw new Error('No text returned from Gemini');
            }
            const result = JSON.parse(response.text);
            // Ensure enums are mapped correctly
            if (!Object.values(command_types_1.Intent).includes(result.intent)) {
                result.intent = command_types_1.Intent.UNKNOWN;
            }
            return result;
        }
        catch (error) {
            console.error('Gemini Provider Error:', error);
            return {
                intent: command_types_1.Intent.UNKNOWN,
                confidence: command_types_1.ConfidenceLevel.LOW,
                reasoning: 'Failed to parse AI response.',
                entities: {},
            };
        }
    }
}
exports.GeminiProvider = GeminiProvider;
//# sourceMappingURL=gemini.provider.js.map