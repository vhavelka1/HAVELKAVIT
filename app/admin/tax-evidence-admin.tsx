import { formatCurrency, formatDate } from "@/lib/invoices";
import {
  expenseCategories,
  type Expense,
  type TaxEvidenceReport,
} from "@/lib/tax-evidence";
import { saveExpense } from "./actions";

export function TaxEvidenceAdmin({
  report,
  years,
}: {
  report: TaxEvidenceReport;
  years: number[];
}) {
  return (
    <section
      id="danova-evidence"
      className="mb-8 rounded-[2rem] border border-white/12 bg-zinc-950/78 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-emerald-200">
            danova evidence
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Daňová evidence</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Jednoduchý roční přehled příjmů z faktur a ručně evidovaných výdajů.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/admin/tax-evidence/export/csv?year=${report.year}`}
            className="inline-flex h-11 items-center rounded-full border border-white/12 bg-white/8 px-5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/14 hover:text-white"
          >
            Export CSV
          </a>
          <a
            href={`/api/admin/tax-evidence/export/pdf?year=${report.year}`}
            className="inline-flex h-11 items-center rounded-full bg-emerald-200 px-5 text-sm font-bold text-zinc-950 transition-colors hover:bg-white"
          >
            Export PDF
          </a>
        </div>
      </div>

      <form action="/login/fake#danova-evidence" className="mb-6 flex flex-wrap items-end gap-3">
        <label className="grid gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
            Rok
          </span>
          <select name="taxYear" defaultValue={report.year} className="admin-input h-12 min-w-36">
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <button className="h-12 rounded-full bg-white/8 px-5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/14 hover:text-white">
          Zobrazit rok
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Příjmy celkem" value={formatCurrency(report.incomeTotal)} tone="green" />
        <SummaryCard label="Výdaje celkem" value={formatCurrency(report.expenseTotal)} tone="pink" />
        <SummaryCard label="Rozdíl" value={formatCurrency(report.balance)} tone="yellow" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
          <h3 className="text-2xl font-semibold text-white">Nový výdaj</h3>
          <form action={saveExpense} className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TaxField label="Datum" name="expense_date" type="date" defaultValue={defaultDate()} />
              <TaxField label="Částka" name="amount" type="number" step="0.01" min="0" />
            </div>
            <TaxField label="Název výdaje" name="title" />
            <TaxField label="Dodavatel" name="supplier" required={false} />
            <label className="grid gap-2">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
                Kategorie
              </span>
              <select name="category" className="admin-input" defaultValue="Ostatní">
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
                Soubor účtenky/faktury
              </span>
              <input
                name="document_file"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                className="admin-input file:mr-4 file:rounded-full file:border-0 file:bg-emerald-200 file:px-4 file:py-2 file:text-sm file:font-bold file:text-zinc-950"
              />
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
                Poznámka
              </span>
              <textarea name="note" className="admin-input min-h-24" />
            </label>
            <button className="h-12 rounded-full bg-emerald-200 px-6 text-sm font-bold text-zinc-950 transition-colors hover:bg-white">
              Uložit výdaj
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
          <h3 className="text-2xl font-semibold text-white">Výdaje podle kategorií</h3>
          <div className="mt-4 grid gap-2">
            {report.categorySummaries.map((summary) => (
              <div
                key={summary.category}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <span className="text-sm font-semibold text-zinc-200">{summary.category}</span>
                <span className="font-mono text-sm font-bold text-white">
                  {formatCurrency(summary.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ExpenseList expenses={report.expenses} />
        <IncomeList incomes={report.incomes} />
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "pink" | "yellow";
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-200 text-zinc-950"
      : tone === "pink"
        ? "bg-pink-200 text-zinc-950"
        : "bg-yellow-200 text-zinc-950";

  return (
    <div className={`rounded-3xl p-5 shadow-xl shadow-black/20 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function ExpenseList({ expenses }: { expenses: Expense[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
      <h3 className="text-2xl font-semibold text-white">Seznam výdajů</h3>
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        {expenses.length === 0 ? (
          <p className="p-4 text-sm text-zinc-400">Pro vybraný rok nejsou uložené žádné výdaje.</p>
        ) : null}
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="grid gap-3 border-b border-white/10 bg-white/4 p-4 text-sm last:border-b-0"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-white">{expense.title}</p>
                <p className="mt-1 text-zinc-400">
                  {formatDate(expense.expense_date)} | {expense.category}
                </p>
              </div>
              <p className="font-mono font-bold text-white">{formatCurrency(expense.amount)}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-zinc-400">
              <span>{expense.supplier || "Bez dodavatele"}</span>
              {expense.document_url ? (
                <a
                  href={expense.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white/8 px-3 py-2 text-xs font-bold text-zinc-100 transition-colors hover:bg-white/14"
                >
                  Zobrazit doklad
                </a>
              ) : null}
            </div>
            {expense.note ? <p className="text-zinc-400">{expense.note}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function IncomeList({ incomes }: { incomes: TaxEvidenceReport["incomes"] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
      <h3 className="text-2xl font-semibold text-white">Příjmy z faktur</h3>
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        {incomes.length === 0 ? (
          <p className="p-4 text-sm text-zinc-400">Pro vybraný rok nejsou vystavené žádné faktury.</p>
        ) : null}
        {incomes.map((invoice) => (
          <div
            key={invoice.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/4 p-4 text-sm last:border-b-0"
          >
            <div>
              <p className="font-bold text-white">{invoice.invoice_number}</p>
              <p className="mt-1 text-zinc-400">
                {formatDate(invoice.issue_date)} | {invoice.customer_name}
              </p>
            </div>
            <p className="font-mono font-bold text-white">
              {formatCurrency(Number(invoice.total_amount))}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaxField({
  label,
  name,
  type = "text",
  defaultValue = "",
  required = true,
  step,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  step?: string;
  min?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        step={step}
        min={min}
        className="admin-input"
      />
    </label>
  );
}

function defaultDate() {
  return new Date().toISOString().slice(0, 10);
}
