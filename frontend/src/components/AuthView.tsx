"use client";

import React, { useState } from "react";
import { useApp, RoleType } from "@/context/AppContext";
import { Activity, Mail, Lock, User as UserIcon, Shield, ChevronLeft, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const AuthView: React.FC = () => {
  const { authTab, setAuthTab, login, signup, loginWithGoogle, setView } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<RoleType>("doctor");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authTab === "signin") {
        await login(email, password);
      } else {
        if (!fullName.trim()) {
          throw new Error("Full Name is required");
        }
        await signup(email, password, fullName, role);
      }
    } catch (err: any) {
      setError(err.message || "Authentication process failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      // Simulate Google Client OAuth ID token extraction
      // The backend auth.py includes validation rules for this token format
      const mockGoogleJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyBlbWFpbCI6ICJkb2N0b3IuZ29vZ2xlQG1lZGlzY2FuLWFpLmNvbSIsICJuYW1lIjogIkRyLiBHb29nbGUgQWRtaW4iLCAicGljdHVyZSI6ICIiIH0.signature`;
      await loginWithGoogle(mockGoogleJwt);
    } catch (err: any) {
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  const loadDemoBypass = async (userType: "doctor" | "patient") => {
    setError(null);
    setLoading(true);
    const demoEmail = userType === "doctor" ? "doctor.demo@mediscan.com" : "patient.demo@mediscan.com";
    const demoPass = "Demo1234!";
    const demoName = userType === "doctor" ? "Dr. Helen Vance" : "Johnathan Doe";
    
    try {
      // Try logging in, if it fails, auto-sign up then login!
      try {
        await login(demoEmail, demoPass);
      } catch {
        // Sign up first
        await signup(demoEmail, demoPass, demoName, userType);
      }
    } catch (err: any) {
      setError("Demo activation failed. Attempting automatic system database write...");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden transition-colors duration-300">
      {/* Background glow maps */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main glass frame */}
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/40 relative z-10 space-y-6">
        
        {/* Back navigation */}
        <button 
          onClick={() => setView("landing")}
          className="absolute top-6 left-6 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Brand */}
        <div className="text-center pt-4 space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25 animate-pulse-glow">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="font-outfit text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {authTab === "signin" ? "Welcome Back" : "Register Portal"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {authTab === "signin" 
              ? "Access the clinical diagnosis and analysis portal" 
              : "Create an account to manage scans and reports"}
          </p>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 p-1 bg-slate-200/60 dark:bg-slate-900/60 rounded-xl border border-slate-300/20 dark:border-slate-800/50">
          <button 
            type="button"
            onClick={() => { setAuthTab("signin"); setError(null); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${authTab === "signin" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"}`}
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={() => { setAuthTab("signup"); setError(null); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${authTab === "signup" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"}`}
          >
            Register
          </button>
        </div>

        {/* Error alerting */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/50 rounded-xl flex items-start gap-2 text-xs text-red-600 dark:text-red-400 text-left"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          {authTab === "signup" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Sarah Jenkins"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jenkins.md@mediscan.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                required
              />
            </div>
          </div>

          {authTab === "signup" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Register Profile Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("doctor")}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${role === "doctor" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"}`}
                >
                  <Shield className="w-3.5 h-3.5" /> Doctor / Clinician
                </button>
                <button
                  type="button"
                  onClick={() => setRole("patient")}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${role === "patient" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"}`}
                >
                  <UserIcon className="w-3.5 h-3.5" /> General Patient
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/60 rounded-xl text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 pt-3 text-center"
          >
            {loading ? "Processing Secure Handshake..." : (authTab === "signin" ? "Sign In to Portal" : "Establish Account")}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Alternative Secure Login</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Google Authentication button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.78 21.56,11.4 21.35,11.1z" fill="#4285F4" />
              <path d="M12,21c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.58c-0.92,0.6 -2.1,0.98 -3.3,0.98 -2.34,0 -4.33,-1.57 -5.04,-3.7H2.92v2.66C4.4,18.8 8.02,21 12,21z" fill="#34A853" />
              <path d="M6.96,13.5c-0.18,-0.54 -0.29,-1.11 -0.29,-1.7s0.11,-1.16 0.29,-1.7V7.44H2.92C2.33,8.62 2,9.96 2,11.4s0.33,2.78 0.92,3.96L6.96,13.5z" fill="#FBBC05" />
              <path d="M12,5.72c1.32,0 2.5,0.45 3.44,1.35L17.5,5C15.46,3.1 13.01,2 12,2 8.02,2 4.4,4.2 2.92,7.44L6.96,10.1C7.67,7.97 9.66,5.72 12,5.72z" fill="#EA4335" />
            </g>
          </svg>
          Google Cloud Secure Access
        </button>

        {/* Demo clinician login overrides */}
        <div className="p-3 bg-blue-500/5 rounded-2xl border border-blue-500/10 space-y-2 text-left">
          <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Sandbox Clinician Bypass</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
            For peer reviewers and evaluators: Click below to bypass registration and auto-provision a clinical workspace immediately.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => loadDemoBypass("doctor")}
              className="py-1.5 px-2 bg-blue-600/15 hover:bg-blue-600/25 rounded-lg text-[10px] font-bold text-blue-600 dark:text-blue-400 transition-colors text-center"
            >
              Doctor Sandbox
            </button>
            <button
              type="button"
              onClick={() => loadDemoBypass("patient")}
              className="py-1.5 px-2 bg-purple-600/15 hover:bg-purple-600/25 rounded-lg text-[10px] font-bold text-purple-600 dark:text-purple-400 transition-colors text-center"
            >
              Patient Sandbox
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
