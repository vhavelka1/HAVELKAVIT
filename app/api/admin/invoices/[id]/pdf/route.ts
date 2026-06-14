import fs from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import QRCode from "qrcode";
import {
  formatCurrency,
  formatDate,
  getInvoice,
  supplier,
  verifyInvoiceDownloadToken,
} from "@/lib/invoices";
import { isAdminAuthenticated } from "@/lib/supabase-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paymentIban = "CZ2708000000002809697083";

type InvoicePdf = NonNullable<Awaited<ReturnType<typeof getInvoice>>>;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const canDownload = (await isAdminAuthenticated()) || verifyInvoiceDownloadToken(id, token);

  if (!canDownload) {
    return new Response("Unauthorized", { status: 401 });
  }

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

async function renderInvoicePdf(invoice: InvoicePdf) {
  const [logoDataUrl, fontBuffer] = await Promise.all([readLogoAsset(), readFontAsset()]);
  const qrPayload = paymentQrPayload(invoice);
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 1,
    width: 180,
    color: { dark: "#111111", light: "#FFFFFF" },
  });

  const buffers: Buffer[] = [];
  const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: false });

  doc.registerFont("Geist", fontBuffer);
  doc.on("data", (chunk: Buffer) => buffers.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
  });

  drawHeader(doc, logoDataUrl);
  drawSupplierAndCustomer(doc, invoice);
  drawDates(doc, invoice);
  const paymentY = drawItems(doc, invoice);
  drawPayment(doc, invoice, qrDataUrl, qrPayload, paymentY);
  drawFooter(doc);

  doc.end();
  return done;
}

function drawHeader(doc: PDFKit.PDFDocument, logoDataUrl: string) {
  doc.image(logoDataUrl, 42, 30, { width: 148 });
  doc.fillColor("#111111").font("Geist").fontSize(34).text("FAKTURA", 372, 48, {
    align: "right",
    width: 181,
  });
  doc.fillColor("#6B7280").fontSize(10).text("Daňový doklad", 372, 86, {
    align: "right",
    width: 181,
  });
  doc.moveTo(42, 120).lineTo(553, 120).lineWidth(4).strokeColor("#FACC15").stroke();
}

function drawSupplierAndCustomer(doc: PDFKit.PDFDocument, invoice: InvoicePdf) {
  const y = 150;

  doc.fillColor("#111111").font("Geist").fontSize(9).text("DODAVATEL", 42, y);
  doc.fillColor("#111111").fontSize(13).text(supplier.name, 42, y + 18);
  doc.fillColor("#374151").fontSize(9.5).text(supplier.address.join("\n"), 42, y + 39);
  doc.text(`IČ: ${supplier.ico}`, 42, y + 73);
  doc.text(supplier.vatNote, 42, y + 88);
  doc.text(`Účet: ${supplier.bankAccount}`, 42, y + 103);

  doc.fillColor("#111111").font("Geist").fontSize(9).text("ODBĚRATEL", 322, y);
  doc.fillColor("#111111").fontSize(13).text(invoice.customer_name, 322, y + 18, {
    width: 230,
  });
  doc.fillColor("#374151").fontSize(9.5).text(invoice.customer_address, 322, y + 39, {
    width: 230,
  });

  if (invoice.customer_ico) {
    doc.text(`IČ: ${invoice.customer_ico}`, 322, y + 88, { width: 230 });
  }

  if (invoice.customer_dic) {
    doc.text(`DIČ: ${invoice.customer_dic}`, 322, y + 103, { width: 230 });
  }
}

function drawDates(doc: PDFKit.PDFDocument, invoice: InvoicePdf) {
  const y = 286;
  doc.roundedRect(42, y, 511, 82, 14).fill("#F8FAFC");
  doc.roundedRect(42, y, 511, 82, 14).strokeColor("#E5E7EB").lineWidth(1).stroke();

  const columns = [
    ["Číslo faktury", invoice.invoice_number, 58],
    ["Variabilní symbol", paymentVariableSymbol(invoice.variable_symbol), 178],
    ["Vystavení", formatDate(invoice.issue_date), 318],
    ["Splatnost", formatDate(invoice.due_date), 432],
  ] as const;

  columns.forEach(([label, value, x]) => {
    doc.fillColor("#6B7280").font("Geist").fontSize(8.5).text(label, x, y + 18);
    doc.fillColor("#111111").fontSize(10.5).text(value, x, y + 39, { width: 104 });
  });

  doc.fillColor("#6B7280").fontSize(8.5).text("Datum uskutečnění plnění", 58, y + 62);
  doc.fillColor("#111111").fontSize(10).text(formatDate(invoice.taxable_supply_date), 202, y + 62);
}

