import { getSupabaseAdminClient } from "@/lib/site-settings";

export type Invoice = {
  id: string;
  invoice_number: string;
  variable_symbol: string;
  issue_date: string;
  due_date: string;
  taxable_supply_date: string;
  customer_name: string;
  customer_address: string;
  customer_ico: string;
  customer_dic: string;
  note: string;
  total_amount: number;
  created_at?: string;
  items: InvoiceItem[];
};

export type InvoiceItem = {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
};

export const supplier = {
  name: "Vít Havelka",
  address: ["Litobratřická 1057", "671 67 Hrušovany nad Jevišovkou"],
  ico: "22640401",
  vatNote: "Nejsem plátce DPH.",
  bankAccount: "2809697083/0800",
};

type InvoiceRow = Omit<Invoice, "items">;
type InvoiceItemRow = InvoiceItem & { invoice_id?: string };

export async function getInvoices() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as InvoiceRow[]).map((invoice) => ({ ...invoice, items: [] }));
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase || !id) {
    return null;
  }

  const [{ data: invoice, error: invoiceError }, { data: items, error: itemsError }] =
    await Promise.all([
      supabase.from("invoices").select("*").eq("id", id).maybeSingle(),
      supabase.from("invoice_items").select("*").eq("invoice_id", id).order("sort_order"),
    ]);

  if (invoiceError || itemsError || !invoice) {
    return null;
  }

  return {
    ...(invoice as InvoiceRow),
    items: ((items ?? []) as InvoiceItemRow[]).map((item) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity ?? 0),
      unit: item.unit,
      unit_price: Number(item.unit_price ?? 0),
      total_price: Number(item.total_price ?? 0),
    })),
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("cs-CZ").format(new Date(value));
}
