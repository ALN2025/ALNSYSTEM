import React, { useMemo, useState } from 'react';
import { StyleSheet, View, FlatList, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../../src/components/GradientBackground';
import { GuarantorCard } from '../../src/components/GuarantorCard';
import { EmptyState, SectionHeader } from '../../src/components/SectionHeader';
import { FloatingActionButton } from '../../src/components/FloatingActionButton';
import { PremiumPaywall } from '../../src/components/PremiumPaywall';
import { GetProButton } from '../../src/components/GetProButton';
import { useApp } from '../../src/context/AppContext';
import { getAgreementStats } from '../../src/utils/guarantor';
import { formatCurrency } from '../../src/utils/format';
import { Colors, BorderRadius, FontSize, Spacing } from '../../src/constants/theme';

export default function GuarantorScreen() {
  const router = useRouter();
  const { guarantorAgreements, isPremium } = useApp();
  const [showPremium, setShowPremium] = useState(false);
  const premium = isPremium();

  const openNew = () => {
    if (!premium) {
      setShowPremium(true);
      return;
    }
    router.push('/guarantor/new');
  };

  const totals = useMemo(() => {
    let overdue = 0;
    let pending = 0;
    let lateFees = 0;
    for (const a of guarantorAgreements) {
      const s = getAgreementStats(a);
      overdue += s.totalOverdue;
      pending += s.totalPending;
      lateFees += s.totalLateFees;
    }
    return { overdue, pending, lateFees };
  }, [guarantorAgreements]);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <SectionHeader title="Fiador" />
          <View style={styles.offlineBadge}>
            <Ionicons name="cloud-offline" size={14} color={Colors.secondary} />
            <Text style={styles.offlineText}>100% offline</Text>
          </View>
        </View>

        {guarantorAgreements.length > 0 && (
          <View style={styles.summary}>
            {totals.overdue > 0 && (
              <View style={[styles.summaryItem, styles.summaryDanger]}>
                <Text style={styles.summaryLabel}>Em atraso + juros</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totals.overdue)}</Text>
              </View>
            )}
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pendente</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totals.pending)}</Text>
            </View>
            {totals.lateFees > 0 && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Juros acumulados</Text>
                <Text style={[styles.summaryValue, { color: Colors.danger }]}>
                  {formatCurrency(totals.lateFees)}
                </Text>
              </View>
            )}
          </View>
        )}

        <FlatList
          data={guarantorAgreements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="hand-left-outline"
              title="Nenhum acordo de fiador"
              subtitle="Registre quando você for fiador de um amigo em compras parceladas na loja. Controle parcelas, juros por atraso e baixe comprovantes offline."
              actionLabel={premium ? 'Novo Acordo' : 'Desbloquear Pro'}
              onAction={openNew}
            />
          }
          renderItem={({ item }) => (
            <GuarantorCard
              agreement={item}
              onPress={() => router.push(`/guarantor/${item.id}`)}
            />
          )}
        />

        {!premium && (
          <View style={styles.proBanner}>
            <GetProButton onPress={() => setShowPremium(true)} />
          </View>
        )}

        {premium && <FloatingActionButton icon="hand-left" onPress={openNew} />}
        <PremiumPaywall
          visible={showPremium}
          onClose={() => setShowPremium(false)}
          reason="O módulo Fiador faz parte do Meu Controle Pro."
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.secondary}22`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  offlineText: {
    color: Colors.secondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryDanger: {
    borderColor: `${Colors.danger}44`,
    backgroundColor: `${Colors.danger}11`,
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  summaryValue: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 160,
  },
  proBanner: {
    position: 'absolute',
    bottom: 130,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
