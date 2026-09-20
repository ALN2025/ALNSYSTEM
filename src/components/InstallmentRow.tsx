import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GuarantorInstallment } from '../types';
import { formatCurrency, formatShortDate } from '../utils/format';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

const STATUS_CONFIG = {
  paid: { label: 'Pago', color: Colors.success, icon: 'checkmark-circle' as const },
  overdue: { label: 'Atrasado', color: Colors.danger, icon: 'alert-circle' as const },
  pending: { label: 'Pendente', color: Colors.warning, icon: 'time' as const },
};

interface Props {
  installment: GuarantorInstallment;
  totalInstallments: number;
  onMarkPaid: () => void;
  onDownload: () => void;
}

export function InstallmentRow({ installment, totalInstallments, onMarkPaid, onDownload }: Props) {
  const config = STATUS_CONFIG[installment.status];

  return (
    <View style={styles.container}>
      <View style={[styles.statusBar, { backgroundColor: config.color }]} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.number}>
              Parcela {installment.number}/{totalInstallments}
            </Text>
            <Text style={styles.dueDate}>Venc: {formatShortDate(installment.dueDate)}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${config.color}22` }]}>
            <Ionicons name={config.icon} size={12} color={config.color} />
            <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.amounts}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Valor base</Text>
            <Text style={styles.amountValue}>{formatCurrency(installment.baseAmount)}</Text>
          </View>

          {installment.lateFeeAmount > 0 && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>
                Juros ({installment.lateFeePercent}% a.m. · {installment.daysLate}d)
              </Text>
              <Text style={[styles.amountValue, styles.lateFee]}>
                + {formatCurrency(installment.lateFeeAmount)}
              </Text>
            </View>
          )}

          <View style={[styles.amountRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>
              {installment.status === 'paid' ? 'Pago' : 'Total a cobrar'}
            </Text>
            <Text style={styles.totalValue}>{formatCurrency(installment.totalDue)}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {installment.status !== 'paid' && (
            <Pressable onPress={onMarkPaid} style={styles.actionBtn}>
              <Ionicons name="checkmark" size={16} color={Colors.success} />
              <Text style={[styles.actionText, { color: Colors.success }]}>Marcar pago</Text>
            </Pressable>
          )}
          <Pressable onPress={onDownload} style={styles.actionBtn}>
            <Ionicons name="download-outline" size={16} color={Colors.primaryLight} />
            <Text style={[styles.actionText, { color: Colors.primaryLight }]}>
              {installment.status === 'paid' ? 'Baixar comprovante' : 'Baixar cobrança'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
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
  statusBar: { width: 4 },
  content: { flex: 1, padding: Spacing.md },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  number: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  dueDate: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  amounts: {
    marginTop: Spacing.sm,
    gap: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  amountValue: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  lateFee: {
    color: Colors.danger,
    fontWeight: '700',
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  totalValue: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
