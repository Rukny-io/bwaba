import { existsSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import type { BillingCycle } from '@prisma/client';

const COLORS = {
  ink: '#111111',
  muted: '#6b7280',
  faint: '#9ca3af',
  border: '#e5e7eb',
  surface: '#f9fafb',
};

const PAGE_MARGIN = 48;

const FONT = {
  regular: 'IBMPlexSans-Regular',
  medium: 'IBMPlexSans-Medium',
  semibold: 'IBMPlexSans-SemiBold',
} as const;

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
  const regular = resolveFontPath(FONT.regular);
  const medium = resolveFontPath(FONT.medium);
  const semibold = resolveFontPath(FONT.semibold);

  if (regular) doc.registerFont(FONT.regular, regular);
  if (medium) doc.registerFont(FONT.medium, medium);
  if (semibold) doc.registerFont(FONT.semibold, semibold);
}

function setInvoiceFont(
  doc: PDFKit.PDFDocument,
  weight: 'regular' | 'medium' | 'semibold' = 'regular',
): void {
  const name = FONT[weight];
  const path = resolveFontPath(name);
  if (path) {
    doc.font(name);
    return;
  }
  doc.font(weight === 'semibold' ? 'Helvetica-Bold' : 'Helvetica');
}

export interface MailInvoicePdfInput {
  invoiceNumber: string;
  issuedAt: Date;
  workspaceName: string;
  workspaceDomain: string | null;
  contactEmail: string | null;
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
}

function formatIqd(amount: number): string {
  return `${new Intl.NumberFormat('en-IQ').format(Math.max(0, Math.floor(amount)))} IQD`;
}

