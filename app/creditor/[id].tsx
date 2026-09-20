import React from 'react';
import { StyleSheet, ScrollView, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../src/context/AppContext';
import { ExpenseGroupCard } from '../../src/components/ExpenseGroupCard';
import { InstallmentSearchPanel } from '../../src/components/InstallmentSearchPanel';
import { buildExpenseGroups, getGroupsForCreditor } from '../../src/utils/expenseGroups';
import { CREDITOR_CATEGORIES, PAYMENT_METHODS, CREDITOR_TYPES } from '../../src/constants/categories';
import { formatDocument, formatPhone, formatCurrency, getExpenseStatus } from '../../src/utils/format';
import { confirmAlert } from '../../src/utils/alert';
import { PixPayButton } from '../../src/components/PixPayButton';
import { Colors, BorderRadius, FontSize, Spacing } from '../../src/constants/theme';

export default function CreditorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getCreditorById, expenses, deleteCreditor, markAsPaid, markAsUnpaid, markAsScheduled } = useApp();

  const creditor = getCreditorById(id!);

  if (!creditor) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Credor não encontrado</Text>
      </View>
    );
  }

  const category = CREDITOR_CATEGORIES[creditor.category];
  const method = PAYMENT_METHODS[creditor.preferredMethod];
  const groups = getGroupsForCreditor(buildExpenseGroups(expenses, [creditor]), creditor.id);
  const installmentGroups = groups.filter((g) => g.isInstallmentPlan);
  const rollingGroups = groups.filter((g) => !g.isInstallmentPlan);
  const relatedExpenses = expenses.filter((e) => e.creditorId === creditor.id);
  const totalPending = relatedExpenses
    .filter((e) => getExpenseStatus(e) !== 'paid')
    .reduce((s, e) => s + e.amount, 0);

  const handleDelete = () => {
    confirmAlert(
      'Excluir credor',
      `Deseja excluir "${creditor.name}" e todas as despesas vinculadas?`,
      async () => {
        await deleteCreditor(creditor.id);
        router.back();
      }
    );
  };

  const InfoRow = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) => {
    if (!value) return null;
    return (
      <View style={styles.infoRow}>
        <Ionicons name={icon} size={18} color={Colors.textMuted} />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <LinearGradient colors={[creditor.color, `${creditor.color}88`]} style={styles.avatar}>
          <Ionicons name={creditor.icon as keyof typeof Ionicons.glyphMap} size={36} color="#FFF" />
        </LinearGradient>
        <Text style={styles.name}>{creditor.name}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: `${category.color}22` }]}>
            <Text style={[styles.badgeText, { color: category.color }]}>{category.label}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{CREDITOR_TYPES[creditor.type]}</Text>
          </View>
        </View>
        {totalPending > 0 && (
          <Text style={styles.pending}>{formatCurrency(totalPending)} pendente</Text>
        )}
        {(creditor.monthlyAmount ?? 0) > 0 && (
          <Text style={styles.monthly}>
            {formatCurrency(creditor.monthlyAmount!)} / mês
          </Text>
        )}

        <Pressable onPress={() => router.push(`/creditor/edit/${creditor.id}` as never)} style={styles.editButton}>
          <Ionicons name="create-outline" size={18} color={Colors.primaryLight} />
          <Text style={styles.editText}>Editar informações</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Identificação</Text>
        <InfoRow icon="document-text" label={creditor.type === 'PF' ? 'CPF' : 'CNPJ'} value={formatDocument(creditor.document, creditor.type)} />
        <InfoRow icon="call" label="Telefone" value={formatPhone(creditor.phone)} />
        <InfoRow icon="mail" label="E-mail" value={creditor.email} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados de Pagamento</Text>
        <InfoRow icon="qr-code" label="Chave PIX" value={creditor.pixKey} />
        {creditor.pixKey ? (
          <PixPayButton
            pixKey={creditor.pixKey}
            merchantName={creditor.name}
            amount={totalPending > 0 ? totalPending : creditor.monthlyAmount}
          />
        ) : null}
        <InfoRow icon="business" label="Banco" value={creditor.bankInfo.bank} />
        <InfoRow icon="git-branch" label="Agência / Conta" value={
          creditor.bankInfo.agency
            ? `${creditor.bankInfo.agency} / ${creditor.bankInfo.account}`
            : ''
        } />
        <InfoRow icon={method.icon as keyof typeof Ionicons.glyphMap} label="Forma preferida" value={method.label} />
        <InfoRow icon="calendar" label="Dia preferencial" value={
          creditor.preferredPaymentDay ? `Dia ${creditor.preferredPaymentDay}` : ''
        } />
        <InfoRow icon="cash" label="Valor mensal" value={
          (creditor.monthlyAmount ?? 0) > 0 ? formatCurrency(creditor.monthlyAmount!) : ''
        } />
      </View>

      {creditor.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações</Text>
          <Text style={styles.notes}>{creditor.notes}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Despesas ({relatedExpenses.length})
          </Text>
          <Pressable onPress={() => router.push(`/expense/creditor/${creditor.id}` as never)}>
            <Text style={styles.sectionLink}>Ver histórico</Text>
          </Pressable>
        </View>
        {relatedExpenses.length === 0 ? (
          <Text style={styles.emptyExpenses}>Nenhuma despesa vinculada</Text>
        ) : (
          <>
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
          </>
        )}
      </View>

      <Pressable onPress={handleDelete} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={20} color={Colors.danger} />
        <Text style={styles.deleteText}>Excluir Credor</Text>
      </Pressable>

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
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
  },
  badgeText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  pending: {
    color: Colors.warning,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  monthly: {
    color: Colors.secondary,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary}33`,
    borderWidth: 1,
    borderColor: `${Colors.primary}55`,
  },
  editText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionLink: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoContent: { flex: 1 },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  infoValue: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginTop: 2,
  },
  notes: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  emptyExpenses: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.danger}44`,
    marginTop: Spacing.md,
  },
  deleteText: {
    color: Colors.danger,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
