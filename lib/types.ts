/**
 * Result of scam analysis for an email or message
 */
export interface ScamAnalysisResult {
  /** Risk score from 0 (safe) to 100 (high risk) */
  riskScore: number;
  
  /** Risk level category */
  riskLevel: "low" | "medium" | "high";
  
  /** Natural language explanation of the analysis */
  explanation: string;
  
  /** List of detected scam patterns */
  patterns: string[];
  
  /** Suspicious phrases extracted from the message */
  suspiciousPhrases: string[];
}
