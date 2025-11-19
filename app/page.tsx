"use client";

import { useState } from "react";
import { ScamAnalysisResult } from "@/lib/types";

export default function Home() {
  const [message, setMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScamAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!message.trim()) {
      setError("Please enter a message to analyze");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = "Failed to analyze message";

        try {
          const errorData = await response.json();

          // Use detailed error message if available
          if (errorData.details) {
            errorMessage = `${errorData.error || 'Error'}: ${errorData.details}`;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }

          // Add error code if available
          if (errorData.code) {
            errorMessage += ` (Error Code: ${errorData.code})`;
          }
        } catch (parseError) {
          // If we can't parse the error response, provide a status-based message
          if (response.status === 400) {
            errorMessage = "Invalid request. Please check your input and try again.";
          } else if (response.status === 500) {
            errorMessage = "Server error occurred. Please try again later.";
          } else if (response.status === 503) {
            errorMessage = "Service temporarily unavailable. Please try again in a few moments.";
          } else {
            errorMessage = `Request failed with status ${response.status}. Please try again.`;
          }
        }

        throw new Error(errorMessage);
      }

      const data: ScamAnalysisResult = await response.json();
      setResult(data);
    } catch (err) {
      let errorMessage = "An unexpected error occurred";

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = "Request timed out. The analysis is taking too long. Please try again with a shorter message or try again later.";
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setMessage("");
    setError(null);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case "low":
        return "Low Risk";
      case "medium":
        return "Medium Risk";
      case "high":
        return "High Risk";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            ScamScan
          </h1>
          <p className="text-gray-600 text-lg">
            Paste any email or message and we&apos;ll help you assess if it might be a scam.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          {/* Input Section */}
          <div className="mb-6">
            <label
              htmlFor="message-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Message to Analyze
            </label>
            <textarea
              id="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Paste your email or message here..."
              className="w-full h-52 sm:h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
              disabled={isAnalyzing}
            />
            <div className="mt-2 text-sm text-gray-500">
              {message.length} / 10,000 characters
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </button>
            <button
              onClick={handleClear}
              disabled={isAnalyzing}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Clear
            </button>
          </div>

          {/* Loading State */}
          {isAnalyzing && (
            <div className="mt-6 flex items-center justify-center gap-3 text-gray-600">
              <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing message...</span>
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 animate-fade-in">
            {/* Risk Score */}
            <div className="text-center mb-8">
              <div className="inline-block">
                <div className="text-6xl font-bold text-gray-800 mb-2">
                  {result.riskScore}
                </div>
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-full border-2 font-semibold ${getRiskColor(
                    result.riskLevel
                  )}`}
                >
                  {getRiskLabel(result.riskLevel)}
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Analysis
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {result.explanation}
              </p>
            </div>

            {/* Detected Patterns */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Detected Patterns
              </h2>
              <ul className="space-y-2">
                {result.patterns.map((pattern, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-gray-700"
                  >
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{pattern}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suspicious Phrases */}
            {result.suspiciousPhrases.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  Suspicious Phrases
                </h2>
                <div className="flex flex-wrap gap-2">
                  {result.suspiciousPhrases.map((phrase, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm"
                    >
                      {phrase}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          This tool does not provide legal or financial advice. Always use your own judgment.
        </div>
      </div>
    </div>
  );
}
