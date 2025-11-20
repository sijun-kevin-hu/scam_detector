import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScamAnalysisResult } from "./types";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Pattern definitions for scam detection (Fallback logic)
 * Each pattern includes keywords and a description
 */
const SCAM_PATTERNS = {
    urgentLanguage: {
        keywords: [
            "urgent",
            "immediately",
            "act now",
            "limited time",
            "expires",
            "hurry",
            "today only",
            "last chance",
            "final notice",
            "suspended",
            "locked",
            "expire",
        ],
        description: "Urgent or time-pressured language",
    },
    paymentRequest: {
        keywords: [
            "wire transfer",
            "gift card",
            "bitcoin",
            "crypto",
            "payment",
            "send money",
            "pay now",
            "invoice",
            "western union",
            "paypal",
            "venmo",
            "cash app",
            "zelle",
        ],
        description: "Requests for payment or financial information",
    },
    impersonation: {
        keywords: [
            "verify account",
            "confirm identity",
            "update information",
            "security alert",
            "unusual activity",
            "click here",
            "log in",
            "reset password",
            "suspended account",
            "unauthorized access",
        ],
        description: "Impersonation of official organizations",
    },
    prizes: {
        keywords: [
            "you've won",
            "congratulations",
            "winner",
            "prize",
            "lottery",
            "claim your",
            "free gift",
            "selected",
            "lucky",
        ],
        description: "Too-good-to-be-true offers or prizes",
    },
    threats: {
        keywords: [
            "legal action",
            "arrest",
            "warrant",
            "police",
            "lawsuit",
            "court",
            "penalty",
            "fine",
            "consequences",
            "investigation",
        ],
        description: "Threats or legal intimidation",
    },
};

/**
 * Fallback heuristic analysis when API is unavailable
 */
function analyzeHeuristically(message: string): ScamAnalysisResult {
    const messageLower = message.toLowerCase();
    const detectedPatterns: string[] = [];
    const suspiciousPhrases: string[] = [];
    let riskScore = 0;

    // Check for each scam pattern
    for (const [_, pattern] of Object.entries(SCAM_PATTERNS)) {
        const matchedKeywords = pattern.keywords.filter((keyword) =>
            messageLower.includes(keyword.toLowerCase())
        );

        if (matchedKeywords.length > 0) {
            detectedPatterns.push(pattern.description);
            suspiciousPhrases.push(...matchedKeywords.slice(0, 3));
            riskScore += 15 + matchedKeywords.length * 5;
        }
    }

    // Check for grammar/spelling issues
    const hasMultipleExclamations = (message.match(/!/g) || []).length > 2;
    const hasAllCaps =
        message.split(" ").filter((word) => word.length > 3 && word === word.toUpperCase())
            .length > 2;
    const hasPoorSpacing = /\s{3,}/.test(message) || /[a-z][A-Z]/.test(message);

    if (hasMultipleExclamations || hasAllCaps || hasPoorSpacing) {
        detectedPatterns.push("Poor grammar or unusual formatting");
        riskScore += 10;
    }

    // Check for suspicious links
    const hasLinks = /https?:\/\/|www\./i.test(message);
    const hasShortenedLinks = /(bit\.ly|tinyurl|goo\.gl)/i.test(message);
    if (hasShortenedLinks) {
        detectedPatterns.push("Shortened or suspicious URLs");
        riskScore += 20;
    } else if (hasLinks && detectedPatterns.length > 0) {
        detectedPatterns.push("Contains links (verify before clicking)");
        riskScore += 10;
    }

    // Check for requests for personal information
    const personalInfoKeywords = [
        "social security",
        "ssn",
        "credit card",
        "bank account",
        "password",
        "pin",
        "date of birth",
    ];
    const hasPersonalInfoRequest = personalInfoKeywords.some((keyword) =>
        messageLower.includes(keyword)
    );
    if (hasPersonalInfoRequest) {
        detectedPatterns.push("Requests for sensitive personal information");
        riskScore += 25;
    }

    // Cap risk score at 100
    riskScore = Math.min(100, riskScore);

    // If message is very short and benign, lower the score
    if (message.length < 50 && detectedPatterns.length === 0) {
        riskScore = Math.max(0, riskScore - 10);
    }

    // Determine risk level
    let riskLevel: "low" | "medium" | "high";
    if (riskScore <= 30) {
        riskLevel = "low";
    } else if (riskScore <= 70) {
        riskLevel = "medium";
    } else {
        riskLevel = "high";
    }

    // Generate explanation
    let explanation = "";
    if (riskScore === 0) {
        explanation =
            "This message appears to be legitimate with no obvious scam indicators detected. However, always exercise caution when sharing personal information or clicking on links.";
    } else if (riskLevel === "low") {
        explanation = `This message shows minimal risk indicators. ${detectedPatterns.length > 0
            ? "While some patterns were detected, they may be used in legitimate contexts."
            : "No significant scam patterns were found."
            } Always verify the sender's identity before taking action.`;
    } else if (riskLevel === "medium") {
        explanation = `This message contains several concerning elements that are commonly found in scam attempts. The use of ${detectedPatterns[0]?.toLowerCase() || "suspicious language"
            } and other patterns suggest caution is warranted. Verify the sender through official channels before responding or clicking any links.`;
    } else {
        explanation = `⚠️ This message exhibits multiple high-risk characteristics typical of scam attempts. The combination of ${detectedPatterns
            .slice(0, 2)
            .map((p) => p.toLowerCase())
            .join(" and ")} are major red flags. Do not click any links, provide personal information, or send money. Contact the organization directly using official contact information to verify.`;
    }

    const uniquePhrases = Array.from(new Set(suspiciousPhrases)).slice(0, 8);

    return {
        riskScore,
        riskLevel,
        explanation,
        patterns: detectedPatterns.length > 0 ? detectedPatterns : ["No scam patterns detected"],
        suspiciousPhrases: uniquePhrases,
    };
}

/**
 * Analyzes a message for scam indicators using Google Gemini API
 * Falls back to heuristic analysis if API key is missing or request fails
 */
export async function analyzeMessage(
    message: string
): Promise<ScamAnalysisResult> {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY not found, falling back to heuristic analysis");
        return analyzeHeuristically(message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

        const analysis = JSON.parse(jsonStr) as ScamAnalysisResult;

        // Validate the result structure roughly
        if (typeof analysis.riskScore !== 'number' || !analysis.riskLevel) {
            throw new Error("Invalid API response structure");
        }

        return analysis;

    } catch (error) {
        console.error("Gemini API error:", error);
        return analyzeHeuristically(message);
    }
}
