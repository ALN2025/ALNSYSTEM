import React from 'react';
import { StyleSheet, ScrollView, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../src/context/AppContext';
import { InstallmentRow } from '../../src/components/InstallmentRow';
import { enrichAgreement, getAgreementStats, buildInstallmentReport, buildAgreementSummaryReport } from '../../src/utils/guarantor';
import { exportTextFile, makeExportFilename } from '../../src/services/export';
import { formatCurrency, formatPhone, formatDocument } from '../../src/utils/format';
import { confirmAlert, showAlert } from '../../src/utils/alert';
import { Colors, BorderRadius, FontSize, Spacing } from '../../src/constants/theme';

export default function GuarantorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    getGuarantorById,
    markInstallmentPaid,
    deleteGuarantorAgreement,
    isPremium,
  } = useApp();

  const raw = getGuarantorById(id!);
  const agreement = raw ? enrichAgreement(raw) : undefined;

  if (!agreement) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Acordo não encontrado</Text>
      </View>
    );
  }

  const stats = getAgreementStats(agreement);

  const handleDownloadInstallment = async (installmentNumber: number) => {
    if (!isPremium()) {
      showAlert('Recurso Pro', 'Exportação de comprovantes disponível no Meu Controle Pro.');
      return;
    }
    const inst = agreement.installments.find((i) => i.number === installmentNumber);
    if (!inst) return;
    const content = buildInstallmentReport(agreement, inst);
    const prefix = inst.status === 'paid' ? 'comprovante' : 'cobranca';
    await exportTextFile(
      content,
      makeExportFilename(prefix, agreement.friendName, installmentNumber)
    );
  };

  const handleDownloadSummary = async () => {
    if (!isPremium()) {
      showAlert('Recurso Pro', 'Exportação de comprovantes disponível no Meu Controle Pro.');
      return;
    }
    const content = buildAgreementSummaryReport(agreement);
    await exportTextFile(content, makeExportFilename('resumo_fiador', agreement.friendName));
  };

  const handleMarkPaid = (installmentNumber: number) => {
    const inst = agreement.installments.find((i) => i.number === installmentNumber);
    if (!inst) return;

    confirmAlert(
      'Confirmar pagamento',
      `Marcar parcela ${installmentNumber} como paga?\nTotal: ${formatCurrency(inst.totalDue)}`,
      () => markInstallmentPaid(agreement.id, installmentNumber)
    );
  };

  const handleDelete = () => {
    confirmAlert(
      'Excluir acordo',
      `Deseja excluir o acordo com ${agreement.friendName}?`,
      async () => {
        await deleteGuarantorAgreement(agreement.id);
        router.back();
      }
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <LinearGradient colors={[agreement.color, `${agreement.color}88`]} style={styles.avatar}>
          <Ionicons name="hand-left" size={32} color="#FFF" />
        </LinearGradient>
        <Text style={styles.friendName}>{agreement.friendName}</Text>
        <Text style={styles.storeName}>{agreement.storeName}</Text>
        <Text style={styles.total}>
          {formatCurrency(agreement.totalAmount)} em {agreement.installmentCount}x de{' '}
          {formatCurrency(agreement.installmentAmount)}
        </Text>
        <Text style={styles.feeInfo}>Juros por atraso: {agreement.lateFeePercent}% a.m. (pro-rata)</Text>

        <Pressable onPress={() => router.push(`/guarantor/edit/${agreement.id}` as never)} style={styles.editButton}>
          <Ionicons name="create-outline" size={18} color={Colors.accent} />
          <Text style={styles.editText}>Editar informações</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: Colors.success }]}>{stats.paidCount}</Text>
          <Text style={styles.statLabel}>Pagas</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: Colors.danger }]}>{stats.overdueCount}</Text>
          <Text style={styles.statLabel}>Atrasadas</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: Colors.warning }]}>{stats.pendingCount}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
      </View>

      {stats.totalOverdue > 0 && (
        <View style={styles.alertBox}>
          <Ionicons name="alert-circle" size={20} color={Colors.danger} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Total a cobrar (com juros)</Text>
            <Text style={styles.alertValue}>{formatCurrency(stats.totalOverdue)}</Text>
            {stats.totalLateFees > 0 && (
              <Text style={styles.alertSub}>
                Inclui {formatCurrency(stats.totalLateFees)} de juros
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do amigo</Text>
        {agreement.friendPhone ? (
          <Text style={styles.detail}>📱 {formatPhone(agreement.friendPhone)}</Text>
        ) : null}
        {agreement.friendDocument ? (
          <Text style={styles.detail}>CPF: {formatDocument(agreement.friendDocument, 'PF')}</Text>
        ) : null}
        {agreement.storeDocument ? (
          <Text style={styles.detail}>CNPJ Loja: {formatDocument(agreement.storeDocument, 'PJ')}</Text>
        ) : null}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Parcelas</Text>
        <Pressable onPress={handleDownloadSummary} style={styles.downloadAll}>
          <Ionicons name="download-outline" size={16} color={Colors.primaryLight} />
          <Text style={styles.downloadAllText}>Baixar resumo</Text>
        </Pressable>
      </View>

      {agreement.installments.map((inst) => (
        <InstallmentRow
          key={inst.number}
          installment={inst}
          totalInstallments={agreement.installmentCount}
          onMarkPaid={() => handleMarkPaid(inst.number)}
          onDownload={() => handleDownloadInstallment(inst.number)}
        />
      ))}

      <Pressable onPress={handleDelete} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={20} color={Colors.danger} />
        <Text style={styles.deleteText}>Excluir Acordo</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  notFoundText: { color: Colors.textSecondary },
  header: { alignItems: 'center', marginBottom: Spacing.lg },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendName: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginTop: Spacing.md,
  },
  storeName: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 4 },
  total: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600', marginTop: Spacing.sm },
  feeInfo: { color: Colors.warning, fontSize: FontSize.xs, marginTop: 4 },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.accent}33`,
    borderWidth: 1,
    borderColor: `${Colors.accent}55`,
  },
  editText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  alertBox: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: `${Colors.danger}15`,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.danger}33`,
  },
  alertContent: { flex: 1 },
  alertTitle: { color: Colors.danger, fontSize: FontSize.sm, fontWeight: '600' },
  alertValue: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '800', marginTop: 2 },
  alertSub: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  detail: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 4 },
  downloadAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  downloadAllText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '600',
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
    marginTop: Spacing.lg,
  },
  deleteText: { color: Colors.danger, fontSize: FontSize.md, fontWeight: '600' },
});
