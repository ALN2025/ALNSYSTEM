import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Expense, Creditor } from '../types';
import { PAYMENT_METHODS } from '../constants/categories';
import {
  formatCurrency,
  formatShortDate,
  getExpenseStatus,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../utils/format';
import { formatInstallmentLabel } from '../utils/recurrence';
import { PixPayButton } from './PixPayButton';
import { showToast } from '../utils/toast';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

interface Props {
  expense: Expense;
  creditor: Creditor;
  onMarkPaid: () => void;
  onMarkScheduled: () => void;
  onMarkUnpaid?: () => void;
}

export function PaymentActionPanel({
  expense,
  creditor,
  onMarkPaid,
  onMarkScheduled,
  onMarkUnpaid,
}: Props) {
  const [confirming, setConfirming] = useState<'paid' | 'scheduled' | null>(null);
  const status = getExpenseStatus(expense);
  const statusColor = STATUS_COLORS[status];
  const method = PAYMENT_METHODS[expense.paymentMethod] ?? PAYMENT_METHODS[creditor.preferredMethod];
  const isPaid = status === 'paid';
  const showTransfer = expense.paymentMethod === 'transfer' || Boolean(creditor.bankInfo.bank);

  const copyBank = async (text: string, label: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    showToast(`${label} copiado`, 'success');
  };

  const handleConfirmPaid = () => {
    setConfirming(null);
    onMarkPaid();
  };

  const handleConfirmScheduled = () => {
    setConfirming(null);
    onMarkScheduled();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>
            {expense.installment ? formatInstallmentLabel(expense) : expense.title}
          </Text>
          <Text style={styles.meta}>
            Vence {formatShortDate(expense.dueDate)} · {formatCurrency(expense.amount)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22`, borderColor: `${statusColor}55` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[status]}</Text>
        </View>
      </View>

      {status === 'scheduled' && expense.scheduledPayDate && (
        <View style={styles.scheduledBox}>
          <Ionicons name="calendar" size={16} color={Colors.warning} />
          <Text style={styles.scheduledText}>
            Pagamento agendado para {formatShortDate(expense.scheduledPayDate)}
          </Text>
        </View>
      )}

      {showTransfer && (
        <View style={styles.transferBox}>
          <View style={styles.transferHeader}>
            <Ionicons name="business" size={18} color={Colors.primaryLight} />
            <Text style={styles.transferTitle}>Dados para transferência</Text>
          </View>
          {creditor.bankInfo.bank ? (
            <Pressable onPress={() => copyBank(creditor.bankInfo.bank, 'Banco')} style={styles.transferRow}>
              <Text style={styles.transferLabel}>Banco</Text>
              <Text style={styles.transferValue}>{creditor.bankInfo.bank}</Text>
              <Ionicons name="copy-outline" size={16} color={Colors.textMuted} />
            </Pressable>
          ) : null}
          {creditor.bankInfo.agency ? (
            <Pressable
              onPress={() => copyBank(`${creditor.bankInfo.agency} / ${creditor.bankInfo.account}`, 'Agência/Conta')}
              style={styles.transferRow}
            >
              <Text style={styles.transferLabel}>Agência / Conta</Text>
              <Text style={styles.transferValue}>
                {creditor.bankInfo.agency} · {creditor.bankInfo.account}
              </Text>
              <Ionicons name="copy-outline" size={16} color={Colors.textMuted} />
            </Pressable>
          ) : null}
          {creditor.document ? (
            <Pressable onPress={() => copyBank(creditor.document, 'Documento')} style={styles.transferRow}>
              <Text style={styles.transferLabel}>Favorecido</Text>
              <Text style={styles.transferValue}>{creditor.name}</Text>
              <Ionicons name="copy-outline" size={16} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      )}

      <View style={styles.methodRow}>
        <Ionicons name={method.icon as keyof typeof Ionicons.glyphMap} size={16} color={Colors.textMuted} />
        <Text style={styles.methodText}>Forma: {method.label}</Text>
      </View>

      {!isPaid && (
        <View style={styles.actions}>
          {creditor.pixKey && (
            <PixPayButton
              pixKey={creditor.pixKey}
              merchantName={creditor.name}
              amount={expense.amount}
              description={expense.title}
            />
          )}

          {confirming === 'paid' ? (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>Confirmar que o pagamento foi efetuado?</Text>
              <View style={styles.confirmRow}>
                <Pressable onPress={() => setConfirming(null)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={handleConfirmPaid}>
                  <LinearGradient colors={[...Colors.gradients.secondary]} style={styles.confirmBtn}>
                    <Ionicons name="checkmark-done" size={18} color="#FFF" />
                    <Text style={styles.confirmBtnText}>Sim, pago</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          ) : confirming === 'scheduled' ? (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>Marcar como pagamento agendado?</Text>
              <View style={styles.confirmRow}>
                <Pressable onPress={() => setConfirming(null)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={handleConfirmScheduled}>
                  <LinearGradient colors={[...Colors.gradients.sunset]} style={styles.confirmBtn}>
                    <Ionicons name="calendar" size={18} color="#FFF" />
                    <Text style={styles.confirmBtnText}>Agendar</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.btnRow}>
              <Pressable onPress={() => setConfirming('paid')} style={styles.paidBtn}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.paidBtnText}>Pagamento concluído</Text>
              </Pressable>
              <Pressable onPress={() => setConfirming('scheduled')} style={styles.scheduledBtn}>
                <Ionicons name="time" size={20} color={Colors.warning} />
                <Text style={styles.scheduledBtnText}>Pagamento agendado</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {isPaid && onMarkUnpaid && (
        <Pressable onPress={onMarkUnpaid} style={styles.unpaidBtn}>
          <Ionicons name="arrow-undo" size={16} color={Colors.textMuted} />
          <Text style={styles.unpaidText}>Desfazer pagamento</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  headerLeft: { flex: 1 },
  title: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  scheduledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Colors.warning}18`,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: `${Colors.warning}33`,
  },
  scheduledText: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    fontWeight: '600',
    flex: 1,
  },
  transferBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  transferHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  transferTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  transferLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    width: 88,
  },
  transferValue: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  methodText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  actions: { gap: Spacing.sm },
  btnRow: { gap: Spacing.sm },
  paidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.success}18`,
    borderWidth: 1,
    borderColor: `${Colors.success}44`,
  },
  paidBtnText: {
    color: Colors.success,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  scheduledBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.warning}14`,
    borderWidth: 1,
    borderColor: `${Colors.warning}33`,
  },
  scheduledBtnText: {
    color: Colors.warning,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  confirmBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  confirmText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  confirmRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  unpaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  unpaidText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