function drawItems(doc: PDFKit.PDFDocument, invoice: InvoicePdf) {
  const startY = 404;
  const tableX = 42;

  doc.roundedRect(tableX, startY, 511, 30, 8).fill("#111111");
  doc.fillColor("#FFFFFF").font("Geist").fontSize(9);
  doc.text("Položka", tableX + 12, startY + 10);
  doc.text("Počet", 310, startY + 10);
  doc.text("Cena/ks", 378, startY + 10);
  doc.text("Celkem", 476, startY + 10);

  let y = startY + 36;
  doc.font("Geist").fontSize(9);
  invoice.items.forEach((item, index) => {
    const rowHeight = 34;
    doc.roundedRect(tableX, y, 511, rowHeight, 6).fill(index % 2 === 0 ? "#FFFFFF" : "#F9FAFB");
    doc.fillColor("#111111");
    doc.text(item.description, tableX + 12, y + 10, { width: 245 });
    doc.text(`${item.quantity} ${item.unit}`, 310, y + 10, { width: 58, align: "right" });
    doc.text(formatCurrency(item.unit_price), 378, y + 10, { width: 70, align: "right" });
    doc.text(formatCurrency(item.total_price), 462, y + 10, {
      width: 78,
      align: "right",
    });
    y += rowHeight;
  });

  const summaryY = Math.max(y + 22, 612);
  doc.roundedRect(342, summaryY, 211, 68, 14).fill("#FACC15");
  doc.fillColor("#111111").font("Geist").fontSize(10).text("Celkem k úhradě", 362, summaryY + 16);
  doc.fontSize(23).text(formatCurrency(Number(invoice.total_amount)), 362, summaryY + 32, {
    width: 170,
    align: "right",
  });

  return summaryY;
}

function drawPayment(
  doc: PDFKit.PDFDocument,
  invoice: InvoicePdf,
  qrDataUrl: string,
  qrPayload: string,
  y: number,
) {
  doc.roundedRect(42, y, 274, 122, 14).fill("#F8FAFC");
  doc.roundedRect(42, y, 274, 122, 14).strokeColor("#E5E7EB").lineWidth(1).stroke();
  doc.image(qrDataUrl, 58, y + 15, { width: 92, height: 92 });
  doc.fillColor("#111111").font("Geist").fontSize(13).text("QR platba", 166, y + 22);
  doc.fillColor("#374151").font("Geist").fontSize(9).text(
    "Naskenujte v aplikaci vaší banky.",
    166,
    y + 43,
    { width: 130 },
  );
  doc.text(`Účet: ${supplier.bankAccount}`, 166, y + 76, { width: 130 });
  doc.text(`VS: ${paymentVariableSymbol(invoice.variable_symbol)}`, 166, y + 92, { width: 130 });
  doc.fillColor("#111111").font("Geist").fontSize(5).text(qrPayload, 42, y + 126, {
    width: 511,
  });

  if (invoice.note) {
    doc.fillColor("#111111").font("Geist").fontSize(10).text("Poznámka", 342, y + 84);
    doc.fillColor("#374151").fontSize(9).text(invoice.note, 342, y + 101, {
      ellipsis: true,
      height: 46,
      width: 211,
    });
  }
}

function drawFooter(doc: PDFKit.PDFDocument) {
  doc.moveTo(42, 756).lineTo(553, 756).lineWidth(1).strokeColor("#E5E7EB").stroke();
  doc.fillColor("#111111").font("Geist").fontSize(10).text("Děkujeme za spolupráci.", 42, 770, {
    lineBreak: false,
  });
  doc.fillColor("#6B7280").fontSize(9).text("havelkavit.cz", 452, 770, {
    align: "right",
    lineBreak: false,
    width: 101,
  });
}

function paymentQrPayload(invoice: InvoicePdf) {
  const amount = Number(invoice.total_amount).toFixed(2);
  const variableSymbol = paymentVariableSymbol(invoice.variable_symbol);

  return [
    "SPD",
    "1.0",
    `ACC:${paymentIban}`,
    `AM:${amount}`,
    "CC:CZK",
    "MSG:Faktura",
    "RN:VÍT HAVELKA",
    `X-VS:${variableSymbol}`,
    "",
  ].join("*");
}

function paymentVariableSymbol(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 10) {
    return digits;
  }

  const dateAndSequence = digits.match(/^(\d{8})(\d+)$/);

  if (dateAndSequence) {
    return `${dateAndSequence[1]}${dateAndSequence[2].slice(-2)}`;
  }

  return digits.slice(0, 10);
}

async function readLogoAsset() {
  const logoPath = path.join(process.cwd(), "public", "havelkavit-logo.png");
  const logo = await fs.readFile(logoPath);
  return `data:image/png;base64,${logo.toString("base64")}`;
}

async function readFontAsset() {
  return fs.readFile(
    path.join(
      process.cwd(),
      "node_modules",
      "next",
      "dist",
      "compiled",
      "@vercel",
      "og",
      "Geist-Regular.ttf",
    ),
  );
}
