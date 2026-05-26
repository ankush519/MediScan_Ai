"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { 
  Heart, 
  Activity, 
  Eye, 
  Calendar,
  ChevronRight, 
  Sparkles, 
  AlertTriangle,
  UploadCloud,
  MessageCircle,
  FileCheck
} from "lucide-react";

export const DashboardHome: React.FC = () => {
  const { user, setView, backendUrl, token } = useApp();
  const [historyCount, setHistoryCount] = useState(0);
  const [urgentReviews, setUrgentReviews] = useState(0);

  // Fetch scan history count to populate metrics
  useEffect(() => {
    if (!token) return;
    fetch(`${backendUrl}/api/v1/history`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setHistoryCount(data.length);
        const urgent = data.filter(d => d.risk_level === "High" || d.risk_level === "Medium").length;
        setUrgentReviews(urgent);
      }
    })
    .catch(err => console.error("Error loading home page statistics:", err));
  }, [token, backendUrl]);

  return (
    <div className="space-y-6 text-left">
      {/* 1. Welcoming Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Glow vector */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-blue-200">Clinical Workstation</span>
          </div>
          <h2 className="font-outfit text-2xl sm:text-3xl font-extrabold">
            Welcome back, {user?.full_name || "Doctor"}
          </h2>
          <p className="text-sm text-blue-100">
            You have <span className="underline font-semibold">{urgentReviews} pending reviews</span> and {historyCount} diagnostic scans compiled in your database.
          </p>
        </div>

        <button 
          onClick={() => setView("diagnose")}
          className="px-5 py-2.5 bg-white text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-bold shadow-md transition-all shrink-0 flex items-center gap-1.5 relative z-10"
        >
          <UploadCloud className="w-4 h-4" /> Start New Scan
        </button>
      </div>

      {/* 2. Clinical Vitals Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Heart Rate Widget */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850 flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Avg Heart Rate</span>
              <div className="font-outfit text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-1">
                74 <span className="text-xs font-semibold text-slate-500">BPM</span>
              </div>
            </div>
            <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/10">
              <Heart className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          {/* Custom vector sparkline */}
          <div className="h-10 w-full mt-2">
            <svg viewBox="0 0 300 40" className="w-full h-full text-red-500 overflow-visible">
              <path 
                d="M0,20 L30,20 L40,10 L50,30 L60,20 L100,20 L110,5 L120,35 L130,20 L180,20 L190,15 L200,25 L210,20 L250,20 L260,0 L270,40 L280,20 L300,20" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>
          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> Stable Sinus Rhythm
          </span>
        </div>

        {/* Blood Pressure Widget */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850 flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Blood Pressure</span>
              <div className="font-outfit text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-1">
                118/76 <span className="text-xs font-semibold text-slate-500">mmHg</span>
              </div>
            </div>
            <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/10">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          {/* Custom vector sparkline */}
          <div className="h-10 w-full mt-2">
            <svg viewBox="0 0 300 40" className="w-full h-full text-blue-500 overflow-visible">
              <path 
                d="M0,20 L40,22 L80,18 L120,24 L160,16 L200,22 L240,18 L300,20" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>
          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> Optimal Range (Normotensive)
          </span>
        </div>

        {/* SpO2 Widget */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850 flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Avg Blood Oxygen</span>
              <div className="font-outfit text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-1">
                98.2 <span className="text-xs font-semibold text-slate-500">%</span>
              </div>
            </div>
            <div className="p-2.5 bg-teal-500/10 text-teal-500 rounded-xl border border-teal-500/10">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          {/* Custom vector sparkline */}
          <div className="h-10 w-full mt-2">
            <svg viewBox="0 0 300 40" className="w-full h-full text-teal-500 overflow-visible">
              <path 
                d="M0,15 L40,18 L80,13 L120,15 L160,12 L200,16 L240,10 L300,15" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>
          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> Normal Respiratory Index
          </span>
        </div>

      </div>

      {/* 3. Trends & Quick Actions Panel */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Trend Graph Grid */}
        <div className="lg:col-span-8 glass-card p-6 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h3 className="font-outfit text-lg font-bold text-slate-950 dark:text-white">Patient Diagnostics Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Weekly count of processed medical images</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-500/10">Weekly</span>
              <span className="px-3 py-1 text-xs text-slate-500 font-bold rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">Monthly</span>
            </div>
          </div>

          {/* Large SVG Trend Graph */}
          <div className="h-56 w-full relative flex flex-col justify-end pt-4">
            <div className="absolute inset-0 grid grid-rows-4 pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border-b border-slate-200/40 dark:border-slate-800/30 w-full" />
              ))}
            </div>
            
            <svg viewBox="0 0 600 200" className="w-full h-full text-blue-500 overflow-visible relative z-10">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              {/* Fill area */}
              <path 
                d="M0,170 Q100,120 200,150 T400,60 T600,30 L600,200 L0,200 Z" 
                fill="url(#chartGrad)" 
              />
              {/* Stroke line */}
              <path 
                d="M0,170 Q100,120 200,150 T400,60 T600,30" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />
              {/* Dot Markers */}
              <circle cx="200" cy="150" r="5" className="fill-white stroke-blue-500 stroke-2" />
              <circle cx="400" cy="60" r="5" className="fill-white stroke-blue-500 stroke-2" />
              <circle cx="600" cy="30" r="5" className="fill-white stroke-blue-500 stroke-2" />
            </svg>
            
            {/* Axis Labels */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>May 01</span>
              <span>May 05</span>
              <span>May 10</span>
              <span>May 15</span>
              <span>May 20 (Today)</span>
            </div>
          </div>
        </div>

        {/* Quick Action Matrix */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850 flex-1 space-y-4">
            <h3 className="font-outfit text-base font-bold text-slate-950 dark:text-white">Workspace Actions</h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => setView("diagnose")}
                className="w-full p-3 rounded-xl border border-slate-250/20 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-3"
              >
                <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-lg">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-950 dark:text-white">Upload New Radiograph</h4>
                  <span className="text-[9px] text-slate-500">PA chest X-Ray classifications</span>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />
              </button>

              <button 
                onClick={() => setView("chat")}
                className="w-full p-3 rounded-xl border border-slate-250/20 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-3"
              >
                <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-lg">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-950 dark:text-white">Consult AI Assistant</h4>
                  <span className="text-[9px] text-slate-500">Gemini-driven medical assistance</span>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />
              </button>

              <button 
                onClick={() => setView("history")}
                className="w-full p-3 rounded-xl border border-slate-250/20 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-3"
              >
                <div className="p-2.5 bg-teal-500/10 text-teal-500 rounded-lg">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-950 dark:text-white">Retrieve Scan History</h4>
                  <span className="text-[9px] text-slate-500">Download report PDFs and findings</span>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />
              </button>
            </div>
          </div>

          {/* Urgent Reviews Alert Box */}
          {urgentReviews > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
              <div className="text-left space-y-1">
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">Urgent Triage Scans Required</h4>
                <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 leading-normal">
                  {urgentReviews} uploaded scans indicate high or medium risk factors. Pulmonologist review recommended.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
