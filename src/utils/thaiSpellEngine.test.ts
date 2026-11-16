import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runOfflineLexiconSpellCheck,
  applyCorrections,
  estimateThaiWordCount,
  checkThaiVowelSyntax,
  calculateWeeklyStats,
  type AuditLogEntry
} from './thaiSpellEngine.ts';

test('detects official Thai spelling errors and suggests correct words', () => {
  const sample = 'อยากพัฒฯาระบบตรวจจะบคำผิดในเอกสาร พร้อมทั้งปฏิบัติตามกฏหมาย และมีประสพการณ์การทำงาน';
  const result = runOfflineLexiconSpellCheck(sample);

  assert.ok(result.errors.length >= 4, `Expected at least 4 errors, got ${result.errors.length}`);
  
  const foundWords = result.errors.map(e => e.original);
  assert.ok(foundWords.includes('พัฒฯา'), 'Should catch "พัฒฯา"');
  assert.ok(foundWords.includes('ตรวจจะบ'), 'Should catch "ตรวจจะบ"');
  assert.ok(foundWords.includes('กฏหมาย'), 'Should catch "กฏหมาย"');
  assert.ok(foundWords.includes('ประสพการณ์'), 'Should catch "ประสพการณ์"');

  const developError = result.errors.find(e => e.original === 'พัฒฯา');
  assert.equal(developError?.suggestion, 'พัฒนา');

  const lawError = result.errors.find(e => e.original === 'กฏหมาย');
  assert.equal(lawError?.suggestion, 'กฎหมาย');
});

test('detects double vowel and tone syntax anomalies', () => {
  const textWithSyntax = 'สวัสดีเเละยินดีต้อนรับมากๆๆ';
  const syntaxErrors = checkThaiVowelSyntax(textWithSyntax);

  assert.ok(syntaxErrors.length >= 2, 'Should catch double Sara E and repeated Maiyamok');
  
  const aeError = syntaxErrors.find(e => e.original === 'เเ');
  assert.ok(aeError, 'Should find double Sara E');
  assert.equal(aeError?.suggestion, 'แ');

  const yamokError = syntaxErrors.find(e => e.original === 'ๆๆ');
  assert.ok(yamokError, 'Should find repeated Maiyamok');
  assert.equal(yamokError?.suggestion, 'ๆ');
});

test('applyCorrections properly replaces accepted words without mangling text', () => {
  const original = 'โรงเรียนมีกฏหมาย และนักเรียนอนุญาติให้กลับบ้าน';
  const check = runOfflineLexiconSpellCheck(original);

  const errors = check.errors.map(e => ({
    ...e,
    status: 'accepted' as const
  }));

  const fixed = applyCorrections(original, errors);
  assert.equal(fixed, 'โรงเรียนมีกฎหมาย และนักเรียนอนุญาตให้กลับบ้าน');
});

test('applyCorrections respects rejected errors and custom edits', () => {
  const original = 'พัฒฯา เวปไซต์';
  const check = runOfflineLexiconSpellCheck(original);

  // Accept first, reject second
  const errors = check.errors.map((e, index) => ({
    ...e,
    status: index === 0 ? ('accepted' as const) : ('rejected' as const)
  }));

  const fixed = applyCorrections(original, errors);
  assert.equal(fixed, 'พัฒนา เวปไซต์');
});

test('custom word exemption prevents flagging specific terms', () => {
  const original = 'พัฒฯา เป็นชื่อเฉพาะ';
  const check = runOfflineLexiconSpellCheck(original, ['พัฒฯา']);

  const foundDevelop = check.errors.find(e => e.original === 'พัฒฯา');
  assert.equal(foundDevelop, undefined, 'Exempted word should not be flagged as error');
});

test('estimateThaiWordCount calculates reasonable counts', () => {
  const text = 'ระบบตรวจสอบคำผิดภาษาไทยอัตโนมัติ 100%';
  const count = estimateThaiWordCount(text);
  assert.ok(count >= 5 && count <= 15, `Expected count between 5 and 15, got ${count}`);
});

test('calculateWeeklyStats aggregates top errors and categories', () => {
  const mockLogs: AuditLogEntry[] = [
    {
      id: 'log1',
      timestamp: new Date().toISOString(),
      documentName: 'คำสั่งที่1.docx',
      fileType: 'docx',
      originalLength: 200,
      correctedLength: 200,
      totalErrorsFound: 3,
      acceptedFixes: 3,
      rejectedFixes: 0,
      engine: 'gemini-ai',
      benchmarkMs: 45,
      summary: 'ทดสอบ',
      details: [
        { original: 'กฏหมาย', fixed: 'กฎหมาย', category: 'spelling', status: 'accepted' },
        { original: 'ผูกพันธ์', fixed: 'ผูกพัน', category: 'spelling', status: 'accepted' },
        { original: 'อินเตอร์เน็ต', fixed: 'อินเทอร์เน็ต', category: 'formal', status: 'accepted' }
      ]
    },
    {
      id: 'log2',
      timestamp: new Date().toISOString(),
      documentName: 'รายงานประชุม.pdf',
      fileType: 'pdf',
      originalLength: 150,
      correctedLength: 150,
      totalErrorsFound: 2,
      acceptedFixes: 2,
      rejectedFixes: 0,
      engine: 'offline-lexicon',
      benchmarkMs: 12,
      summary: 'ทดสอบ 2',
      details: [
        { original: 'กฏหมาย', fixed: 'กฎหมาย', category: 'spelling', status: 'accepted' },
        { original: 'สังเกตุ', fixed: 'สังเกต', category: 'spelling', status: 'accepted' }
      ]
    }
  ];

  const report = calculateWeeklyStats(mockLogs);
  assert.equal(report.totalDocuments, 2);
  assert.equal(report.totalErrorsDetected, 5);
  assert.equal(report.topFrequentErrors[0].word, 'กฏหมาย');
  assert.equal(report.topFrequentErrors[0].count, 2);
  assert.equal(report.categoryBreakdown.spelling, 4);
  assert.equal(report.categoryBreakdown.formal, 1);
});
