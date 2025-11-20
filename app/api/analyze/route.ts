import { NextRequest, NextResponse } from "next/server";
import { analyzeMessage } from "@/lib/analyze";

// Simple in-memory rate limiter
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * POST /api/analyze
 * Analyzes a message for scam indicators
 */
export async function POST(request: NextRequest) {
    try {
        // Rate Limiting
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const now = Date.now();
        const userRate = ipRequestCounts.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

        if (now > userRate.resetTime) {
            userRate.count = 1;
            userRate.resetTime = now + RATE_LIMIT_WINDOW;
        } else {
            userRate.count++;
        }

        ipRequestCounts.set(ip, userRate);

        if (userRate.count > MAX_REQUESTS_PER_WINDOW) {
            return NextResponse.json(
                {
                    error: "Too many requests",
                    details: "You have exceeded the rate limit. Please try again in a minute.",
                    code: "RATE_LIMIT_EXCEEDED"
                },
                { status: 429 }
            );
        }

        // Parse request body
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {
                    error: "Invalid request format",
                    details: "The request body must be valid JSON. Please check your request format and try again.",
                    code: "INVALID_JSON"
                },
                { status: 400 }
            );
        }

        const { message } = body;

        // Validate input
        if (!message || typeof message !== "string") {
            return NextResponse.json(
                {
                    error: "Invalid message format",
                    details: "The 'message' field is required and must be a text string. Please provide a valid message to analyze.",
                    code: "INVALID_MESSAGE_TYPE"
                },
                { status: 400 }
            );
        }

        // Check if message is empty or just whitespace
        if (message.trim().length === 0) {
            return NextResponse.json(
                {
                    error: "Empty message",
                    details: "The message cannot be empty or contain only whitespace. Please enter some text to analyze.",
                    code: "EMPTY_MESSAGE"
                },
                { status: 400 }
            );
        }

        // Check message length (max 10000 characters)
        if (message.length > 10000) {
            return NextResponse.json(
                {
                    error: "Message too long",
                    details: `The message is ${message.length.toLocaleString()} characters long, but the maximum allowed is 10,000 characters. Please shorten your message and try again.`,
                    code: "MESSAGE_TOO_LONG"
                },
                { status: 400 }
            );
        }

        // Analyze the message
        const result = await analyzeMessage(message);

        // Return the analysis result
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error analyzing message:", error);

        // Provide more detailed error information
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : undefined;

        // Log detailed error for debugging
        console.error("Detailed error:", {
            message: errorMessage,
            stack: errorStack,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json(
            {
                error: "Analysis failed",
                details: "An unexpected error occurred while analyzing your message. This might be due to a temporary service issue. Please try again in a few moments.",
                code: "INTERNAL_SERVER_ERROR",
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
