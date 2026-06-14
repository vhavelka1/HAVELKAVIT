import { getInvoices, type Invoice } from "@/lib/invoices";
import { getSupabaseAdminClient } from "@/lib/site-settings";

export const expenseDocumentsBucket = "expense-documents";

export const expenseCategories = [
  "Fototechnika",
  "Objektivy",
  "Paměťové karty",
  "Software",
  "Cestovné",
  "Telefon a internet",
  "Kancelář",
  "Ostatní",
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

export type Expense = {
  id: string;
  expense_date: string;
  title: string;
  supplier: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  document_path: string;
  document_name: string;
  document_mime_type: string;
  document_url?: string;
  created_at?: string;
};

export type CategorySummary = {
  category: ExpenseCategory;
  amount: number;
};

export type TaxEvidenceReport = {
  year: number;
  incomes: Invoice[];
  expenses: Expense[];
  categorySummaries: CategorySummary[];
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
};

type ExpenseRow = Omit<Expense, "amount" | "category"> & {
  amount: number | string;
  category: string;
};

export function normalizeTaxYear(value: string | number | undefined, fallbackDate = new Date()) {
  const year = Number(value);

  if (Number.isInteger(year) && year >= 2000 && year <= 2100) {
    return year;
  }

  return fallbackDate.getFullYear();
}

export async function getTaxEvidenceReport(year: number): Promise<TaxEvidenceReport> {
  const [invoices, expenses] = await Promise.all([getInvoices(), getExpenses(year)]);
  const incomes = invoices.filter((invoice) => new Date(invoice.issue_date).getFullYear() === year);
  const incomeTotal = incomes.reduce((total, invoice) => total + Number(invoice.total_amount), 0);
  const expenseTotal = expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  const categorySummaries = expenseCategories.map((category) => ({
    category,
    amount: expenses
      .filter((expense) => expense.category === category)
      .reduce((total, expense) => total + Number(expense.amount), 0),
  }));

  return {
    year,
    incomes,
    expenses,
    categorySummaries,
    incomeTotal,
    expenseTotal,
    balance: incomeTotal - expenseTotal,
  };
}

export async function getAvailableTaxYears(invoices: Invoice[], expenses: Expense[]) {
  const years = new Set<number>([new Date().getFullYear()]);

  invoices.forEach((invoice) => years.add(new Date(invoice.issue_date).getFullYear()));
  expenses.forEach((expense) => years.add(new Date(expense.expense_date).getFullYear()));

  return Array.from(years).sort((a, b) => b - a);
}

export async function getExpenses(year?: number) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  let query = supabase.from("expenses").select("*").order("expense_date", { ascending: false });

  if (year) {
    query = query.gte("expense_date", `${year}-01-01`).lte("expense_date", `${year}-12-31`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return Promise.all((data as ExpenseRow[]).map((expense) => mapExpense(expense)));
}

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return expenseCategories.includes(value as ExpenseCategory);
}

async function mapExpense(expense: ExpenseRow): Promise<Expense> {
  const documentPath = expense.document_path ?? "";

  return {
    id: String(expense.id),
    expense_date: expense.expense_date,
    title: expense.title,
    supplier: expense.supplier ?? "",
    amount: Number(expense.amount ?? 0),
    category: isExpenseCategory(expense.category) ? expense.category : "Ostatní",
    note: expense.note ?? "",
    document_path: documentPath,
    document_name: expense.document_name ?? "",
    document_mime_type: expense.document_mime_type ?? "",
    document_url: documentPath ? await createExpenseDocumentUrl(documentPath) : "",
    created_at: expense.created_at,
  };
}

async function createExpenseDocumentUrl(path: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase || !path) {
    return "";
  }

  const { data, error } = await supabase.storage
    .from(expenseDocumentsBucket)
    .createSignedUrl(path, 60 * 60);

  if (error || !data) {
    return "";
  }

  return data.signedUrl;
}
