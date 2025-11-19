"use client";

import { useState } from "react";
import { ScamAnalysisResult } from "@/lib/types";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2
} from "lucide-react";

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
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze message");
      }

      const data: ScamAnalysisResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setMessage("");
    setError(null);
    setResult(null);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "high":
        return "text-rose-600 bg-rose-50 border-rose-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "low":
        return <ShieldCheck className="w-12 h-12 text-emerald-500" />;
      case "medium":
        return <ShieldAlert className="w-12 h-12 text-amber-500" />;
      case "high":
        return <ShieldX className="w-12 h-12 text-rose-500" />;
      default:
        return <Shield className="w-12 h-12 text-slate-400" />;
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

  const getRiskScoreColor = (score: number) => {
    if (score < 30) return "text-emerald-600";
    if (score < 70) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-lg mb-4">
            <Shield className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-5xl font-bold font-heading bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
            ScamScan
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Protect yourself from digital threats. Paste any email or message below to instantly analyze it for scam patterns using advanced AI.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8 animate-slide-up">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label
                htmlFor="message-input"
                className="block text-sm font-semibold text-slate-700 uppercase tracking-wider"
              >
                Message Content
              </label>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                {message.length} / 10,000 chars
              </span>
            </div>

            <div className="relative group">
              <textarea
                id="message-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste the suspicious email or message text here..."
                className="w-full h-64 px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 resize-none transition-all duration-200 placeholder:text-slate-400 text-slate-700 text-base leading-relaxed"
                disabled={isAnalyzing}
              />
              <div className="absolute bottom-4 right-4 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                <span className="text-xs text-slate-400 font-medium">Press Analyze to scan</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 animate-scale-in">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !message.trim()}
              className="flex-1 group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 px-8 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Analyze Message</span>
                  </>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <button
              onClick={handleClear}
              disabled={isAnalyzing || !message}
              className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-scale-in ring-1 ring-slate-900/5">
            {/* Result Header */}
            <div className="bg-slate-50/50 border-b border-slate-100 p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-full shadow-sm ring-1 ring-slate-100">
                  {getRiskIcon(result.riskLevel)}
                </div>

                <div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Risk Score</div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-6xl font-bold ${getRiskScoreColor(result.riskScore)}`}>
                      {result.riskScore}
                    </span>
                    <span className="text-2xl text-slate-400 font-medium">/100</span>
                  </div>
                </div>

                <div className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wide border ${getRiskColor(result.riskLevel)}`}>
                  {getRiskLabel(result.riskLevel)}
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Analysis */}
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 mb-4">
                  <Info className="w-5 h-5 text-indigo-500" />
                  Analysis Summary
                </h2>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <p className="text-slate-700 leading-relaxed text-lg">
                    {result.explanation}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Detected Patterns */}
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Detected Patterns
                  </h2>
                  {result.patterns.length > 0 ? (
                    <ul className="space-y-3">
                      {result.patterns.map((pattern, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-amber-500" />
                          <span className="text-slate-600 font-medium">{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500 italic">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      No suspicious patterns detected
                    </div>
                  )}
                </div>

                {/* Suspicious Phrases */}
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
                    <Search className="w-5 h-5 text-rose-500" />
                    Suspicious Phrases
                  </h2>
                  {result.suspiciousPhrases.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.suspiciousPhrases.map((phrase, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors cursor-default"
                        >
                          &quot;{phrase}&quot;
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500 italic">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      No suspicious phrases found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-slate-400 text-sm">
            This tool provides AI-based analysis but does not guarantee 100% accuracy.
            <br />
            Always verify with official sources before taking action.
          </p>
        </div>
      </div>
    </div>
  );
}
