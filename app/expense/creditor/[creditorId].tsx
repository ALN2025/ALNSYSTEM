import React, { useMemo } from 'react';
import { StyleSheet, ScrollView, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../../src/context/AppContext';
import { ExpenseGroupCard } from '../../../src/components/ExpenseGroupCard';
import { InstallmentSearchPanel } from '../../../src/components/InstallmentSearchPanel';
import { CREDITOR_CATEGORIES } from '../../../src/constants/categories';
import { buildExpenseGroups, getGroupsForCreditor } from '../../../src/utils/expenseGroups';
import { formatCurrency, getExpenseStatus } from '../../../src/utils/format';
import { openNewExpense } from '../../../src/utils/navigation';
import { PixPayButton } from '../../../src/components/PixPayButton';
import { Colors, BorderRadius, FontSize, Spacing } from '../../../src/constants/theme';

export default function CreditorExpensesScreen() {
  const { creditorId } = useLocalSearchParams<{ creditorId: string }>();
  const router = useRouter();
  const { expenses, creditors, getCreditorById, markAsPaid, markAsUnpaid, markAsScheduled } = useApp();

  const creditor = getCreditorById(creditorId!);
  const groups = useMemo(
    () => getGroupsForCreditor(buildExpenseGroups(expenses, creditors), creditorId!),
    [expenses, creditors, creditorId]
  );

  if (!creditor) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Credor não encontrado</Text>
      </View>
    );
  }

  const category = CREDITOR_CATEGORIES[creditor.category];
  const creditorExpenses = expenses.filter((e) => e.creditorId === creditor.id);

  const pendingTotal = creditorExpenses
    .filter((e) => getExpenseStatus(e) !== 'paid')
    .reduce((s, e) => s + e.amount, 0);

  const installmentGroups = groups.filter((g) => g.isInstallmentPlan);
  const rollingGroups = groups.filter((g) => !g.isInstallmentPlan);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <LinearGradient colors={[creditor.color, `${creditor.color}88`]} style={styles.avatar}>
          <Ionicons name={creditor.icon as keyof typeof Ionicons.glyphMap} size={28} color="#FFF" />
        </LinearGradient>
        <Text style={styles.category}>{category.label}</Text>
        <Text style={styles.name}>{creditor.name}</Text>
        {pendingTotal > 0 && (
          <Text style={styles.pending}>{formatCurrency(pendingTotal)} pendente</Text>
        )}
      </View>

      <Pressable onPress={() => openNewExpense(router, creditor.id)} style={styles.newExpenseBtn}>
        <Ionicons name="add-circle" size={20} color="#FFF" />
        <Text style={styles.newExpenseText}>Nova Despesa</Text>
      </Pressable>

      {creditor.pixKey ? (
        <PixPayButton
          pixKey={creditor.pixKey}
          merchantName={creditor.name}
          amount={pendingTotal > 0 ? pendingTotal : undefined}
        />
      ) : null}

      {rollingGroups.map((group) => (
        <ExpenseGroupCard
          key={group.key}
          group={group}
          creditor={creditor}
          onMarkPaid={markAsPaid}
          showTapHint={false}
        />
      ))}

      {installmentGroups.map((group) => (
        <InstallmentSearchPanel
          key={group.key}
          expenses={group.all}
          creditor={creditor}
          onMarkPaid={markAsPaid}
          onMarkUnpaid={markAsUnpaid}
          onMarkScheduled={markAsScheduled}
          onEdit={(id) => router.push(`/expense/edit/${id}` as never)}
        />
      ))}

      <View style={styles.actions}>
        <Pressable onPress={() => router.push(`/creditor/edit/${creditor.id}` as never)} style={styles.editBtn}>
          <Ionicons name="create-outline" size={18} color={Colors.primaryLight} />
          <Text style={styles.editText}>Editar credor</Text>
        </Pressable>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  notFoundText: { color: Colors.textSecondary, fontSize: FontSize.md },
  header: { alignItems: 'center', marginBottom: Spacing.lg },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  category: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginTop: 4,
  },
  pending: {
    color: Colors.warning,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  newExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  newExpenseText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
