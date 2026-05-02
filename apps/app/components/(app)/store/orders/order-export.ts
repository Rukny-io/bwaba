"use client";

/**
 * 🧾 Invoice Generator — Arabic
 * تصدير فاتورة PDF عربية + CSV + طباعة + واتساب
 */

import jsPDF from "jspdf";
import type { StoreOrder } from "@/lib/api/orders";
import { getStatusLabel } from "./order-helpers";

function fmtNum(n: number): string {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}
function fmtIQD(v: number): string {
  return `${fmtNum(v)} IQD`;
}

const C = {
  primary: [79, 70, 229] as [number, number, number],
  primaryLight: [238, 242, 255] as [number, number, number],
  dark: [30, 30, 46] as [number, number, number],
  text: [55, 55, 75] as [number, number, number],
  muted: [140, 140, 160] as [number, number, number],
  border: [228, 228, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
  successBg: [236, 253, 245] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  warningBg: [255, 251, 235] as [number, number, number],
  error: [239, 68, 68] as [number, number, number],
  errorBg: [254, 242, 242] as [number, number, number],
  tableBg: [249, 250, 251] as [number, number, number],
};

function getStatusColor(status: string) {
  switch (status.toUpperCase()) {
    case "COMPLETED": case "DELIVERED": return { text: C.success, bg: C.successBg };
    case "CANCELLED": return { text: C.error, bg: C.errorBg };
    case "PENDING": return { text: C.warning, bg: C.warningBg };
    default: return { text: C.primary, bg: C.primaryLight };
  }
}

/* ═══════════════════════════════════════════════
 * PDF INVOICE — Arabic RTL
 * ═══════════════════════════════════════════════ */

export function generateInvoicePDF(order: StoreOrder, storeName?: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = 210, m = 18, cw = pw - m * 2;
  let y = m;

  // Top bar
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, pw, 4, "F");
  y = 16;

  // Header — store name right, "INVOICE" left (visual RTL)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...C.dark);
  doc.text(storeName || "Rukny Store", pw - m, y, { align: "right" });

  doc.setFontSize(26);
  doc.setTextColor(...C.primary);
  doc.text("INVOICE", m, y + 1);

  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  doc.text(`# ${order.orderNumber.slice(0, 14)}`, pw - m, y, { align: "right" });

  y += 4;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(m, y, pw - m, y);
  y += 8;

  // Two info boxes
  const bw = cw / 2 - 4;

  // RIGHT box — Store/Order info (RTL = right first)
  doc.setFillColor(...C.primaryLight);
  doc.roundedRect(pw - m - bw, y, bw, 36, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.primary);
  doc.text("Order Info", pw - m - 6, y + 7, { align: "right" });

  const oInfo = [
    ["Date", new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })],
    ["Status", getStatusLabel(order.status)],
    ["Items", `${order.items.length}`],
  ];
  oInfo.forEach(([l, v], i) => {
    const iy = y + 14 + i * 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...C.muted);
    doc.text(l, pw - m - bw + 6, iy);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...C.dark);
    doc.text(v, pw - m - 6, iy, { align: "right" });
  });

  // LEFT box — Customer
  doc.setFillColor(...C.tableBg);
  doc.roundedRect(m, y, bw, 36, 3, 3, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...C.primary);
  doc.text("Customer", m + bw - 6, y + 7, { align: "right" });

  const cInfo: string[][] = [[order.customerName, "Name"]];
  if (order.customerPhone) cInfo.push([order.customerPhone, "Phone"]);
  if (order.customerEmail) cInfo.push([order.customerEmail.slice(0, 28), "Email"]);

  cInfo.forEach(([v, l], i) => {
    const iy = y + 14 + i * 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...C.muted);
    doc.text(l, m + 6, iy);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...C.dark);
    doc.text(v, m + bw - 6, iy, { align: "right" });
  });

  y += 42;

  // Address
  if (order.shippingAddress) {
    const addr = [order.shippingAddress.city, order.shippingAddress.area, order.shippingAddress.address].filter(Boolean).join(", ");
    if (addr) {
      doc.setFillColor(...C.tableBg);
      doc.roundedRect(m, y, cw, 12, 3, 3, "F");
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...C.muted);
      doc.text("Address:", m + 6, y + 5);
      doc.setFont("helvetica", "bold"); doc.setTextColor(...C.dark);
      doc.text(addr.slice(0, 80), m + 6, y + 10);
      y += 16;
    }
  }

  y += 2;

  // Items table header
  const cols = { num: 10, name: cw - 10 - 22 - 32 - 36, qty: 22, price: 32, total: 36 };
  doc.setFillColor(...C.primary);
  doc.roundedRect(m, y, cw, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...C.white);
  let cx = m + 4;
  doc.text("#", cx, y + 7); cx += cols.num;
  doc.text("Product", cx, y + 7); cx += cols.name;
  doc.text("Qty", cx, y + 7); cx += cols.qty;
  doc.text("Price", cx, y + 7); cx += cols.price;
  doc.text("Total", cx, y + 7);
  y += 12;

  // Rows
  order.items.forEach((item, i) => {
    if (i % 2 === 0) { doc.setFillColor(...C.tableBg); doc.rect(m, y - 2, cw, 10, "F"); }
    doc.setFontSize(8.5); cx = m + 4;
    doc.setFont("helvetica", "normal"); doc.setTextColor(...C.muted);
    doc.text(String(i + 1), cx, y + 5);
    cx += cols.num;
    doc.setFont("helvetica", "bold"); doc.setTextColor(...C.dark);
    doc.text(item.productName.length > 35 ? item.productName.slice(0, 35) + "..." : item.productName, cx, y + 5);
    cx += cols.name;
    doc.setFont("helvetica", "normal"); doc.setTextColor(...C.text);
    doc.text(String(item.quantity), cx, y + 5);
    cx += cols.qty;
    doc.text(fmtNum(item.price), cx, y + 5);
    cx += cols.price;
    doc.setFont("helvetica", "bold");
    doc.text(fmtNum(item.total), cx, y + 5);
    y += 10;
  });

  doc.setDrawColor(...C.border); doc.setLineWidth(0.3);
  doc.line(m, y, pw - m, y);
  y += 8;

  // Totals
  const tx = pw - m - 80, tw = 80;
  const addTotal = (label: string, value: string, color?: [number, number, number]) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...C.muted);
    doc.text(label, tx, y + 5);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...(color || C.dark));
    doc.text(value, tx + tw, y + 5, { align: "right" });
    y += 8;
  };

  addTotal("Subtotal", fmtIQD(order.subtotal));
  addTotal("Shipping", order.shippingCost === 0 ? "Free" : fmtIQD(order.shippingCost), order.shippingCost === 0 ? C.success : undefined);
  if (order.discount > 0) addTotal("Discount", `-${fmtIQD(order.discount)}`, C.success);

  doc.setDrawColor(...C.primary); doc.setLineWidth(0.5);
  doc.line(tx, y + 2, tx + tw, y + 2);
  y += 6;

  doc.setFillColor(...C.primary);
  doc.roundedRect(tx - 4, y, tw + 8, 14, 3, 3, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...C.white);
  doc.text("TOTAL", tx, y + 10);
  doc.text(fmtIQD(order.total), tx + tw, y + 10, { align: "right" });
  y += 22;

  // Notes
  if (order.notes) {
    doc.setFillColor(...C.warningBg);
    doc.roundedRect(m, y, cw, 14, 3, 3, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...C.warning);
    doc.text("Customer Notes:", m + 6, y + 5);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...C.text);
    doc.text(order.notes.slice(0, 100), m + 6, y + 11);
    y += 18;
  }

  // Footer — Support
  const fy = 270;
  doc.setFillColor(...C.primaryLight);
  doc.roundedRect(m, fy, cw, 18, 3, 3, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...C.primary);
  doc.text("Support & Help", m + 6, fy + 6);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...C.muted);
  doc.text("support@rukny.io  |  rukny.io/help", m + 6, fy + 11);
  doc.text("Powered by Rukny.io", m + 6, fy + 15);

  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(...C.muted);
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pw - m, fy + 15, { align: "right" });

  // Bottom bar
  doc.setFillColor(...C.primary);
  doc.rect(0, 293, pw, 4, "F");

  doc.save(`invoice-${order.orderNumber.slice(0, 12)}.pdf`);
}

