import { addMonths, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Expense } from '../types';
import { getExpenseStatus } from './format';

export function getRecurrenceSeriesId(expense: Expense): string | null {
  if (expense.recurrence !== 'monthly') return null;
  return expense.recurrenceSeriesId ?? expense.id;
}

export function getInstallmentSeriesId(expense: Expense): string | null {
  return expense.installmentSeriesId ?? null;
}

export function isRollingMonthly(expense: Expense): boolean {
  return (
    expense.recurrence === 'monthly' &&
    !expense.installmentSeriesId &&
    !(expense.installment?.total && expense.installment.total > 1)
  );
}

export function isInstallmentSeries(expense: Expense): boolean {
  return Boolean(expense.installmentSeriesId && expense.installment?.total && expense.installment.total > 1);
}

/** Normaliza IDs de série e status — sem gerar mensalidades futuras. */
export function normalizeExpenses(expenses: Expense[]): Expense[] {
  return expenses.map((e) => {
    let next = { ...e, status: getExpenseStatus(e) };
    if (next.recurrence === 'monthly' && !next.recurrenceSeriesId) {
      next = { ...next, recurrenceSeriesId: next.id };
    }
    return next;
  });
}

/** Remove mensalidades futuras duplicadas (legado) — mantém só a cobrança atual. */
export function dedupeMonthlySeries(expenses: Expense[]): Expense[] {
  const monthlySeries = new Map<string, Expense[]>();
  const others: Expense[] = [];

  for (const expense of expenses) {
    if (isRollingMonthly(expense)) {
      const sid = getRecurrenceSeriesId(expense) ?? expense.id;
      if (!monthlySeries.has(sid)) monthlySeries.set(sid, []);
      monthlySeries.get(sid)!.push(expense);
    } else {
      others.push(expense);
    }
  }

  const kept: Expense[] = [];
  for (const [, series] of monthlySeries) {
    const unpaid = series
      .filter((e) => getExpenseStatus(e) !== 'paid')
      .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
    const paid = series.filter((e) => getExpenseStatus(e) === 'paid');

    kept.push(...paid);
    if (unpaid.length > 0) {
      kept.push(unpaid[0]);
    }
  }

  return normalizeExpenses([...others, ...kept]);
}

/** Compat: não gera mais 12 meses — só deduplica e normaliza. */
export function syncMonthlyRecurrenceExpenses(expenses: Expense[]): Expense[] {
  return dedupeMonthlySeries(expenses);
}

export function getSeriesExpenses(expenses: Expense[], expense: Expense): Expense[] {
  if (expense.installmentSeriesId) {
    return expenses
      .filter((e) => e.installmentSeriesId === expense.installmentSeriesId)
      .sort((a, b) => (a.installment?.current ?? 0) - (b.installment?.current ?? 0));
  }

  const sid = getRecurrenceSeriesId(expense);
  if (!sid) return [expense];

  return expenses
    .filter((e) => e.recurrence === 'monthly' && (e.recurrenceSeriesId ?? e.id) === sid)
    .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
}

export function getUpcomingSeriesExpenses(expenses: Expense[], expense: Expense): Expense[] {
  const now = new Date();
  return getSeriesExpenses(expenses, expense).filter(
    (e) => getExpenseStatus(e) !== 'paid' && parseISO(e.dueDate) >= now
  );
}

export function advanceMonthlyDueDate(expense: Expense): string {
  const next = addMonths(parseISO(expense.dueDate), 1);
  next.setHours(12, 0, 0, 0);
  return next.toISOString();
}

export function formatInstallmentLabel(expense: Expense): string {
  if (!expense.installment) return expense.title;
  return `Parcela ${expense.installment.current}/${expense.installment.total}`;
}

export function formatMonthLabel(dateStr: string): string {
  return format(parseISO(dateStr), 'MMMM yyyy', { locale: ptBR });
}

export function buildInstallmentSeriesExpenses(
  base: Omit<Expense, 'id' | 'createdAt' | 'notificationIds' | 'status'>,
  total: number,
  seriesId: string
): Omit<Expense, 'id' | 'createdAt' | 'notificationIds' | 'status'>[] {
  const anchor = parseISO(base.dueDate);
  anchor.setHours(12, 0, 0, 0);

  return Array.from({ length: total }, (_, index) => {
    const due = addMonths(anchor, index);
    due.setHours(12, 0, 0, 0);
    const current = index + 1;
    return {
      ...base,
      title: `${base.title} — ${current}/${total}`,
      dueDate: due.toISOString(),
      recurrence: 'none' as const,
      recurrenceSeriesId: undefined,
      installment: { current, total },
      installmentSeriesId: seriesId,
    };
  });
}
