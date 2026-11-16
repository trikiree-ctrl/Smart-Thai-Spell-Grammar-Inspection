import React, { useState } from 'react';
import {
  BookMarked,
  Plus,
  Trash2,
  CheckCircle,
  Sliders,
  Building,
  Info,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { type AppPreferences } from '../utils/storage';

interface DictionarySettingsViewProps {
  customWords: string[];
  onAddWord: (word: string) => void;
  onRemoveWord: (word: string) => void;
  preferences: AppPreferences;
  onSavePreferences: (prefs: Partial<AppPreferences>) => void;
}

export const DictionarySettingsView: React.FC<DictionarySettingsViewProps> = ({
  customWords,
  onAddWord,
  onRemoveWord,
  preferences,
  onSavePreferences,
}) => {
  const [newWordInput, setNewWordInput] = useState('');
  const [departmentInput, setDepartmentInput] = useState(preferences.departmentName);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleAddCustomWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordInput.trim()) return;
    onAddWord(newWordInput.trim());
    setNewWordInput('');
  };

  const handleSaveDepartment = () => {
    onSavePreferences({ departmentName: departmentInput });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section
        aria-label="ตั้งค่าคลังคำศัพท์และระบบ"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
              การปรับแต่งพจนานุกรมและพฤติกรรมระบบ
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            คลังคำศัพท์เฉพาะองค์กร & การตั้งค่าเครื่องมือ
          </h2>
          <p className="text-xs text-slate-500">
            กำหนดคำศัพท์เฉพาะทาง ชื่อบุคคล หรือคำย่อของหน่วยงานที่ไม่ต้องการให้ระบบแจ้งเตือนว่าผิด
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Custom Lexicon Whitelist (7 cols) */}
        <section
          aria-label="จัดการคำยกเว้นขององค์กร"
          className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                คำศัพท์ยกเว้นขององค์กร ({customWords.length} คำ)
              </h3>
            </div>
            <span className="text-xs text-slate-500">บันทึกบนเครื่องของคุณ</span>
          </div>

          {/* Add Word Form */}
          <form onSubmit={handleAddCustomWord} className="flex gap-2">
            <input
              type="text"
              value={newWordInput}
              onChange={e => setNewWordInput(e.target.value)}
              placeholder="พิมพ์คำศัพท์เฉพาะ เช่น ชื่อโครงการ, คำย่อ..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={!newWordInput.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>เพิ่มคำ</span>
            </button>
          </form>

          {/* Words List */}
          <div className="flex flex-wrap gap-2 pt-2 max-h-[360px] overflow-y-auto">
            {customWords.map(word => (
              <span
                key={word}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <span>{word}</span>
                <button
                  type="button"
                  onClick={() => onRemoveWord(word)}
                  className="rounded p-0.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                  title="ลบคำนี้ออกจากรายการยกเว้น"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Right Column: Engine Preferences & Department (5 cols) */}
        <section
          aria-label="การตั้งค่าเครื่องยนต์และการแสดงผล"
          className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              การตั้งค่าเครื่องยนต์และหน่วยงาน
            </h3>
          </div>

          {/* Department Name for Reports */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              ชื่อหน่วยงาน / องค์กร (สำหรับหัวรายงานและเอกสาร Word):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={departmentInput}
                onChange={e => setDepartmentInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleSaveDepartment}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {savedMessage ? 'บันทึกแล้ว!' : 'บันทึก'}
              </button>
            </div>
          </div>

          {/* Engine Selection Strategy */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              กลยุทธ์เครื่องยนต์ตรวจคำผิดเริ่มต้น:
            </label>
            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-2.5 cursor-pointer hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
                <input
                  type="radio"
                  name="engineChoice"
                  checked={preferences.preferEngine === 'auto'}
                  onChange={() => onSavePreferences({ preferEngine: 'auto' })}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    อัตโนมัติ (Online Gemini AI + สลับ Offline เมื่อตัดการเชื่อมต่อ)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    แนะนำ: ประมวลผลด้วยโมเดล Gemini 4 Hydrogen และสลับใช้ Offline Lexicon ทันทีที่ไม่มีเน็ต
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-2.5 cursor-pointer hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
                <input
                  type="radio"
                  name="engineChoice"
                  checked={preferences.preferEngine === 'offline'}
                  onChange={() => onSavePreferences({ preferEngine: 'offline' })}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    ออฟไลน์เสมอ (Built-in Thai Lexicon 100%)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    ทำงานรวดเร็วสูงสุด (&lt; 0.05 วินาที) ไม่ส่งข้อมูลออกนอกเครื่อง ความเป็นส่วนตัวสูงสุด
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Telemetry HUD toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs dark:border-slate-800">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              แสดงป้ายวัดเวลา Smart HUD มุมล่างขวา
            </span>
            <input
              type="checkbox"
              checked={preferences.showSmartHUD}
              onChange={e => onSavePreferences({ showSmartHUD: e.target.checked })}
              className="rounded text-indigo-600"
            />
          </div>
        </section>
      </div>
    </div>
  );
};
