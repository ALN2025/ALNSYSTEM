import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Expense, Creditor } from '../types';
import { formatCurrency, formatRelativeDate, STATUS_COLORS, STATUS_LABELS, getExpenseStatus } from '../utils/format';
import { PAYMENT_METHODS } from '../constants/categories';
import { PixPayButton } from './PixPayButton';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

interface Props {
  expense: Expense;
  creditor?: Creditor;
  onPress?: () => void;
  onMarkPaid?: () => void;
}

export function ExpenseItem({ expense, creditor, onPress, onMarkPaid }: Props) {
  const status = getExpenseStatus(expense);
  const statusColor = STATUS_COLORS[status];
  const method = PAYMENT_METHODS[expense.paymentMethod];

  const isOverdue = status === 'overdue';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        isOverdue && styles.containerOverdue,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>{expense.title}</Text>
            {creditor && (
              <View style={styles.creditorRow}>
                <View style={[styles.dot, { backgroundColor: creditor.color }]} />
                <Text style={styles.creditorName}>{creditor.name}</Text>
              </View>
            )}
          </View>
          <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.tags}>
            <View style={[styles.tag, { backgroundColor: `${statusColor}22` }, isOverdue && styles.tagOverdue]}>
              {isOverdue && <Ionicons name="warning" size={10} color={Colors.danger} />}
              <Text style={[styles.tagText, { color: statusColor }, isOverdue && styles.tagTextOverdue]}>
                {STATUS_LABELS[status]}
              </Text>
            </View>
            <View style={styles.tag}>
              <Ionicons name={method.icon as keyof typeof Ionicons.glyphMap} size={10} color={Colors.textMuted} />
              <Text style={styles.tagText}>{method.label}</Text>
            </View>
            {expense.recurrence === 'monthly' && (
              <View style={styles.tag}>
                <Ionicons name="repeat" size={10} color={Colors.secondary} />
                <Text style={[styles.tagText, { color: Colors.secondary }]}>Mensal</Text>
              </View>
            )}
            {expense.installment && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {expense.installment.current}/{expense.installment.total}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
            <Text style={[styles.date, status === 'overdue' && styles.dateOverdue]}>
              {formatRelativeDate(expense.dueDate)}
            </Text>
          </View>
        </View>
      </View>

      {status !== 'paid' && (
        <View style={styles.actionsCol}>
          {(expense.paymentMethod === 'pix' || creditor?.preferredMethod === 'pix') && creditor?.pixKey && (
            <PixPayButton
              compact
              pixKey={creditor.pixKey}
              merchantName={creditor.name}
              amount={expense.amount}
              description={expense.title}
            />
          )}
          {onMarkPaid && (
            <Pressable onPress={onMarkPaid} style={styles.payButton} hitSlop={8}>
              <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  containerOverdue: {
    borderColor: `${Colors.danger}88`,
    borderWidth: 1.5,
    backgroundColor: `${Colors.danger}0A`,
  },
  pressed: {
    opacity: 0.9,
  },
  statusBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleBlock: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  creditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  creditorName: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  amount: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  tagOverdue: {
    borderWidth: 1,
    borderColor: `${Colors.danger}55`,
  },
  tagTextOverdue: {
    fontWeight: '800',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  dateOverdue: {
    color: Colors.danger,
    fontWeight: '700',
  },
  payButton: {
    justifyContent: 'center',
  },
  actionsCol: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: Spacing.md,
    gap: Spacing.xs,
  },
});
