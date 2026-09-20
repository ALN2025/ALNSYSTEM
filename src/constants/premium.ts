import Constants from 'expo-constants';

/** Limites da versão gratuita. */
export const FREE_TIER = {
  maxCreditors: 5,
  maxExpenses: 30,
  guarantorEnabled: false,
  notificationsEnabled: true,
  overdueReminderDays: 7,
  maxOverdueReminders: 5,
  exportEnabled: false,
} as const;

/** Benefícios extras do Pro. */
export const PRO_TIER = {
  maxCreditors: Infinity,
  maxExpenses: Infinity,
  guarantorEnabled: true,
  overdueReminderDays: 14,
  maxOverdueReminders: 20,
  exportEnabled: true,
} as const;

/** Chave Pro temporária no APK sideload (não vale em build Play). */
export const SIDELOAD_PRO_KEY = 'ALNPRO';

export type DistributionChannel = 'play' | 'sideload';

export function getDistributionChannel(): DistributionChannel {
  const fromEnv =
    process.env.APP_DISTRIBUTION ?? process.env.EXPO_PUBLIC_APP_DISTRIBUTION;
  if (fromEnv === 'play') return 'play';

  const extra = Constants.expoConfig?.extra as { distribution?: string } | undefined;
  if (extra?.distribution === 'play') return 'play';
  return 'sideload';
}

export function isPlayStoreBuild(): boolean {
  return getDistributionChannel() === 'play';
}

export function canUseGuarantorModule(isPremium: boolean): boolean {
  return isPremium || FREE_TIER.guarantorEnabled;
}

export function canExportReceipts(isPremium: boolean): boolean {
  return isPremium && PRO_TIER.exportEnabled;
}

export const FREE_FEATURES = [
  'Até 5 credores',
  'Até 30 despesas e parcelas',
  'Aviso 1, 3 e 7 dias antes do vencimento',
  'Alerta no dia do vencimento',
  'Lembretes de atraso por 7 dias (até 5 contas)',
] as const;

export const PREMIUM_FEATURES = [
  'Credores ilimitados',
  'Despesas e parcelas ilimitadas',
  'Módulo Fiador completo',
  'Notificações de atraso (14 dias, até 20 contas)',
  'Exportação de comprovantes',
  'Suporte prioritário',
] as const;

/**
 * Play Store: chave offline não ativa Pro (use compra in-app).
 * Sideload: por enquanto use {@link SIDELOAD_PRO_KEY}.
 */
export function isValidLicenseKey(key: string): boolean {
  const normalized = key.trim().toUpperCase().replace(/\s/g, '');
  if (!normalized) return false;

  if (isPlayStoreBuild()) {
    return false;
  }

  return normalized === SIDELOAD_PRO_KEY;
}

export function getTierLimits(isPremium: boolean) {
  return isPremium ? PRO_TIER : FREE_TIER;
}
