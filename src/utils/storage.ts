import { type AuditLogEntry } from './thaiSpellEngine';

const STORAGE_KEYS = {
  AUDIT_LOGS: 'thaidoc_audit_logs_v1',
  CUSTOM_WORDS: 'thaidoc_custom_words_v1',
  PREFERENCES: 'thaidoc_preferences_v1',
};

export interface AppPreferences {
  preferEngine: 'auto' | 'ai' | 'offline';
  autoApplyHighSeverity: boolean;
  highlightCategoryColors: boolean;
  showSmartHUD: boolean;
  departmentName: string;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  preferEngine: 'auto',
  autoApplyHighSeverity: false,
  highlightCategoryColors: true,
  showSmartHUD: true,
  departmentName: 'กลุ่มงานสารบรรณและเทคโนโลยีสารสนเทศ (สพฐ.)',
};

// Seed sample historical logs representing realistic usage across the current week
const SEED_LOGS: AuditLogEntry[] = [
  {
    id: 'log_seed_001',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    documentName: 'บันทึกข้อความ_ขออนุมัติจัดโครงการพัฒนาครู.docx',
    fileType: 'docx',
    originalLength: 540,
    correctedLength: 538,
    totalErrorsFound: 5,
    acceptedFixes: 5,
    rejectedFixes: 0,
    engine: 'gemini-ai',
    benchmarkMs: 42.5,
    summary: 'บันทึกขออนุมัติโครงการพัฒนาครูผู้สอน ตรวจพบคำผิดตัวสะกด 3 จุด และคำทับศัพท์ 2 จุด',
    details: [
      { original: 'พัฒฯา', fixed: 'พัฒนา', category: 'spelling', status: 'accepted' },
      { original: 'สัมนา', fixed: 'สัมมนา', category: 'spelling', status: 'accepted' },
      { original: 'อนุมัติต', fixed: 'อนุมัติ', category: 'spelling', status: 'accepted' },
      { original: 'โปรเจค', fixed: 'โปรเจกต์', category: 'formal', status: 'accepted' },
      { original: 'อัพเดท', fixed: 'อัปเดต', category: 'formal', status: 'accepted' },
    ],
  },
  {
    id: 'log_seed_002',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    documentName: 'ระเบียบวาระการประชุมคณะกรรมการสถานศึกษา.pdf',
    fileType: 'pdf',
    originalLength: 820,
    correctedLength: 818,
    totalErrorsFound: 6,
    acceptedFixes: 6,
    rejectedFixes: 0,
    engine: 'offline-lexicon',
    benchmarkMs: 14.8,
    summary: 'วาระการประชุม ตรวจพบการใช้ตัวอักษร ฎ/ฏ สับสน และคำว่าผูกพันผิด',
    details: [
      { original: 'กฏหมาย', fixed: 'กฎหมาย', category: 'spelling', status: 'accepted' },
      { original: 'กฏเกณฑ์', fixed: 'กฎเกณฑ์', category: 'spelling', status: 'accepted' },
      { original: 'ผูกพันธ์', fixed: 'ผูกพัน', category: 'spelling', status: 'accepted' },
      { original: 'ปรากฎ', fixed: 'ปรากฏ', category: 'spelling', status: 'accepted' },
      { original: 'สังเกตุ', fixed: 'สังเกต', category: 'spelling', status: 'accepted' },
      { original: 'กะทัดรัด', fixed: 'กะทัดรัด', category: 'spelling', status: 'accepted' },
    ],
  },
  {
    id: 'log_seed_003',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    documentName: 'หนังสือแจ้งเวียนนโยบายการศึกษาดิจิทัล.docx',
    fileType: 'docx',
    originalLength: 1200,
    correctedLength: 1196,
    totalErrorsFound: 4,
    acceptedFixes: 4,
    rejectedFixes: 0,
    engine: 'gemini-ai',
    benchmarkMs: 38.2,
    summary: 'หนังสือแจ้งเวียน ตรวจพบคำศัพท์เทคโนโลยีที่เขียนไม่ตรงตามราชบัณฑิตยสภา',
    details: [
      { original: 'ดิจิตอล', fixed: 'ดิจิทัล', category: 'formal', status: 'accepted' },
      { original: 'อินเตอร์เน็ต', fixed: 'อินเทอร์เน็ต', category: 'formal', status: 'accepted' },
      { original: 'เว็ปไซต์', fixed: 'เว็บไซต์', category: 'spelling', status: 'accepted' },
      { original: 'ตรวจจะบ', fixed: 'ตรวจสอบ', category: 'spelling', status: 'accepted' },
    ],
  },
];

