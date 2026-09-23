import { existsSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import arabicReshaper from 'arabic-persian-reshaper';
import bidiFactory from 'bidi-js';
import type { BillingCycle } from '@prisma/client';
import { MAIL_INVOICE_TAX_IQD } from './mail-plan-limits.config';

export type MailInvoiceTotals = {
  subtotalIqd: number;
  taxIqd: number;
  totalIqd: number;
};

/** Flat tax on every Mail invoice: subtotal + MAIL_INVOICE_TAX_IQD. */
export function mailInvoiceTotals(amountIqd: number): MailInvoiceTotals {
  const subtotalIqd = Math.max(0, Math.floor(amountIqd));
  const taxIqd = MAIL_INVOICE_TAX_IQD;
  return {
    subtotalIqd,
    taxIqd,
    totalIqd: subtotalIqd + taxIqd,
  };
}

const COLORS = {
  ink: '#111111',
  muted: '#6b7280',
  faint: '#9ca3af',
  border: '#e5e7eb',
};

const PAGE_MARGIN = 48;

const FONT = {
  regular: 'NotoSansArabic-Regular',
  bold: 'NotoSansArabic-Bold',
  latin: 'IBMPlexSans-Regular',
  latinBold: 'IBMPlexSans-SemiBold',
} as const;

const bidi = bidiFactory();

function resolveFontPath(fileName: string): string | null {
  const candidates = [
    join(__dirname, `../../assets/fonts/${fileName}.ttf`),
    join(process.cwd(), `dist/assets/fonts/${fileName}.ttf`),
    join(process.cwd(), `src/assets/fonts/${fileName}.ttf`),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function registerInvoiceFonts(doc: PDFKit.PDFDocument): void {
  for (const name of Object.values(FONT)) {
    const path = resolveFontPath(name);
    if (path) doc.registerFont(name, path);
  }
}

function hasFont(name: string): boolean {
  return Boolean(resolveFontPath(name));
}

function setArabicFont(
  doc: PDFKit.PDFDocument,
  weight: 'regular' | 'bold' = 'regular',
): void {
  const name = weight === 'bold' ? FONT.bold : FONT.regular;
  if (hasFont(name)) {
    doc.font(name);
    return;
  }
  const latin = weight === 'bold' ? FONT.latinBold : FONT.latin;
  if (hasFont(latin)) {
    doc.font(latin);
    return;
  }
  doc.font(weight === 'bold' ? 'Helvetica-Bold' : 'Helvetica');
}

function setLatinFont(
  doc: PDFKit.PDFDocument,
  weight: 'regular' | 'bold' = 'regular',
): void {
  const name = weight === 'bold' ? FONT.latinBold : FONT.latin;
  if (hasFont(name)) {
    doc.font(name);
    return;
  }
  doc.font(weight === 'bold' ? 'Helvetica-Bold' : 'Helvetica');
}

/** Shape + reorder Arabic for PDFKit visual drawing. */
function ar(text: string): string {
  if (!text) return '';
  const reshaped = arabicReshaper.ArabicShaper.convertArabic(text);
  const embeddingLevels = bidi.getEmbeddingLevels(reshaped, 'rtl');
  return bidi.getReorderedString(reshaped, embeddingLevels);
}

export interface MailInvoicePdfInput {
  invoiceNumber: string;
  issuedAt: Date;
  workspaceName: string;
  workspaceDomain: string | null;
  contactEmail: string | null;
  /** Display name for العميل (falls back to workspaceName). */
  customerName?: string | null;
  planName: string;
  billingCycle: BillingCycle;
  mailboxCount: number;
  amountIqd: number;
  periodStart: Date;
  periodEnd: Date;
  paidAt: Date | null;
  qasehPaymentId: string | null;
  paymentRowId: string | null;
  status: string;
  note?: string;
  /** Public URL encoded in QR (invoice download). */
  proofUrl?: string | null;
  /** Outbound pack line item instead of seat subscription. */
  isPack?: boolean;
  packEmails?: number | null;
}

function formatIqdNumber(amount: number): string {
  return new Intl.NumberFormat('en-IQ').format(Math.max(0, Math.floor(amount)));
}

function formatIqdAr(amount: number): string {
  return ar(`${formatIqdNumber(amount)} دينار عراقي`);
}

function formatInvoiceDate(value: Date | null | undefined): string {
  if (!value || Number.isNaN(value.getTime())) return '—';
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function drawRule(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  color = COLORS.border,
) {
  doc
    .save()
    .strokeColor(color)
    .lineWidth(0.8)
    .moveTo(x, y)
    .lineTo(x + width, y)
    .stroke()
    .restore();
}

function textRtl(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  opts?: { bold?: boolean; size?: number; color?: string },
) {
  setArabicFont(doc, opts?.bold ? 'bold' : 'regular');
  doc
    .fontSize(opts?.size ?? 10)
    .fillColor(opts?.color ?? COLORS.ink)
    .text(ar(text), x, y, { width, align: 'right', lineBreak: false });
}

function textShaped(
  doc: PDFKit.PDFDocument,
  shaped: string,
  x: number,
  y: number,
  width: number,
  opts?: { bold?: boolean; size?: number; color?: string },
) {
  setArabicFont(doc, opts?.bold ? 'bold' : 'regular');
  doc
    .fontSize(opts?.size ?? 10)
    .fillColor(opts?.color ?? COLORS.ink)
    .text(shaped, x, y, { width, align: 'right', lineBreak: false });
}

function textLtr(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  opts?: {
    bold?: boolean;
    size?: number;
    color?: string;
    align?: 'left' | 'right' | 'center';
  },
) {
  setLatinFont(doc, opts?.bold ? 'bold' : 'regular');
  doc
    .fontSize(opts?.size ?? 10)
    .fillColor(opts?.color ?? COLORS.ink)
    .text(text, x, y, {
      width,
      align: opts?.align ?? 'left',
      lineBreak: false,
    });
}

export async function renderMailInvoicePdf(
  input: MailInvoicePdfInput,
): Promise<Buffer> {
  let qrPng: Buffer | null = null;
  if (input.proofUrl) {
    try {
      qrPng = await QRCode.toBuffer(input.proofUrl, {
        type: 'png',
        width: 110,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
    } catch {
      qrPng = null;
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      registerInvoiceFonts(doc);

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - PAGE_MARGIN * 2;
      const left = PAGE_MARGIN;
      const right = PAGE_MARGIN + contentWidth;
      let y = PAGE_MARGIN;

      const { subtotalIqd, taxIqd, totalIqd } = mailInvoiceTotals(
        input.amountIqd,
      );
      const seats = Math.max(1, input.mailboxCount);
      const isPack = Boolean(input.isPack);
      const qty = isPack ? 1 : seats;
      const unitPrice = Math.floor(subtotalIqd / qty);
      const periodStart = formatInvoiceDate(input.periodStart);
      const periodEnd = formatInvoiceDate(input.periodEnd);
      const issued = formatInvoiceDate(input.issuedAt);
      const paid = formatInvoiceDate(input.paidAt);
      const customer =
        (input.customerName || input.workspaceName || '').trim() || '—';
      const invoiceShort = input.invoiceNumber.replace(/^RM-/, '');

      // ── Header ──
      textRtl(doc, 'فاتورة', right - 220, y, 220, { bold: true, size: 28 });
      textLtr(doc, 'Rukny Mail', right - 220, y + 34, 220, {
        size: 12,
        color: COLORS.muted,
        align: 'right',
      });

      textRtl(doc, `رقم الفاتورة: #${invoiceShort}`, left, y + 6, 240, {
        bold: true,
        size: 11,
      });
      textRtl(doc, `تاريخ الإصدار: ${issued}`, left, y + 24, 240, {
        size: 10,
        color: COLORS.muted,
      });

      y += 58;
      drawRule(doc, left, y, contentWidth);
      y += 20;

      // ── المرسل / العميل ──
      const colW = contentWidth / 2 - 12;
      const senderX = left + colW + 24;
      const customerX = left;

      textRtl(doc, 'المرسل:', senderX, y, colW, { bold: true, size: 11 });
      textRtl(doc, 'العميل:', customerX, y, colW, { bold: true, size: 11 });
      y += 18;

      textLtr(doc, 'Rukny Mail', senderX, y, colW, {
        size: 11,
        align: 'right',
      });
      textRtl(doc, customer, customerX, y, colW, { size: 11 });
      y += 16;

      textRtl(doc, 'العراق، بغداد', senderX, y, colW, {
        size: 10,
        color: COLORS.muted,
      });
      if (input.contactEmail) {
        textLtr(doc, input.contactEmail, customerX, y, colW, {
          size: 10,
          color: COLORS.muted,
          align: 'right',
        });
      }
      y += 16;

      textLtr(doc, 'support@rukny.io', senderX, y, colW, {
        size: 10,
        color: COLORS.muted,
        align: 'right',
      });
      if (input.workspaceDomain) {
        textLtr(doc, input.workspaceDomain, customerX, y, colW, {
          size: 10,
          color: COLORS.muted,
          align: 'right',
        });
      }
      y += 28;

      // ── تفاصيل الطلب ──
      textRtl(doc, 'تفاصيل الطلب', left, y, contentWidth, {
        bold: true,
        size: 13,
      });
      y += 18;
      drawRule(doc, left, y, contentWidth);
      y += 12;

      // LTR coords: total | price | qty | product (product on the visual right)
      const wTotal = Math.floor(contentWidth * 0.24);
      const wPrice = Math.floor(contentWidth * 0.24);
      const wQty = Math.floor(contentWidth * 0.12);
      const wProduct = contentWidth - wTotal - wPrice - wQty;
      const xTotal = left;
      const xPrice = xTotal + wTotal;
      const xQty = xPrice + wPrice;
      const xProduct = xQty + wQty;

      textRtl(doc, 'المجموع', xTotal, y, wTotal - 4, {
        bold: true,
        size: 10,
        color: COLORS.muted,
      });
      textRtl(doc, 'السعر', xPrice, y, wPrice - 4, {
        bold: true,
        size: 10,
        color: COLORS.muted,
      });
      textRtl(doc, 'الكمية', xQty, y, wQty - 4, {
        bold: true,
        size: 10,
        color: COLORS.muted,
      });
      textRtl(doc, 'المنتج', xProduct, y, wProduct - 4, {
        bold: true,
        size: 10,
        color: COLORS.muted,
      });
      y += 18;
      drawRule(doc, left, y, contentWidth);
      y += 12;

      const productTitle = isPack
        ? input.packEmails && input.packEmails > 0
          ? `حزمة ${formatIqdNumber(input.packEmails)} رسالة صادرة`
          : 'حزمة رسائل صادرة'
        : `باقة ${input.planName}`;
      const productSub = isPack
        ? `باقة ${input.planName}`
        : `من ${periodStart} إلى ${periodEnd}`;

      textRtl(doc, productTitle, xProduct, y, wProduct - 4, {
        bold: true,
        size: 11,
      });
      textRtl(doc, String(qty), xQty, y, wQty - 4, { size: 11 });
      textShaped(doc, formatIqdAr(unitPrice), xPrice, y, wPrice - 4, {
        size: 10,
      });
      textShaped(doc, formatIqdAr(subtotalIqd), xTotal, y, wTotal - 4, {
        size: 10,
      });
      y += 16;
      textRtl(doc, productSub, xProduct, y, wProduct - 4, {
        size: 9,
        color: COLORS.muted,
      });
      y += 18;
      drawRule(doc, left, y, contentWidth);
      y += 20;

      // ── Totals ──
      const totalsW = wTotal + wPrice;
      const totalsX = left;
      const labelW = Math.floor(totalsW * 0.55);
      const valueW = totalsW - labelW;

      textRtl(doc, 'المجموع الفرعي', totalsX + valueW, y, labelW, {
        size: 10,
        color: COLORS.muted,
      });
      textShaped(doc, formatIqdAr(subtotalIqd), totalsX, y, valueW, {
        size: 10,
      });
      y += 18;

      textRtl(doc, 'الضريبة', totalsX + valueW, y, labelW, {
        size: 10,
        color: COLORS.muted,
      });
      textShaped(doc, formatIqdAr(taxIqd), totalsX, y, valueW, { size: 10 });
      y += 16;
      drawRule(doc, totalsX, y, totalsW);
      y += 12;

      textRtl(doc, 'الإجمالي', totalsX + valueW, y, labelW, {
        bold: true,
        size: 13,
      });
      textShaped(doc, formatIqdAr(totalIqd), totalsX, y, valueW, {
        bold: true,
        size: 13,
      });
      y += 36;

      // ── معلومات الدفع ──
      textRtl(doc, 'معلومات الدفع', left, y, contentWidth, {
        bold: true,
        size: 13,
      });
      y += 18;
      drawRule(doc, left, y, contentWidth);
      y += 16;

      const payColW = contentWidth / 2 - 12;
      const payRightX = left + payColW + 24;
      const payLeftX = left;

      textRtl(doc, 'طريقة الدفع: خدمات كي كارد', payRightX, y, payColW, {
        size: 10,
      });
      textRtl(doc, `رقم الطلب: #${invoiceShort}`, payLeftX, y, payColW, {
        size: 10,
      });
      y += 16;

      textRtl(
        doc,
        `تاريخ تأكيد الدفع: ${paid !== '—' ? paid : issued}`,
        payRightX,
        y,
        payColW,
        { size: 10 },
      );
      textRtl(doc, `تاريخ الطلب: ${issued}`, payLeftX, y, payColW, {
        size: 10,
      });
      y += 22;

      if (qrPng) {
        textRtl(doc, 'إثبات الدفع (QR):', payRightX, y, payColW, {
          size: 10,
        });
        y += 14;
        const qrSize = 88;
        doc.image(qrPng, right - qrSize, y, { width: qrSize, height: qrSize });
        textRtl(
          doc,
          'امسح الرمز لعرض / تحميل الفاتورة',
          payRightX,
          y + qrSize + 8,
          payColW,
          { size: 8, color: COLORS.faint },
        );
        y += qrSize + 28;
      } else if (input.qasehPaymentId) {
        textLtr(doc, input.qasehPaymentId, payRightX, y, payColW, {
          size: 9,
          color: COLORS.muted,
          align: 'right',
        });
        y += 18;
      }

      if (input.note) {
        textRtl(doc, input.note, left, y, contentWidth, {
          size: 8,
          color: COLORS.muted,
        });
        y += 16;
      }

      const footerY = doc.page.height - PAGE_MARGIN - 20;
      drawRule(doc, left, footerY - 10, contentWidth);
      textRtl(
        doc,
        'تم إنشاء هذه الفاتورة تلقائياً بواسطة Rukny Mail. للاستفسارات: support@rukny.io',
        left,
        footerY,
        contentWidth,
        { size: 8, color: COLORS.faint },
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
