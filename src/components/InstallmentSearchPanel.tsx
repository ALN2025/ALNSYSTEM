import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Expense, Creditor } from '../types';
import {
  formatCurrency,
  formatShortDate,
  getExpenseStatus,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../utils/format';
import { formatInstallmentLabel, formatMonthLabel } from '../utils/recurrence';
import { InstallmentProgressBar } from './InstallmentProgressBar';
import { PaymentActionPanel } from './PaymentActionPanel';
import { getInstallmentStats } from '../utils/installmentStats';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

interface Props {
  expenses: Expense[];
  creditor?: Creditor;
  onMarkPaid: (id: string) => void;
  onMarkUnpaid: (id: string) => void;
  onMarkScheduled: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function InstallmentSearchPanel({
  expenses,
  creditor,
  onMarkPaid,
  onMarkUnpaid,
  onMarkScheduled,
  onEdit,
}: Props) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(
    () =>
      [...expenses].sort((a, b) => {
        if (a.installment && b.installment) {
          return a.installment.current - b.installment.current;
        }
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }),
    [expenses]
  );

  const stats = getInstallmentStats(sorted);
  const current = sorted.find((e) => {
    const s = getExpenseStatus(e);
    return s !== 'paid';
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return sorted.filter((e) => {
      const num = String(e.installment?.current ?? '');
      const month = formatMonthLabel(e.dueDate).toLowerCase();
      const title = e.title.toLowerCase();
      return num.includes(q) || month.includes(q) || title.includes(q);
    });
  }, [query, sorted]);

  const showList = expanded || query.trim().length > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Ionicons name="layers" size={18} color={Colors.secondary} />
        <Text style={styles.title}>Parcelas {stats.paid}/{stats.total}</Text>
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.toggle}>
          <Text style={styles.toggleText}>{expanded ? 'Ocultar' : 'Buscar'}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'search'} size={14} color={Colors.primaryLight} />
        </Pressable>
      </View>

      <InstallmentProgressBar stats={stats} accentColor={creditor?.color ?? Colors.secondary} />

      {current && creditor && (
        <PaymentActionPanel
          expense={current}
          creditor={creditor}
          onMarkPaid={() => onMarkPaid(current.id)}
          onMarkScheduled={() => onMarkScheduled(current.id)}
          onMarkUnpaid={() => onMarkUnpaid(current.id)}
        />
      )}

      {current && onEdit && (
        <Pressable onPress={() => onEdit(current.id)} style={styles.editLink}>
          <Text style={styles.editText}>Editar parcela</Text>
        </Pressable>
      )}

      {(expanded || query) && (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar parcela (nº ou mês)..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      )}

      {showList && (
        <View style={styles.results}>
          {(query ? filtered : sorted.slice(0, 6)).map((expense) => {
            const status = getExpenseStatus(expense);
            const color = STATUS_COLORS[status];
            const isPaid = status === 'paid';

            return (
              <View key={expense.id} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: creditor?.color ?? Colors.primary }]} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{formatInstallmentLabel(expense)}</Text>
                  <Text style={styles.rowDate}>{formatShortDate(expense.dueDate)}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>{formatCurrency(expense.amount)}</Text>
                  <Text style={[styles.rowStatus, { color }]}>{STATUS_LABELS[status]}</Text>
                </View>
                <Pressable
                  onPress={() => (isPaid ? onMarkUnpaid(expense.id) : onMarkPaid(expense.id))}
                  hitSlop={8}
                >
                  <Ionicons
                    name={isPaid ? 'close-circle' : 'checkmark-circle'}
                    size={24}
                    color={isPaid ? Colors.textMuted : Colors.success}
                  />
                </Pressable>
              </View>
            );
          })}
          {!query && sorted.length > 6 && (
            <Text style={styles.moreHint}>
              Digite na busca para encontrar outras parcelas ({sorted.length} no total)
            </Text>
          )}
          {query && filtered.length === 0 && (
            <Text style={styles.empty}>Nenhuma parcela encontrada</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  title: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  editLink: {
    alignSelf: 'center',
    paddingVertical: Spacing.xs,
  },
  editText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.sm,
    paddingVertical: Spacing.sm,
  },
  results: {
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rowInfo: { flex: 1 },
  rowTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  rowDate: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  rowRight: { alignItems: 'flex-end', marginRight: Spacing.xs },
  rowAmount: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  rowStatus: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  moreHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    paddingTop: Spacing.sm,
    fontStyle: 'italic',
  },
  empty: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
