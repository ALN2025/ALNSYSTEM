import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Creditor } from '../types';
import { CREDITOR_CATEGORIES } from '../constants/categories';
import { formatDocument } from '../utils/format';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

interface Props {
  creditor: Creditor;
  installmentLabel?: string;
  overdueCount?: number;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CreditorCard({ creditor, installmentLabel, overdueCount = 0, onPress, onEdit, onDelete }: Props) {
  const category = CREDITOR_CATEGORIES[creditor.category];
  const hasOverdue = overdueCount > 0;

  return (
    <Pressable onPress={onPress} style={[styles.container, hasOverdue && styles.containerOverdue]}>
      <View style={styles.row}>
        <LinearGradient
          colors={[creditor.color, `${creditor.color}88`]}
          style={styles.avatar}
        >
          <Ionicons name={creditor.icon as keyof typeof Ionicons.glyphMap} size={24} color="#FFF" />
        </LinearGradient>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{creditor.name}</Text>
            {hasOverdue && (
              <View style={styles.overdueBadge}>
                <Ionicons name="warning" size={10} color="#FFF" />
                <Text style={styles.overdueText}>{overdueCount} atraso</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: `${category.color}22` }]}>
              <Ionicons name={category.icon as keyof typeof Ionicons.glyphMap} size={10} color={category.color} />
              <Text style={[styles.badgeText, { color: category.color }]}>{category.label}</Text>
            </View>
            <Text style={styles.type}>{creditor.type}</Text>
          </View>
          {creditor.document ? (
            <Text style={styles.doc}>{formatDocument(creditor.document, creditor.type)}</Text>
          ) : null}
          {installmentLabel ? (
            <Text style={styles.installment}>{installmentLabel}</Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          {onEdit && (
            <Pressable onPress={onEdit} hitSlop={8} style={styles.actionBtn}>
              <Ionicons name="create-outline" size={20} color={Colors.primaryLight} />
            </Pressable>
          )}
          {onDelete && (
            <Pressable onPress={onDelete} hitSlop={8} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={20} color={Colors.danger} />
            </Pressable>
          )}
        </View>
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
  containerOverdue: {
    borderColor: `${Colors.danger}77`,
    borderWidth: 1.5,
    backgroundColor: `${Colors.danger}0D`,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  overdueText: {
    color: '#FFF',
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionBtn: {
    padding: 6,
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  type: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  doc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  installment: {
    color: Colors.secondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginTop: 4,
  },
});
