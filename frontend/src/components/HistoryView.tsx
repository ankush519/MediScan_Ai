"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { 
  History, 
  Search, 
  Download, 
  Eye, 
  FileText, 
  Calendar,
  X,
  Activity,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const HistoryView: React.FC = () => {
  const { token, backendUrl } = useApp();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiag, setSelectedDiag] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch histories on mount
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${backendUrl}/api/v1/history`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then((res) => {
      if (!res.ok) throw new Error("History fetch failed");
      return res.json();
    })
    .then((data) => {
      if (Array.isArray(data)) {
        setHistory(data);
      }
    })
    .catch((err) => console.error("Error loading scan logs:", err))
    .finally(() => setLoading(false));
  }, [token, backendUrl]);

  // Fetch detailed base64 images when viewing record
  const handleViewDetails = async (id: string) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`${backendUrl}/api/v1/history/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Details fetch failed");
      const data = await response.json();
      setSelectedDiag(data);
    } catch (err) {
      alert("Failed to retrieve visual X-ray mappings for this record.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDownloadPdf = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details modal
    setDownloadingId(id);
    try {
      const response = await fetch(`${backendUrl}/api/v1/history/pdf/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to stream report PDF.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `mediscan_report_${id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || "PDF download failed.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Filter lists based on query
  const filteredHistory = history.filter((item) =>
    item.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.symptoms && item.symptoms.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.prediction.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="font-outfit text-2xl font-extrabold text-slate-950 dark:text-white">Scan Diagnosis History</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Review clinical logs and retrieve PDF radiography report sheets</p>
      </div>

      {/* Filter and search bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/50 dark:border-slate-850 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by patient, symptoms, or prediction..."
          className="w-full bg-transparent text-sm focus:outline-none text-slate-950 dark:text-white"
        />
      </div>

      {/* History log registry grid */}
      <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-850 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            Querying clinical registries...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <History className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No diagnostic records match the search filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-850 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Patient Name</th>
                  <th className="p-4">Diagnosis</th>
                  <th className="p-4">Confidence</th>
                  <th className="p-4">Risk Level</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => {
                  const isPneumonia = item.prediction === "Pneumonia";
                  const riskColor = item.risk_level === "High" ? "text-red-500 bg-red-500/10" : (item.risk_level === "Medium" ? "text-amber-500 bg-amber-500/10" : "text-emerald-500 bg-emerald-500/10");
                  return (
                    <tr 
                      key={item.id}
                      onClick={() => handleViewDetails(item.id)}
                      className="border-b border-slate-200/30 dark:border-slate-850/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
                    >
                      <td className="p-4 font-bold text-slate-950 dark:text-white">{item.patient_name}</td>
                      <td className={`p-4 font-bold ${isPneumonia ? "text-red-500" : "text-emerald-500"}`}>{item.prediction.toUpperCase()}</td>
                      <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-350">{(item.confidence * 100).toFixed(1)}%</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${riskColor}`}>
                          {item.risk_level}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-mono">
                        {item.created_at.slice(0, 10)} {item.created_at.slice(11, 16)}
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewDetails(item.id); }}
                          className="p-1.5 rounded-lg bg-slate-150/40 hover:bg-slate-200/60 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200/15"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDownloadPdf(item.id, e)}
                          disabled={downloadingId === item.id}
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/10"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expanded detailed scan records modal modal */}
      <AnimatePresence>
        {selectedDiag && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-filter backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-250/20 dark:border-slate-850 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal header */}
              <div className="h-14 bg-slate-100 dark:bg-slate-950 px-6 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-850">
                <h3 className="font-outfit text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" /> Diagnosis Summary: {selectedDiag.patient_name}
                </h3>
                <button 
                  onClick={() => setSelectedDiag(null)}
                  className="p-1.5 rounded-lg bg-slate-200/60 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal body scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Metric tiles */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/30 dark:border-slate-850">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Scan Verdict</span>
                    <span className={`text-base font-extrabold block mt-1 ${selectedDiag.prediction === "Pneumonia" ? "text-red-500" : "text-emerald-500"}`}>
                      {selectedDiag.prediction.toUpperCase()}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/30 dark:border-slate-850">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Confidence</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white block mt-1">{(selectedDiag.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/30 dark:border-slate-850">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Severity Risk</span>
                    <span className={`text-base font-extrabold block mt-1 ${
                      selectedDiag.risk_level === "High" ? "text-red-500" : (selectedDiag.risk_level === "Medium" ? "text-amber-500" : "text-emerald-500")
                    }`}>
                      {selectedDiag.risk_level.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Side-by-Side radiography details */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Original */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-center">Original Scan</span>
                    <div className="aspect-[4/5] rounded-xl overflow-hidden border border-slate-200/30 dark:border-slate-850 shadow-md">
                      <img src={selectedDiag.original_image} alt="Original scan details" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  
                  {/* Overlay heatmap */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-center">Grad-CAM Overlay</span>
                    <div className="aspect-[4/5] rounded-xl overflow-hidden border border-slate-200/30 dark:border-slate-850 shadow-md">
                      <img src={selectedDiag.heatmap_image} alt="Grad-CAM scan details" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/30 dark:border-slate-850 space-y-3">
                  <h4 className="text-xs font-bold text-slate-950 dark:text-white">Recommendations Summary</h4>
                  <ul className="space-y-2">
                    {selectedDiag.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-650 dark:text-slate-400 flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Modal footer actions */}
              <div className="h-14 bg-slate-150/40 dark:bg-slate-950 px-6 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-850">
                <span className="text-[10px] text-slate-400 font-mono font-bold">DATE: {selectedDiag.created_at}</span>
                <button
                  onClick={(e) => handleDownloadPdf(selectedDiag.id, e)}
                  disabled={downloadingId === selectedDiag.id}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/60 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Download PDF Report
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
