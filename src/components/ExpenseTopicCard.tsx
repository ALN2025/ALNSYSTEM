import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Creditor } from '../types';
import { CREDITOR_CATEGORIES } from '../constants/categories';
import { formatCurrency } from '../utils/format';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

interface Props {
  creditor: Creditor;
  onAdd: () => void;
}

export function ExpenseTopicCard({ creditor, onAdd }: Props) {
  const category = CREDITOR_CATEGORIES[creditor.category];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <LinearGradient
          colors={[creditor.color, `${creditor.color}88`]}
          style={styles.avatar}
        >
          <Ionicons name={creditor.icon as keyof typeof Ionicons.glyphMap} size={22} color="#FFF" />
        </LinearGradient>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{creditor.name}</Text>
          <View style={[styles.badge, { backgroundColor: `${category.color}22` }]}>
            <Text style={[styles.badgeText, { color: category.color }]}>{category.label}</Text>
          </View>
          {(creditor.monthlyAmount ?? 0) > 0 && (
            <Text style={styles.monthly}>{formatCurrency(creditor.monthlyAmount!)} / mês</Text>
          )}
        </View>
      </View>

      <Pressable onPress={onAdd} style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}>
        <Ionicons name="add-circle-outline" size={18} color={Colors.primaryLight} />
        <Text style={styles.addText}>Registrar pagamento</Text>
      </Pressable>
    </View>
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
    gap: Spacing.md,
  },
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
  info: { flex: 1, gap: 4 },
  name: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  monthly: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.primary}55`,
    backgroundColor: `${Colors.primary}18`,
  },
  addText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  pressed: { opacity: 0.85 },
});
