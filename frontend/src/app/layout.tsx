import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap"
});

export const metadata: Metadata = {
  title: "MediScan AI - Premium AI-Powered Medical Diagnosis Assistant",
  description: "Next-generation healthcare SaaS platform leveraging Deep Learning CNNs and Grad-CAM explainability to assist clinicians in diagnosing respiratory conditions from chest X-ray scans.",
  keywords: ["Medical AI", "Radiology Assistant", "Pneumonia Detection", "Grad-CAM", "Healthcare SaaS", "FastAPI NextJS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="antialiased min-h-screen">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
