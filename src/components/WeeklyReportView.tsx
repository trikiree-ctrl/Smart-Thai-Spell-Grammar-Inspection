import React from 'react';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  TrendingUp,
  Award,
  BookOpen,
  Building2,
  Sparkles,
} from 'lucide-react';
import { type WeeklyReportData } from '../utils/thaiSpellEngine';

interface WeeklyReportViewProps {
  reportData: WeeklyReportData;
  departmentName: string;
}

export const WeeklyReportView: React.FC<WeeklyReportViewProps> = ({
  reportData,
  departmentName,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Report Header Card */}
      <section
        aria-label="หัวข้อรายงานสรุปรายสัปดาห์"
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                รายงานสรุปรายสัปดาห์ (Weekly Executive Audit Bulletin)
              </span>
              <span className="text-xs text-slate-500 font-mono">
                รอบสัปดาห์: {reportData.weekRange}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              รายงานผลการตรวจจับคำผิดและคุณภาพเอกสารราชการ
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Building2 className="h-3.5 w-3.5" />
              <span>{departmentName}</span>
              <span aria-hidden="true">·</span>
              <span>ระบบตรวจสอบอัตโนมัติมาตรฐาน สพฐ.</span>
            </div>
          </div>

          <div className="flex items-center gap-3 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>พิมพ์รายงาน / บันทึก PDF</span>
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid KPI Cards (4 Cards) */}
      <section
        aria-label="ตัวชี้วัดประสิทธิภาพรายสัปดาห์"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* KPI 1 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">เอกสารที่ตรวจทั้งหมด</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums dark:text-white">
              {reportData.totalDocuments}
            </span>
            <span className="text-xs text-slate-500">ฉบับ</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            เฉลี่ย {Math.max(1, Math.round(reportData.totalDocuments / 7))} ฉบับต่อวัน
          </p>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">จำนวนคำที่ตรวจทาน</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums dark:text-white">
              {reportData.totalWordsChecked.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">คำ</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">ครอบคลุมคำศัพท์ทั้งไทยและอังกฤษ</p>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">คำผิดที่ตรวจจับได้</span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
              {reportData.totalErrorsDetected}
            </span>
            <span className="text-xs text-slate-500">จุด</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">ได้รับการแก้ไขและยืนยันแล้ว</p>
        </div>

        {/* KPI 4 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">ดัชนีความถูกต้องเฉลี่ย</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
              {reportData.avgAccuracy}%
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              เกณฑ์ดีเยี่ยม
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">ผ่านเกณฑ์มาตรฐานเอกสารราชการ</p>
        </div>
      </section>

      {/* Bento Grid Main Section: Top 10 Frequent Typos + Error Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Top 10 Most Frequent Thai Typos (7 cols) */}
        <section
          aria-label="คำผิดยอดนิยมประจำสัปดาห์"
          className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                ๑๐ คำผิดที่พบบ่อยสูงสุดในสัปดาห์นี้ (Top 10 Thai Typos)
              </h3>
              <p className="text-xs text-slate-500">
                สถิติสะสมจากเอกสารทั้งหมด เพื่อนำไปใช้ปรับปรุงคลังความรู้ของบุคลากร
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </div>

          <div className="mt-4 overflow-x-auto">
            {reportData.topFrequentErrors.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                ยังไม่มีข้อมูลความถี่คำผิดในรอบสัปดาห์นี้
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-3 py-2 font-semibold">อันดับ</th>
                    <th className="px-3 py-2 font-semibold">คำที่มักเขียนผิด</th>
                    <th className="px-3 py-2 font-semibold">คำที่ถูกต้องตามหลักภาษา</th>
                    <th className="px-3 py-2 font-semibold text-center">ความถี่</th>
                    <th className="px-3 py-2 font-semibold">หมวดหมู่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportData.topFrequentErrors.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 font-mono text-slate-400 font-semibold">
                        #{idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-rose-600 line-through">
                        {item.word}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-emerald-700 dark:text-emerald-300">
                        {item.correction}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {item.count} ครั้ง
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {item.category === 'spelling'
                            ? 'ตัวสะกด'
                            : item.category === 'formal'
                            ? 'ทางการ/ทับศัพท์'
                            : 'ไวยากรณ์'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Right Column: Error Category Breakdown & Daily Trend (5 cols) */}
        <section
          aria-label="การกระจายตัวของประเภทข้อผิดพลาด"
          className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              สัดส่วนประเภทข้อผิดพลาด (Category Distribution)
            </h3>
            <p className="text-xs text-slate-500">วิเคราะห์ตามหลักภาษาไทยและระเบียบสารบรรณ</p>
          </div>

          {/* Progress bar breakdown */}
          <div className="space-y-3 text-xs">
            {/* Category: Spelling */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  ๑. ตัวสะกดผิดและวรรณยุกต์
                </span>
                <span className="font-mono font-semibold text-rose-600">
                  {reportData.categoryBreakdown.spelling} จุด
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (reportData.categoryBreakdown.spelling /
                        Math.max(1, reportData.totalErrorsDetected)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Category: Formal */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  ๒. คำทับศัพท์และศัพท์ราชการไม่เป็นทางการ
                </span>
                <span className="font-mono font-semibold text-indigo-600">
                  {reportData.categoryBreakdown.formal} จุด
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (reportData.categoryBreakdown.formal /
                        Math.max(1, reportData.totalErrorsDetected)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Category: Grammar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  ๓. ไวยากรณ์และรูปประโยคสับสน
                </span>
                <span className="font-mono font-semibold text-amber-600">
                  {reportData.categoryBreakdown.grammar} จุด
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (reportData.categoryBreakdown.grammar /
                        Math.max(1, reportData.totalErrorsDetected)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Daily Activity Sparkline / Histogram */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              กิจกรรมการตรวจทานรายวัน (๗ วันล่าสุด)
            </h4>
            <div className="grid grid-cols-7 gap-1 text-center">
              {reportData.dailyActivity.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="h-16 w-full bg-slate-100 rounded-t flex items-end justify-center pb-1 dark:bg-slate-800">
                    <div
                      className="w-4/5 bg-indigo-500 rounded-t transition-all"
                      style={{
                        height: `${Math.min(100, Math.max(15, day.documentsCount * 25))}%`,
                      }}
                      title={`${day.date}: ${day.documentsCount} ฉบับ, พบคำผิด ${day.errorsCount} จุด`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 truncate max-w-full">
                    {day.date.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Executive Recommendations & Policy Guidance */}
      <section
        aria-label="ข้อเสนอแนะเชิงนโยบายเพื่อปรับปรุงคุณภาพเอกสาร"
        className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/30 p-5 sm:p-6 shadow-xs dark:border-indigo-900/40 dark:from-indigo-950/20 dark:via-slate-900 dark:to-indigo-950/10"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-600 p-2 text-white shadow-xs shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              ข้อเสนอแนะเชิงนโยบายเพื่อปรับปรุงคุณภาพงานสารบรรณ (Executive Recommendations)
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {reportData.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold shrink-0">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