// Sample demo documents for quick 1-click test
export const SAMPLE_DOCUMENTS = [
  {
    title: 'ตัวอย่างที่ 1: คำสั่งราชการและบันทึกข้อความ (มีคำผิดยอดนิยม)',
    content: `เรื่อง ขออนุมัติตจัดโครงการพัฒฯาระบบสารสนเทศเพื่อการศึกษา

เรียน อธิการบดี / ผู้อำนวยการเขตพื้นที่การศึกษา

ตามที่ฝ่ายเทคโนโลยีสารสนเทศได้เสนอโปรเจคการตรวจจะบและปรับปรุงฐานข้อมูล เพื่อให้สอดคล้องกับกฏหมายและกฏระเบียบของทางราชการนั้น ฝ่ายงานได้ประสพการณ์จากโครงการเดิม พบว่าระบบยังมีส่วนที่ต้องอัพเดทให้ทันสมัยต่อยุคดิจิตอล

ในการนี้ เพื่อให้เกิดความผูกพันธ์อันดีระหว่างบุคลากร และให้การจัดงานสัมนาสัมฤทธิ์ผล จึงใคร่ขออนุญาติตจัดกิจกรรมผ่านอินเตอร์เน็ต และประชาสัมพันข้อมูลบนเว็ปไซต์หลักของหน่วยงาน พร้อมทั้งสังเกตุผลลัพธ์อย่างใกล้ชิด

จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติต และลงนามในคำสั่ง`,
  },
  {
    title: 'ตัวอย่างที่ 2: ร่างข้อตกลงความร่วมมือและการปฏิบัติราชการ (MOU)',
    content: `บันทึกข้อตกลงความร่วมมือ (MOU)
การพัฒฯาและส่งเสริมการใช้เทคโนโลยีปัญญาประดิษฐ์ในสถานศึกษา

ข้อ ๑. ทั้งสองฝ่ายตกลงที่จะร่วมมือกันตามกฏหมายและกฏเกณฑ์แห่งระเบียบกระทรวงศึกษาธิการ
ข้อ ๒. โครงการนี้มีวัตถุประสงค์เพื่อเปิดโอกาศให้ครูและบุคลากรทางการศึกษาได้มีประสพการณ์ในการใช้เครื่องมือตรวจจะบเอกสารอัตโนมัติ
ข้อ ๓. ผู้มีสิทธิ์เข้าร่วมจะต้องได้รับความยินยอมและอนุญาตจากผู้บังคับบัญชาตามสายงาน
ข้อ ๔. การประชาสัมพันข้อมูลข่าวสารจะดำเนินการผ่านแอพพลิเคชั่นและเว็ปไซต์อย่างเป็นทางการ

ลงชื่อผู้มีอำนาจลงนามและเซ็นต์ชื่อรับรอง`,
  },
  {
    title: 'ตัวอย่างที่ 3: บทความวิชาการและการสื่อสารทั่วไป',
    content: `บทความ: ความสำคัญของภาษาไทยในยุคดิจิตอล

ในยุคโลกาภิวัฒน์ การติดต่อสื่อสารผ่านเครือข่ายอินเตอร์เน็ตและแอพพลิเคชั่นต่างๆ มีความรวดเร็วเป็นอย่างยิ่ง เเต่สิ่งที่เรามักสังเกตุเห็นคือการเขียนสะกดคำผิดๆๆ อาทิเช่น การใช้คำว่า นะค่ะ หรือ คะนะ ซึ่งผิดหลักไวยากรณ์

นอกจากนี้ การพิมพ์คำว่า รสชาด, ศรีษะ, หรือ กระเพรา ก็เป็นสิ่งที่พบเห็นได้บ่อยครั้ง หากเราไม่ช่วยกันทนุถนอมภาษาประจำชาติไว้ เอกลักษณ์ทางวัฒนธรรมก็อาจย่อหย่อนลงไปในที่สุด`,
  },
];

export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(SEED_LOGS));
      return SEED_LOGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return SEED_LOGS;
  }
}

export function saveAuditLog(entry: AuditLogEntry): AuditLogEntry[] {
  try {
    const logs = getAuditLogs();
    const updated = [entry, ...logs.filter(l => l.id !== entry.id)].slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save audit log:', e);
    return [];
  }
}

export function deleteAuditLog(id: string): AuditLogEntry[] {
  try {
    const logs = getAuditLogs();
    const updated = logs.filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export function clearAuditLogs(): void {
  localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
}

export function getCustomWords(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_WORDS);
    if (!raw) return ['สพฐ.', 'ศธ.', 'สพป.', 'สพม.', 'กคศ.'];
    return JSON.parse(raw);
  } catch (e) {
    return ['สพฐ.', 'ศธ.', 'สพป.', 'สพม.', 'กคศ.'];
  }
}

export function saveCustomWord(word: string): string[] {
  const words = getCustomWords();
  const trimmed = word.trim();
  if (trimmed && !words.includes(trimmed)) {
    const updated = [...words, trimmed];
    localStorage.setItem(STORAGE_KEYS.CUSTOM_WORDS, JSON.stringify(updated));
    return updated;
  }
  return words;
}

export function removeCustomWord(word: string): string[] {
  const words = getCustomWords();
  const updated = words.filter(w => w !== word);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_WORDS, JSON.stringify(updated));
  return updated;
}

export function getPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: Partial<AppPreferences>): AppPreferences {
  try {
    const current = getPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return DEFAULT_PREFERENCES;
  }
}