/* ═══════════════════════════════════════════════
 * PRINT — Arabic RTL
 * ═══════════════════════════════════════════════ */

export function printOrder(order: StoreOrder, storeName?: string) {
  const statusColors = getStatusColor(order.status);
  const items = order.items.map((item, i) => `
    <tr style="${i % 2 === 0 ? "background:#f9fafb;" : ""}">
      <td style="padding:8px 12px;font-size:13px;color:#6b7280;">${i + 1}</td>
      <td style="padding:8px 12px;font-size:13px;font-weight:600;">${item.productName}</td>
      <td style="padding:8px 12px;font-size:13px;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;font-size:13px;text-align:left;">${fmtIQD(item.price)}</td>
      <td style="padding:8px 12px;font-size:13px;text-align:left;font-weight:600;">${fmtIQD(item.total)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<title>فاتورة #${order.orderNumber.slice(0, 12)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#1e1e2e;padding:32px;max-width:800px;margin:0 auto;direction:rtl}
@media print{body{padding:16px}.no-print{display:none!important}}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #4f46e5}
.store-name{font-size:24px;font-weight:800;color:#4f46e5}
.invoice-label{font-size:28px;font-weight:800;color:#1e1e2e;letter-spacing:-1px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.info-box{background:#f9fafb;border-radius:12px;padding:16px}
.info-box h4{font-size:12px;font-weight:700;color:#4f46e5;margin-bottom:12px}
.info-row{display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px}
.info-row .label{color:#9ca3af}
.info-row .value{font-weight:600}
table{width:100%;border-collapse:collapse;margin-bottom:24px}
thead th{background:#4f46e5;color:white;padding:10px 12px;font-size:12px;text-align:right}
thead th:first-child{border-radius:0 8px 0 0}
thead th:last-child{border-radius:8px 0 0 0;text-align:left}
.totals{margin-right:auto;width:280px}
.total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}
.total-row .label{color:#9ca3af}
.total-row .value{font-weight:600}
.grand-total{background:#4f46e5;color:white;padding:12px 16px;border-radius:8px;display:flex;justify-content:space-between;font-size:15px;font-weight:700;margin-top:8px}
.status-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
.support-box{background:#eef2ff;border-radius:12px;padding:16px;margin-top:32px}
.support-box h4{font-size:13px;font-weight:700;color:#4f46e5;margin-bottom:6px}
.support-box p{font-size:11px;color:#6b7280;line-height:1.6}
.footer{margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between}
.print-btn{position:fixed;bottom:24px;left:24px;background:#4f46e5;color:white;border:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(79,70,229,0.4)}
</style></head><body>
<div class="header">
  <div>
    <div class="store-name">${storeName || "Rukny Store"}</div>
    <div style="font-size:12px;color:#9ca3af;margin-top:4px">فاتورة طلب</div>
  </div>
  <div style="text-align:left">
    <div class="invoice-label">فاتورة</div>
    <span class="status-badge" style="background:rgb(${statusColors.bg.join(",")});color:rgb(${statusColors.text.join(",")});">${getStatusLabel(order.status)}</span>
  </div>
</div>

<div class="info-grid">
  <div class="info-box">
    <h4>تفاصيل الطلب</h4>
    <div class="info-row"><span class="label">رقم الطلب</span><span class="value">${order.orderNumber.slice(0, 14)}</span></div>
    <div class="info-row"><span class="label">التاريخ</span><span class="value">${new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span></div>
    <div class="info-row"><span class="label">عدد المنتجات</span><span class="value">${order.items.length}</span></div>
  </div>
  <div class="info-box">
    <h4>معلومات العميل</h4>
    <div class="info-row"><span class="label">الاسم</span><span class="value">${order.customerName}</span></div>
    ${order.customerPhone ? `<div class="info-row"><span class="label">الهاتف</span><span class="value" dir="ltr">${order.customerPhone}</span></div>` : ""}
    ${order.customerEmail ? `<div class="info-row"><span class="label">البريد</span><span class="value" dir="ltr">${order.customerEmail}</span></div>` : ""}
  </div>
</div>

${order.shippingAddress ? `<div style="background:#f9fafb;border-radius:8px;padding:10px 16px;margin-bottom:16px;font-size:12px"><span style="color:#9ca3af">عنوان التوصيل: </span><strong>${[order.shippingAddress.city, order.shippingAddress.area, order.shippingAddress.address].filter(Boolean).join("، ")}</strong></div>` : ""}

<table>
  <thead><tr>
    <th style="width:40px">#</th>
    <th>المنتج</th>
    <th style="text-align:center;width:60px">الكمية</th>
    <th style="text-align:left;width:120px">السعر</th>
    <th style="text-align:left;width:120px">الإجمالي</th>
  </tr></thead>
  <tbody>${items}</tbody>
</table>

<div class="totals">
  <div class="total-row"><span class="label">المجموع الفرعي</span><span class="value">${fmtIQD(order.subtotal)}</span></div>
  <div class="total-row"><span class="label">التوصيل</span><span class="value" style="${order.shippingCost === 0 ? "color:#10b981" : ""}">${order.shippingCost === 0 ? "مجاني" : fmtIQD(order.shippingCost)}</span></div>
  ${order.discount > 0 ? `<div class="total-row"><span class="label" style="color:#10b981">الخصم</span><span class="value" style="color:#10b981">-${fmtIQD(order.discount)}</span></div>` : ""}
  <div class="grand-total"><span>الإجمالي</span><span>${fmtIQD(order.total)}</span></div>
</div>

${order.notes ? `<div style="margin-top:24px;background:#fffbeb;border-radius:8px;padding:12px 16px"><p style="font-size:11px;font-weight:700;color:#f59e0b;margin-bottom:4px">ملاحظات العميل</p><p style="font-size:12px;color:#92400e">${order.notes}</p></div>` : ""}

<div class="support-box">
  <h4>فريق دعم المنصة</h4>
  <p>هل تحتاج مساعدة؟ تواصل معنا عبر البريد الإلكتروني support@rukny.io أو قم بزيارة مركز المساعدة على rukny.io/help</p>
  <p style="margin-top:4px">شكراً لاستخدامكم منصة ركني 🙏</p>
</div>

<div class="footer">
  <span>تم الإنشاء في ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
  <span>مدعوم من Rukny.io</span>
</div>

<button class="print-btn no-print" onclick="window.print()">طباعة</button>
</body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

/* ═══════════════════════════════════════════════
 * CSV Export
 * ═══════════════════════════════════════════════ */

export function exportOrdersCSV(orders: StoreOrder[]) {
  const headers = ["رقم الطلب", "العميل", "الهاتف", "البريد", "المنتجات", "المجموع الفرعي", "التوصيل", "الخصم", "الإجمالي", "الحالة", "التاريخ"];
  const rows = orders.map((o) => [
    o.orderNumber, o.customerName, o.customerPhone || "", o.customerEmail || "",
    o.items.length.toString(), o.subtotal.toString(), o.shippingCost.toString(),
    o.discount.toString(), o.total.toString(), getStatusLabel(o.status),
    new Date(o.createdAt).toLocaleDateString("en-US"),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════
 * WhatsApp Share
 * ═══════════════════════════════════════════════ */

export function shareOrderWhatsApp(order: StoreOrder) {
  const items = order.items.map((item, i) => `${i + 1}. ${item.productName} × ${item.quantity} = ${fmtIQD(item.total)}`).join("\n");
  const msg = [
    `📦 *طلب #${order.orderNumber.slice(0, 12)}*`,
    `📅 التاريخ: ${new Date(order.createdAt).toLocaleDateString("en-US")}`,
    `📋 الحالة: ${getStatusLabel(order.status)}`,
    ``, `🛍️ *المنتجات:*`, items, ``,
    `💰 *الإجمالي: ${fmtIQD(order.total)}*`,
    order.shippingCost > 0 ? `🚚 التوصيل: ${fmtIQD(order.shippingCost)}` : `🚚 التوصيل: مجاني`,
    order.discount > 0 ? `🏷️ الخصم: -${fmtIQD(order.discount)}` : "",
    ``, `شكراً لطلبكم! 🙏`,
  ].filter(Boolean).join("\n");
  const phone = order.customerPhone?.replace(/[^0-9+]/g, "") || "";
  const encoded = encodeURIComponent(msg);
  window.open(phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`, "_blank");
}
