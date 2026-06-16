import OpenAI from "openai";

const DEFAULT_AI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_OPENAI_BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta/openai/";

export function getAiApiKey() {
    return process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
}

export function getAiModel(fallback = DEFAULT_AI_MODEL) {
    return process.env.GEMINI_MODEL || process.env.AI_MODEL || process.env.OPENAI_MODEL || fallback;
}

export function createAiClient() {
    const apiKey = getAiApiKey();

    if (!apiKey) {
        return null;
    }

    const baseURL =
        process.env.AI_BASE_URL ||
        process.env.GEMINI_BASE_URL ||
        GEMINI_OPENAI_BASE_URL;

    return new OpenAI({
        apiKey,
        baseURL,
    });
}
