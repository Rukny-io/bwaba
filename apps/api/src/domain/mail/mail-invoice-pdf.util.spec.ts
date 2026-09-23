import { BillingCycle } from '@prisma/client';
import { MAIL_INVOICE_TAX_IQD } from './mail-plan-limits.config';
import {
  mailInvoiceTotals,
  renderMailInvoicePdf,
} from './mail-invoice-pdf.util';

describe('mailInvoiceTotals', () => {
  it('applies flat 400 IQD tax on every invoice', () => {
    expect(mailInvoiceTotals(60_000)).toEqual({
      subtotalIqd: 60_000,
      taxIqd: MAIL_INVOICE_TAX_IQD,
      totalIqd: 60_400,
    });
    expect(MAIL_INVOICE_TAX_IQD).toBe(400);
  });

  it('floors negative amounts to zero subtotal but still adds tax', () => {
    expect(mailInvoiceTotals(-100)).toEqual({
      subtotalIqd: 0,
      taxIqd: 400,
      totalIqd: 400,
    });
  });
});

describe('renderMailInvoicePdf', () => {
  it('generates a non-empty PDF buffer with table layout', async () => {
    const buffer = await renderMailInvoicePdf({
      invoiceNumber: 'RM-202509-TEST1234',
      issuedAt: new Date('2026-09-01T00:00:00Z'),
      workspaceName: 'Acme Workspace',
      workspaceDomain: 'acme.rukny.io',
      contactEmail: 'billing@acme.test',
      planName: 'Pro',
      billingCycle: BillingCycle.MONTHLY,
      mailboxCount: 5,
      amountIqd: 60000,
      periodStart: new Date('2026-09-01T00:00:00Z'),
      periodEnd: new Date('2026-10-01T00:00:00Z'),
      paidAt: new Date('2026-09-01T12:00:00Z'),
      qasehPaymentId: 'pay_test_123',
      paymentRowId: 'row_test_456',
      status: 'PAID',
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
