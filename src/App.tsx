import React, { useState, useEffect } from 'react';
import { TopNavigation, type ActiveTab } from './components/TopNavigation';
import { DocumentInspector } from './components/DocumentInspector';
import { AuditHistoryView } from './components/AuditHistoryView';
import { WeeklyReportView } from './components/WeeklyReportView';
import { DictionarySettingsView } from './components/DictionarySettingsView';
import { SmartHUD } from './components/SmartHUD';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  type CheckResult,
  type AuditLogEntry,
  runOfflineLexiconSpellCheck,
  calculateWeeklyStats,
} from './utils/thaiSpellEngine';
import {
  getAuditLogs,
  saveAuditLog,
  deleteAuditLog,
  clearAuditLogs,
  getCustomWords,
  saveCustomWord,
  removeCustomWord,
  getPreferences,
  savePreferences,
  type AppPreferences,
} from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('inspector');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<AppPreferences>(getPreferences());
  const [forcedOffline, setForcedOffline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentBenchmarkMs, setCurrentBenchmarkMs] = useState<number | null>(null);
  const [hudStatusText, setHudStatusText] = useState<string>('Zero-Latency พร้อมใช้งาน');
  const [engineUsed, setEngineUsed] = useState<'gemini-ai' | 'offline-lexicon' | null>(null);

  const isNetworkOnline = useOnlineStatus();
  const effectiveOnline = isNetworkOnline && !forcedOffline;

  // Initial Boot Data Loading (3-Stage Hydration)
  useEffect(() => {
    // Stage 0: Preferences & Custom Lexicon
    setPreferences(getPreferences());
    setCustomWords(getCustomWords());

    // Stage 1: Core History Hydration
    const loadedLogs = getAuditLogs();
    setAuditLogs(loadedLogs);
  }, []);

  // Primary Check Function (Online AI with automatic zero-delay Offline fallback)
  const handleRunCheck = async (
    text: string,
    documentName: string,
    preferEngine: 'auto' | 'ai' | 'offline'
  ): Promise<CheckResult | null> => {
    setIsLoading(true);
    setHudStatusText('กำลังประมวลผลวิเคราะห์ภาษาไทย...');
    const t0 = performance.now();

    const shouldUseOffline =
      preferEngine === 'offline' ||
      forcedOffline ||
      !isNetworkOnline ||
      preferences.preferEngine === 'offline';

    if (shouldUseOffline) {
      // Run instantaneous client-side lexicon engine
      try {
        const offlineRes = runOfflineLexiconSpellCheck(text, customWords);
        offlineRes.documentName = documentName;
        const totalMs = Math.round((performance.now() - t0) * 100) / 100;
        offlineRes.benchmarkMs = totalMs;

        setCurrentBenchmarkMs(totalMs);
        setEngineUsed('offline-lexicon');
        setHudStatusText(`ประมวลผลสำเร็จ (${offlineRes.errors.length} ข้อผิดพลาด)`);
        setIsLoading(false);
        return offlineRes;
      } catch (err) {
        console.error('Offline check failed:', err);
        setIsLoading(false);
        return null;
      }
    }

    // Attempt Full-Stack Online API with Gemini AI
    try {
      const response = await fetch('/api/spell-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          documentName,
          customWords,
          preferEngine: preferEngine === 'ai' ? 'ai' : preferences.preferEngine,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data: CheckResult = await response.json();
      const totalMs = Math.round((performance.now() - t0) * 100) / 100;
      data.benchmarkMs = data.benchmarkMs || totalMs;

      setCurrentBenchmarkMs(data.benchmarkMs);
      setEngineUsed(data.engineUsed || 'gemini-ai');
      if (data.apiNotice === 'BILLING_REQUIRED') {
        setHudStatusText(`Offline Lexicon (${data.errors.length} คำผิด - โครงการต้องการ Billing)`);
      } else {
        setHudStatusText(`ประมวลผลสำเร็จ (${data.errors.length} ข้อผิดพลาด)`);
      }
      setIsLoading(false);
      return data;
    } catch (apiError) {
      console.warn('Online API failed or offline, switching immediately to local lexicon:', apiError);
      // Seamless Zero-Loss Offline Fallback
      const fallbackRes = runOfflineLexiconSpellCheck(text, customWords);
      fallbackRes.documentName = documentName;
      const totalMs = Math.round((performance.now() - t0) * 100) / 100;
      fallbackRes.benchmarkMs = totalMs;

      setCurrentBenchmarkMs(totalMs);
      setEngineUsed('offline-lexicon');
      setHudStatusText(`โหมด Offline (${fallbackRes.errors.length} ข้อผิดพลาด)`);
      setIsLoading(false);
      return fallbackRes;
    }
  };

  // Save audit log to local history
  const handleSaveToHistory = (result: CheckResult) => {
    const acceptedCount = result.errors.filter(
      e => e.status === 'accepted' || e.status === 'custom'
    ).length;
    const rejectedCount = result.errors.filter(e => e.status === 'rejected').length;

    const newLog: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      documentName: result.documentName || 'เอกสารไม่ระบุชื่อ',
      fileType: result.documentName?.split('.').pop() || 'docx',
      originalLength: result.originalText.length,
      correctedLength: result.correctedText.length,
      totalErrorsFound: result.errors.length,
      acceptedFixes: acceptedCount,
      rejectedFixes: rejectedCount,
      engine: result.engineUsed,
      benchmarkMs: result.benchmarkMs,
      summary: `ตรวจทานเอกสาร ${result.documentName} พบคำผิด ${result.errors.length} จุด (ยืนยันแก้ไข ${acceptedCount} จุด)`,
      details: result.errors.map(e => ({
        original: e.original,
        fixed: e.status === 'custom' && e.customFix ? e.customFix : e.suggestion,
        category: e.category,
        status: e.status,
      })),
    };

    const updated = saveAuditLog(newLog);
    setAuditLogs(updated);
  };

  // Delete single log
  const handleDeleteLog = (id: string) => {
    const updated = deleteAuditLog(id);
    setAuditLogs(updated);
  };

  // Clear all logs
  const handleClearLogs = () => {
    clearAuditLogs();
    setAuditLogs([]);
  };

  // Load past log document into active editor
  const handleLoadLogIntoEditor = (log: AuditLogEntry) => {
    setActiveTab('inspector');
  };

  // Custom words management
  const handleAddCustomWord = (word: string) => {
    const updated = saveCustomWord(word);
    setCustomWords(updated);
  };

  const handleRemoveCustomWord = (word: string) => {
    const updated = removeCustomWord(word);
    setCustomWords(updated);
  };

  // Preferences
  const handleSavePreferences = (prefs: Partial<AppPreferences>) => {
    const updated = savePreferences(prefs);
    setPreferences(updated);
  };

  // Toggle forced offline mode
  const handleToggleForceOffline = () => {
    setForcedOffline(prev => !prev);
    setHudStatusText(!forcedOffline ? 'สลับเป็นโหมด Offline' : 'สลับเป็นโหมด Online AI');
  };

  // Compute live weekly report statistics from audit history
  const weeklyReportData = calculateWeeklyStats(auditLogs);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans dark:bg-slate-950 dark:text-slate-100 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Bar Contract (Brand - Nav Links - Actions) */}
      <TopNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOnline={effectiveOnline}
        isOfflineForced={forcedOffline}
        onToggleForceOffline={handleToggleForceOffline}
        pendingCount={0}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'inspector' && (
          <DocumentInspector
            onRunCheck={handleRunCheck}
            isLoading={isLoading}
            onSaveToHistory={handleSaveToHistory}
            onAddCustomWord={handleAddCustomWord}
            customWords={customWords}
            isOnline={effectiveOnline}
            forcedOffline={forcedOffline}
          />
        )}

        {activeTab === 'history' && (
          <AuditHistoryView
            logs={auditLogs}
            onDeleteLog={handleDeleteLog}
            onClearLogs={handleClearLogs}
            onLoadLogIntoEditor={handleLoadLogIntoEditor}
          />
        )}

        {activeTab === 'weekly-report' && (
          <WeeklyReportView
            reportData={weeklyReportData}
            departmentName={preferences.departmentName}
          />
        )}

        {activeTab === 'settings' && (
          <DictionarySettingsView
            customWords={customWords}
            onAddWord={handleAddCustomWord}
            onRemoveWord={handleRemoveCustomWord}
            preferences={preferences}
            onSavePreferences={handleSavePreferences}
          />
        )}
      </main>

      {/* Non-Intrusive Smart HUD Telemetry */}
      {preferences.showSmartHUD && (
        <SmartHUD
          isLoading={isLoading}
          benchmarkMs={currentBenchmarkMs}
          statusText={hudStatusText}
          engineUsed={engineUsed}
          isOnline={effectiveOnline}
        />
      )}
    </div>
  );
}
