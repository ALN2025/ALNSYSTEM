import { Expense } from '../types';
import { getExpenseStatus } from './format';

export interface InstallmentStats {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  scheduled: number;
  progress: number;
}

export function getInstallmentStats(expenses: Expense[]): InstallmentStats {
  const total = expenses[0]?.installment?.total ?? expenses.length;
  let paid = 0;
  let pending = 0;
  let overdue = 0;
  let scheduled = 0;

  for (const e of expenses) {
    const status = getExpenseStatus(e);
    if (status === 'paid') paid += 1;
    else if (status === 'scheduled') scheduled += 1;
    else if (status === 'overdue') overdue += 1;
    else pending += 1;
  }

  return {
    total,
    paid,
    pending,
    overdue,
    scheduled,
    progress: total > 0 ? paid / total : 0,
  };
}

export function getCreditorInstallmentSummary(
  expenses: Expense[],
  creditorId: string
): InstallmentStats | null {
  const seriesMap = new Map<string, Expense[]>();

  for (const e of expenses) {
    if (e.creditorId !== creditorId || !e.installmentSeriesId) continue;
    const list = seriesMap.get(e.installmentSeriesId) ?? [];
    list.push(e);
    seriesMap.set(e.installmentSeriesId, list);
  }

  if (seriesMap.size === 0) return null;

  let best: InstallmentStats | null = null;
  for (const list of seriesMap.values()) {
    const stats = getInstallmentStats(list);
    if (!best || stats.total > best.total) best = stats;
  }
  return best;
}
