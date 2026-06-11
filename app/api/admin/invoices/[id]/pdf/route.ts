import fs from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { getInvoice, formatCurrency, formatDate, supplier } from "@/lib/invoices";
import { isAdminAuthenticated } from "@/lib/supabase-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const invoice = await getInvoice(id);

  if (!invoice) {
    return new Response("Faktura nenalezena", { status: 404 });
  }

  const pdf = await renderInvoicePdf(invoice);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}

async function renderInvoicePdf(invoice: NonNullable<Awaited<ReturnType<typeof getInvoice>>>) {
  await readLogoAsset();
  const qrDataUrl = await QRCode.toDataURL(paymentQrPayload(invoice), {
    margin: 1,
    width: 180,
    color: { dark: "#111111", light: "#FFFFFF" },
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1] ?? "", "base64");
  const buffers: Buffer[] = [];
  const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: false });

  doc.registerFont("Geist", path.join(process.cwd(), "node_modules", "next", "dist", "compiled", "@vercel", "og", "Geist-Regular.ttf"));
  doc.on("data", (chunk: Buffer) => buffers.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
  });

  drawHeader(doc);
  drawSupplierAndCustomer(doc, invoice);
  drawDates(doc, invoice);
  drawItems(doc, invoice);
  drawPayment(doc, invoice, qrBuffer);

  doc.end();
  return done;
}

function drawHeader(doc: PDFKit.PDFDocument) {
  doc.rect(42, 38, 72, 42).fill("#FACC15");
  doc.fillColor("#111111").font("Geist").fontSize(21).text("HV", 58, 51);
  doc.fillColor("#111111").font("Geist").fontSize(23).text("HAVELKAVIT", 126, 48);
  doc.fillColor("#111111").font("Geist").fontSize(34).text("FAKTURA", 372, 44, {
    align: "right",
    width: 181,
  });
  doc.moveTo(42, 96).lineTo(553, 96).lineWidth(4).strokeColor("#FACC15").stroke();
}

function drawSupplierAndCustomer(
  doc: PDFKit.PDFDocument,
  invoice: NonNullable<Awaited<ReturnType<typeof getInvoice>>>,
) {
  doc.fillColor("#111111").font("Geist").fontSize(10).text("DODAVATEL", 42, 126);
  doc.font("Geist").fontSize(13).text(supplier.name, 42, 145);
  doc.font("Geist").fontSize(10).text(supplier.address.join("\n"), 42, 165);
  doc.text(`IČ: ${supplier.ico}`, 42, 198);
  doc.text(supplier.vatNote, 42, 214);
  doc.text(`Účet: ${supplier.bankAccount}`, 42, 230);

  doc.fillColor("#111111").font("Geist").fontSize(10).text("ODBĚRATEL", 322, 126);
  doc.font("Geist").fontSize(13).text(invoice.customer_name, 322, 145, { width: 230 });
  doc.font("Geist").fontSize(10).text(invoice.customer_address, 322, 165, { width: 230 });
  if (invoice.customer_ico) {
    doc.text(`IČ: ${invoice.customer_ico}`, 322, 218, { width: 230 });
  }
}

function drawDates(doc: PDFKit.PDFDocument, invoice: NonNullable<Awaited<ReturnType<typeof getInvoice>>>) {
  const y = 270;
  doc.roundedRect(42, y, 511, 72, 10).fill("#F8FAFC").strokeColor("#E5E7EB").stroke();
  doc.fillColor("#111111").font("Geist").fontSize(10);
  doc.text("Číslo faktury", 58, y + 16);
  doc.text("Variabilní symbol", 174, y + 16);
  doc.text("Vystavení", 312, y + 16);
  doc.text("Splatnost", 414, y + 16);
  doc.font("Geist").fontSize(11);
  doc.text(invoice.invoice_number, 58, y + 38);
  doc.text(invoice.variable_symbol, 174, y + 38);
  doc.text(formatDate(invoice.issue_date), 312, y + 38);
  doc.text(formatDate(invoice.due_date), 414, y + 38);
  doc.font("Geist").fontSize(9).text(`Datum uskutečnění plnění: ${formatDate(invoice.taxable_supply_date)}`, 58, y + 55);
}

function drawItems(doc: PDFKit.PDFDocument, invoice: NonNullable<Awaited<ReturnType<typeof getInvoice>>>) {
  const startY = 380;
  const tableX = 42;
  doc.rect(tableX, startY, 511, 28).fill("#111111");
  doc.fillColor("#FFFFFF").font("Geist").fontSize(9);
  doc.text("Položka", tableX + 12, startY + 9);
  doc.text("Počet", 310, startY + 9);
  doc.text("Cena/ks", 378, startY + 9);
  doc.text("Celkem", 476, startY + 9);

  let y = startY + 28;
  doc.font("Geist").fontSize(9);
  invoice.items.forEach((item, index) => {
    const rowHeight = 32;
    doc.rect(tableX, y, 511, rowHeight).fill(index % 2 === 0 ? "#FFFFFF" : "#F8FAFC");
    doc.fillColor("#111111");
    doc.text(item.description, tableX + 12, y + 10, { width: 245 });
    doc.text(`${item.quantity} ${item.unit}`, 310, y + 10, { width: 58, align: "right" });
    doc.text(formatCurrency(item.unit_price), 378, y + 10, { width: 70, align: "right" });
    doc.font("Geist").text(formatCurrency(item.total_price), 462, y + 10, {
      width: 78,
      align: "right",
    });
    doc.font("Geist");
    y += rowHeight;
  });

  doc.roundedRect(342, y + 20, 211, 66, 10).fill("#FACC15");
  doc.fillColor("#111111").font("Geist").fontSize(11).text("Celkem k úhradě", 362, y + 34);
  doc.fontSize(24).text(formatCurrency(Number(invoice.total_amount)), 362, y + 50, {
    width: 170,
    align: "right",
  });
}

function drawPayment(
  doc: PDFKit.PDFDocument,
  invoice: NonNullable<Awaited<ReturnType<typeof getInvoice>>>,
  qrBuffer: Buffer,
) {
  const y = 650;
  doc.image(qrBuffer, 42, y, { width: 112, height: 112 });
  doc.fillColor("#111111").font("Geist").fontSize(12).text("QR platba", 170, y + 8);
  doc.font("Geist").fontSize(10).text("Naskenujte v aplikaci vaší banky.", 170, y + 29, {
    width: 220,
  });
  doc.text(`Účet: ${supplier.bankAccount}`, 170, y + 58);
  doc.text(`VS: ${invoice.variable_symbol}`, 170, y + 74);

  if (invoice.note) {
    doc.font("Geist").text("Poznámka", 42, y + 134);
    doc.font("Geist").fontSize(9).text(invoice.note, 42, y + 150, { width: 511 });
  }
}

function paymentQrPayload(invoice: NonNullable<Awaited<ReturnType<typeof getInvoice>>>) {
  const amount = Number(invoice.total_amount).toFixed(2);
  const message = encodeURIComponent(`Faktura ${invoice.invoice_number}`);

  return `SPD*1.0*ACC:CZ6508000000002809697083*AM:${amount}*CC:CZK*X-VS:${invoice.variable_symbol}*MSG:${message}`;
}

async function readLogoAsset() {
  const logoPath = path.join(process.cwd(), "public", "havelkavit-logo.svg");
  await fs.readFile(logoPath, "utf8");
}
