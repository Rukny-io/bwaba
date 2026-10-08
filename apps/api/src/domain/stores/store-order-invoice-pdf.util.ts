import { existsSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import arabicReshaper from 'arabic-persian-reshaper';
import bidiFactory from 'bidi-js';

const COLORS = {
  ink: '#111111',
  muted: '#6b7280',
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

function ar(text: string): string {
  if (!text) return '';
  const reshaped = arabicReshaper.ArabicShaper.convertArabic(text);
  const embeddingLevels = bidi.getEmbeddingLevels(reshaped, 'rtl');
  return bidi.getReorderedString(reshaped, embeddingLevels);
}

function formatIqdNumber(amount: number): string {
  return new Intl.NumberFormat('en-IQ').format(Math.max(0, Math.floor(amount)));
}

function formatMoney(amount: number, currency: string): string {
  if (currency === 'IQD') return `${formatIqdNumber(amount)} د.ع`;
  return `${formatIqdNumber(amount)} ${currency}`;
}

function formatInvoiceDate(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate());
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

export interface StoreOrderInvoiceLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  variantLabel?: string | null;
}

export interface StoreOrderInvoicePdfInput {
  invoiceNumber: string;
  orderNumber: string;
  issuedAt: Date;
  storeName: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  paymentMethodLabel: string;
  paymentStatusLabel: string;
  orderStatusLabel: string;
  items: StoreOrderInvoiceLineItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  currency: string;
  couponCode?: string | null;
  addressLines: string[];
  customerNote?: string | null;
}

export async function renderStoreOrderInvoicePdf(
  input: StoreOrderInvoicePdfInput,
): Promise<Buffer> {
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

      textRtl(doc, 'فاتورة طلب', right - 240, y, 240, { bold: true, size: 26 });
      textRtl(doc, input.storeName, right - 240, y + 32, 240, {
        size: 11,
        color: COLORS.muted,
      });

      textRtl(doc, `رقم الطلب: ${input.orderNumber}`, left, y + 4, 260, {
        bold: true,
        size: 11,
      });
      textRtl(doc, `تاريخ الطلب: ${formatInvoiceDate(input.issuedAt)}`, left, y + 22, 260, {
        size: 10,
        color: COLORS.muted,
      });
      textRtl(doc, `رقم الفاتورة: ${input.invoiceNumber}`, left, y + 38, 260, {
        size: 10,
        color: COLORS.muted,
      });

      y += 72;
      drawRule(doc, left, y, contentWidth);
      y += 18;

      const colW = contentWidth / 2 - 12;
      const sellerX = left + colW + 24;
      const buyerX = left;

      textRtl(doc, 'البائع', sellerX, y, colW, { bold: true, size: 11 });
      textRtl(doc, 'العميل', buyerX, y, colW, { bold: true, size: 11 });
      y += 16;
      textRtl(doc, input.storeName, sellerX, y, colW, { size: 11 });
      textRtl(doc, input.customerName, buyerX, y, colW, { size: 11 });
      y += 14;

      if (input.customerPhone) {
        textLtr(doc, input.customerPhone, buyerX, y, colW, {
          size: 10,
          color: COLORS.muted,
          align: 'right',
        });
        y += 14;
      }
      if (input.customerEmail) {
        textLtr(doc, input.customerEmail, buyerX, y, colW, {
          size: 10,
          color: COLORS.muted,
          align: 'right',
        });
        y += 14;
      }

      y += 8;
      textRtl(doc, `طريقة الدفع: ${input.paymentMethodLabel}`, left, y, contentWidth, {
        size: 10,
        color: COLORS.muted,
      });
      y += 14;
      textRtl(doc, `حالة الدفع: ${input.paymentStatusLabel}`, left, y, contentWidth, {
        size: 10,
        color: COLORS.muted,
      });
      y += 14;
      textRtl(doc, `حالة الطلب: ${input.orderStatusLabel}`, left, y, contentWidth, {
        size: 10,
        color: COLORS.muted,
      });
      y += 22;

      textRtl(doc, 'المنتجات', left, y, contentWidth, { bold: true, size: 13 });
      y += 16;
      drawRule(doc, left, y, contentWidth);
      y += 10;

      const wTotal = Math.floor(contentWidth * 0.22);
      const wPrice = Math.floor(contentWidth * 0.22);
      const wQty = Math.floor(contentWidth * 0.1);
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
      y += 16;
      drawRule(doc, left, y, contentWidth);
      y += 10;

      for (const item of input.items) {
        const productLine = item.variantLabel
          ? `${item.name} (${item.variantLabel})`
          : item.name;

        textLtr(doc, formatMoney(item.subtotal, input.currency), xTotal, y, wTotal - 4, {
          size: 10,
          align: 'left',
        });
        textLtr(doc, formatMoney(item.unitPrice, input.currency), xPrice, y, wPrice - 4, {
          size: 10,
          align: 'left',
        });
        textLtr(doc, String(item.quantity), xQty, y, wQty - 4, {
          size: 10,
          align: 'left',
        });
        textRtl(doc, productLine, xProduct, y, wProduct - 4, { size: 10 });
        y += 18;

        if (y > doc.page.height - PAGE_MARGIN - 120) {
          doc.addPage();
          y = PAGE_MARGIN;
        }
      }

      y += 6;
      drawRule(doc, left, y, contentWidth);
      y += 14;

      const summaryX = left + contentWidth * 0.45;
      const summaryW = contentWidth * 0.55;

      textRtl(doc, 'المجموع الفرعي', summaryX, y, summaryW * 0.55, { size: 10 });
      textLtr(
        doc,
        formatMoney(input.subtotal, input.currency),
        summaryX + summaryW * 0.55,
        y,
        summaryW * 0.45,
        { size: 10, align: 'right' },
      );
      y += 16;

      textRtl(doc, 'تكلفة التوصيل', summaryX, y, summaryW * 0.55, { size: 10 });
      textLtr(
        doc,
        formatMoney(input.shippingFee, input.currency),
        summaryX + summaryW * 0.55,
        y,
        summaryW * 0.45,
        { size: 10, align: 'right' },
      );
      y += 16;

      const discountLabel = input.couponCode
        ? `الخصم (${input.couponCode})`
        : 'الخصم';
      textRtl(doc, discountLabel, summaryX, y, summaryW * 0.55, { size: 10 });
      textLtr(
        doc,
        input.discount > 0
          ? `- ${formatMoney(input.discount, input.currency)}`
          : '—',
        summaryX + summaryW * 0.55,
        y,
        summaryW * 0.45,
        { size: 10, align: 'right' },
      );
      y += 18;
      drawRule(doc, summaryX, y, summaryW);
      y += 12;

      textRtl(doc, 'الإجمالي', summaryX, y, summaryW * 0.55, { bold: true, size: 12 });
      textLtr(
        doc,
        formatMoney(input.total, input.currency),
        summaryX + summaryW * 0.55,
        y,
        summaryW * 0.45,
        { size: 12, bold: true, align: 'right' },
      );
      y += 28;

      if (input.addressLines.length > 0) {
        textRtl(doc, 'عنوان التوصيل', left, y, contentWidth, { bold: true, size: 11 });
        y += 14;
        for (const line of input.addressLines) {
          textRtl(doc, line, left, y, contentWidth, { size: 10, color: COLORS.muted });
          y += 14;
        }
        y += 8;
      }

      if (input.customerNote?.trim()) {
        textRtl(doc, 'ملاحظات العميل', left, y, contentWidth, { bold: true, size: 11 });
        y += 14;
        setArabicFont(doc, 'regular');
        doc
          .fontSize(10)
          .fillColor(COLORS.muted)
          .text(ar(input.customerNote.trim()), left, y, {
            width: contentWidth,
            align: 'right',
          });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
