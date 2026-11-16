import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Wand2,
  Download,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  FileDown,
  Printer,
  Sparkles,
  BookPlus,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  FileCheck,
} from 'lucide-react';
import {
  type SpellError,
  type CheckResult,
  applyCorrections,
  estimateThaiWordCount,
} from '../utils/thaiSpellEngine';
import { extractTextFromFile, exportToDocx, exportToTxt } from '../utils/fileHandler';
import { SAMPLE_DOCUMENTS } from '../utils/storage';

interface DocumentInspectorProps {
  onRunCheck: (
    text: string,
    documentName: string,
    preferEngine: 'auto' | 'ai' | 'offline'
  ) => Promise<CheckResult | null>;
  isLoading: boolean;
  onSaveToHistory: (result: CheckResult) => void;
  onAddCustomWord: (word: string) => void;
  customWords: string[];
  isOnline: boolean;
  forcedOffline: boolean;
}

export const DocumentInspector: React.FC<DocumentInspectorProps> = ({
  onRunCheck,
  isLoading,
  onSaveToHistory,
  onAddCustomWord,
  customWords,
  isOnline,
  forcedOffline,
}) => {
  const [documentName, setDocumentName] = useState<string>('บันทึกข้อความราชการ.docx');
  const [text, setText] = useState<string>(SAMPLE_DOCUMENTS[0].content);
  const [originalTextSnapshot, setOriginalTextSnapshot] = useState<string>(SAMPLE_DOCUMENTS[0].content);
  const [errors, setErrors] = useState<SpellError[]>([]);
  const [activeEngine, setActiveEngine] = useState<'auto' | 'ai' | 'offline'>('auto');
  const [viewMode, setViewMode] = useState<'cards' | 'diff'>('cards');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [benchmarkMs, setBenchmarkMs] = useState<number | null>(null);
  const [engineUsed, setEngineUsed] = useState<'gemini-ai' | 'offline-lexicon' | null>(null);
  const [editingErrorId, setEditingErrorId] = useState<string | null>(null);
  const [customInputValue, setCustomInputValue] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-compute corrected text preview
  const liveCorrectedText = applyCorrections(originalTextSnapshot, errors);

  // Execute check on text
  const handleCheck = async () => {
    if (!text.trim() || isLoading) return;
    setOriginalTextSnapshot(text);
    const result = await onRunCheck(text, documentName, activeEngine);
    if (result) {
      setErrors(result.errors);
      setBenchmarkMs(result.benchmarkMs);
      setEngineUsed(result.engineUsed);
      setApiNotice(result.apiNotice || null);
      onSaveToHistory(result);
    }
  };

  // Handle file selection / drop
  const handleFileUpload = async (file: File) => {
    try {
      const extracted = await extractTextFromFile(file);
      setText(extracted.text);
      setOriginalTextSnapshot(extracted.text);
      setDocumentName(extracted.fileName);
      setErrors([]);
      setBenchmarkMs(null);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์เอกสาร');
      console.error(err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Accept a single error fix
  const handleAcceptError = (id: string) => {
    setErrors(prev =>
      prev.map(err => (err.id === id ? { ...err, status: 'accepted' as const } : err))
    );
  };

  // Reject a single error fix
  const handleRejectError = (id: string) => {
    setErrors(prev =>
      prev.map(err => (err.id === id ? { ...err, status: 'rejected' as const } : err))
    );
  };

  // Apply custom fix to an error
  const handleSaveCustomFix = (id: string) => {
    if (!customInputValue.trim()) return;
    setErrors(prev =>
      prev.map(err =>
        err.id === id
          ? {
              ...err,
              status: 'custom' as const,
              customFix: customInputValue.trim(),
            }
          : err
      )
    );
    setEditingErrorId(null);
    setCustomInputValue('');
  };

  // Auto-Fix All: Accept all pending errors
  const handleAutoFixAll = () => {
    setErrors(prev =>
      prev.map(err => ({
        ...err,
        status: err.status === 'rejected' ? 'rejected' : ('accepted' as const),
      }))
    );
    // Sync the editor text with the corrected text
    const updated = applyCorrections(
      originalTextSnapshot,
      errors.map(err => ({
        ...err,
        status: err.status === 'rejected' ? 'rejected' : ('accepted' as const),
      }))
    );
    setText(updated);
  };

  // Copy to clipboard
  const handleCopyText = async () => {
    const textToCopy = errors.length > 0 ? liveCorrectedText : text;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export handlers
  const handleExportDocx = () => {
    const exportText = errors.length > 0 ? liveCorrectedText : text;
    exportToDocx(exportText, `แก้ไขแล้ว_${documentName}`, {
      docTitle: documentName.replace(/\.[^/.]+$/, ''),
      errorCount: errors.filter(e => e.status === 'accepted' || e.status === 'custom').length,
    });
  };

  const handleExportTxt = () => {
    const exportText = errors.length > 0 ? liveCorrectedText : text;
    exportToTxt(exportText, `แก้ไขแล้ว_${documentName.replace(/\.[^/.]+$/, '')}.txt`);
  };

  const handlePrint = () => {
    window.print();
  };

  const pendingErrors = errors.filter(e => e.status === 'pending');
  const acceptedErrors = errors.filter(e => e.status === 'accepted' || e.status === 'custom');
  const filteredErrors = errors.filter(e => {
    if (filterCategory === 'all') return true;
    return e.category === filterCategory;
  });

  const wordCount = estimateThaiWordCount(text);

  return (
    <div className="space-y-6">
      {/* Top Action Bar & File Controls */}
      <section
        aria-label="การจัดการเอกสาร"
        className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* File Name & Presets */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
              <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <input
                type="text"
                value={documentName}
                onChange={e => setDocumentName(e.target.value)}
                placeholder="ชื่อเอกสาร"
                className="w-48 sm:w-64 bg-transparent text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden dark:text-slate-200"
              />
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf,.txt,.md"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Upload className="h-3.5 w-3.5 text-slate-500" />
              <span>เปิดไฟล์ (.docx / .pdf / .txt)</span>
            </button>

            {/* Quick Sample Selector */}
            <select
              aria-label="เลือกเอกสารตัวอย่างสำหรับทดสอบ"
              onChange={e => {
                const idx = parseInt(e.target.value, 10);
                if (!isNaN(idx) && SAMPLE_DOCUMENTS[idx]) {
                  setText(SAMPLE_DOCUMENTS[idx].content);
                  setOriginalTextSnapshot(SAMPLE_DOCUMENTS[idx].content);
                  setDocumentName(`เอกสารตัวอย่าง_${idx + 1}.docx`);
                  setErrors([]);
                }
              }}
              defaultValue="0"
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="" disabled>
                -- เลือกข้อความตัวอย่างสำหรับทดสอบ --
              </option>
              {SAMPLE_DOCUMENTS.map((doc, idx) => (
                <option key={idx} value={idx}>
                  {doc.title}
                </option>
              ))}
            </select>
          </div>

          {/* Engine Selector & Run Button */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <button
                onClick={() => setActiveEngine('auto')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeEngine === 'auto'
                    ? 'bg-white text-indigo-700 shadow-xs dark:bg-slate-700 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Auto
              </button>
              <button
                onClick={() => setActiveEngine('ai')}
                disabled={forcedOffline || !isOnline}
                title={forcedOffline || !isOnline ? 'ไม่สามารถใช้ Online AI ในโหมดออฟไลน์' : 'ใช้ Gemini 4 AI'}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeEngine === 'ai'
                    ? 'bg-white text-indigo-700 shadow-xs dark:bg-slate-700 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 disabled:opacity-40 dark:text-slate-400'
                }`}
              >
                Gemini 4 AI
              </button>
              <button
                onClick={() => setActiveEngine('offline')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeEngine === 'offline'
                    ? 'bg-white text-indigo-700 shadow-xs dark:bg-slate-700 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Offline Lexicon
              </button>
            </div>

            <button
              onClick={handleCheck}
              disabled={isLoading || !text.trim()}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>กำลังตรวจจับคำผิด...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  <span>ตรวจจับคำผิด</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Notice banner when Gemini API free tier / billing requires offline fallback */}
        {apiNotice === 'BILLING_REQUIRED' && (
          <div className="mt-3 flex items-start justify-between rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <span className="font-bold shrink-0">💡 สลับใช้งาน Offline Lexicon อัตโนมัติ:</span>
              <span>
                โครงการนี้ยังไม่ได้เปิดใช้ Billing สำหรับ Gemini API ในระบบคลาวด์ ระบบจึงประมวลผลด้วย Offline Local Lexicon Engine ซึ่งตรวจจับและยืนยันคำผิดภาษาไทยได้ครบถ้วน ถูกต้อง และรวดเร็วระดับเสี้ยววินาที (&lt; 0.05s) โดยไม่จำเป็นต้องต่อเน็ต
              </span>
            </div>
            <button
              onClick={() => setApiNotice(null)}
              className="ml-2 px-1.5 py-0.5 rounded text-amber-700 hover:bg-amber-100 font-bold dark:text-amber-400 dark:hover:bg-amber-900"
              title="ปิดการแจ้งเตือนนี้"
            >
              ✕
            </button>
          </div>
        )}

        {/* Drag & drop helper strip */}
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`mt-3 rounded-lg border border-dashed px-4 py-2 text-center text-xs transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/60 text-indigo-700 dark:bg-indigo-950/40'
              : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
          }`}
        >
          ลากไฟล์เอกสาร .docx หรือ .pdf มาวางที่นี่เพื่อนำเข้าข้อความโดยตรง
        </div>
      </section>

      {/* Main Workspace: Split-Grid Editor + Error Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Text Area / Diff Preview (7 cols) */}
        <section
          aria-label="พื้นที่แก้ไขข้อความและดูเปรียบเทียบ"
          className="lg:col-span-7 space-y-4"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            {/* View switcher & stats */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg dark:bg-slate-800">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>แก้ไขข้อความ</span>
                </button>
                <button
                  onClick={() => setViewMode('diff')}
                  disabled={errors.length === 0}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewMode === 'diff'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 disabled:opacity-40 dark:text-slate-400'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>เปรียบเทียบคำผิด (Diff)</span>
                </button>
              </div>

              {/* Text metadata */}
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                <span>{wordCount} คำ</span>
                <span aria-hidden="true">·</span>
                <span>{text.length} ตัวอักษร</span>
              </div>
            </div>

            {/* Content view */}
            {viewMode === 'cards' ? (
              <div className="mt-3">
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="วางหรือพิมพ์เนื้อหาเอกสารภาษาไทยที่ต้องการตรวจสอบที่นี่..."
                  rows={16}
                  className="w-full resize-y rounded-xl border-0 p-3 text-sm leading-relaxed text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-sans dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            ) : (
              <div className="mt-3 p-4 rounded-xl bg-slate-50 text-sm leading-relaxed max-h-[460px] overflow-y-auto font-sans whitespace-pre-wrap dark:bg-slate-950 dark:text-slate-200">
                <HighlightedDiffText
                  originalText={originalTextSnapshot}
                  errors={errors}
                />
              </div>
            )}

            {/* Bottom Editor Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:text-slate-300"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600">คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      <span>คัดลอกข้อความ</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setText('');
                    setOriginalTextSnapshot('');
                    setErrors([]);
                  }}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors dark:text-slate-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>ล้างข้อความ</span>
                </button>
              </div>

              {/* Export menu */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportDocx}
                  title="ดาวน์โหลดเอกสาร Word (.docx) ฉบับแก้ไขสมบูรณ์"
                  className="flex items-center gap-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1.5 text-xs font-medium hover:bg-blue-100 transition-colors dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>ส่งออก .docx</span>
                </button>

                <button
                  onClick={handleExportTxt}
                  title="ดาวน์โหลดเป็นไฟล์ข้อความธรรมดา (.txt)"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:text-slate-300"
                >
                  <FileDown className="h-3.5 w-3.5 text-slate-500" />
                  <span>.txt</span>
                </button>

                <button
                  onClick={handlePrint}
                  title="พิมพ์รายงานพร้อมบทสรุปการตรวจทาน"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:text-slate-300"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">พิมพ์/PDF</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Detected Errors & Interactive Correction Cards (5 cols) */}
        <section
          aria-label="รายการคำผิดที่ตรวจพบและการยืนยันแก้ไข"
          className="lg:col-span-5 space-y-4"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            {/* Header with Auto-Fix All */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  คำผิดที่ตรวจพบ ({errors.length})
                </h2>
                {pendingErrors.length > 0 && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
                    รอการยืนยัน {pendingErrors.length}
                  </span>
                )}
              </div>

              {errors.length > 0 && (
                <button
                  onClick={handleAutoFixAll}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>แก้ไขอัตโนมัติทั้งหมด</span>
                </button>
              )}
            </div>

            {/* Category filter tabs */}
            {errors.length > 0 && (
              <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                    filterCategory === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
                  }`}
                >
                  ทั้งหมด ({errors.length})
                </button>
                <button
                  onClick={() => setFilterCategory('spelling')}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                    filterCategory === 'spelling'
                      ? 'bg-rose-600 text-white'
                      : 'text-rose-700 hover:bg-rose-50 dark:text-rose-300'
                  }`}
                >
                  ตัวสะกด ({errors.filter(e => e.category === 'spelling').length})
                </button>
                <button
                  onClick={() => setFilterCategory('grammar')}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                    filterCategory === 'grammar'
                      ? 'bg-amber-600 text-white'
                      : 'text-amber-700 hover:bg-amber-50 dark:text-amber-300'
                  }`}
                >
                  ไวยากรณ์ ({errors.filter(e => e.category === 'grammar').length})
                </button>
                <button
                  onClick={() => setFilterCategory('formal')}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                    filterCategory === 'formal'
                      ? 'bg-indigo-600 text-white'
                      : 'text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300'
                  }`}
                >
                  ทางการ/ทับศัพท์ ({errors.filter(e => e.category === 'formal').length})
                </button>
              </div>
            )}

            {/* Error Cards List */}
            <div className="mt-4 space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {errors.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <FileCheck className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    ยังไม่มีรายการคำผิด
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                    คลิกปุ่ม "ตรวจจับคำผิด" ด้านบนเพื่อเริ่มวิเคราะห์เอกสารด้วย AI และระบบพจนานุกรม
                  </p>
                </div>
              ) : filteredErrors.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  ไม่มีคำผิดในหมวดหมู่นี้
                </div>
              ) : (
                filteredErrors.map(err => {
                  const isAccepted = err.status === 'accepted';
                  const isRejected = err.status === 'rejected';
                  const isCustom = err.status === 'custom';

                  return (
                    <article
                      key={err.id}
                      className={`rounded-xl border p-3.5 transition-all ${
                        isAccepted
                          ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                          : isRejected
                          ? 'border-slate-200 bg-slate-50/50 opacity-60 dark:border-slate-800 dark:bg-slate-900/40'
                          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                      }`}
                    >
                      {/* Top status & category tag */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={`font-medium ${
                            err.category === 'spelling'
                              ? 'text-rose-600'
                              : err.category === 'grammar'
                              ? 'text-amber-600'
                              : 'text-indigo-600'
                          }`}
                        >
                          {err.category === 'spelling'
                            ? 'ตัวสะกด'
                            : err.category === 'grammar'
                            ? 'ไวยากรณ์'
                            : err.category === 'formal'
                            ? 'ภาษาทางการ / ศัพท์บัญญัติ'
                            : 'วรรคตอน'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isAccepted && (
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                              <CheckCircle className="h-3 w-3" />
                              <span>แก้ไขแล้ว</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <XCircle className="h-3 w-3" />
                              <span>ปฏิเสธ</span>
                            </span>
                          )}
                          {isCustom && (
                            <span className="flex items-center gap-1 text-violet-600 font-semibold">
                              <CheckCircle className="h-3 w-3" />
                              <span>กำหนดเอง</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Word replacement preview */}
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="line-through text-rose-600 font-medium bg-rose-50 px-1.5 py-0.5 rounded dark:bg-rose-950/60">
                          {err.original}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded dark:bg-emerald-950/60 dark:text-emerald-300">
                          {isCustom && err.customFix ? err.customFix : err.suggestion}
                        </span>
                      </div>

                      {/* Linguistic reason */}
                      <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {err.reason}
                      </p>

                      {/* Inline Custom Edit Input if active */}
                      {editingErrorId === err.id && (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={customInputValue}
                            onChange={e => setCustomInputValue(e.target.value)}
                            placeholder="ระบุคำที่ต้องการแก้ไข..."
                            className="flex-1 rounded-md border border-slate-300 px-2.5 py-1 text-xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
                          />
                          <button
                            onClick={() => handleSaveCustomFix(err.id)}
                            className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                          >
                            บันทึก
                          </button>
                          <button
                            onClick={() => setEditingErrorId(null)}
                            className="text-xs text-slate-500 hover:text-slate-800"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAcceptError(err.id)}
                            className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
                              isAccepted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <Check className="h-3 w-3" />
                            <span>ยืนยันแก้ไข</span>
                          </button>

                          <button
                            onClick={() => handleRejectError(err.id)}
                            className={`flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors ${
                              isRejected
                                ? 'bg-slate-700 text-white dark:bg-slate-600'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span>คงคำเดิม</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingErrorId(err.id);
                              setCustomInputValue(err.suggestion);
                            }}
                            className="text-slate-500 hover:text-indigo-600 px-1.5 py-1"
                            title="พิมพ์แก้ไขคำนี้เอง"
                          >
                            แก้ไขเอง
                          </button>

                          <button
                            onClick={() => {
                              onAddCustomWord(err.original);
                              handleRejectError(err.id);
                            }}
                            title="เพิ่มคำนี้ลงคลังคำยกเว้นขององค์กร (จะไม่เตือนซ้ำอีก)"
                            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 px-1.5 py-1"
                          >
                            <BookPlus className="h-3 w-3" />
                            <span className="hidden sm:inline">จำคำนี้</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

/**
 * Highlighted Diff Renderer
 * Displays original text with red strikethrough for errors and green bold for replacements
 */
const HighlightedDiffText: React.FC<{
  originalText: string;
  errors: SpellError[];
}> = ({ originalText, errors }) => {
  if (!errors || errors.length === 0) {
    return <span>{originalText}</span>;
  }

  // Sort errors by startIndex
  const sorted = [...errors].sort((a, b) => a.startIndex - b.startIndex);
  const elements: React.ReactNode[] = [];
  let cursor = 0;

  sorted.forEach((err, idx) => {
    if (err.startIndex >= cursor && err.startIndex < originalText.length) {
      // Clean prefix text
      if (err.startIndex > cursor) {
        elements.push(
          <span key={`txt_${idx}`}>{originalText.substring(cursor, err.startIndex)}</span>
        );
      }

      const isAccepted = err.status === 'accepted';
      const isCustom = err.status === 'custom';
      const isRejected = err.status === 'rejected';

      if (isAccepted || isCustom) {
        elements.push(
          <span key={`diff_${err.id}`} className="inline-flex items-center mx-1">
            <span className="line-through text-rose-500 bg-rose-50 px-1 rounded text-xs dark:bg-rose-950/60">
              {err.original}
            </span>
            <span className="text-emerald-700 bg-emerald-100 font-bold px-1.5 rounded ml-1 dark:bg-emerald-900/60 dark:text-emerald-200">
              {isCustom && err.customFix ? err.customFix : err.suggestion}
            </span>
          </span>
        );
      } else if (isRejected) {
        elements.push(
          <span
            key={`rej_${err.id}`}
            className="text-slate-700 underline decoration-dotted font-medium"
            title="ผู้ใช้ปฏิเสธการแก้ไข คงคำเดิมไว้"
          >
            {err.original}
          </span>
        );
      } else {
        // Pending
        elements.push(
          <span
            key={`pen_${err.id}`}
            className="bg-amber-100 text-amber-900 font-semibold px-1 rounded border-b-2 border-amber-500 dark:bg-amber-950/60 dark:text-amber-200"
            title={`${err.reason} -> แนะนำ: ${err.suggestion}`}
          >
            {err.original}
          </span>
        );
      }

      cursor = err.endIndex;
    }
  });

  if (cursor < originalText.length) {
    elements.push(<span key="tail">{originalText.substring(cursor)}</span>);
  }

  return <div>{elements}</div>;
};
