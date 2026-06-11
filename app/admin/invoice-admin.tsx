import Link from "next/link";
import { formatCurrency, formatDate, supplier, type Invoice } from "@/lib/invoices";
import { saveInvoice } from "./actions";

export function InvoiceAdmin({
  invoices,
  selectedInvoice,
}: {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
}) {
  const defaultDates = getDefaultInvoiceDates();
  const defaultIdentifiers = getNextInvoiceIdentifiers(invoices);

  return (
    <section
      id="fakturace"
      className="mb-8 rounded-[2rem] border border-white/12 bg-zinc-950/78 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-yellow-200">
            fakturace
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Fakturace</h2>
        </div>
        <a
          href="#nova-faktura"
          className="inline-flex h-11 items-center rounded-full bg-yellow-200 px-5 text-sm font-bold text-zinc-950 transition-colors hover:bg-white"
        >
          Nová faktura
        </a>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
          <h3 className="text-xl font-semibold text-white">Seznam faktur</h3>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            {invoices.length === 0 ? (
              <p className="p-4 text-sm text-zinc-400">Zatím nejsou vytvořené žádné faktury.</p>
            ) : null}
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/login/fake?invoice=${invoice.id}#fakturace`}
                className={`grid gap-2 border-b border-white/10 p-4 transition-colors last:border-b-0 hover:bg-white/8 ${
                  selectedInvoice?.id === invoice.id ? "bg-yellow-200/10" : "bg-white/4"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-bold text-yellow-100">
                    {invoice.invoice_number}
                  </span>
                  <span className="text-sm font-black text-white">
                    {formatCurrency(Number(invoice.total_amount))}
                  </span>
                </div>
                <div className="text-sm text-zinc-400">
                  {invoice.customer_name} | splatnost {formatDate(invoice.due_date)}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <InvoiceDetail invoice={selectedInvoice} />
      </div>

      <div id="nova-faktura" className="mt-8 rounded-3xl border border-white/10 bg-white/6 p-5">
        <h3 className="text-2xl font-semibold text-white">Nová faktura</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Dodavatel: {supplier.name}, {supplier.address.join(", ")}, IČ {supplier.ico}.{" "}
          {supplier.vatNote}
        </p>
        <form action={saveInvoice} className="mt-5 grid gap-4 lg:grid-cols-2">
          <InvoiceField label="Číslo faktury" name="invoice_number" defaultValue={defaultIdentifiers.invoiceNumber} />
          <InvoiceField label="Variabilní symbol" name="variable_symbol" defaultValue={defaultIdentifiers.variableSymbol} />
          <InvoiceField label="Datum vystavení" name="issue_date" type="date" defaultValue={defaultDates.today} />
          <InvoiceField label="Datum splatnosti" name="due_date" type="date" defaultValue={defaultDates.tomorrow} />
          <InvoiceField label="Datum uskutečnění plnění" name="taxable_supply_date" type="date" defaultValue={defaultDates.today} />
          <InvoiceField label="Odběratel IČ" name="customer_ico" defaultValue="" />
          <InvoiceField label="Odběratel DIČ" name="customer_dic" defaultValue="" />
          <InvoiceField label="Odběratel název" name="customer_name" defaultValue="" wide />
          <label className="grid gap-2 lg:col-span-2">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
              Odběratel adresa
            </span>
            <textarea name="customer_address" className="admin-input min-h-24" required />
          </label>

          <div className="lg:col-span-2">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
              Položky faktury
            </p>
            <div className="mt-3 grid gap-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 lg:grid-cols-[1fr_90px_90px_130px]"
                >
                  <input
                    name="item_description"
                    className="admin-input"
                    placeholder="Popis položky"
                    required={index === 0}
                  />
                  <input
                    name="item_quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    className="admin-input"
                    placeholder="Počet"
                    defaultValue={index === 0 ? "1" : ""}
                  />
                  <input
                    name="item_unit"
                    className="admin-input"
                    placeholder="Jednotka"
                    defaultValue="ks"
                  />
                  <input
                    name="item_unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    className="admin-input"
                    placeholder="Cena za kus"
                    required={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>

          <label className="grid gap-2 lg:col-span-2">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
              Poznámka
            </span>
            <textarea name="note" className="admin-input min-h-24" />
          </label>

          <div className="lg:col-span-2">
            <button className="h-12 rounded-full bg-yellow-200 px-6 text-sm font-bold text-zinc-950 transition-colors hover:bg-white">
              Uložit fakturu
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function InvoiceDetail({ invoice }: { invoice: Invoice | null }) {
  if (!invoice) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
        <h3 className="text-xl font-semibold text-white">Detail faktury</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Vyber fakturu ze seznamu, nebo vytvoř novou.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-yellow-200">
            detail faktury
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-white">{invoice.invoice_number}</h3>
          <p className="mt-2 text-sm text-zinc-400">{invoice.customer_name}</p>
        </div>
        <a
          href={`/api/admin/invoices/${invoice.id}/pdf`}
          className="inline-flex h-11 items-center rounded-full bg-yellow-200 px-5 text-sm font-bold text-zinc-950 transition-colors hover:bg-white"
        >
          Stáhnout PDF
        </a>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <DetailItem label="Variabilní symbol" value={invoice.variable_symbol} />
        <DetailItem label="Datum vystavení" value={formatDate(invoice.issue_date)} />
        <DetailItem label="Datum splatnosti" value={formatDate(invoice.due_date)} />
        <DetailItem label="DUZP" value={formatDate(invoice.taxable_supply_date)} />
        <DetailItem label="Odběratel IČ" value={invoice.customer_ico || "-"} />
        <DetailItem label="Odběratel DIČ" value={invoice.customer_dic || "-"} />
        <DetailItem label="Celkem k úhradě" value={formatCurrency(Number(invoice.total_amount))} strong />
      </dl>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
        {invoice.items.map((item) => (
          <div key={item.id ?? item.description} className="grid gap-2 border-b border-white/10 p-3 text-sm last:border-b-0 sm:grid-cols-[1fr_auto]">
            <span className="font-semibold text-white">{item.description}</span>
            <span className="text-zinc-300">
              {item.quantity} {item.unit} × {formatCurrency(item.unit_price)} ={" "}
              {formatCurrency(item.total_price)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <dt className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</dt>
      <dd className={`mt-1 ${strong ? "text-xl font-black text-yellow-100" : "font-semibold text-white"}`}>
        {value}
      </dd>
    </div>
  );
}

function InvoiceField({
  label,
  name,
  defaultValue,
  type = "text",
  wide,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  wide?: boolean;
}) {
  return (
    <label className={`grid gap-2 ${wide ? "lg:col-span-2" : ""}`}>
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} className="admin-input" required />
    </label>
  );
}

function getNextInvoiceIdentifiers(invoices: Invoice[]) {
  const now = new Date();
  const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const sequenceText = String(getNextInvoiceSequence(invoices)).padStart(3, "0");

  return {
    invoiceNumber: `${datePrefix}-${sequenceText}`,
    variableSymbol: `${datePrefix}${sequenceText}`,
  };
}

function getNextInvoiceSequence(invoices: Invoice[]) {
  const highestSequence = invoices.reduce((highest, invoice) => {
    const invoiceSequence = extractTrailingSequence(invoice.invoice_number);
    const variableSequence = extractTrailingSequence(invoice.variable_symbol);

    return Math.max(highest, invoiceSequence, variableSequence);
  }, 0);

  return highestSequence + 1;
}

function extractTrailingSequence(value: string) {
  const invoiceNumberMatch = value.match(/-(\d+)$/);

  if (invoiceNumberMatch) {
    const sequence = Number(invoiceNumberMatch[1]);
    return Number.isFinite(sequence) ? sequence : 0;
  }

  const variableSymbolMatch = value.match(/^\d{8}(\d+)$/);

  if (variableSymbolMatch) {
    const sequence = Number(variableSymbolMatch[1]);
    return Number.isFinite(sequence) ? sequence : 0;
  }

  const fallbackMatch = value.match(/(\d+)$/);
  const sequence = Number(fallbackMatch?.[1] ?? 0);
  return Number.isFinite(sequence) ? sequence : 0;
}

function getDefaultInvoiceDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return {
    today: toDateInputValue(today),
    tomorrow: toDateInputValue(tomorrow),
  };
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}
