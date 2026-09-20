import { addMonths, parseISO } from 'date-fns';
import { Expense, Creditor, CreditorCategory } from '../types';
import { CREDITOR_CATEGORIES } from '../constants/categories';
import { getExpenseStatus } from './format';
import { getInstallmentSeriesId, getRecurrenceSeriesId, isRollingMonthly } from './recurrence';

export interface ExpenseGroup {
  key: string;
  creditorId: string;
  seriesId?: string;
  installmentSeriesId?: string;
  label: string;
  categoryLabel: string;
  category: CreditorCategory;
  color: string;
  current?: Expense;
  next?: Expense;
  all: Expense[];
  isMonthlyRolling?: boolean;
  isInstallmentPlan?: boolean;
}

function groupKey(expense: Expense): string {
  const instSid = getInstallmentSeriesId(expense);
  if (instSid) return `${expense.creditorId}:inst:${instSid}`;

  if (expense.recurrence === 'monthly') {
    const sid = getRecurrenceSeriesId(expense) ?? expense.id;
    return `${expense.creditorId}:monthly:${sid}`;
  }

  return `${expense.creditorId}:single:${expense.id}`;
}

function syntheticNextMonthly(expense: Expense): Expense {
  const nextDue = addMonths(parseISO(expense.dueDate), 1);
  return {
    ...expense,
    id: `${expense.id}-next-preview`,
    dueDate: nextDue.toISOString(),
    status: 'pending',
    paidAt: undefined,
  };
}

export function buildExpenseGroups(expenses: Expense[], creditors: Creditor[]): ExpenseGroup[] {
  const groups = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const key = groupKey(expense);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(expense);
  }

  return Array.from(groups.entries())
    .map(([key, items]) => {
      const sorted = [...items].sort((a, b) => {
        if (a.installment && b.installment) {
          return a.installment.current - b.installment.current;
        }
        return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
      });

      const unpaid = sorted.filter((e) => getExpenseStatus(e) !== 'paid');
      const first = items[0];
      const monthlyRolling = isRollingMonthly(first);
      const installmentPlan = Boolean(first.installmentSeriesId);

      let current = unpaid[0];
      let next = unpaid[1];

      if (monthlyRolling && current && !next) {
        next = syntheticNextMonthly(current);
      }

      const creditor = creditors.find((c) => c.id === items[0].creditorId);
      const category = creditor?.category ?? 'other';
      const catInfo = CREDITOR_CATEGORIES[category];

      return {
        key,
        creditorId: items[0].creditorId,
        seriesId: items[0].recurrenceSeriesId,
        installmentSeriesId: items[0].installmentSeriesId,
        label: creditor?.name ?? 'Credor',
        categoryLabel: catInfo.label,
        category,
        color: creditor?.color ?? catInfo.color,
        current,
        next: next?.id.endsWith('-next-preview') ? next : next,
        all: sorted,
        isMonthlyRolling: monthlyRolling,
        isInstallmentPlan: installmentPlan,
      };
    })
    .sort((a, b) => {
      const dateA = a.current?.dueDate ?? a.all[a.all.length - 1]?.dueDate ?? '';
      const dateB = b.current?.dueDate ?? b.all[b.all.length - 1]?.dueDate ?? '';
      return parseISO(dateA || '2099-01-01').getTime() - parseISO(dateB || '2099-01-01').getTime();
    });
}

export function getCompactExpenseGroups(groups: ExpenseGroup[]): ExpenseGroup[] {
  return groups.filter((g) => g.current || g.next);
}

export function filterGroupsByStatus(
  groups: ExpenseGroup[],
  filter: 'all' | 'pending' | 'overdue' | 'paid'
): ExpenseGroup[] {
  if (filter === 'all') return groups;

  return groups.filter((g) => {
    const relevant = [g.current, g.next?.id.endsWith('-next-preview') ? undefined : g.next].filter(
      Boolean
    ) as Expense[];
    if (relevant.length === 0) {
      if (filter === 'paid') return g.all.some((e) => getExpenseStatus(e) === 'paid');
      return false;
    }
    return relevant.some((e) => getExpenseStatus(e) === filter);
  });
}

export function getGroupsForCreditor(groups: ExpenseGroup[], creditorId: string): ExpenseGroup[] {
  return groups.filter((g) => g.creditorId === creditorId);
}

export function getGroupsForCategory(groups: ExpenseGroup[], category: CreditorCategory): ExpenseGroup[] {
  return groups.filter((g) => g.category === category);
}
