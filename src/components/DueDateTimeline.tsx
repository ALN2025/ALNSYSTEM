import React from 'react';
import { StyleSheet, Text, View, ScrollView, useWindowDimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseISO, differenceInDays } from 'date-fns';
import { Expense, Creditor } from '../types';
import { formatCurrency, formatShortDate, getExpenseStatus, STATUS_COLORS } from '../utils/format';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

interface Props {
  expenses: Expense[];
  creditors: Creditor[];
  onItemPress?: (expense: Expense) => void;
}

export function DueDateTimeline({ expenses, creditors, onItemPress }: Props) {
  const { width } = useWindowDimensions();
  const itemWidth = width >= 1024 ? 200 : width >= 768 ? 180 : Math.min(160, width * 0.42);
  const upcoming = expenses
    .filter((e) => getExpenseStatus(e) !== 'paid')
    .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="checkmark-done-circle" size={32} color={Colors.success} />
        <Text style={styles.emptyText}>Nenhum vencimento próximo</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      {upcoming.map((expense, index) => {
        const creditor = creditors.find((c) => c.id === expense.creditorId);
        const status = getExpenseStatus(expense);
        const days = differenceInDays(parseISO(expense.dueDate), new Date());
        const color = STATUS_COLORS[status];
        const isOverdue = status === 'overdue';

        return (
          <Pressable
            key={expense.id}
            onPress={() => onItemPress?.(expense)}
            style={({ pressed }) => [styles.item, { width: itemWidth }, pressed && styles.itemPressed]}
          >
            <View style={styles.timeline}>
              <View style={[styles.dot, { backgroundColor: color, borderColor: `${color}44` }]} />
              {index < upcoming.length - 1 && <View style={styles.line} />}
            </View>
            <View
              style={[
                styles.card,
                { borderLeftColor: creditor?.color ?? Colors.primary },
                isOverdue && styles.cardOverdue,
              ]}
            >
              <View style={styles.dayRow}>
                {isOverdue && <Ionicons name="warning" size={12} color={Colors.danger} />}
                <Text style={[styles.dayLabel, isOverdue && styles.dayLabelOverdue]}>
                  {days === 0
                    ? 'HOJE'
                    : days === 1
                      ? 'AMANHÃ'
                      : days < 0
                        ? `${Math.abs(days)}d ATRASADO`
                        : `${days}d`}
                </Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>{expense.title}</Text>
              <Text style={styles.cardCreditor} numberOfLines={1}>{creditor?.name ?? '—'}</Text>
              <Text style={styles.cardAmount}>{formatCurrency(expense.amount)}</Text>
              <Text style={styles.cardDate}>{formatShortDate(expense.dueDate)}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemPressed: {
    opacity: 0.9,
  },
  timeline: {
    alignItems: 'center',
    width: 20,
    paddingTop: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
  },
  cardOverdue: {
    backgroundColor: `${Colors.danger}18`,
    borderColor: `${Colors.danger}66`,
    borderWidth: 1.5,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dayLabelOverdue: {
    color: Colors.danger,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginTop: 4,
  },
  cardCreditor: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  cardAmount: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  cardDate: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
});
