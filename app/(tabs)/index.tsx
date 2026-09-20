import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../../src/components/GradientBackground';
import { StatCard } from '../../src/components/StatCard';
import { DueDateTimeline } from '../../src/components/DueDateTimeline';
import { CategoryBreakdown } from '../../src/components/CategoryBreakdown';
import { SectionHeader } from '../../src/components/SectionHeader';
import { ResponsiveContainer } from '../../src/components/ResponsiveContainer';
import { useApp } from '../../src/context/AppContext';
import { useResponsive } from '../../src/hooks/useResponsive';
import { computeStats, formatCurrency, getExpenseStatus } from '../../src/utils/format';
import { getAgreementStats } from '../../src/utils/guarantor';
import { buildExpenseGroups } from '../../src/utils/expenseGroups';
import { CreditorCategory } from '../../src/types';
import { Colors, FontSize, Spacing } from '../../src/constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const r = useResponsive();
  const { expenses, creditors, guarantorAgreements, loading } = useApp();

  const groups = useMemo(
    () => buildExpenseGroups(expenses, creditors),
    [expenses, creditors]
  );

  const timelineExpenses = useMemo(
    () => groups.filter((g) => g.current).map((g) => g.current!),
    [groups]
  );

  const overdueExpenses = useMemo(
    () => expenses.filter((e) => getExpenseStatus(e) === 'overdue'),
    [expenses]
  );

  const upcomingExpenses = useMemo(
    () =>
      expenses
        .filter((e) => {
          const s = getExpenseStatus(e);
          return s === 'pending' || s === 'scheduled';
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [expenses]
  );

  const handleCategoryPress = (category: CreditorCategory) => {
    const inCategory = creditors.filter((c) => c.category === category);
    if (inCategory.length === 0) return;

    let target = inCategory[0];
    let maxPending = 0;
    for (const creditor of inCategory) {
      const pending = expenses
        .filter((e) => e.creditorId === creditor.id && getExpenseStatus(e) !== 'paid')
        .reduce((s, e) => s + e.amount, 0);
      if (pending > maxPending) {
        maxPending = pending;
        target = creditor;
      }
    }
    router.push(`/expense/creditor/${target.id}` as never);
  };

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </GradientBackground>
    );
  }

  const stats = computeStats(expenses);
  const guarantorOverdue = guarantorAgreements.reduce((sum, a) => sum + getAgreementStats(a).totalOverdue, 0);

  const goToCreditorHub = (creditorId: string) => {
    router.push(`/expense/creditor/${creditorId}` as never);
  };

  const goToFirstExpenseCreditor = (list: typeof expenses) => {
    const first = list[0];
    if (first) goToCreditorHub(first.creditorId);
    else router.push('/(tabs)/expenses');
  };

  return (
    <GradientBackground>
      <View style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: Spacing.xl }]}
        >
          <ResponsiveContainer>
            <LinearGradient
              colors={['#6C5CE7', '#A29BFE', '#FD79A8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <Text style={styles.heroLabel}>Total do mês</Text>
              <Text style={[styles.heroValue, { fontSize: r.heroFontSize }]}>
                {formatCurrency(stats.monthlyTotal)}
              </Text>
              <View style={[styles.heroRow, r.isCompact && styles.heroRowCompact]}>
                <Pressable style={styles.heroStat} onPress={() => router.push('/(tabs)/expenses')}>
                  <Text style={styles.heroStatValue}>{formatCurrency(stats.totalPending)}</Text>
                  <Text style={styles.heroStatLabel}>Pendente →</Text>
                </Pressable>
                <View style={styles.heroDivider} />
                <Pressable
                  style={styles.heroStat}
                  onPress={() => goToFirstExpenseCreditor(overdueExpenses)}
                >
                  <Text style={[styles.heroStatValue, stats.totalOverdue > 0 && styles.heroOverdueValue]}>
                    {formatCurrency(stats.totalOverdue)}
                  </Text>
                  <Text style={[styles.heroStatLabel, stats.totalOverdue > 0 && styles.heroOverdueLabel]}>
                    Atrasado →
                  </Text>
                </Pressable>
                <View style={styles.heroDivider} />
                <Pressable style={styles.heroStat} onPress={() => router.push('/(tabs)/expenses')}>
                  <Text style={styles.heroStatValue}>{formatCurrency(stats.totalPaid)}</Text>
                  <Text style={styles.heroStatLabel}>Pago →</Text>
                </Pressable>
              </View>
            </LinearGradient>

            {guarantorAgreements.length > 0 && (
              <Pressable onPress={() => router.push('/(tabs)/guarantor')} style={styles.guarantorBanner}>
                <Ionicons name="hand-left" size={22} color={Colors.accent} />
                <View style={styles.guarantorBannerInfo}>
                  <Text style={styles.guarantorBannerTitle}>
                    Fiador — {guarantorAgreements.length} acordo{guarantorAgreements.length > 1 ? 's' : ''}
                  </Text>
                  {guarantorOverdue > 0 ? (
                    <Text style={styles.guarantorBannerSub}>
                      {formatCurrency(guarantorOverdue)} a cobrar (com juros)
                    </Text>
                  ) : (
                    <Text style={styles.guarantorBannerSub}>Tudo em dia com seus amigos</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </Pressable>
            )}

            <View style={[styles.statsGrid, { gap: r.sectionGap }]}>
              <StatCard
                label="Credores"
                value={String(creditors.length)}
                icon="people"
                gradient={Colors.gradients.primary}
                onPress={() => router.push('/(tabs)/creditors')}
                style={{ flexBasis: r.isDesktop ? '23%' : '47%', flexGrow: 1, maxWidth: r.isDesktop ? '25%' : '48%' }}
              />
              <StatCard
                label="Despesas"
                value={String(groups.length)}
                icon="receipt"
                gradient={Colors.gradients.secondary}
                onPress={() => router.push('/(tabs)/expenses')}
                style={{ flexBasis: r.isDesktop ? '23%' : '47%', flexGrow: 1, maxWidth: r.isDesktop ? '25%' : '48%' }}
              />
              <StatCard
                label="Vencendo"
                value={String(stats.upcomingCount)}
                icon="alarm"
                gradient={Colors.gradients.sunset}
                onPress={() => goToFirstExpenseCreditor(upcomingExpenses)}
                style={{ flexBasis: r.isDesktop ? '23%' : '47%', flexGrow: 1, maxWidth: r.isDesktop ? '25%' : '48%' }}
              />
              <StatCard
                label="Atrasadas"
                value={String(overdueExpenses.length)}
                icon="warning"
                gradient={Colors.gradients.accent}
                alert={overdueExpenses.length > 0}
                onPress={() => goToFirstExpenseCreditor(overdueExpenses)}
                style={{ flexBasis: r.isDesktop ? '23%' : '47%', flexGrow: 1, maxWidth: r.isDesktop ? '25%' : '48%' }}
              />
            </View>

            <View style={[r.isDesktop && styles.twoCol, { gap: r.sectionGap }]}>
              <View style={r.isDesktop ? styles.col : undefined}>
                <SectionHeader title="Próximos Vencimentos" />
                <DueDateTimeline
                  expenses={timelineExpenses}
                  creditors={creditors}
                  onItemPress={(expense) => goToCreditorHub(expense.creditorId)}
                />
              </View>
              <View style={r.isDesktop ? styles.col : undefined}>
                <SectionHeader title="Por Categoria" />
                <View style={styles.sectionCard}>
                  <CategoryBreakdown
                    expenses={expenses}
                    creditors={creditors}
                    onCategoryPress={handleCategoryPress}
                  />
                </View>
              </View>
            </View>
          </ResponsiveContainer>
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroCard: {
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  heroValue: {
    color: '#FFF',
    fontWeight: '800',
    marginVertical: Spacing.sm,
  },
  heroRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  heroRowCompact: {
    flexWrap: 'wrap',
    gap: 8,
  },
  heroStat: { flex: 1, alignItems: 'center', minWidth: 80 },
  heroStatValue: {
    color: '#FFF',
    fontSize: FontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  heroOverdueValue: {
    color: '#FFE3E3',
    textShadowColor: 'rgba(255,107,107,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  heroOverdueLabel: {
    color: '#FFD0D0',
    fontWeight: '800',
  },
  heroDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: Spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  twoCol: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  col: {
    flex: 1,
    minWidth: 0,
  },
  guarantorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guarantorBannerInfo: { flex: 1, minWidth: 0 },
  guarantorBannerTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  guarantorBannerSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