function formatInvoiceDate(value: Date | null | undefined): string {
  if (!value || Number.isNaN(value.getTime())) return '—';
  return value.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function resolveLogoSvgPath(): string | null {
  const candidates = [
    join(__dirname, '../../assets/rukny-logo.svg'),
    join(process.cwd(), 'dist/assets/rukny-logo.svg'),
    join(process.cwd(), 'src/assets/rukny-logo.svg'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

async function loadLogoPng(): Promise<Buffer | null> {
  const svgPath = resolveLogoSvgPath();
  if (!svgPath) return null;
  try {
    return await sharp(svgPath).resize(160, 160, { fit: 'inside' }).png().toBuffer();
  } catch {
    return null;
  }
}

function drawRule(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  color = COLORS.border,
) {
  doc.save().strokeColor(color).lineWidth(1).moveTo(x, y).lineTo(x + width, y).stroke().restore();
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  widths: number[],
  labels: string[],
) {
  const height = 26;
  const totalWidth = widths.reduce((sum, w) => sum + w, 0);

  doc.save();
  doc.fillColor(COLORS.surface).rect(x, y, totalWidth, height).fill();
  doc.restore();
  drawRule(doc, x, y + height, totalWidth);

  let cursor = x + 10;
  setInvoiceFont(doc, 'medium');
  doc.fontSize(8.5).fillColor(COLORS.muted);
  for (let i = 0; i < labels.length; i++) {
    doc.text(labels[i], cursor, y + 8, {
      width: widths[i] - 12,
      align: i >= labels.length - 2 ? 'right' : 'left',
    });
    cursor += widths[i];
  }

  return y + height;
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  widths: number[],
  cells: string[],
  rowHeight = 34,
) {
  const totalWidth = widths.reduce((sum, w) => sum + w, 0);
  let cursor = x + 10;

  setInvoiceFont(doc, 'regular');
  doc.fontSize(9.5).fillColor(COLORS.ink);
  for (let i = 0; i < cells.length; i++) {
    doc.text(cells[i], cursor, y + 10, {
      width: widths[i] - 12,
      align: i >= cells.length - 2 ? 'right' : 'left',
    });
    cursor += widths[i];
  }

  drawRule(doc, x, y + rowHeight, totalWidth);
  return y + rowHeight;
}

export async function renderMailInvoicePdf(
  input: MailInvoicePdfInput,
): Promise<Buffer> {
  const logo = await loadLogoPng();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      registerInvoiceFonts(doc);
      setInvoiceFont(doc, 'regular');

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - PAGE_MARGIN * 2;
      let y = PAGE_MARGIN;

      // Header
      const logoSize = 42;
      if (logo) {
        doc.image(logo, PAGE_MARGIN, y, { width: logoSize, height: logoSize });
      }

      const headerTextX = logo ? PAGE_MARGIN + logoSize + 14 : PAGE_MARGIN;
      setInvoiceFont(doc, 'semibold');
      doc
        .fontSize(18)
        .fillColor(COLORS.ink)
        .text('Rukny', headerTextX, y + 2);
      setInvoiceFont(doc, 'regular');
      doc
        .fontSize(10)
        .fillColor(COLORS.muted)
        .text('Mail · Professional email for teams', headerTextX, y + 24);

      const metaX = PAGE_MARGIN + contentWidth - 170;
      setInvoiceFont(doc, 'semibold');
      doc.fontSize(22).fillColor(COLORS.ink).text('INVOICE', metaX, y, {
        width: 170,
        align: 'right',
      });
      setInvoiceFont(doc, 'regular');
      doc
        .fontSize(9)
        .fillColor(COLORS.muted)
        .text(`# ${input.invoiceNumber}`, metaX, y + 28, {
          width: 170,
          align: 'right',
        });
      doc.text(`Issued ${formatInvoiceDate(input.issuedAt)}`, metaX, y + 42, {
        width: 170,
        align: 'right',
      });
      doc.text(`Status ${input.status}`, metaX, y + 56, {
        width: 170,
        align: 'right',
      });

      y += logoSize + 28;
      drawRule(doc, PAGE_MARGIN, y, contentWidth);
      y += 18;

      // Bill to + company
      const colWidth = contentWidth / 2 - 8;
      doc.fontSize(8).fillColor(COLORS.muted).text('BILL TO', PAGE_MARGIN, y);
      doc
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text('FROM', PAGE_MARGIN + colWidth + 16, y);

      y += 14;
      doc.fontSize(11).fillColor(COLORS.ink).text(input.workspaceName, PAGE_MARGIN, y, {
        width: colWidth,
      });
      doc
        .fontSize(11)
        .fillColor(COLORS.ink)
        .text('Rukny', PAGE_MARGIN + colWidth + 16, y);

      y += 16;
      doc.fontSize(9).fillColor(COLORS.muted);
      if (input.workspaceDomain) {
        doc.text(input.workspaceDomain, PAGE_MARGIN, y, { width: colWidth });
      }
      doc.text('rukny.io', PAGE_MARGIN + colWidth + 16, y);
      y += 14;

      if (input.contactEmail) {
        doc.text(input.contactEmail, PAGE_MARGIN, y, { width: colWidth });
      }
      doc.text('support@rukny.io', PAGE_MARGIN + colWidth + 16, y);
      y += 28;

      // Line items table
      const colWidths = [
        Math.floor(contentWidth * 0.36),
        Math.floor(contentWidth * 0.24),
        Math.floor(contentWidth * 0.1),
        Math.floor(contentWidth * 0.15),
        contentWidth -
          Math.floor(contentWidth * 0.36) -
          Math.floor(contentWidth * 0.24) -
          Math.floor(contentWidth * 0.1) -
          Math.floor(contentWidth * 0.15),
      ];

      const billingLabel =
        input.billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly';
      const seats = Math.max(1, input.mailboxCount);
      const unitPrice = Math.floor(input.amountIqd / seats);
      const description = `${input.planName} plan · ${billingLabel}`;
      const period = `${formatInvoiceDate(input.periodStart)} – ${formatInvoiceDate(input.periodEnd)}`;

      y = drawTableHeader(doc, PAGE_MARGIN, y, colWidths, [
        'Description',
        'Period',
        'Qty',
        'Unit price',
        'Amount',
      ]);

      y = drawTableRow(doc, PAGE_MARGIN, y, colWidths, [
        description,
        period,
        String(seats),
        formatIqd(unitPrice),
        formatIqd(input.amountIqd),
      ]);

      y += 16;

      // Totals
      const totalsLabelX = PAGE_MARGIN + contentWidth - 220;
      const totalsValueX = PAGE_MARGIN + contentWidth - 90;

      doc.fontSize(9).fillColor(COLORS.muted).text('Subtotal', totalsLabelX, y, {
        width: 100,
        align: 'right',
      });
      doc
        .fontSize(9)
        .fillColor(COLORS.ink)
        .text(formatIqd(input.amountIqd), totalsValueX, y, {
          width: 90,
          align: 'right',
        });
      y += 18;

      drawRule(doc, totalsLabelX, y, 190, COLORS.border);
      y += 10;

      doc.fontSize(11).fillColor(COLORS.ink).text('Total', totalsLabelX, y, {
        width: 100,
        align: 'right',
      });
      doc
        .fontSize(12)
        .fillColor(COLORS.ink)
        .text(formatIqd(input.amountIqd), totalsValueX, y - 1, {
          width: 90,
          align: 'right',
        });
      y += 22;

      doc
        .fontSize(8)
        .fillColor(COLORS.faint)
        .text('All amounts in Iraqi dinar (IQD). Bank fees may apply separately.', PAGE_MARGIN, y);
      y += 24;

      // Payment details
      if (input.paidAt || input.qasehPaymentId || input.paymentRowId) {
        drawRule(doc, PAGE_MARGIN, y, contentWidth);
        y += 12;
        doc.fontSize(8).fillColor(COLORS.muted).text('PAYMENT DETAILS', PAGE_MARGIN, y);
        y += 14;
        doc.fontSize(9).fillColor(COLORS.ink);
        if (input.paidAt) {
          doc.text(`Paid on ${formatInvoiceDate(input.paidAt)}`, PAGE_MARGIN, y);
          y += 14;
        }
        if (input.qasehPaymentId) {
          doc.text(`Reference ${input.qasehPaymentId}`, PAGE_MARGIN, y);
          y += 14;
        }
        if (input.paymentRowId) {
          doc.text(`Payment id ${input.paymentRowId}`, PAGE_MARGIN, y);
          y += 14;
        }
      }

      if (input.note) {
        y += 6;
        doc
          .fontSize(8)
          .fillColor(COLORS.muted)
          .text(input.note, PAGE_MARGIN, y, { width: contentWidth });
        y += 20;
      }

      // Footer
      const footerY = doc.page.height - PAGE_MARGIN - 24;
      drawRule(doc, PAGE_MARGIN, footerY - 10, contentWidth);
      doc
        .fontSize(7.5)
        .fillColor(COLORS.faint)
        .text(
          'This invoice was generated automatically by Rukny Mail for the subscription listed above. For billing questions, contact support@rukny.io.',
          PAGE_MARGIN,
          footerY,
          { width: contentWidth, align: 'left' },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
