"use client";

import React, { useState } from "react";
import { useApp, ViewType } from "@/context/AppContext";
import { 
  Activity, 
  LayoutDashboard, 
  FileSearch, 
  MessageSquare, 
  History, 
  CalendarRange, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon,
  ChevronRight,
  User as UserIcon,
  Stethoscope
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout, currentView, setView, toggleTheme, theme } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "dashboard" as ViewType, label: "Analytics Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "diagnose" as ViewType, label: "AI Image Analysis", icon: <FileSearch className="w-4 h-4" /> },
    { id: "chat" as ViewType, label: "AI Clinical Chat", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "history" as ViewType, label: "Scan Diagnosis History", icon: <History className="w-4 h-4" /> },
    { id: "appointments" as ViewType, label: "Appointments Booking", icon: <CalendarRange className="w-4 h-4" /> },
  ];

  const getBreadcrumb = () => {
    switch (currentView) {
      case "dashboard": return "Portal / Dashboard";
      case "diagnose": return "Portal / AI Radiography Diagnosis";
      case "chat": return "Portal / AI Consultation Assistant";
      case "history": return "Portal / Scan Diagnosis History";
      case "appointments": return "Portal / Appointments Scheduler";
      default: return "Portal / Workstation";
    }
  };

  const userInitials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "DR";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300 text-slate-800 dark:text-slate-100">
      
      {/* 1. Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-850 shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-200 dark:border-slate-850">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Activity className="w-4 h-4" />
          </div>
          <span className="font-outfit text-lg font-bold tracking-tight text-slate-950 dark:text-white">
            MediScan<span className="text-blue-500">AI</span>
          </span>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" 
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/80" />}
              </button>
            );
          })}
        </nav>

        {/* User Card Badge */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-850 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center font-outfit border border-blue-500/10">
              {userInitials}
            </div>
            <div className="text-left overflow-hidden">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.full_name || "Doctor Guest"}
              </h4>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[9px] font-bold uppercase mt-0.5">
                {user?.role || "Doctor"}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-red-500 dark:text-red-400 transition-colors flex items-center justify-center gap-1.5 border border-slate-200/20"
          >
            <LogOut className="w-3.5 h-3.5" /> Close Session
          </button>
        </div>
      </aside>

      {/* 2. Mobile Nav Drawer Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black z-40"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="lg:hidden fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 z-50 flex flex-col shadow-2xl border-r border-slate-200 dark:border-slate-800"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
                  <span className="font-outfit text-lg font-bold text-slate-950 dark:text-white">MediScan</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                {menuItems.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setView(item.id); setMobileMenuOpen(false); }}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all ${
                        isActive 
                          ? "bg-blue-600 text-white" 
                          : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 font-bold flex items-center justify-center font-outfit">
                    {userInitials}
                  </div>
                  <div className="text-left truncate">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.full_name}</h4>
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">{user?.role}</span>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-red-500 flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Close Session
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Workstation Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between px-6 sticky top-0 z-30 backdrop-filter backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold font-mono text-slate-400 dark:text-slate-500 tracking-wider">
              {getBreadcrumb()}
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200/20"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/10">
              <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-outfit uppercase">
                Workstation Online
              </span>
            </div>
          </div>
        </header>

        {/* Content Body Container */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="h-full flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

    </div>
  );
};
