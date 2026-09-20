import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExpenseGroup } from '../utils/expenseGroups';
import { Creditor } from '../types';
import { formatCurrency, formatShortDate, getExpenseStatus, STATUS_COLORS, STATUS_LABELS } from '../utils/format';
import { PixPayButton } from './PixPayButton';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

interface Props {
  group: ExpenseGroup;
  creditor?: Creditor;
  onHistoryPress?: () => void;
  onAddPress?: () => void;
  onMarkPaid?: (expenseId: string) => void;
  showTapHint?: boolean;
}

function PaymentLine({
  label,
  expense,
  onMarkPaid,
  isPreview,
  creditor,
}: {
  label: string;
  expense: NonNullable<ExpenseGroup['current']>;
  onMarkPaid?: (id: string) => void;
  isPreview?: boolean;
  creditor?: Creditor;
}) {
  const status = isPreview ? 'pending' : getExpenseStatus(expense);
  const color = STATUS_COLORS[status];
  const isOverdue = status === 'overdue';

  return (
    <View style={[styles.line, isOverdue && styles.lineOverdue]}>
      <View style={styles.lineLeft}>
        <Text style={styles.lineLabel}>{label}</Text>
        <Text style={styles.lineDate}>Vence {formatShortDate(expense.dueDate)}</Text>
        {isPreview && (
          <Text style={styles.previewHint}>Gerado automaticamente no próximo mês</Text>
        )}
      </View>
      <View style={styles.lineRight}>
        <Text style={styles.lineAmount}>{formatCurrency(expense.amount)}</Text>
        <View style={[styles.statusBadge, isOverdue && styles.statusBadgeOverdue]}>
          {isOverdue && <Ionicons name="warning" size={12} color={Colors.danger} />}
          <Text style={[styles.lineStatus, { color }]}>{STATUS_LABELS[status]}</Text>
        </View>
      </View>
      {!isPreview && status !== 'paid' && onMarkPaid && (
        <View style={styles.lineActions}>
          {creditor?.pixKey && (expense.paymentMethod === 'pix' || creditor.preferredMethod === 'pix') && (
            <PixPayButton
              compact
              pixKey={creditor.pixKey}
              merchantName={creditor.name}
              amount={expense.amount}
              description={expense.title}
            />
          )}
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onMarkPaid(expense.id);
            }}
            hitSlop={8}
            style={styles.payBtn}
          >
            <Ionicons name="checkmark-circle" size={26} color={Colors.success} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function ExpenseGroupCard({
  group,
  creditor,
  onHistoryPress,
  onAddPress,
  onMarkPaid,
  showTapHint = true,
}: Props) {
  const historyCount = group.all.length;
  const nextIsPreview = group.next?.id.endsWith('-next-preview') ?? false;
  const currentStatus = group.current ? getExpenseStatus(group.current) : null;
  const hasOverdue = currentStatus === 'overdue';

  return (
    <View style={[styles.card, hasOverdue && styles.cardOverdue]}>
      {hasOverdue && (
        <View style={styles.overdueBanner}>
          <Ionicons name="alert-circle" size={16} color="#FFF" />
          <Text style={styles.overdueBannerText}>Pagamento em atraso</Text>
        </View>
      )}
      <View style={[styles.accent, { backgroundColor: hasOverdue ? Colors.danger : group.color }]} />

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.category}>{group.categoryLabel}</Text>
          <Text style={styles.creditor}>{group.label}</Text>
        </View>
        <View style={styles.headerActions}>
          {onAddPress && (
            <Pressable onPress={onAddPress} hitSlop={8} style={styles.addBtn}>
              <Ionicons name="add-circle" size={26} color={Colors.primaryLight} />
            </Pressable>
          )}
          {onHistoryPress && (
            <Pressable onPress={onHistoryPress} hitSlop={8} style={styles.historyBtn}>
              <Text style={styles.historyText}>{historyCount} no histórico</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primaryLight} />
            </Pressable>
          )}
        </View>
      </View>

      {group.current ? (
        <PaymentLine label="Pagamento atual" expense={group.current} onMarkPaid={onMarkPaid} creditor={creditor} />
      ) : (
        <Text style={styles.emptyLine}>Nenhum pagamento pendente</Text>
      )}

      {group.next && (
        <PaymentLine
          label={group.isMonthlyRolling ? 'Próximo mês (automático)' : 'Próximo pagamento'}
          expense={group.next}
          isPreview={nextIsPreview}
          creditor={creditor}
        />
      )}

      {showTapHint && onHistoryPress && (
        <Pressable onPress={onHistoryPress} style={styles.tapHintBtn}>
          <Text style={styles.tapHint}>Ver histórico completo</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardOverdue: {
    borderColor: `${Colors.danger}88`,
    borderWidth: 1.5,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.danger,
    paddingVertical: 6,
  },
  overdueBannerText: {
    color: '#FFF',
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  accent: { height: 3 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  headerText: { flex: 1 },
  headerActions: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  category: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  creditor: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginTop: 2,
  },
  addBtn: {
    padding: 2,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  lineLeft: { flex: 1 },
  lineLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  lineDate: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginTop: 2,
  },
  lineRight: { alignItems: 'flex-end' },
  lineAmount: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  lineOverdue: {
    backgroundColor: `${Colors.danger}10`,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusBadgeOverdue: {
    backgroundColor: `${Colors.danger}22`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  lineStatus: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  previewHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
    fontStyle: 'italic',
  },
  payBtn: { marginLeft: Spacing.xs },
  lineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyLine: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tapHintBtn: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tapHint: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
    fontWeight: '600',
  },
});
