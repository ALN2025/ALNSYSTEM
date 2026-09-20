import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInput, FormSelect, CurrencyInput, DateInput } from './FormInput';
import { PAYMENT_METHODS } from '../constants/categories';
import { Creditor, PaymentMethod, RecurrenceType } from '../types';
import { getExpenseFormConfig } from '../utils/expenseForm';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

export type ExpenseBillingMode = 'single' | 'monthly' | 'installments';

interface Props {
  creditor?: Creditor;
  creditorOptions: { label: string; value: string }[];
  creditorId: string;
  onCreditorChange: (id: string) => void;
  title: string;
  onTitleChange: (v: string) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  dueDate: string;
  onDueDateChange: (v: string) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (v: PaymentMethod) => void;
  recurrence: RecurrenceType;
  onRecurrenceChange: (v: RecurrenceType) => void;
  installmentCurrent: string;
  onInstallmentCurrentChange: (v: string) => void;
  installmentTotal: string;
  onInstallmentTotalChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  billingMode?: ExpenseBillingMode;
  onBillingModeChange?: (mode: ExpenseBillingMode) => void;
  installmentCount?: string;
  onInstallmentCountChange?: (v: string) => void;
}

export function ExpenseFormFields({
  creditor,
  creditorOptions,
  creditorId,
  onCreditorChange,
  title,
  onTitleChange,
  amount,
  onAmountChange,
  dueDate,
  onDueDateChange,
  paymentMethod,
  onPaymentMethodChange,
  recurrence,
  onRecurrenceChange,
  installmentCurrent,
  onInstallmentCurrentChange,
  installmentTotal,
  onInstallmentTotalChange,
  notes,
  onNotesChange,
  billingMode,
  onBillingModeChange,
  installmentCount,
  onInstallmentCountChange,
}: Props) {
  const formConfig = getExpenseFormConfig(creditor?.category ?? 'other');
  const methodOptions = Object.entries(PAYMENT_METHODS).map(([value, info]) => ({
    label: info.label,
    value,
  }));

  const prevCreditorId = useRef<string | null>(null);
  const useBillingMode = Boolean(billingMode && onBillingModeChange);

  useEffect(() => {
    if (prevCreditorId.current === null) {
      prevCreditorId.current = creditorId;
      return;
    }
    if (prevCreditorId.current === creditorId || !creditor) return;

    prevCreditorId.current = creditorId;
    const cfg = getExpenseFormConfig(creditor.category);
    if (!useBillingMode) {
      onRecurrenceChange(cfg.recurrenceDefault);
      if (!cfg.showInstallments) {
        onInstallmentCurrentChange('');
        onInstallmentTotalChange('');
      }
    }
  }, [creditorId, creditor, useBillingMode]);

  const billingOptions = [
    { label: 'Única', value: 'single' },
    { label: 'Mensal (recorrente)', value: 'monthly' },
    { label: 'Parcelado', value: 'installments' },
  ];

  return (
    <>
      {creditor && (
        <View style={styles.creditorPreview}>
          <View style={[styles.creditorDot, { backgroundColor: creditor.color }]} />
          <View style={styles.creditorInfo}>
            <Text style={styles.creditorName}>{creditor.name}</Text>
            <Text style={styles.categoryBadge}>{formConfig.categoryLabel}</Text>
          </View>
        </View>
      )}

      {!creditorId && (
        <View style={styles.pickHint}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primaryLight} />
          <Text style={styles.pickHintText}>
            Selecione abaixo o tópico desta despesa (ex: Aluguel, Netflix, Energia…)
          </Text>
        </View>
      )}

      <FormSelect label="Credor / Tópico *" value={creditorId} options={creditorOptions} onChange={onCreditorChange} />

      <FormInput
        label="Título *"
        icon="receipt"
        value={title}
        onChangeText={onTitleChange}
        placeholder={formConfig.titlePlaceholder}
      />

      <CurrencyInput label="Valor *" value={amount} onChangeValue={onAmountChange} placeholder="R$ 0,00" />

      <DateInput
        label={formConfig.dateLabel}
        value={dueDate}
        onChangeValue={onDueDateChange}
        placeholder="DD/MM/AAAA"
      />
      <Text style={styles.fieldHint}>{formConfig.dateHint}</Text>

      <FormSelect
        label="Forma de Pagamento"
        value={paymentMethod}
        options={methodOptions}
        onChange={(v) => onPaymentMethodChange(v as PaymentMethod)}
      />

      {useBillingMode ? (
        <>
          <FormSelect
            label="Tipo de cobrança"
            value={billingMode!}
            options={billingOptions}
            onChange={(v) => onBillingModeChange!(v as ExpenseBillingMode)}
          />

          {billingMode === 'monthly' && (
            <View style={styles.recurrenceInfo}>
              <Ionicons name="repeat" size={16} color={Colors.secondary} />
              <Text style={styles.recurrenceInfoText}>
                Cobra todo mês automaticamente. Ao marcar como paga, avança para o próximo mês — sem criar dezenas de parcelas.
              </Text>
            </View>
          )}

          {billingMode === 'installments' && onInstallmentCountChange && (
            <>
              <FormInput
                label="Quantidade de parcelas *"
                icon="layers"
                value={installmentCount ?? ''}
                onChangeText={onInstallmentCountChange}
                placeholder="Ex: 12"
                keyboardType="numeric"
              />
              <View style={styles.recurrenceInfo}>
                <Ionicons name="search" size={16} color={Colors.secondary} />
                <Text style={styles.recurrenceInfoText}>
                  Serão criadas {installmentCount || '?'} parcelas. Na ficha da despesa você busca e marca cada uma como paga ou pendente.
                </Text>
              </View>
            </>
          )}
        </>
      ) : (
        <>
          <FormSelect
            label="Cobrança recorrente"
            value={recurrence}
            options={formConfig.recurrenceOptions}
            onChange={(v) => onRecurrenceChange(v as RecurrenceType)}
          />

          {recurrence === 'monthly' && (
            <View style={styles.recurrenceInfo}>
              <Ionicons name="repeat" size={16} color={Colors.secondary} />
              <Text style={styles.recurrenceInfoText}>
                Cobra todo mês. Ao marcar como paga, avança para o próximo vencimento.
              </Text>
            </View>
          )}

          {formConfig.showInstallments && (
            <>
              <Text style={styles.sectionTitle}>{formConfig.installmentsTitle}</Text>
              <View style={styles.row2}>
                <View style={styles.half}>
                  <FormInput
                    label={formConfig.installmentCurrentLabel}
                    value={installmentCurrent}
                    onChangeText={onInstallmentCurrentChange}
                    placeholder="1"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.half}>
                  <FormInput
                    label={formConfig.installmentTotalLabel}
                    value={installmentTotal}
                    onChangeText={onInstallmentTotalChange}
                    placeholder="12"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </>
          )}
        </>
      )}

      <FormInput
        label="Observações"
        icon="create"
        value={notes}
        onChangeText={onNotesChange}
        placeholder="Informações adicionais..."
        multiline
        numberOfLines={3}
      />
    </>
  );
}

const styles = StyleSheet.create({
  creditorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  creditorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  creditorInfo: { flex: 1, gap: 4 },
  creditorName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  categoryBadge: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  pickHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: `${Colors.primary}18`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.primary}33`,
  },
  pickHintText: {
    flex: 1,
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    lineHeight: 18,
    fontWeight: '600',
  },
  fieldHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  row2: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  half: { flex: 1 },
  recurrenceInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: `${Colors.secondary}18`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.secondary}33`,
  },
  recurrenceInfoText: {
    flex: 1,
    color: Colors.secondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
    fontWeight: '600',
  },
});
