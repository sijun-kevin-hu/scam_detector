import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScamAnalysisResult } from "./types";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Analyzes a message for scam indicators using Google Gemini API
 * Throws an error if API key is missing or request fails
 */
export async function analyzeMessage(
    message: string
): Promise<ScamAnalysisResult> {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
      Analyze the following message for scam indicators. Act as a cybersecurity expert.
      
      Message: "${message}"
      
      Return a JSON object with the following structure:
      {
        "riskScore": number (0-100),
        "riskLevel": "low" | "medium" | "high",
        "explanation": "string (2-3 sentences explaining why)",
        "patterns": ["string", "string"] (list of detected scam patterns, e.g., "Urgency", "Phishing"),
        "suspiciousPhrases": ["string", "string"] (exact phrases from the text that are suspicious)
      }

      Strictly return ONLY the JSON object. Do not include markdown formatting like \`\`\`json.
    `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 500,
            },
        });

        const response = result.response;
        const text = response.text();

        // Clean up potential markdown formatting if the model ignores instructions
        const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();

        let analysis: ScamAnalysisResult;
        try {
            analysis = JSON.parse(jsonStr) as ScamAnalysisResult;
        } catch (parseError) {
            console.error("Failed to parse LLM response:", text);
            throw new Error("Invalid JSON response from LLM");
        }

        // Validate the result structure roughly
        if (typeof analysis.riskScore !== 'number' || !analysis.riskLevel) {
            throw new Error("Invalid API response structure: missing required fields");
        }

        return analysis;

    } catch (error) {
        console.error("Gemini API error:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
}
