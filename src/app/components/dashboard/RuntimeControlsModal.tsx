"use client";

import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card } from "../ui/Card";
import { focusRing } from "../ui/styles";

interface RuntimeControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProxyStatus {
  running: boolean;
  port: number;
  endpoint: string;
}

export function RuntimeControlsModal({ isOpen, onClose }: RuntimeControlsModalProps) {
  const [status, setStatus] = useState<ProxyStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      // Listen for escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    try {
      const current = await invoke<ProxyStatus>("get_proxy_status");
      setStatus(current);
    } catch (err) {
      console.error("Failed to get status:", err);
    }
  };

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  const handleStart = async () => {
    setLoading(true);
    addLog("Starting proxy...");
    try {
      const res = await invoke<ProxyStatus>("start_proxy");
      setStatus(res);
      addLog("Proxy started successfully.");
    } catch (err) {
      addLog(`Error starting proxy: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    addLog("Stopping proxy...");
    try {
      const res = await invoke<ProxyStatus>("stop_proxy");
      setStatus(res);
      addLog("Proxy stopped.");
    } catch (err) {
      addLog(`Error stopping proxy: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
     await handleStop();
     // mild delay
     setTimeout(() => handleStart(), 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="font-heading text-lg font-semibold text-slate-100">Runtime Controls</h2>
          <button
            onClick={onClose}
            className={`rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition ${focusRing}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Indicator */}
          <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
             <div>
                <p className="text-sm font-medium text-slate-400">Current Status</p>
                <div className="flex items-center gap-2 mt-1">
                   <span className={`relative flex h-3 w-3`}>
                     <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status?.running ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                     <span className={`relative inline-flex rounded-full h-3 w-3 ${status?.running ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                   </span>
                   <span className={`font-semibold ${status?.running ? 'text-emerald-300' : 'text-red-300'}`}>
                      {status?.running ? 'Running' : 'Stopped'}
                   </span>
                </div>
             </div>
             {status?.running && (
                <div className="text-right">
                   <p className="text-xs text-slate-500">Port</p>
                   <p className="font-mono text-slate-200">{status.port}</p>
                </div>
             )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
             <button
                onClick={handleStart}
                disabled={loading || status?.running}
                className={`flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`}
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Start Proxy
             </button>
             <button
                onClick={handleStop}
                disabled={loading || !status?.running}
                className={`flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`}
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                Stop Proxy
             </button>
          </div>
          
          <button
            onClick={handleRestart}
            disabled={loading}
             className={`w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10 ${focusRing}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
             Restart Service
          </button>

          {/* Mini Logs */}
          <div className="rounded-xl bg-slate-950 p-3 font-mono text-xs text-slate-400 min-h-[100px] overflow-hidden border border-white/5">
             {logs.length === 0 ? (
                <span className="text-slate-600 italic">No recent activity...</span>
             ) : (
                <ul className="space-y-1">
                   {logs.map((log, i) => (
                      <li key={i}>{log}</li>
                   ))}
                </ul>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
