import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ScamScan | Free AI Scam Detector & Message Analyzer",
    template: "%s | ScamScan",
  },
  description: "Protect yourself from fraud. Instantly analyze suspicious emails, texts, and DMs using advanced AI to detect phishing, scams, and malicious patterns. Free, fast, and private.",
  keywords: [
    "scam detector",
    "scam check",
    "phishing checker",
    "email analyzer",
    "fraud detection",
    "AI security",
    "safe browsing",
    "scam scanner",
    "is this a scam",
    "text message scam",
  ],
  authors: [{ name: "ScamScan Team" }],
  creator: "ScamScan",
  publisher: "ScamScan",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "ScamScan | Is that message a scam?",
    description: "Don't get scammed. Paste any suspicious message to instantly analyze it with AI. Detect phishing, fraud, and threats in seconds.",
    url: "https://scamscan.app", // Placeholder URL
    siteName: "ScamScan",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScamScan | AI Scam Detector",
    description: "Analyze suspicious messages instantly with AI. Protect yourself from phishing and fraud.",
    creator: "@scamscan", // Placeholder
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png", // Placeholder, good to have defined
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
