import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GuarantorAgreement } from '../types';
import { getAgreementStats } from '../utils/guarantor';
import { formatCurrency } from '../utils/format';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

interface Props {
  agreement: GuarantorAgreement;
  onPress: () => void;
}

export function GuarantorCard({ agreement, onPress }: Props) {
  const stats = getAgreementStats(agreement);
  const progress = agreement.installmentCount > 0
    ? stats.paidCount / agreement.installmentCount
    : 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={styles.row}>
        <LinearGradient colors={[agreement.color, `${agreement.color}88`]} style={styles.avatar}>
          <Ionicons name="hand-left" size={22} color="#FFF" />
        </LinearGradient>

        <View style={styles.info}>
          <Text style={styles.friendName} numberOfLines={1}>{agreement.friendName}</Text>
          <Text style={styles.storeName} numberOfLines={1}>
            <Ionicons name="storefront" size={11} color={Colors.textMuted} /> {agreement.storeName}
          </Text>
          <Text style={styles.installments}>
            {stats.paidCount}/{agreement.installmentCount} parcelas pagas
          </Text>
        </View>

        <View style={styles.right}>
          {stats.overdueCount > 0 && (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueText}>{stats.overdueCount} atraso</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </View>
      </View>

      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: agreement.color }]} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>
          Total: {formatCurrency(agreement.totalAmount)}
        </Text>
        {stats.totalOverdue > 0 ? (
          <Text style={styles.footerOverdue}>
            A cobrar: {formatCurrency(stats.totalOverdue)} (+ juros)
          </Text>
        ) : stats.totalPending > 0 ? (
          <Text style={styles.footerPending}>
            Pendente: {formatCurrency(stats.totalPending)}
          </Text>
        ) : (
          <Text style={styles.footerDone}>Quitado</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  friendName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  storeName: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  installments: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  overdueBadge: {
    backgroundColor: `${Colors.danger}22`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  overdueText: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  progressBg: {
    height: 4,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 2,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  footerLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  footerOverdue: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  footerPending: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  footerDone: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
