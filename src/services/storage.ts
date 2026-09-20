import AsyncStorage from '@react-native-async-storage/async-storage';
import { Creditor, Expense, AppSettings, GuarantorAgreement } from '../types';

const KEYS = {
  CREDITORS: '@meucontrole/creditors',
  EXPENSES: '@meucontrole/expenses',
  SETTINGS: '@meucontrole/settings',
  GUARANTOR: '@meucontrole/guarantor',
};

const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    enabled: true,
    daysBefore: [1, 3, 7],
    onDueDate: true,
    onOverdue: true,
    soundEnabled: true,
  },
  currency: 'BRL',
  defaultLateFeePercent: 2,
  premium: { isPremium: false },
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadCreditors(): Promise<Creditor[]> {
  const data = await AsyncStorage.getItem(KEYS.CREDITORS);
  return safeParse(data, []);
}

export async function saveCreditors(creditors: Creditor[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CREDITORS, JSON.stringify(creditors));
}

export async function loadExpenses(): Promise<Expense[]> {
  const data = await AsyncStorage.getItem(KEYS.EXPENSES);
  return safeParse(data, []);
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
}

export async function loadSettings(): Promise<AppSettings> {
  const data = await AsyncStorage.getItem(KEYS.SETTINGS);
  const parsed = safeParse<Partial<AppSettings> | null>(data, null);
  const base = parsed ?? {};
  return {
    ...DEFAULT_SETTINGS,
    ...base,
    defaultLateFeePercent: base.defaultLateFeePercent ?? 2,
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(base.notifications ?? {}),
      onOverdue: base.notifications?.onOverdue ?? true,
    },
    premium: { ...DEFAULT_SETTINGS.premium, ...(base.premium ?? {}) },
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export async function loadGuarantorAgreements(): Promise<GuarantorAgreement[]> {
  const data = await AsyncStorage.getItem(KEYS.GUARANTOR);
  return safeParse(data, []);
}

export async function saveGuarantorAgreements(agreements: GuarantorAgreement[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.GUARANTOR, JSON.stringify(agreements));
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
