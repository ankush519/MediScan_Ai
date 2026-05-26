"use client";

import React, { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User as UserIcon, 
  Sparkles, 
  PlusCircle, 
  CheckCircle,
  AlertCircle,
  FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Appointment {
  id: string;
  patient_name: string;
  date: string;
  time: string;
  reason: string;
  status: "Confirmed" | "Urgent" | "Completed";
}

export const AppointmentsView: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: "1", patient_name: "Margaret Jenkins", date: "2026-05-21", time: "09:30 AM", reason: "Post-Pneumonia follow-up scan review", status: "Urgent" },
    { id: "2", patient_name: "Johnathan Doe", date: "2026-05-21", time: "11:00 AM", reason: "Standard checkup & vital trend review", status: "Confirmed" },
    { id: "3", patient_name: "Sarah Parker", date: "2026-05-22", time: "02:15 PM", reason: "Chest congestion auscultation", status: "Confirmed" },
    { id: "4", patient_name: "Arthur Pendelton", date: "2026-05-19", time: "10:00 AM", reason: "Annual physical radiography scan", status: "Completed" },
  ]);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"Confirmed" | "Urgent">("Confirmed");

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !date || !time) return;

    const newApp: Appointment = {
      id: Math.random().toString(),
      patient_name: patientName,
      date,
      time,
      reason: reason ? reason : "Consultation scan request",
      status
    };

    setAppointments(prev => [newApp, ...prev]);
    setBookingOpen(false);
    setPatientName("");
    setDate("");
    setTime("");
    setReason("");
  };

  return (
    <div className="space-y-6 text-left relative">
      <div className="flex justify-between items-center pb-2">
        <div>
          <h2 className="font-outfit text-2xl font-extrabold text-slate-950 dark:text-white">Appointments Scheduler</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Manage clinician calendars and patient consult queues</p>
        </div>
        
        <button
          onClick={() => setBookingOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/10"
        >
          <PlusCircle className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Schedule Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-4">
            <h3 className="font-outfit text-base font-bold text-slate-950 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-500" /> Clinic Calendar View
            </h3>

            {/* Simulated Month Calendar view */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold border-b border-slate-200/60 dark:border-slate-850/50 pb-2 text-slate-400">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold">
              {/* Days padding before starting month */}
              <span className="p-3 text-slate-300 dark:text-slate-800">26</span>
              <span className="p-3 text-slate-300 dark:text-slate-800">27</span>
              <span className="p-3 text-slate-300 dark:text-slate-800">28</span>
              <span className="p-3 text-slate-300 dark:text-slate-800">29</span>
              <span className="p-3 text-slate-300 dark:text-slate-800">30</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">1</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">2</span>
              
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">3</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">4</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">5</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">6</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">7</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">8</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">9</span>
              
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">10</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">11</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">12</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">13</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">14</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">15</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">16</span>
              
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">17</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer text-blue-500">18</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer text-blue-500">19</span>
              {/* Today */}
              <span className="p-3 rounded-xl bg-blue-600 text-white font-extrabold shadow shadow-blue-600/30">20</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer text-blue-500 font-extrabold">21</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer text-blue-500 font-extrabold">22</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">23</span>
              
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">24</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">25</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">26</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">27</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">28</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">29</span>
              <span className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">30</span>
            </div>
          </div>
        </div>

        {/* Right Active List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-4">
            <h3 className="font-outfit text-base font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" /> Active Slots
            </h3>
            
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {appointments.map((app) => {
                const statusColor = app.status === "Urgent" 
                  ? "text-red-500 border-red-500/10 bg-red-500/5" 
                  : (app.status === "Completed" ? "text-slate-400 border-slate-200/10 bg-slate-100/5" : "text-blue-500 border-blue-500/10 bg-blue-500/5");
                return (
                  <div 
                    key={app.id} 
                    className="p-3 rounded-xl border border-slate-200/50 dark:border-slate-850 text-xs space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <UserIcon className="w-3 h-3 text-slate-400" /> {app.patient_name}
                        </h4>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {app.date} • {app.time}
                        </div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[8px] border ${statusColor}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-450 leading-relaxed font-mono">
                      {app.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Booking Drawer overlay */}
      <AnimatePresence>
        {bookingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-filter backdrop-blur-sm">
            <motion.form 
              onSubmit={handleBook}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-250/20 dark:border-slate-850 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-850 pb-3">
                <h3 className="font-outfit text-base font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" /> Reserve Appointment Slot
                </h3>
                <button 
                  type="button"
                  onClick={() => setBookingOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  Close
                </button>
              </div>

              {/* Patient Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Patient Full Name</label>
                <input 
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Margaret Jenkins"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                  required
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Date</label>
                  <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none text-slate-950 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Time</label>
                  <input 
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="10:30 AM"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none text-slate-950 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Consultation Concern</label>
                <input 
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="E.g., Chest radiography scan interpretation"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none text-slate-950 dark:text-white"
                />
              </div>

              {/* Priority Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Triage Priority</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus("Confirmed")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${status === "Confirmed" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-500" : "bg-slate-50 dark:bg-slate-950 border-slate-200/50 text-slate-400"}`}
                  >
                    Confirmed (Routine)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("Urgent")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${status === "Urgent" ? "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-500" : "bg-slate-50 dark:bg-slate-950 border-slate-200/50 text-slate-400"}`}
                  >
                    Urgent / Severe
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Confirm Appointment Slot
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
