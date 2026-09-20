export type CreditorType = 'PF' | 'PJ';

export type CreditorCategory =
  | 'utilities'
  | 'credit_card'
  | 'loan'
  | 'subscription'
  | 'rent'
  | 'insurance'
  | 'health'
  | 'education'
  | 'child_support'
  | 'other';

export type PaymentMethod = 'pix' | 'boleto' | 'debit' | 'credit' | 'transfer' | 'cash';

export type ExpenseStatus = 'pending' | 'paid' | 'overdue' | 'scheduled';

export type RecurrenceType = 'none' | 'monthly' | 'weekly' | 'yearly';

export interface BankInfo {
  bank: string;
  agency: string;
  account: string;
  accountType: 'checking' | 'savings';
}

export interface Creditor {
  id: string;
  name: string;
  type: CreditorType;
  document: string;
  category: CreditorCategory;
  phone: string;
  email: string;
  pixKey: string;
  bankInfo: BankInfo;
  preferredPaymentDay: number;
  preferredMethod: PaymentMethod;
  color: string;
  icon: string;
  notes: string;
  monthlyAmount?: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  creditorId: string;
  title: string;
  amount: number;
  dueDate: string;
  status: ExpenseStatus;
  paymentMethod: PaymentMethod;
  recurrence: RecurrenceType;
  /** Agrupa despesas da mesma série mensal */
  recurrenceSeriesId?: string;
  /** Agrupa parcelas fixas (ex: 12x) */
  installmentSeriesId?: string;
  installment?: { current: number; total: number };
  notes: string;
  paidAt?: string;
  /** Data prevista quando status = scheduled */
  scheduledPayDate?: string;
  notificationIds: string[];
  createdAt: string;
}

export interface NotificationSettings {
  enabled: boolean;
  daysBefore: number[];
  onDueDate: boolean;
  /** Avisar quando a despesa estiver atrasada */
  onOverdue: boolean;
  soundEnabled: boolean;
  /** Último resumo diário de atrasos enviado (yyyy-MM-dd) */
  lastOverdueDigest?: string;
}

export type InstallmentStatus = 'pending' | 'paid' | 'overdue';

export interface GuarantorInstallment {
  number: number;
  dueDate: string;
  baseAmount: number;
  status: InstallmentStatus;
  paidAt?: string;
  daysLate: number;
  lateFeePercent: number;
  lateFeeAmount: number;
  totalDue: number;
  notes?: string;
}

export interface GuarantorAgreement {
  id: string;
  friendName: string;
  friendPhone: string;
  friendDocument: string;
  storeName: string;
  storeDocument: string;
  totalAmount: number;
  installmentCount: number;
  installmentAmount: number;
  firstDueDate: string;
  lateFeePercent: number;
  installments: GuarantorInstallment[];
  color: string;
  notes: string;
  createdAt: string;
}

export interface PremiumSettings {
  isPremium: boolean;
  /** Chave de licença ativada localmente (Play Store / manual) */
  licenseKey?: string;
  activatedAt?: string;
}

export interface AppSettings {
  notifications: NotificationSettings;
  currency: string;
  defaultLateFeePercent: number;
  premium: PremiumSettings;
}

export interface DashboardStats {
  totalPending: number;
  totalPaid: number;
  totalOverdue: number;
  upcomingCount: number;
  monthlyTotal: number;
}
