import React from 'react';
import { Zap, Clock, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';

interface SmartHUDProps {
  isLoading: boolean;
  benchmarkMs: number | null;
  statusText: string;
  engineUsed: 'gemini-ai' | 'offline-lexicon' | null;
  isOnline: boolean;
}

export const SmartHUD: React.FC<SmartHUDProps> = ({
  isLoading,
  benchmarkMs,
  statusText,
  engineUsed,
  isOnline,
}) => {
  return (
    <aside
      id="smartLoadingHUD"
      aria-label="ระบบวัดประสิทธิภาพการประมวลผล"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/95 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-lg backdrop-blur-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-200"
    >
      {/* Loading state indicator */}
      {isLoading ? (
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-indigo-600"></span>
          </span>
          <span className="text-slate-900 font-semibold dark:text-white">
            {statusText || 'กำลังประมวลผลภาษาไทย...'}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="text-slate-600 dark:text-slate-400">
            {statusText || 'พร้อมใช้งาน'}
          </span>
        </div>
      )}

      {/* Latency / Benchmark badge */}
      {benchmarkMs !== null && !isLoading && (
        <>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>{(benchmarkMs / 1000).toFixed(2)}s</span>
          </div>
        </>
      )}

      {/* Engine badge */}
      {engineUsed && (
        <>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
              engineUsed === 'gemini-ai'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            {engineUsed === 'gemini-ai' ? 'Gemini 4 AI' : 'Offline Lexicon'}
          </span>
        </>
      )}

      {/* Online / Offline status */}
      <span className="text-slate-300 dark:text-slate-700">|</span>
      <div
        className="flex items-center gap-1 text-[11px]"
        title={isOnline ? 'เชื่อมต่ออินเทอร์เน็ตปกติ' : 'โหมดออฟไลน์: ใช้งานคลังคำศัพท์ในตัวเครื่อง'}
      >
        {isOnline ? (
          <>
            <Wifi className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-slate-500">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-amber-600 font-semibold">Offline</span>
          </>
        )}
      </div>
    </aside>
  );
};
