"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type RoleType = "doctor" | "patient";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: RoleType;
}

export type ViewType = "landing" | "auth" | "dashboard" | "diagnose" | "chat" | "history" | "appointments";

interface AppContextType {
  user: User | null;
  token: string | null;
  theme: "light" | "dark";
  currentView: ViewType;
  authTab: "signin" | "signup";
  setAuthTab: (tab: "signin" | "signup") => void;
  toggleTheme: () => void;
  setView: (view: ViewType) => void;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, fullName: string, role: RoleType) => Promise<boolean>;
  loginWithGoogle: (googleToken: string) => Promise<boolean>;
  logout: () => void;
  backendUrl: string;
  activeDiagId: string | null;
  setActiveDiagId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark"); // Default dark mode for modern sci-fi premium look
  const [currentView, setView] = useState<ViewType>("landing");
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [activeDiagId, setActiveDiagId] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

  // Synchronize auth session and theme on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("mediscan_token");
    const savedUser = localStorage.getItem("mediscan_user");
    const savedTheme = localStorage.getItem("mediscan_theme") as "light" | "dark";
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("mediscan_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }
      
      const data = await response.json();
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("mediscan_token", data.access_token);
      localStorage.setItem("mediscan_user", JSON.stringify(data.user));
      setView("dashboard");
      return true;
    } catch (error) {
      console.error("Login request error:", error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, fullName: string, role: RoleType): Promise<boolean> => {
    try {
      const response = await fetch(`${backendUrl}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName, role }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Registration failed");
      }
      
      const data = await response.json();
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("mediscan_token", data.access_token);
      localStorage.setItem("mediscan_user", JSON.stringify(data.user));
      setView("dashboard");
      return true;
    } catch (error) {
      console.error("Signup request error:", error);
      throw error;
    }
  };

  const loginWithGoogle = async (googleToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${backendUrl}/api/v1/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: googleToken, role: "doctor" }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Google authentication failed");
      }
      
      const data = await response.json();
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("mediscan_token", data.access_token);
      localStorage.setItem("mediscan_user", JSON.stringify(data.user));
      setView("dashboard");
      return true;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("mediscan_token");
    localStorage.removeItem("mediscan_user");
    setView("landing");
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        theme,
        currentView,
        authTab,
        setAuthTab,
        toggleTheme,
        setView,
        login,
        signup,
        loginWithGoogle,
        logout,
        backendUrl,
        activeDiagId,
        setActiveDiagId
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
