import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { runOfflineLexiconSpellCheck, estimateThaiWordCount, applyCorrections, type SpellError } from './src/utils/thaiSpellEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI client if GEMINI_API_KEY is present
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Primary Spell Check Endpoint (Online Gemini AI + Fallback Offline Lexicon)
app.post('/api/spell-check', async (req: Request, res: Response) => {
  const t0 = performance.now();
  const { text, documentName, customWords = [], preferEngine = 'auto' } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required for spell checking' });
  }

  const wordCount = estimateThaiWordCount(text);
  const docTitle = documentName || 'เอกสารไม่ระบุชื่อ';

  // If user requested strictly offline or no Gemini key is available, run offline engine
  if (preferEngine === 'offline' || !aiClient || !process.env.GEMINI_API_KEY) {
    const offlineResult = runOfflineLexiconSpellCheck(text, customWords);
    offlineResult.documentName = docTitle;
    return res.json(offlineResult);
  }

  // Attempt Gemini AI Spell Checking
  try {
    const systemPrompt = `คุณคือผู้เชี่ยวชาญการตรวจทานภาษาไทยและบรรณาธิการเอกสารราชการระดับสูง (Senior Thai Proofreader & EdTech Systems Strategist)
หน้าที่ของคุณคือตรวจสอบข้อผิดพลาดในข้อความภาษาไทยอย่างละเอียดรอบคอบ ประกอบด้วย:
1. การสะกดคำผิด (spelling) เช่น พัฒฯา -> พัฒนา, ตรวจจะบ -> ตรวจสอบ, กฎหมาย vs กฏหมาย, ผูกพัน vs ผูกพันธ์, อนุญาต vs อนุญาติ
2. ไวยากรณ์และบริบท (grammar) เช่น คะ/ค่ะ, รูปประโยคกำกวม, คำขาด
3. ระดับภาษาทางการและคำทับศัพท์ (formal) เช่น การใช้ศัพท์บัญญัติราชบัณฑิตยสภา (เช่น ดิจิทัล, เว็บไซต์, แอปพลิเคชัน), คำไม่สุภาพในหนังสือราชการ
4. วรรคตอนและเครื่องหมาย (punctuation) เช่น ไม้ยมกซ้ำซ้อน (ๆๆ), สระหรือวรรณยุกต์เบิ้ล

กฎสำคัญ:
- ห้ามดัดแปลงแก้ไขเนื้อหาที่ถูกต้องอยู่แล้ว
- ระบุตำแหน่งคำเดิม (original), คำที่แนะนำ (suggestion), เหตุผลสั้นๆ ชัดเจน (reason), หมวดหมู่ (spelling/grammar/formal/punctuation), และระดับความรุนแรง (severity: high/medium/low)
- ให้ข้อความฉบับแก้ไขสมบูรณ์ทั้งหมด (fullCorrectedText) มาด้วย`;

    const userPrompt = `กรุณาตรวจสอบข้อความเอกสารภาษาไทยต่อไปนี้:
"""
${text}
"""
คำที่ผู้ใช้ยกเว้น (ไม่ต้องแจ้งเตือน): ${customWords.join(', ') || 'ไม่มี'}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            errors: {
              type: Type.ARRAY,
              description: 'รายการคำผิดที่ตรวจพบ',
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING, description: 'คำหรือข้อความเดิมที่ผิด' },
                  suggestion: { type: Type.STRING, description: 'คำที่ถูกต้องหรือแนะนำ' },
                  reason: { type: Type.STRING, description: 'คำอธิบายสาเหตุและหลักภาษา' },
                  category: {
                    type: Type.STRING,
                    description: 'หมวดหมู่ข้อผิดพลาด: spelling, grammar, formal, punctuation',
                  },
                  severity: {
                    type: Type.STRING,
                    description: 'ความรุนแรง: high, medium, low',
                  },
                },
                required: ['original', 'suggestion', 'reason', 'category'],
              },
            },
            fullCorrectedText: {
              type: Type.STRING,
              description: 'ข้อความฉบับแก้ไขสมบูรณ์ที่ผ่านการแก้ไขข้อผิดพลาดทั้งหมดแล้ว',
            },
          },
          required: ['errors', 'fullCorrectedText'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    const rawErrors = parsedJson.errors || [];

    // Map errors with calculated indices and IDs
    const mappedErrors: SpellError[] = [];
    let searchCursor = 0;

    for (let i = 0; i < rawErrors.length; i++) {
      const item = rawErrors[i];
      if (!item.original) continue;

      let foundIdx = text.indexOf(item.original, searchCursor);
      if (foundIdx === -1) {
        foundIdx = text.indexOf(item.original);
      }

      const startIndex = foundIdx !== -1 ? foundIdx : 0;
      const endIndex = startIndex + item.original.length;
      if (foundIdx !== -1) {
        searchCursor = endIndex;
      }

      mappedErrors.push({
        id: `ai_${i}_${Date.now()}`,
        original: item.original,
        suggestion: item.suggestion || item.original,
        reason: item.reason || 'ตรวจพบความผิดปกติทางภาษา',
        category: (['spelling', 'grammar', 'formal', 'punctuation'].includes(item.category)
          ? item.category
          : 'spelling') as SpellError['category'],
        startIndex,
        endIndex,
        status: 'pending',
        severity: (['high', 'medium', 'low'].includes(item.severity) ? item.severity : 'medium') as SpellError['severity'],
      });
    }

    // Combine with offline syntax errors (like double vowels) to ensure nothing is missed
    const syntaxErrors = runOfflineLexiconSpellCheck(text, customWords).errors;
    for (const syn of syntaxErrors) {
      const alreadyHas = mappedErrors.some(m => m.startIndex === syn.startIndex || m.original === syn.original);
      if (!alreadyHas) {
        mappedErrors.push(syn);
      }
    }

    mappedErrors.sort((a, b) => a.startIndex - b.startIndex);

    const benchmarkMs = Math.round((performance.now() - t0) * 100) / 100;
    const spellingCount = mappedErrors.filter(e => e.category === 'spelling').length;
    const grammarCount = mappedErrors.filter(e => e.category === 'grammar').length;
    const formalCount = mappedErrors.filter(e => e.category === 'formal').length;
    const punctuationCount = mappedErrors.filter(e => e.category === 'punctuation').length;

    const accuracyScore = wordCount > 0
      ? Math.max(0, Math.round(((wordCount - mappedErrors.length) / wordCount) * 100))
      : 100;

    const correctedText = parsedJson.fullCorrectedText || applyCorrections(text, mappedErrors.map(e => ({ ...e, status: 'accepted' })));

    return res.json({
      id: `chk_${Date.now()}_ai`,
      documentName: docTitle,
      originalText: text,
      correctedText,
      errors: mappedErrors,
      stats: {
        totalWords: wordCount,
        errorCount: mappedErrors.length,
        spellingCount,
        grammarCount,
        formalCount,
        accuracyScore,
      },
      benchmarkMs,
      engineUsed: 'gemini-ai',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    const errorMsg = String(err?.message || err || '');
    const isBillingError =
      err?.status === 403 ||
      errorMsg.includes('PERMISSION_DENIED') ||
      errorMsg.includes('free tier is not available') ||
      errorMsg.includes('billing');

    if (isBillingError) {
      console.log('Notice: Cloud project requires billing for Gemini API. Falling back to built-in Offline Lexicon Engine.');
    } else {
      console.log('Notice: Gemini API fallback triggered:', errorMsg.slice(0, 100));
    }

    // Fallback gracefully to offline lexicon
    const fallbackResult = runOfflineLexiconSpellCheck(text, customWords);
    fallbackResult.documentName = docTitle;
    fallbackResult.benchmarkMs = Math.round((performance.now() - t0) * 100) / 100;
    return res.json({
      ...fallbackResult,
      apiNotice: isBillingError ? 'BILLING_REQUIRED' : 'NORMAL',
    });
  }
});

async function main() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

main().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
