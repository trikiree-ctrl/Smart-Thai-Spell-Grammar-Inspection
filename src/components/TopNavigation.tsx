import React from 'react';
import {
  FileCheck2,
  History,
  BarChart3,
  BookMarked,
  Download,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export type ActiveTab = 'inspector' | 'history' | 'weekly-report' | 'settings';

interface TopNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isOnline: boolean;
  isOfflineForced: boolean;
  onToggleForceOffline: () => void;
  pendingCount?: number;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeTab,
  onTabChange,
  isOnline,
  isOfflineForced,
  onToggleForceOffline,
  pendingCount = 0,
}) => {
  const { isInstallable, install } = usePWAInstall();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Zone (Single text element wordmark) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-sm shadow-indigo-200 dark:shadow-none">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <button
            onClick={() => onTabChange('inspector')}
            className="text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0 dark:text-white">
                ThaiDoc Inspector
              </span>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/70 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900">
                AI & Lexicon v5.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
              ระบบตรวจจับและยืนยันคำผิดในเอกสารราชการ
            </p>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Clean single-line text links with active indicator) */}
        <nav
          aria-label="เมนูหลัก"
          className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium"
        >
          <button
            onClick={() => onTabChange('inspector')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'inspector'
                ? 'bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <FileCheck2 className="h-4 w-4" />
            <span>ตรวจจับคำผิด</span>
            {pendingCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white tabular-nums">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('history')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'history'
                ? 'bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <History className="h-4 w-4" />
            <span>ประวัติการแก้ไข</span>
          </button>

          <button
            onClick={() => onTabChange('weekly-report')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'weekly-report'
                ? 'bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>รายงานสรุปรายสัปดาห์</span>
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'settings'
                ? 'bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <BookMarked className="h-4 w-4" />
            <span>คำศัพท์เฉพาะ & ตั้งค่า</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Status Toggles */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Offline/Online toggle switch */}
          <button
            onClick={onToggleForceOffline}
            title={
              isOfflineForced
                ? 'กำลังบังคับใช้งาน Offline Engine (คลิกเพื่อกลับเป็น Auto/Online)'
                : isOnline
                ? 'เชื่อมต่อ Online Gemini AI พร้อมใช้งาน (คลิกเพื่อสลับเป็น Offline Mode)'
                : 'เครือข่ายออฟไลน์: ทำงานด้วย Local Lexicon'
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
              isOfflineForced || !isOnline
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-900'
            }`}
          >
            {isOfflineForced || !isOnline ? (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                <span>โหมด Offline</span>
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                <span className="hidden sm:inline">โหมด Online AI</span>
                <span className="sm:hidden">Online</span>
              </>
            )}
          </button>

          {/* PWA Install Button if available */}
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>ติดตั้งแอป</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar for touch screens */}
      <div className="flex md:hidden border-t border-slate-100 bg-slate-50/90 px-2 py-1 justify-around text-xs font-medium overflow-x-auto dark:border-slate-800 dark:bg-slate-900/90">
        <button
          onClick={() => onTabChange('inspector')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md ${
            activeTab === 'inspector'
              ? 'bg-white text-indigo-700 shadow-xs font-semibold dark:bg-slate-800 dark:text-indigo-300'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <FileCheck2 className="h-3.5 w-3.5" />
          <span>ตรวจคำผิด</span>
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-rose-500 px-1 text-[10px] text-white">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onTabChange('history')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md ${
            activeTab === 'history'
              ? 'bg-white text-indigo-700 shadow-xs font-semibold dark:bg-slate-800 dark:text-indigo-300'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>ประวัติ</span>
        </button>
        <button
          onClick={() => onTabChange('weekly-report')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md ${
            activeTab === 'weekly-report'
              ? 'bg-white text-indigo-700 shadow-xs font-semibold dark:bg-slate-800 dark:text-indigo-300'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>รายงานสัปดาห์</span>
        </button>
        <button
          onClick={() => onTabChange('settings')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md ${
            activeTab === 'settings'
              ? 'bg-white text-indigo-700 shadow-xs font-semibold dark:bg-slate-800 dark:text-indigo-300'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <BookMarked className="h-3.5 w-3.5" />
          <span>ตั้งค่า</span>
        </button>
      </div>
    </header>
  );
};
