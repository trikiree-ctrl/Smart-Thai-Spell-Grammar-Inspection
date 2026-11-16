import React, { useState } from 'react';
import {
  History,
  Search,
  Trash2,
  ExternalLink,
  Download,
  Calendar,
  FileText,
  CheckCircle2,
  Zap,
  Filter,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { type AuditLogEntry } from '../utils/thaiSpellEngine';
import { downloadBlob } from '../utils/fileHandler';

interface AuditHistoryViewProps {
  logs: AuditLogEntry[];
  onDeleteLog: (id: string) => void;
  onClearLogs: () => void;
  onLoadLogIntoEditor: (log: AuditLogEntry) => void;
}

export const AuditHistoryView: React.FC<AuditHistoryViewProps> = ({
  logs,
  onDeleteLog,
  onClearLogs,
  onLoadLogIntoEditor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = fileTypeFilter === 'all' || log.fileType === fileTypeFilter;
    return matchesSearch && matchesType;
  });

  const selectedLog = logs.find(l => l.id === selectedLogId);

  // Export audit logs as CSV for official reporting
  const handleExportCSV = () => {
    const headers = [
      'วันที่และเวลา',
      'ชื่อเอกสาร',
      'ประเภทไฟล์',
      'จำนวนคำผิดที่พบ',
      'แก้ไขแล้ว',
      'ปฏิเสธ',
      'เครื่องยนต์ที่ใช้',
      'เวลาประมวลผล(ms)',
      'สรุปการตรวจ',
    ];

    const rows = logs.map(l => [
      `"${new Date(l.timestamp).toLocaleString('th-TH')}"`,
      `"${l.documentName.replace(/"/g, '""')}"`,
      l.fileType,
      l.totalErrorsFound,
      l.acceptedFixes,
      l.rejectedFixes,
      l.engine,
      l.benchmarkMs,
      `"${(l.summary || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `รายงานประวัติการตรวจคำผิด_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Ribbon */}
      <section
        aria-label="การค้นหาและจัดการประวัติ"
        className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อเอกสาร หรือบันทึกย่อ..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <select
              aria-label="กรองประเภทไฟล์"
              value={fileTypeFilter}
              onChange={e => setFileTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="all">ทุกประเภทไฟล์</option>
              <option value="docx">Microsoft Word (.docx)</option>
              <option value="pdf">เอกสาร PDF (.pdf)</option>
              <option value="txt">ข้อความ (.txt)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>ส่งออก CSV</span>
            </button>

            {logs.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('คุณต้องการล้างประวัติการตรวจทั้งหมดใช่หรือไม่? (ไม่สามารถกู้คืนได้)')) {
                    onClearLogs();
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>ล้างประวัติ</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Audit Logs Table & Details Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Table of logs (7 or 12 cols depending on details open) */}
        <div
          className={`${
            selectedLog ? 'lg:col-span-7' : 'lg:col-span-12'
          } rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900`}
        >
          <div className="border-b border-slate-100 px-5 py-3.5 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              ประวัติการตรวจทานเอกสาร ({filteredLogs.length})
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              เก็บบนอุปกรณ์ (Local Storage)
            </span>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center">
              <History className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm text-slate-500">ไม่พบประวัติการตรวจสอบเอกสาร</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-100 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">ชื่อเอกสาร</th>
                    <th className="px-4 py-3 font-semibold">เวลา</th>
                    <th className="px-4 py-3 font-semibold text-center">คำผิดที่พบ</th>
                    <th className="px-4 py-3 font-semibold text-center">แก้ไขแล้ว</th>
                    <th className="px-4 py-3 font-semibold">เครื่องยนต์</th>
                    <th className="px-4 py-3 font-semibold text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.map(log => {
                    const isSelected = log.id === selectedLogId;
                    const dateObj = new Date(log.timestamp);
                    const formattedDate = dateObj.toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLogId(isSelected ? null : log.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                            <span className="truncate max-w-[180px] sm:max-w-[240px]">
                              {log.documentName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                            {log.totalErrorsFound}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {log.acceptedFixes}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
                              log.engine === 'gemini-ai'
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                          >
                            {log.engine === 'gemini-ai' ? 'Gemini AI' : 'Offline'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setSelectedLogId(log.id)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                              title="ดูรายละเอียดการแก้ไข"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteLog(log.id)}
                              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                              title="ลบรายการนี้"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Panel (5 cols) */}
        {selectedLog && (
          <aside
            aria-label="รายละเอียดการแก้ไขเอกสารย้อนหลัง"
            className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                บันทึกการแก้ไข: {selectedLog.documentName}
              </h3>
              <button
                onClick={() => setSelectedLogId(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800">
                <span className="text-slate-500">เวลาที่ตรวจ</span>
                <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(selectedLog.timestamp).toLocaleString('th-TH')}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800">
                <span className="text-slate-500">ความเร็วประมวลผล</span>
                <p className="mt-0.5 font-semibold text-emerald-600 font-mono">
                  ⚡ {(selectedLog.benchmarkMs / 1000).toFixed(2)} วินาที
                </p>
              </div>
            </div>

            {/* List of corrected words */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                รายการคำผิดและการดำเนินการ ({selectedLog.details.length})
              </h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {selectedLog.details.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="line-through text-rose-500 font-medium">
                        {item.original}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">
                        {item.fixed}
                      </span>
                    </div>

                    <span className="rounded bg-white px-2 py-0.5 text-[10px] text-slate-500 shadow-2xs dark:bg-slate-700">
                      {item.category === 'spelling'
                        ? 'ตัวสะกด'
                        : item.category === 'formal'
                        ? 'ภาษาทางการ'
                        : 'ไวยากรณ์'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-100 pt-3 dark:border-slate-800 flex items-center justify-end">
              <button
                onClick={() => onLoadLogIntoEditor(selectedLog)}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>เปิดเอกสารนี้ในตัวแก้ไข</span>
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
