import { CreditorCategory, CreditorType, PaymentMethod } from '../types';

export const CREDITOR_CATEGORIES: Record<
  CreditorCategory,
  { label: string; icon: string; color: string }
> = {
  utilities: { label: 'Contas & Utilidades', icon: 'flash', color: '#FDCB6E' },
  credit_card: { label: 'Cartão de Crédito', icon: 'card', color: '#6C5CE7' },
  loan: { label: 'Empréstimo / Financiamento', icon: 'cash', color: '#E17055' },
  subscription: { label: 'Assinaturas', icon: 'repeat', color: '#00CEC9' },
  rent: { label: 'Aluguel / Moradia', icon: 'home', color: '#FD79A8' },
  insurance: { label: 'Seguros', icon: 'shield-checkmark', color: '#0984E3' },
  health: { label: 'Saúde', icon: 'medkit', color: '#00B894' },
  education: { label: 'Educação', icon: 'school', color: '#A29BFE' },
  child_support: { label: 'Pensão Alimentícia', icon: 'heart', color: '#E84393' },
  other: { label: 'Outros', icon: 'ellipsis-horizontal', color: '#636E72' },
};

export const PAYMENT_METHODS: Record<PaymentMethod, { label: string; icon: string }> = {
  pix: { label: 'PIX', icon: 'qr-code' },
  boleto: { label: 'Boleto', icon: 'barcode' },
  debit: { label: 'Débito', icon: 'card-outline' },
  credit: { label: 'Crédito', icon: 'card' },
  transfer: { label: 'Transferência', icon: 'swap-horizontal' },
  cash: { label: 'Dinheiro', icon: 'wallet' },
};

export const CREDITOR_TYPES: Record<CreditorType, string> = {
  PF: 'Pessoa Física',
  PJ: 'Pessoa Jurídica',
};

export const CREDITOR_COLORS = [
  '#6C5CE7', '#00CEC9', '#FD79A8', '#FDCB6E',
  '#E17055', '#0984E3', '#00B894', '#A29BFE',
  '#FF6B6B', '#55EFC4', '#E84393', '#74B9FF',
];

export const CREDITOR_ICONS = [
  'business', 'storefront', 'car', 'home', 'medical',
  'school', 'fitness', 'restaurant', 'wifi', 'phone-portrait',
  'tv', 'water', 'flash', 'card', 'shield',
];

export const DEFAULT_NOTIFICATION_DAYS = [1, 3, 7];
