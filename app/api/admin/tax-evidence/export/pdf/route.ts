import fs from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { formatCurrency, formatDate } from "@/lib/invoices";
import { isAdminAuthenticated } from "@/lib/supabase-auth";
import { getTaxEvidenceReport, normalizeTaxYear } from "@/lib/tax-evidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const year = normalizeTaxYear(new URL(request.url).searchParams.get("year") ?? undefined);
  const pdf = await renderTaxEvidencePdf(year);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="danova-evidence-${year}.pdf"`,
    },
  });
}

async function renderTaxEvidencePdf(year: number) {
  const [report, fontBuffer] = await Promise.all([getTaxEvidenceReport(year), readFontAsset()]);
  const buffers: Buffer[] = [];
  const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: false });

  doc.registerFont("Geist", fontBuffer);
  doc.on("data", (chunk: Buffer) => buffers.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
  });

  doc.fillColor("#111111").font("Geist").fontSize(28).text(`Daňová evidence ${year}`);
  doc.moveTo(42, 84).lineTo(553, 84).lineWidth(3).strokeColor("#A7F3D0").stroke();

  const summaryY = 112;
  drawSummary(doc, "Příjmy celkem", formatCurrency(report.incomeTotal), 42, summaryY);
  drawSummary(doc, "Výdaje celkem", formatCurrency(report.expenseTotal), 218, summaryY);
  drawSummary(doc, "Rozdíl", formatCurrency(report.balance), 394, summaryY);

  let y = 210;
  y = drawSectionTitle(doc, "Výdaje podle kategorií", y);
  report.categorySummaries.forEach((summary) => {
    y = drawRow(doc, y, summary.category, formatCurrency(summary.amount));
  });

  y += 18;
  y = drawSectionTitle(doc, "Příjmy z faktur", y);
  report.incomes.forEach((invoice) => {
    y = ensureSpace(doc, y, 24);
    y = drawRow(
      doc,
      y,
      `${formatDate(invoice.issue_date)}  ${invoice.invoice_number}  ${invoice.customer_name}`,
      formatCurrency(Number(invoice.total_amount)),
    );
  });

  y += 18;
  y = drawSectionTitle(doc, "Výdaje", y);
  report.expenses.forEach((expense) => {
    y = ensureSpace(doc, y, 24);
    y = drawRow(
      doc,
      y,
      `${formatDate(expense.expense_date)}  ${expense.title}  ${expense.category}`,
      formatCurrency(expense.amount),
    );
  });

  doc.end();
  return done;
}

function drawSummary(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number) {
  doc.roundedRect(x, y, 159, 62, 10).fill("#F8FAFC");
  doc.roundedRect(x, y, 159, 62, 10).strokeColor("#E5E7EB").lineWidth(1).stroke();
  doc.fillColor("#6B7280").font("Geist").fontSize(8.5).text(label, x + 12, y + 14);
  doc.fillColor("#111111").fontSize(15).text(value, x + 12, y + 34, { width: 135, align: "right" });
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string, y: number) {
  const nextY = ensureSpace(doc, y, 36);
  doc.fillColor("#111111").font("Geist").fontSize(15).text(title, 42, nextY);
  return nextY + 28;
}

function drawRow(doc: PDFKit.PDFDocument, y: number, label: string, value: string) {
  doc.fillColor("#374151").font("Geist").fontSize(9).text(label, 42, y, { width: 360 });
  doc.fillColor("#111111").fontSize(9).text(value, 430, y, { width: 123, align: "right" });
  doc.moveTo(42, y + 16).lineTo(553, y + 16).lineWidth(0.5).strokeColor("#E5E7EB").stroke();
  return y + 24;
}

function ensureSpace(doc: PDFKit.PDFDocument, y: number, needed: number) {
  if (y + needed < 760) {
    return y;
  }

  doc.addPage();
  return 42;
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
