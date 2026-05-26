"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Mic, 
  MicOff,
  Activity, 
  ArrowRight,
  TrendingUp, 
  Download,
  RotateCcw,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

export const DiagnosisView: React.FC = () => {
  const { token, backendUrl } = useApp();
  
  // States
  const [patientName, setPatientName] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Results
  const [diagnosisResult, setDiagnosisResult] = useState<any | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  
  // Speech Recording
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // File drag ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step logging lists
  const loadingSteps = [
    "Uploading radiograph metrics to secure portal...",
    "Executing image preprocessing and resizing (224x224)...",
    "Segmenting thoracic cavity and lung lobes...",
    "Running Convolutional Neural Network (CNN) feature analysis...",
    "Tracing activation gradients for Grad-CAM explainability...",
    "Compiling clinical diagnostics data and final report..."
  ];

  // Load speech recognition
  useEffect(() => {
    const WindowWithSpeech = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    const SpeechClass = WindowWithSpeech.SpeechRecognition || WindowWithSpeech.webkitSpeechRecognition;
    if (SpeechClass) {
      const rec = new SpeechClass();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      
      rec.onstart = () => setIsRecording(true);
      rec.onresult = (e: SpeechRecognitionEvent) => {
        const transcript = e.results[0][0].transcript;
        setSymptoms(prev => prev ? `${prev} ${transcript}` : transcript);
      };
      rec.onerror = (e) => {
        console.error("Speech error:", e.error);
        setIsRecording(false);
      };
      rec.onend = () => setIsRecording(false);
      
      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not fully supported in this browser. Please try Chrome or Edge.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError(null);
      } else {
        setError("Invalid format. Please drag a valid chest radiograph image.");
      }
    }
  };

  // Submit scan to backend
  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a chest radiograph to evaluate.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setDiagnosisResult(null);

    // Dynamic loading text step loops
    let stepIndex = 0;
    setLoadingStep(loadingSteps[0]);
    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < loadingSteps.length) {
        setLoadingStep(loadingSteps[stepIndex]);
      }
    }, 1800);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("patient_name", patientName.trim() ? patientName : "Anonymous Patient");
      formData.append("symptoms", symptoms.trim() ? symptoms : "No clinical symptoms reported");

      const response = await fetch(`${backendUrl}/api/v1/predict`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Diagnosis prediction failed");
      }

      const data = await response.json();
      
      // Inject local simulated diag_id if none returned for testing, or fetch history to match
      if (!data.id) {
        // Query history to get newest record id
        const historyRes = await fetch(`${backendUrl}/api/v1/history`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const historyData = await historyRes.json();
        if (Array.isArray(historyData) && historyData.length > 0) {
          data.id = historyData[0].id;
        }
      }

      setDiagnosisResult(data);
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || "An error occurred during image assessment.");
    } finally {
      setLoading(false);
    }
  };

  // Stream PDF Report download
  const handleDownloadPdf = async () => {
    if (!diagnosisResult?.id) return;
    setDownloadingPdf(true);
    try {
      const response = await fetch(`${backendUrl}/api/v1/history/pdf/${diagnosisResult.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error("Failed to compile and download PDF report.");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `mediscan_report_${diagnosisResult.id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || "PDF download failed.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPatientName("");
    setSymptoms("");
    setDiagnosisResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2">
        <div>
          <h2 className="font-outfit text-2xl font-extrabold text-slate-950 dark:text-white">AI Image Analysis</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Classify chest X-rays and evaluate pulmonic opacity matrices</p>
        </div>
        
        {diagnosisResult && (
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-200/20"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Diagnose New Scan
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!diagnosisResult && !loading ? (
          // A. Scan Form Input panel
          <motion.form 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleDiagnose}
            className="grid lg:grid-cols-12 gap-6"
          >
            
            {/* Left Inputs */}
            <div className="lg:col-span-5 space-y-4">
              <div className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-4">
                <h3 className="font-outfit text-base font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" /> Patient Context Criteria
                </h3>
                
                {/* Patient Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Patient Identifier Name</label>
                  <input 
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="E.g., Margaret Jenkins"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                  />
                </div>

                {/* Symptoms Textarea */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Clinical Symptoms Description</label>
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-bold ${isRecording ? "bg-red-500/15 border-red-500 text-red-500 animate-pulse" : "bg-slate-100 dark:bg-slate-800 border-slate-200/20 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"}`}
                    >
                      {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>{isRecording ? "Listening..." : "Voice Dictate"}</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="E.g., Patient presents with persistent productive cough, fever of 101.5°F, and mild dyspnea on exertion. Breath sounds reveal crackles..."
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white leading-relaxed resize-none"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 leading-normal">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Right File Upload */}
            <div className="lg:col-span-7 flex flex-col">
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="glass-card p-8 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500/80 transition-all flex-1 flex flex-col items-center justify-center text-center gap-4 cursor-pointer relative overflow-hidden"
                onClick={triggerUpload}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {previewUrl ? (
                  // Image thumbnail uploader preview
                  <div className="relative w-full max-w-[280px] aspect-[4/5] rounded-xl overflow-hidden shadow-md">
                    <img 
                      src={previewUrl} 
                      alt="X-ray preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs font-bold">Replace Scan Image</span>
                    </div>
                  </div>
                ) : (
                  // Uploader Prompt
                  <div className="space-y-4 max-w-sm">
                    <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/10 animate-bounce">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-950 dark:text-white">Upload Thoracic Radiography Scan</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                        Drag and drop PA view Chest X-Ray or click to select image. Supports JPEG, PNG, DICOM.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {selectedFile && (
                <button
                  type="submit"
                  className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group"
                >
                  Initiate Scan Diagnostic <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>

          </motion.form>
        ) : loading ? (
          // B. Scanning Diagnostic Simulation
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-12 rounded-3xl border border-slate-200/50 dark:border-slate-850 flex flex-col items-center justify-center text-center gap-6"
          >
            {/* Scanning Image Cage */}
            <div className="relative w-44 aspect-[4/5] rounded-xl overflow-hidden shadow-2xl scan-overlay p-1 bg-slate-900 border border-slate-800">
              <img 
                src={previewUrl!} 
                alt="Scanning visual" 
                className="w-full h-full object-cover opacity-60"
              />
            </div>
            
            <div className="space-y-2 max-w-md">
              <h3 className="font-outfit text-lg font-bold text-slate-950 dark:text-white flex items-center justify-center gap-2">
                <Activity className="w-5 h-5 text-blue-500 animate-spin" /> MediScan Convolutional Analysis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono min-h-8">
                {loadingStep}
              </p>
            </div>
          </motion.div>
        ) : (
          // C. Diagnosis results display (Grad-CAM comparison layout)
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Results metrics board */}
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Prediction details */}
              <div className="glass-card p-5 rounded-2xl border border-slate-250/20 dark:border-slate-850 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model Verdict</span>
                <h3 className={`font-outfit text-3xl font-extrabold ${diagnosisResult.prediction === "Pneumonia" ? "text-red-500" : "text-emerald-500"}`}>
                  {diagnosisResult.prediction.toUpperCase()}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Diagnostic Classification Result</span>
              </div>

              {/* Confidence details */}
              <div className="glass-card p-5 rounded-2xl border border-slate-250/20 dark:border-slate-850 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model Confidence</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{(diagnosisResult.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-255/15 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${diagnosisResult.confidence * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block font-medium">Inference margin probability density</span>
              </div>

              {/* Risk details */}
              <div className="glass-card p-5 rounded-2xl border border-slate-250/20 dark:border-slate-850 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Severity Risk Level</span>
                <h3 className={`font-outfit text-3xl font-extrabold ${
                  diagnosisResult.risk_level === "High" ? "text-red-500" : (diagnosisResult.risk_level === "Medium" ? "text-amber-500" : "text-emerald-500")
                }`}>
                  {diagnosisResult.risk_level.toUpperCase()}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Pulmonary distress hazard score</span>
              </div>

            </div>

            {/* Side-by-Side scans comparison layout */}
            <div className="grid lg:grid-cols-12 gap-6">
              
              {/* Image views */}
              <div className="lg:col-span-8 glass-card p-6 rounded-2xl border border-slate-250/20 dark:border-slate-850 space-y-4">
                <div className="space-y-0.5">
                  <h3 className="font-outfit text-base font-bold text-slate-950 dark:text-white">Visual Scan Mapping</h3>
                  <p className="text-xs text-slate-500">Grad-CAM maps regional pixel densities to explain model focus attention</p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Original Radiograph */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-center">Original Radiograph</span>
                    <div className="aspect-[4/5] rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800 shadow bg-slate-900">
                      <img 
                        src={diagnosisResult.original_image} 
                        alt="Original scan" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Grad-CAM Heatmap overlay */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-center">Grad-CAM Heatmap Overlay</span>
                    <div className="aspect-[4/5] rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800 shadow bg-slate-900">
                      <img 
                        src={diagnosisResult.heatmap_image} 
                        alt="Grad-CAM scan" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations and Actions */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Clinical recommendations */}
                <div className="glass-card p-5 rounded-2xl border border-slate-250/20 dark:border-slate-850 flex-1 space-y-4">
                  <h3 className="font-outfit text-base font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-500" /> Clinician Recommendations
                  </h3>
                  <ul className="space-y-2.5">
                    {diagnosisResult.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* PDF generation panel */}
                <div className="glass-card p-5 rounded-2xl border border-slate-250/20 dark:border-slate-850 space-y-3">
                  <h4 className="text-xs font-bold text-slate-950 dark:text-white">Diagnostic Report</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Generate and download a comprehensive clinical PDF report compiling patient stats, side-by-side radiograph comparisons, and directives.
                  </p>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/60 rounded-xl text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingPdf ? "Compiling PDF document..." : "Download PDF Report"}</span>
                  </button>
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
