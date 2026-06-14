import { formatDate } from "@/lib/invoices";
import { isAdminAuthenticated } from "@/lib/supabase-auth";
import { getTaxEvidenceReport, normalizeTaxYear } from "@/lib/tax-evidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const year = normalizeTaxYear(new URL(request.url).searchParams.get("year") ?? undefined);
  const report = await getTaxEvidenceReport(year);
  const rows = [
    ["Typ", "Datum", "Číslo/Název", "Partner", "Kategorie", "Částka", "Poznámka"],
    ...report.incomes.map((invoice) => [
      "Příjem",
      formatDate(invoice.issue_date),
      invoice.invoice_number,
      invoice.customer_name,
      "Faktura",
      Number(invoice.total_amount).toFixed(2),
      invoice.note ?? "",
    ]),
    ...report.expenses.map((expense) => [
      "Výdaj",
      formatDate(expense.expense_date),
      expense.title,
      expense.supplier,
      expense.category,
      Number(expense.amount).toFixed(2),
      expense.note,
    ]),
    [],
    ["Souhrn", "", "Příjmy celkem", "", "", report.incomeTotal.toFixed(2), ""],
    ["Souhrn", "", "Výdaje celkem", "", "", report.expenseTotal.toFixed(2), ""],
    ["Souhrn", "", "Rozdíl", "", "", report.balance.toFixed(2), ""],
  ];
  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="danova-evidence-${year}.csv"`,
    },
  });
}

function csvCell(value: string | number | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}
