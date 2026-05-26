"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { motion } from "framer-motion";
import { Activity, Brain, Shield, FileText, ChevronRight, MessageSquare, CheckCircle, Moon, Sun, ArrowUpRight } from "lucide-react";

export const LandingView: React.FC = () => {
  const { toggleTheme, theme, setView, setAuthTab } = useApp();

  const features = [
    {
      icon: <Brain className="w-6 h-6 text-blue-500" />,
      title: "ConvNet CNN Classification",
      desc: "Deep learning neural network built to detect pulmonary infiltrates, chest consolidations, and active pneumonia with state-of-the-art precision."
    },
    {
      icon: <Activity className="w-6 h-6 text-indigo-500" />,
      title: "Grad-CAM Explainability",
      desc: "Explainable AI (XAI) overlays that visually paint the pixel regions influencing the network's final decision, offering diagnostic transparency."
    },
    {
      icon: <FileText className="w-6 h-6 text-teal-500" />,
      title: "Clinical PDF Reporting",
      desc: "Instantly build downloadable, professional reports compiling patient criteria, side-by-side radiograph comparisons, and clinical directives."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-purple-500" />,
      title: "Gemini Consultation Bot",
      desc: "Direct integration with generative LLMs serving as decision-support partners to query symptoms, precautions, and pharmacology guides."
    }
  ];

  const stats = [
    { value: "98.4%", label: "Model Validation Accuracy" },
    { value: "< 1.2s", label: "Median Scan Classification" },
    { value: "500k+", label: "Verified Clinical Datasets" },
    { value: "ISO 13485", label: "Design Compliant Framework" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans">
      {/* 1. Glassmorphic Navigation Header */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200/50 dark:border-slate-800/30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg text-white animate-pulse-glow">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-outfit text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              MediScan<span className="text-blue-500">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-200/60 dark:bg-slate-900 hover:bg-slate-300/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => { setAuthTab("signin"); setView("auth"); }}
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => { setAuthTab("signup"); setView("auth"); }}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-md shadow-blue-500/20"
            >
              Register Portal
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-12 gap-12 items-center">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="lg:col-span-7 space-y-6 text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" /> Next-Generation Clinical Decision Support
          </div>
          <h1 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
            Predict Respiratory Health with <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent">AI Precision</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed max-w-2xl">
            A state-of-the-art diagnostic platform empowering medical practitioners. Upload chest radiograph scans, generate real-time density classification, and visualize explainable Grad-CAM lung activations instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <button 
              onClick={() => { setAuthTab("signup"); setView("auth"); }}
              className="px-6 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group"
            >
              Get Started Free <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => { setAuthTab("signin"); setView("auth"); }}
              className="px-6 py-3.5 text-base font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-all text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2"
            >
              Access Demo Portal <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-6 pt-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> HIPAA Compliant Architecture
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Zero-Latency Inference Fallback
            </div>
          </div>
        </div>

        {/* Hero Radiography Scanner Visual */}
        <div className="lg:col-span-5 flex justify-center relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[400px] aspect-[4/5] rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-900 shadow-2xl relative overflow-hidden group scan-overlay p-1"
          >
            {/* Mock Chest X-Ray image */}
            <div 
              className="w-full h-full rounded-xl bg-cover bg-center opacity-85" 
              style={{ 
                backgroundImage: `url('https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=600')` 
              }} 
            />
            {/* Scan Beam Indicator */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/0 via-blue-500/10 to-blue-500/0 pointer-events-none z-10" />
            
            {/* UI overlay */}
            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-950/85 backdrop-filter backdrop-blur-md border border-slate-800 text-left z-20 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] tracking-wider text-slate-400 font-mono">SCAN ID: AP-X719</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-bold font-mono">ACTIVE SCANNING</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "20%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
              <div className="flex justify-between text-xs font-mono pt-1 text-white">
                <span>Infiltrates Index:</span>
                <span className="text-yellow-400 font-bold">Evaluating...</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Statistics Bar */}
      <section className="bg-slate-100 dark:bg-slate-900/50 py-10 border-y border-slate-200/60 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, idx) => (
            <div key={idx} className="text-center space-y-1">
              <div className="font-outfit text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                {s.value}
              </div>
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Equipped with Advanced Diagnostic Capabilities
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            MediScan AI integrates clinical image processing, deep convolutional neural networks, and standard generative models into a unified SaaS experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, idx) => (
            <div 
              key={idx} 
              className="glass-card glass-card-hover p-6 rounded-2xl flex flex-col items-start gap-4 text-left border border-slate-200/60 dark:border-slate-800/40"
            >
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl">
                {f.icon}
              </div>
              <h3 className="font-outfit text-lg font-bold text-slate-900 dark:text-white">
                {f.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Endorsements / Testimonial Section */}
      <section className="max-w-5xl mx-auto px-6 pb-24 text-center">
        <div className="glass-card p-10 rounded-3xl border border-slate-200/60 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/30 space-y-6 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <h3 className="font-outfit text-lg font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            Medical Practitioner Endorsement
          </h3>
          <p className="text-xl sm:text-2xl font-medium italic text-slate-800 dark:text-slate-200 leading-relaxed">
            &quot;MediScan AI has dramatically optimized our triage workflow. The Grad-CAM heatmap overlays give our radiologists immediate focus verification, and the PDF generation speeds up patient transfers by hours.&quot;
          </p>
          <div className="space-y-1">
            <h4 className="font-outfit font-extrabold text-slate-900 dark:text-white">
              Dr. Catherine Vance, MD
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chief Radiologist, St. Jude Pulmonary Center
            </p>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="bg-slate-100 dark:bg-slate-950 py-12 border-t border-slate-200 dark:border-slate-900 text-sm text-slate-500 dark:text-slate-400 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded text-white">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-outfit font-bold text-slate-800 dark:text-white">
              MediScan<span className="text-blue-500">AI</span>
            </span>
          </div>
          <div>
            © 2026 MediScan AI Healthcare Platform. All rights reserved. Complies with HL7 and HIPAA standards.
          </div>
          <div className="flex gap-4">
            <span className="hover:text-blue-500 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-blue-500 cursor-pointer">Terms of Service</span>
            <span className="hover:text-blue-500 cursor-pointer">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
