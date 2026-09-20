import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, Pressable, Text, View, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ExpenseFormFields, ExpenseBillingMode } from '../../src/components/ExpenseFormFields';
import { useApp } from '../../src/context/AppContext';
import { CREDITOR_CATEGORIES } from '../../src/constants/categories';
import { PaymentMethod, RecurrenceType } from '../../src/types';
import { parseCurrencyInput, dateInputToIso } from '../../src/utils/format';
import { closeFormAfterSave } from '../../src/utils/navigation';
import { showFormError } from '../../src/utils/alert';
import { PremiumPaywall } from '../../src/components/PremiumPaywall';
import { FREE_TIER } from '../../src/constants/premium';
import { Colors, BorderRadius, FontSize, Spacing } from '../../src/constants/theme';

function emptyForm(creditorId = '') {
  return {
    creditorId,
    title: '',
    amount: '',
    dueDate: '',
    paymentMethod: 'pix' as PaymentMethod,
    billingMode: 'single' as ExpenseBillingMode,
    installmentCount: '',
    notes: '',
  };
}

export default function NewExpenseScreen() {
  const router = useRouter();
  const { creditorId: presetCreditorId } = useLocalSearchParams<{ creditorId?: string }>();
  const { creditors, addExpense, loading, canAddExpenses, expenses } = useApp();
  const [showPremium, setShowPremium] = useState(false);

  const validPreset =
    presetCreditorId && creditors.some((c) => c.id === presetCreditorId)
      ? presetCreditorId
      : '';

  const [form, setForm] = useState(emptyForm(validPreset));

  useEffect(() => {
    setForm(emptyForm(validPreset));
  }, [validPreset]);

  const setField = <K extends keyof ReturnType<typeof emptyForm>>(key: K, value: ReturnType<typeof emptyForm>[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setForm(emptyForm(''));

  const handleSave = async (addAnother = false) => {
    Keyboard.dismiss();
    if (!form.creditorId) {
      showFormError('Selecione o tópico (credor) da despesa.');
      return;
    }
    if (!form.title.trim()) {
      showFormError('Informe o título da despesa.');
      return;
    }
    const parsedAmount = parseCurrencyInput(form.amount);
    if (parsedAmount <= 0) {
      showFormError('Informe um valor válido.');
      return;
    }
    if (!dateInputToIso(form.dueDate)) {
      showFormError('Informe a data no formato DD/MM/AAAA (ex: 10/09/2026).');
      return;
    }

    let recurrence: RecurrenceType = 'none';
    let installment: { current: number; total: number } | undefined;

    if (form.billingMode === 'monthly') {
      recurrence = 'monthly';
    } else if (form.billingMode === 'installments') {
      const total = parseInt(form.installmentCount, 10);
      if (!total || total < 2) {
        showFormError('Informe a quantidade de parcelas (mínimo 2).');
        return;
      }
      installment = { current: 1, total };
    }

    const slotsNeeded = installment ? installment.total : 1;
    if (!canAddExpenses(slotsNeeded)) {
      setShowPremium(true);
      return;
    }

    try {
      await addExpense({
      creditorId: form.creditorId,
      title: form.title.trim(),
      amount: parsedAmount,
      dueDate: dateInputToIso(form.dueDate)!,
      paymentMethod: form.paymentMethod,
      recurrence,
      installment,
      notes: form.notes.trim(),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível salvar.';
      if (msg.includes('Limite gratuito')) {
        setShowPremium(true);
        return;
      }
      showFormError(msg);
      return;
    }

    if (addAnother) {
      resetForm();
      return;
    }
    closeFormAfterSave(router, '/(tabs)/expenses');
  };

  const creditorOptions = creditors.map((c) => ({
    label: `${c.name} — ${CREDITOR_CATEGORIES[c.category].label}`,
    value: c.id,
  }));

  const selectedCreditor = creditors.find((c) => c.id === form.creditorId);

  if (!loading && creditors.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>Nenhum credor cadastrado</Text>
        <Text style={styles.emptySubtitle}>
          Cadastre os tópicos na aba Credores antes de registrar despesas aqui.
        </Text>
        <Pressable onPress={() => router.replace('/(tabs)/creditors')}>
          <LinearGradient colors={[...Colors.gradients.primary]} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Ir para Credores</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ExpenseFormFields
          creditor={selectedCreditor}
          creditorOptions={creditorOptions}
          creditorId={form.creditorId}
          onCreditorChange={(id) => setField('creditorId', id)}
          title={form.title}
          onTitleChange={(v) => setField('title', v)}
          amount={form.amount}
          onAmountChange={(v) => setField('amount', v)}
          dueDate={form.dueDate}
          onDueDateChange={(v) => setField('dueDate', v)}
          paymentMethod={form.paymentMethod}
          onPaymentMethodChange={(v) => setField('paymentMethod', v)}
          recurrence="none"
          onRecurrenceChange={() => {}}
          installmentCurrent=""
          onInstallmentCurrentChange={() => {}}
          installmentTotal=""
          onInstallmentTotalChange={() => {}}
          notes={form.notes}
          onNotesChange={(v) => setField('notes', v)}
          billingMode={form.billingMode}
          onBillingModeChange={(v) => setField('billingMode', v)}
          installmentCount={form.installmentCount}
          onInstallmentCountChange={(v) => setField('installmentCount', v)}
        />

        <Pressable onPress={() => handleSave(false)}>
          <LinearGradient colors={[...Colors.gradients.primary]} style={styles.saveButton}>
            <Ionicons name="checkmark-circle" size={22} color="#FFF" />
            <Text style={styles.saveText}>Salvar Despesa</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => handleSave(true)} style={styles.secondaryButton}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primaryLight} />
          <Text style={styles.secondaryText}>Salvar e adicionar outro tópico</Text>
        </Pressable>

        {!canAddExpenses(1) ? (
          <Text style={styles.limitHint}>
            Limite gratuito: {expenses.length}/{FREE_TIER.maxExpenses} despesas. Ative o Pro para continuar.
          </Text>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
      <PremiumPaywall
        visible={showPremium}
        onClose={() => setShowPremium(false)}
        reason={`Limite gratuito de ${FREE_TIER.maxExpenses} despesas atingido.`}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  emptyButtonText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  saveText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  secondaryText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  limitHint: {
    color: Colors.warning,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
