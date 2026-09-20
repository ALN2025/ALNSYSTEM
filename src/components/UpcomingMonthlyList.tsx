import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Expense, Creditor } from '../types';
import { formatCurrency, formatShortDate, getExpenseStatus, STATUS_COLORS, STATUS_LABELS } from '../utils/format';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

interface Props {
  items: Expense[];
  creditor?: Creditor;
  title?: string;
}

export function UpcomingMonthlyList({ items, creditor, title = 'Próximas mensalidades' }: Props) {
  const router = useRouter();

  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Ionicons name="repeat" size={18} color={Colors.secondary} />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Recorrente</Text>
        </View>
      </View>

      {items.map((expense) => {
        const status = getExpenseStatus(expense);
        const color = STATUS_COLORS[status];
        return (
          <Pressable
            key={expense.id}
            onPress={() => router.push(`/expense/edit/${expense.id}` as never)}
            style={styles.row}
          >
            <View style={[styles.dot, { backgroundColor: creditor?.color ?? Colors.primary }]} />
            <View style={styles.info}>
              <Text style={styles.rowTitle} numberOfLines={1}>{expense.title}</Text>
              <Text style={styles.rowDate}>Vence em {formatShortDate(expense.dueDate)}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
              <Text style={[styles.status, { color }]}>{STATUS_LABELS[status]}</Text>
            </View>
          </Pressable>
        );
      })}
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
    marginBottom: Spacing.md,
  },
  title: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: `${Colors.secondary}22`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    color: Colors.secondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
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
  info: { flex: 1 },
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
  right: { alignItems: 'flex-end' },
  amount: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  status: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
});
