import { CreditorCategory, RecurrenceType } from '../types';
import { CREDITOR_CATEGORIES } from '../constants/categories';

export type ExpenseFormMode = 'monthly_bill' | 'installments' | 'general';

export interface ExpenseFormConfig {
  mode: ExpenseFormMode;
  categoryLabel: string;
  dateLabel: string;
  dateHint: string;
  recurrenceDefault: RecurrenceType;
  recurrenceOptions: { label: string; value: RecurrenceType }[];
  showInstallments: boolean;
  installmentsTitle: string;
  installmentCurrentLabel: string;
  installmentTotalLabel: string;
  titlePlaceholder: string;
}

const MONTHLY_RECURRENCE: { label: string; value: RecurrenceType }[] = [
  { label: 'Mensal', value: 'monthly' },
  { label: 'Única', value: 'none' },
];

const FULL_RECURRENCE: { label: string; value: RecurrenceType }[] = [
  { label: 'Única', value: 'none' },
  { label: 'Mensal', value: 'monthly' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Anual', value: 'yearly' },
];

export function getExpenseFormConfig(category: CreditorCategory): ExpenseFormConfig {
  const categoryLabel = CREDITOR_CATEGORIES[category].label;

  switch (category) {
    case 'rent':
      return {
        mode: 'monthly_bill',
        categoryLabel,
        dateLabel: 'Vencimento do aluguel *',
        dateHint: 'Informe a data deste vencimento (ex: 10/09/2026)',
        recurrenceDefault: 'monthly',
        recurrenceOptions: MONTHLY_RECURRENCE,
        showInstallments: false,
        installmentsTitle: '',
        installmentCurrentLabel: '',
        installmentTotalLabel: '',
        titlePlaceholder: 'Ex: Aluguel setembro, Condomínio',
      };

    case 'utilities':
      return {
        mode: 'monthly_bill',
        categoryLabel,
        dateLabel: 'Vencimento da conta *',
        dateHint: 'Data limite para pagar luz, água, internet etc.',
        recurrenceDefault: 'monthly',
        recurrenceOptions: MONTHLY_RECURRENCE,
        showInstallments: false,
        installmentsTitle: '',
        installmentCurrentLabel: '',
        installmentTotalLabel: '',
        titlePlaceholder: 'Ex: Conta de luz, Internet, Água',
      };

    case 'subscription':
      return {
        mode: 'monthly_bill',
        categoryLabel,
        dateLabel: 'Renovação / vencimento *',
        dateHint: 'Data da cobrança da assinatura',
        recurrenceDefault: 'monthly',
        recurrenceOptions: MONTHLY_RECURRENCE,
        showInstallments: false,
        installmentsTitle: '',
        installmentCurrentLabel: '',
        installmentTotalLabel: '',
        titlePlaceholder: 'Ex: Netflix, Spotify, Plano celular',
      };

    case 'child_support':
      return {
        mode: 'monthly_bill',
        categoryLabel,
        dateLabel: 'Vencimento da pensão *',
        dateHint: 'Data em que a pensão deve ser paga',
        recurrenceDefault: 'monthly',
        recurrenceOptions: MONTHLY_RECURRENCE,
        showInstallments: false,
        installmentsTitle: '',
        installmentCurrentLabel: '',
        installmentTotalLabel: '',
        titlePlaceholder: 'Ex: Pensão alimentícia setembro',
      };

    case 'insurance':
      return {
        mode: 'monthly_bill',
        categoryLabel,
        dateLabel: 'Vencimento do seguro *',
        dateHint: 'Data de vencimento da parcela ou apólice',
        recurrenceDefault: 'monthly',
        recurrenceOptions: MONTHLY_RECURRENCE,
        showInstallments: false,
        installmentsTitle: '',
        installmentCurrentLabel: '',
        installmentTotalLabel: '',
        titlePlaceholder: 'Ex: Seguro auto, Seguro de vida',
      };

    case 'health':
      return {
        mode: 'monthly_bill',
        categoryLabel,
        dateLabel: 'Vencimento *',
        dateHint: 'Data do plano, consulta ou tratamento',
        recurrenceDefault: 'monthly',
        recurrenceOptions: MONTHLY_RECURRENCE,
        showInstallments: false,
        installmentsTitle: '',
        installmentCurrentLabel: '',
        installmentTotalLabel: '',
        titlePlaceholder: 'Ex: Plano de saúde, Consulta',
      };

    case 'education':
      return {
        mode: 'monthly_bill',
        categoryLabel,
        dateLabel: 'Vencimento da mensalidade *',
        dateHint: 'Data limite do pagamento escolar',
        recurrenceDefault: 'monthly',
        recurrenceOptions: MONTHLY_RECURRENCE,
        showInstallments: false,
        installmentsTitle: '',
        installmentCurrentLabel: '',
        installmentTotalLabel: '',
        titlePlaceholder: 'Ex: Mensalidade escola, Curso',
      };

    case 'loan':
      return {
        mode: 'installments',
        categoryLabel,
        dateLabel: 'Vencimento da parcela *',
        dateHint: 'Data de vencimento desta parcela',
        recurrenceDefault: 'monthly',
        recurrenceOptions: FULL_RECURRENCE,
        showInstallments: true,
        installmentsTitle: 'Parcelas do empréstimo',
        installmentCurrentLabel: 'Parcela atual',
        installmentTotalLabel: 'Total de parcelas',
        titlePlaceholder: 'Ex: Financiamento carro, Empréstimo pessoal',
      };

    case 'credit_card':
      return {
        mode: 'installments',
        categoryLabel,
        dateLabel: 'Vencimento da fatura *',
        dateHint: 'Data de fechamento ou vencimento do cartão',
        recurrenceDefault: 'monthly',
        recurrenceOptions: MONTHLY_RECURRENCE,
        showInstallments: true,
        installmentsTitle: 'Parcelamento no cartão (opcional)',
        installmentCurrentLabel: 'Parcela atual',
        installmentTotalLabel: 'Total de parcelas',
        titlePlaceholder: 'Ex: Fatura Nubank, Compra parcelada',
      };

    default:
      return {
        mode: 'general',
        categoryLabel,
        dateLabel: 'Data de vencimento *',
        dateHint: 'Informe no formato DD/MM/AAAA',
        recurrenceDefault: 'none',
        recurrenceOptions: FULL_RECURRENCE,
        showInstallments: true,
        installmentsTitle: 'Parcelas (opcional)',
        installmentCurrentLabel: 'Parcela atual',
        installmentTotalLabel: 'Total de parcelas',
        titlePlaceholder: 'Ex: Pagamento, Despesa avulsa',
      };
  }
}
