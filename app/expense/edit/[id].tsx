import React, { useState } from 'react';
import {
  StyleSheet, ScrollView, Pressable, Text, View, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ExpenseFormFields } from '../../../src/components/ExpenseFormFields';
import { useApp } from '../../../src/context/AppContext';
import { PaymentMethod, RecurrenceType } from '../../../src/types';
import { numberToCurrencyInput, parseCurrencyInput, isoToDateInput, dateInputToIso, formatDateInput } from '../../../src/utils/format';
import { isRollingMonthly } from '../../../src/utils/recurrence';
import { showFormError, confirmAlert } from '../../../src/utils/alert';
import { closeFormAfterSave } from '../../../src/utils/navigation';
import { Colors, BorderRadius, FontSize, Spacing } from '../../../src/constants/theme';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { creditors, expenses, updateExpense, deleteExpense } = useApp();
  const expense = expenses.find((e) => e.id === id);

  const [creditorId, setCreditorId] = useState(expense?.creditorId ?? '');
  const [title, setTitle] = useState(expense?.title ?? '');
  const [amount, setAmount] = useState(numberToCurrencyInput(expense?.amount ?? 0));
  const [dueDate, setDueDate] = useState(
    expense ? formatDateInput(isoToDateInput(expense.dueDate)) : ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(expense?.paymentMethod ?? 'pix');
  const [recurrence, setRecurrence] = useState<RecurrenceType>(expense?.recurrence ?? 'none');
  const [installmentCurrent, setInstallmentCurrent] = useState(String(expense?.installment?.current ?? ''));
  const [installmentTotal, setInstallmentTotal] = useState(String(expense?.installment?.total ?? ''));
  const [notes, setNotes] = useState(expense?.notes ?? '');
  const [saving, setSaving] = useState(false);

  if (!expense) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Despesa não encontrada</Text>
      </View>
    );
  }

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!creditorId) {
      showFormError('Selecione um credor.');
      return;
    }
    if (!title.trim()) {
      showFormError('Informe o título da despesa.');
      return;
    }
    const parsedAmount = parseCurrencyInput(amount);
    if (parsedAmount <= 0) {
      showFormError('Informe um valor válido.');
      return;
    }
    if (!dateInputToIso(dueDate)) {
      showFormError('Informe a data no formato DD/MM/AAAA (ex: 10/09/2026).');
      return;
    }

    const installment =
      installmentCurrent && installmentTotal
        ? { current: parseInt(installmentCurrent, 10), total: parseInt(installmentTotal, 10) }
        : undefined;

    setSaving(true);
    try {
      await updateExpense(expense.id, {
        creditorId,
        title: title.trim(),
        amount: parsedAmount,
        dueDate: dateInputToIso(dueDate)!,
        paymentMethod,
        recurrence,
        installment,
        notes: notes.trim(),
      });
      closeFormAfterSave(router, '/(tabs)/expenses');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    confirmAlert('Excluir despesa', `Deseja excluir "${expense.title}"?`, async () => {
      await deleteExpense(expense.id);
      closeFormAfterSave(router, '/(tabs)/expenses');
    });
  };

  const creditorOptions = creditors.map((c) => ({ label: c.name, value: c.id }));
  const selectedCreditor = creditors.find((c) => c.id === creditorId);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ExpenseFormFields
          creditor={selectedCreditor}
          creditorOptions={creditorOptions}
          creditorId={creditorId}
          onCreditorChange={setCreditorId}
          title={title}
          onTitleChange={setTitle}
          amount={amount}
          onAmountChange={setAmount}
          dueDate={dueDate}
          onDueDateChange={setDueDate}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          recurrence={recurrence}
          onRecurrenceChange={setRecurrence}
          installmentCurrent={installmentCurrent}
          onInstallmentCurrentChange={setInstallmentCurrent}
          installmentTotal={installmentTotal}
          onInstallmentTotalChange={setInstallmentTotal}
          notes={notes}
          onNotesChange={setNotes}
        />

        {isRollingMonthly(expense) && (
          <View style={styles.monthlyHint}>
            <Ionicons name="repeat" size={16} color={Colors.secondary} />
            <Text style={styles.monthlyHintText}>
              Despesa mensal recorrente — ao marcar como paga, o vencimento avança automaticamente.
            </Text>
          </View>
        )}

        <Pressable onPress={handleSave} disabled={saving}>
          <LinearGradient colors={[...Colors.gradients.primary]} style={styles.saveButton}>
            <Ionicons name="save" size={22} color="#FFF" />
            <Text style={styles.saveText}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          <Text style={styles.deleteText}>Excluir Despesa</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  notFoundText: { color: Colors.textSecondary, fontSize: FontSize.md },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.lg },
  saveText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: `${Colors.danger}44`, marginTop: Spacing.md },
  deleteText: { color: Colors.danger, fontSize: FontSize.md, fontWeight: '600' },
  monthlyHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: `${Colors.secondary}18`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: `${Colors.secondary}33`,
  },
  monthlyHintText: {
    flex: 1,
    color: Colors.secondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
    fontWeight: '600',
  },
});
