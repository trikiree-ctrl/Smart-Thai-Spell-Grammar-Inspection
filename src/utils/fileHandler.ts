import mammoth from 'mammoth';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';

/**
 * Extract plain text from supported document files (.docx, .pdf, .txt, .md)
 */
export async function extractTextFromFile(file: File): Promise<{ text: string; fileType: string; fileName: string }> {
  const fileName = file.name;
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

  if (extension === '.docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return {
      text: result.value || '',
      fileType: 'docx',
      fileName,
    };
  }

  if (extension === '.pdf') {
    // Basic reliable PDF textual stream extractor
    const arrayBuffer = await file.arrayBuffer();
    const text = await extractTextFromPdfArrayBuffer(arrayBuffer);
    return {
      text: text || 'ไม่สามารถดึงข้อความจากไฟล์ PDF นี้ได้ หรือไฟล์อาจเป็นภาพสแกน (OCR Required)',
      fileType: 'pdf',
      fileName,
    };
  }

  // Fallback for .txt, .md, .csv, etc.
  const text = await file.text();
  return {
    text,
    fileType: extension.replace('.', '') || 'txt',
    fileName,
  };
}

/**
 * Lightweight browser PDF text extractor
 * Parses PDF literal streams, text operators (BT ... ET, Tj, TJ) without external heavyweight dependencies
 */
async function extractTextFromPdfArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  let binaryStr = '';
  // Convert chunks to avoid stack overflow
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binaryStr += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }

  const extractedChunks: string[] = [];

  // Match text objects BT ... ET
  const textObjectRegex = /BT[\s\S]*?ET/g;
  const matches = binaryStr.match(textObjectRegex) || [];

  for (const block of matches) {
    // Match string literals inside parentheses e.g. (Hello World) Tj
    const literalMatches = block.match(/\((?:\\.|[^\\\)])*\)\s*(?:Tj|'|")/g) || [];
    for (const lit of literalMatches) {
      const clean = lit
        .replace(/\)\s*(?:Tj|'|")$/, '')
        .replace(/^\(/, '')
        .replace(/\\([()\\])/g, '$1')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t');
      if (clean.trim()) {
        extractedChunks.push(decodeThaiPdfString(clean));
      }
    }

    // Match array elements inside TJ e.g. [(Hello) -10 (World)] TJ
    const arrayMatches = block.match(/\[(.*?)\]\s*TJ/g) || [];
    for (const arr of arrayMatches) {
      const innerLiterals = arr.match(/\((?:\\.|[^\\\)])*\)/g) || [];
      const combined = innerLiterals
        .map(l => l.slice(1, -1).replace(/\\([()\\])/g, '$1'))
        .join('');
      if (combined.trim()) {
        extractedChunks.push(decodeThaiPdfString(combined));
      }
    }
  }

  if (extractedChunks.length === 0) {
    // Try simple regex search for printable Thai and Latin characters if BT/ET wasn't clean
    const rawMatches = binaryStr.match(/[\u0E00-\u0E7F0-9a-zA-Z\s.,()/:;%#_-]{4,}/g) || [];
    return rawMatches.filter(s => s.trim().length > 5).join('\n');
  }

  return extractedChunks.join('\n');
}

/**
 * Handle Thai TIS-620 / UTF-8 encoding variations often found in Thai PDFs
 */
function decodeThaiPdfString(raw: string): string {
  // If string contains raw byte values in Thai range 0xA1-0xFB (TIS-620)
  try {
    const bytes = new Uint8Array(raw.length);
    let hasTis620 = false;
    for (let i = 0; i < raw.length; i++) {
      const code = raw.charCodeAt(i);
      bytes[i] = code & 0xff;
      if (code >= 0xa1 && code <= 0xfb) {
        hasTis620 = true;
      }
    }
    if (hasTis620) {
      // Decode with TextDecoder windows-874 / tis-620
      const decoder = new TextDecoder('tis-620');
      return decoder.decode(bytes);
    }
  } catch (e) {
    // Fallback to raw string
  }
  return raw;
}

/**
 * Generate and download a formatted Microsoft Word (.docx) document
 */
export async function exportToDocx(
  text: string,
  fileName: string = 'เอกสารที่ผ่านการตรวจคำผิด.docx',
  meta?: { docTitle?: string; date?: string; errorCount?: number }
) {
  const paragraphs = text.split('\n').map(line => {
    return new Paragraph({
      spacing: { line: 360, after: 120 },
      children: [
        new TextRun({
          text: line,
          font: 'Sarabun',
          size: 32, // 16pt in half-points
        }),
      ],
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: meta?.docTitle || 'เอกสารที่ผ่านการตรวจทานและแก้ไขคำผิด',
                font: 'Sarabun',
                bold: true,
                size: 40,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: `ตรวจทานโดย: ThaiDoc Inspector AI | วันที่: ${meta?.date || new Date().toLocaleDateString('th-TH')} | แก้ไขคำผิดแล้ว: ${meta?.errorCount || 0} จุด`,
                font: 'Sarabun',
                italics: true,
                size: 24,
                color: '666666',
              }),
            ],
          }),
          ...paragraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, fileName.endsWith('.docx') ? fileName : `${fileName}.docx`);
}

/**
 * Export plain text file
 */
export function exportToTxt(text: string, fileName: string = 'เอกสารแก้ไข.txt') {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, fileName.endsWith('.txt') ? fileName : `${fileName}.txt`);
}

/**
 * Trigger file download in browser
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
