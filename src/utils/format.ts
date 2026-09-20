import { format, parseISO, differenceInDays, isToday, isTomorrow, isPast, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Expense, ExpenseStatus, DashboardStats } from '../types';

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function numberToCurrencyInput(value: number): string {
  if (!value || value <= 0) return '';
  return formatCurrency(value);
}

/** Formata dígitos digitados como moeda BRL (últimos 2 = centavos). */
export function formatCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const cents = parseInt(digits, 10);
  const amount = cents / 100;
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Converte texto formatado (R$ 1.234,56) para número. */
export function parseCurrencyInput(text: string): number {
  const digits = text.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "dd 'de' MMMM", { locale: ptBR });
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd/MM/yyyy');
}

/** Formata dígitos digitados como data DD/MM/AAAA. Aceita colar yyyy-MM-dd. */
export function formatDateInput(raw: string): string {
  const trimmed = raw.trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;

  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function dateFromParts(day: number, month: number, year: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return null;
  const date = new Date(year, month - 1, day, 12, 0, 0);
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return null;
  }
  return date;
}

/** Valida e converte DD/MM/AAAA ou yyyy-MM-dd para Date. */
export function parseDateInput(text: string): Date | null {
  const trimmed = text.trim();

  const br = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) {
    return dateFromParts(parseInt(br[1], 10), parseInt(br[2], 10), parseInt(br[3], 10));
  }

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return dateFromParts(parseInt(iso[3], 10), parseInt(iso[2], 10), parseInt(iso[1], 10));
  }

  return null;
}

/** Converte ISO armazenado para exibição DD/MM/AAAA. */
export function isoToDateInput(iso: string): string {
  if (!iso) return '';
  return format(parseISO(iso), 'dd/MM/yyyy');
}

/** Converte DD/MM/AAAA para ISO ou null se inválido. */
export function dateInputToIso(text: string): string | null {
  const date = parseDateInput(text);
  return date ? date.toISOString() : null;
}

export function formatRelativeDate(dateStr: string): string {
  const date = parseISO(dateStr);
  const days = differenceInDays(date, new Date());

  if (isToday(date)) return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  if (days < 0) return `${Math.abs(days)} dia${Math.abs(days) > 1 ? 's' : ''} atrasado`;
  if (days <= 7) return `Em ${days} dia${days > 1 ? 's' : ''}`;
  return format(date, "dd MMM", { locale: ptBR });
}

export function getExpenseStatus(expense: Expense): ExpenseStatus {
  if (expense.status === 'paid') return 'paid';
  if (expense.status === 'scheduled') return 'scheduled';
  const due = parseISO(expense.dueDate);
  if (isPast(due) && !isToday(due)) return 'overdue';
  return expense.status === 'overdue' ? 'overdue' : 'pending';
}

export function computeStats(expenses: Expense[]): DashboardStats {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  let totalPending = 0;
  let totalPaid = 0;
  let totalOverdue = 0;
  let upcomingCount = 0;
  let monthlyTotal = 0;

  for (const expense of expenses) {
    const status = getExpenseStatus(expense);
    const due = parseISO(expense.dueDate);

    if (status === 'paid') {
      totalPaid += expense.amount;
    } else if (status === 'overdue') {
      totalOverdue += expense.amount;
    } else if (status === 'scheduled' || status === 'pending') {
      totalPending += expense.amount;
      if (differenceInDays(due, now) <= 7 && differenceInDays(due, now) >= 0) {
        upcomingCount++;
      }
    }

    if (isWithinInterval(due, { start: monthStart, end: monthEnd })) {
      monthlyTotal += expense.amount;
    }
  }

  return { totalPending, totalPaid, totalOverdue, upcomingCount, monthlyTotal };
}

export function computeMonthlyCommitments(creditors: { monthlyAmount?: number }[]): number {
  return creditors.reduce((sum, c) => sum + (c.monthlyAmount ?? 0), 0);
}

/** Próximo vencimento no dia preferencial do credor (1–28). */
export function buildMonthlyDueDate(paymentDay: number): string {
  const now = new Date();
  const day = Math.min(Math.max(paymentDay || 1, 1), 28);
  let due = new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0);
  if (due.getTime() <= now.getTime()) {
    due = new Date(now.getFullYear(), now.getMonth() + 1, day, 12, 0, 0);
  }
  return due.toISOString();
}

export const MONTHLY_EXPENSE_PREFIX = 'Pagamento mensal —';

export function isAutoMonthlyExpense(expense: { recurrence: string; title: string }): boolean {
  return expense.recurrence === 'monthly' && expense.title.startsWith(MONTHLY_EXPENSE_PREFIX);
}

/** Máscara CPF/CNPJ enquanto digita. */
export function formatDocumentInput(raw: string, type: 'PF' | 'PJ'): string {
  const digits = raw.replace(/\D/g, '');
  if (type === 'PF') {
    const d = digits.slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  const d = digits.slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function formatDocument(doc: string, type: 'PF' | 'PJ'): string {
  const digits = doc.replace(/\D/g, '');
  if (!digits) return doc;
  return formatDocumentInput(digits, type);
}

/** Máscara telefone enquanto digita. */
export function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return phone;
  return formatPhoneInput(digits);
}

/** Formata dígitos como DD/MM/AAAA HH:MM. */
export function formatDateTimeInput(raw: string): string {
  const trimmed = raw.trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (iso) {
    const base = `${iso[3]}/${iso[2]}/${iso[1]}`;
    return iso[4] != null ? `${base} ${iso[4]}:${iso[5] ?? '00'}` : base;
  }

  const digits = raw.replace(/\D/g, '').slice(0, 12);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} ${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} ${digits.slice(8, 10)}:${digits.slice(10)}`;
}

/** Valida e converte DD/MM/AAAA HH:MM para Date. */
export function parseDateTimeInput(text: string): Date | null {
  const trimmed = text.trim();
  const br = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?$/);
  if (!br) return parseDateInput(text);

  const date = dateFromParts(parseInt(br[1], 10), parseInt(br[2], 10), parseInt(br[3], 10));
  if (!date) return null;

  if (br[4] != null) {
    const hours = parseInt(br[4], 10);
    const minutes = parseInt(br[5], 10);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    date.setHours(hours, minutes, 0, 0);
  }
  return date;
}

/** Formata decimal com vírgula (ex: juros 2,50). */
export function formatDecimalInput(raw: string, maxDecimals = 2): string {
  const normalized = raw.replace(/\./g, ',');
  const cleaned = normalized.replace(/[^\d,]/g, '');
  const commaIdx = cleaned.indexOf(',');
  if (commaIdx === -1) return cleaned;
  const intPart = cleaned.slice(0, commaIdx);
  const decPart = cleaned.slice(commaIdx + 1).replace(/,/g, '').slice(0, maxDecimals);
  return `${intPart},${decPart}`;
}

export function parseDecimalInput(text: string): number {
  const normalized = text.trim().replace(',', '.');
  if (!normalized) return 0;
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

export const STATUS_COLORS: Record<ExpenseStatus, string> = {
  pending: '#FDCB6E',
  paid: '#00B894',
  overdue: '#FF6B6B',
  scheduled: '#74B9FF',
};

export const STATUS_LABELS: Record<ExpenseStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Atrasado',
  scheduled: 'Agendado',
};
