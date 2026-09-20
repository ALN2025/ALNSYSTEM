import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Expense, Creditor, CreditorCategory } from '../types';
import { CREDITOR_CATEGORIES } from '../constants/categories';
import { formatCurrency, getExpenseStatus } from '../utils/format';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

interface Props {
  expenses: Expense[];
  creditors: Creditor[];
  onCategoryPress?: (category: CreditorCategory) => void;
}

export function CategoryBreakdown({ expenses, creditors, onCategoryPress }: Props) {
  const pending = expenses.filter((e) => getExpenseStatus(e) !== 'paid');

  const byCategory: Record<string, number> = {};
  for (const expense of pending) {
    const creditor = creditors.find((c) => c.id === expense.creditorId);
    const cat = creditor?.category ?? 'other';
    byCategory[cat] = (byCategory[cat] ?? 0) + expense.amount;
  }

  const entries = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sem despesas pendentes</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {entries.map(([cat, amount]) => {
        const info = CREDITOR_CATEGORIES[cat as keyof typeof CREDITOR_CATEGORIES];
        const pct = total > 0 ? (amount / total) * 100 : 0;
        const interactive = Boolean(onCategoryPress);

        const content = (
          <>
            <View style={styles.labelRow}>
              <View style={[styles.colorDot, { backgroundColor: info.color }]} />
              <Text style={styles.label} numberOfLines={1}>{info.label}</Text>
              <Text style={styles.amount}>{formatCurrency(amount)}</Text>
              {interactive && (
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              )}
            </View>
            <View style={styles.barBg}>
              <View
                style={[styles.barFill, { width: `${pct}%`, backgroundColor: info.color }]}
              />
            </View>
          </>
        );

        if (interactive) {
          return (
            <Pressable
              key={cat}
              onPress={() => onCategoryPress!(cat as CreditorCategory)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              {content}
            </Pressable>
          );
        }

        return (
          <View key={cat} style={styles.row}>
            {content}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  row: {
    gap: 6,
  },
  pressed: {
    opacity: 0.85,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  amount: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  barBg: {
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  empty: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
});
