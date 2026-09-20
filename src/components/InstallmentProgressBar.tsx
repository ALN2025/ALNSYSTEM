import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { InstallmentStats } from '../utils/installmentStats';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

interface Props {
  stats: InstallmentStats;
  accentColor?: string;
  compact?: boolean;
}

export function InstallmentProgressBar({ stats, accentColor = Colors.secondary, compact }: Props) {
  const pct = Math.round(stats.progress * 100);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.header}>
        <Text style={styles.label}>Progresso das parcelas</Text>
        <Text style={[styles.count, { color: accentColor }]}>
          {stats.paid}/{stats.total} pagas
        </Text>
      </View>
      <View style={styles.track}>
        <LinearGradient
          colors={[accentColor, `${accentColor}AA`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${Math.max(pct, stats.paid > 0 ? 4 : 0)}%` }]}
        />
      </View>
      <View style={styles.legend}>
        {stats.overdue > 0 && (
          <Text style={[styles.legendItem, { color: Colors.danger }]}>
            {stats.overdue} atrasada{stats.overdue > 1 ? 's' : ''}
          </Text>
        )}
        {stats.scheduled > 0 && (
          <Text style={[styles.legendItem, { color: Colors.warning }]}>
            {stats.scheduled} agendada{stats.scheduled > 1 ? 's' : ''}
          </Text>
        )}
        {stats.pending > 0 && (
          <Text style={[styles.legendItem, { color: Colors.textMuted }]}>
            {stats.pending} pendente{stats.pending > 1 ? 's' : ''}
          </Text>
        )}
        {stats.paid === stats.total && stats.total > 0 && (
          <Text style={[styles.legendItem, { color: Colors.success }]}>Todas pagas ✓</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  wrapCompact: {
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  count: {
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  track: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  legendItem: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
