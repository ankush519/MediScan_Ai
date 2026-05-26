"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { LandingView } from "@/components/LandingView";
import { AuthView } from "@/components/AuthView";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardHome } from "@/components/DashboardHome";
import { DiagnosisView } from "@/components/DiagnosisView";
import { ChatView } from "@/components/ChatView";
import { HistoryView } from "@/components/HistoryView";
import { AppointmentsView } from "@/components/AppointmentsView";

export default function Home() {
  const { currentView } = useApp();
  const [mounted, setMounted] = useState(false);

  // Prevent SSR hydration mismatch by ensuring rendering occurs on client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-xs">
        Bootstrapping MediScan Workstation...
      </div>
    );
  }

  // Handle core routing
  if (currentView === "landing") {
    return <LandingView />;
  }

  if (currentView === "auth") {
    return <AuthView />;
  }

  // Wrapped pages inside Dashboard Sidebar layout
  return (
    <DashboardLayout>
      {currentView === "dashboard" && <DashboardHome />}
      {currentView === "diagnose" && <DiagnosisView />}
      {currentView === "chat" && <ChatView />}
      {currentView === "history" && <HistoryView />}
      {currentView === "appointments" && <AppointmentsView />}
    </DashboardLayout>
  );
}
