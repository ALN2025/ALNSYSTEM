import * as Notifications from 'expo-notifications';

import { Platform } from 'react-native';

import { addDays, setHours, setMinutes, setSeconds, isBefore, parseISO, format, differenceInDays } from 'date-fns';

import { Expense, Creditor, NotificationSettings } from '../types';

import { getExpenseStatus } from '../utils/format';
import { FREE_TIER, PRO_TIER } from '../constants/premium';
import { playAppSound } from './appSounds';

const notificationsSupported = Platform.OS === 'android' || Platform.OS === 'ios';

function overdueNotificationSound(enabled: boolean): string | boolean {
  if (!enabled) return false;
  return Platform.OS === 'android' ? 'overdue_alert' : 'overdue_alert.wav';
}



if (notificationsSupported) {

  Notifications.setNotificationHandler({

    handleNotification: async () => ({

      shouldShowAlert: true,

      shouldPlaySound: true,

      shouldSetBadge: true,

      shouldShowBanner: true,

      shouldShowList: true,

    }),

  });

}



export async function setupNotifications(): Promise<boolean> {

  if (!notificationsSupported) return false;



  try {

    if (Platform.OS === 'android') {

      await Notifications.setNotificationChannelAsync('vencimentos', {

        name: 'Vencimentos',

        importance: Notifications.AndroidImportance.HIGH,

        vibrationPattern: [0, 250, 250, 250],

        lightColor: '#6C5CE7',

        sound: 'default',

      });

      await Notifications.setNotificationChannelAsync('atrasos', {

        name: 'Atrasos',

        importance: Notifications.AndroidImportance.HIGH,

        vibrationPattern: [0, 400, 200, 400],

        lightColor: '#FF6B6B',

        sound: 'overdue_alert',

      });

    }



    const { status: existing } = await Notifications.getPermissionsAsync();

    if (existing === 'granted') return true;



    const { status } = await Notifications.requestPermissionsAsync();

    return status === 'granted';

  } catch {

    return false;

  }

}



function formatAmount(amount: number): string {

  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

}



function scheduleAt(

  date: Date,

  title: string,

  body: string,

  channelId: 'vencimentos' | 'atrasos' = 'vencimentos',

  identifier?: string,

  data?: Record<string, unknown>,

  sound: string | boolean = 'default'

): Promise<string> {

  const triggerDate = isBefore(date, new Date())

    ? addDays(new Date(), 1)

    : date;



  const normalized = setSeconds(setMinutes(setHours(triggerDate, 9), 0), 0);



  return Notifications.scheduleNotificationAsync({

    identifier,

    content: {

      title,

      body,

      sound,

      data: data ?? { type: channelId === 'atrasos' ? 'overdue' : 'due_date' },

      ...(Platform.OS === 'android' && { channelId }),

    },

    trigger: {

      type: Notifications.SchedulableTriggerInputTypes.DATE,

      date: normalized,

    },

  });

}



function scheduleOverdueAt(

  date: Date,

  creditorName: string,

  expenseTitle: string,

  amount: string,

  identifier?: string,

  daysLate?: number,

  soundEnabled = true

): Promise<string> {

  const lateHint = daysLate && daysLate > 0 ? ` — ${daysLate} dia${daysLate > 1 ? 's' : ''} de atraso` : '';

  return scheduleAt(

    date,

    '⚠️ Pagamento ATRASADO',

    `${creditorName}: ${expenseTitle} — ${amount}${lateHint}. Regularize o quanto antes.`,

    'atrasos',

    identifier,

    { type: 'overdue_recurring' },

    overdueNotificationSound(soundEnabled)

  );

}



/** Dispara alerta imediato para despesa já vencida. */

export async function notifyOverdueNow(

  creditorName: string,

  expenseTitle: string,

  amount: string,

  soundEnabled = true

): Promise<void> {

  if (!notificationsSupported) return;

  try {

    if (soundEnabled) void playAppSound('overdue');

    await Notifications.scheduleNotificationAsync({

      content: {

        title: '⚠️ Conta em atraso',

        body: `${creditorName}: ${expenseTitle} — ${amount}`,

        sound: overdueNotificationSound(soundEnabled),

        data: { type: 'overdue_immediate' },

        ...(Platform.OS === 'android' && { channelId: 'atrasos' }),

      },

      trigger: null,

    });

  } catch {

    /* ignore */

  }

}



async function cancelOverdueRecurring(): Promise<void> {

  if (!notificationsSupported) return;

  try {

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    await Promise.all(

      scheduled

        .filter((n) => n.content.data?.type === 'overdue_recurring')

        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))

    );

  } catch {

    /* ignore */

  }

}



/**

 * Reagenda lembretes diários de atraso e envia resumo ao abrir o app (1x por dia).

 * Free: até 7 dias de lembrete · Pro: até 14 dias.

 */

export async function syncOverdueNotifications(

  expenses: Expense[],

  creditors: Creditor[],

  settings: NotificationSettings,

  isPremium: boolean,

  lastDigestDate?: string

): Promise<string | undefined> {

  if (!settings.enabled || !settings.onOverdue || !notificationsSupported) {

    return lastDigestDate;

  }



  const overdue = expenses.filter((e) => getExpenseStatus(e) === 'overdue');

  const today = format(new Date(), 'yyyy-MM-dd');

  let digestDate = lastDigestDate;



  if (overdue.length > 0 && digestDate !== today) {

    try {

      if (overdue.length === 1) {

        const expense = overdue[0];

        const creditor = creditors.find((c) => c.id === expense.creditorId);

        await notifyOverdueNow(

          creditor?.name ?? 'Credor',

          expense.title,

          formatAmount(expense.amount),

          settings.soundEnabled

        );

      } else {

        const total = overdue.reduce((s, e) => s + e.amount, 0);

        await Notifications.scheduleNotificationAsync({

          content: {

            title: `⚠️ ${overdue.length} contas em atraso`,

            body: `Total: ${formatAmount(total)}. Abra o Meu Controle para ver e pagar.`,

            sound: overdueNotificationSound(settings.soundEnabled),

            data: { type: 'overdue_immediate' },

            ...(Platform.OS === 'android' && { channelId: 'atrasos' }),

          },

          trigger: null,

        });

        if (settings.soundEnabled) void playAppSound('overdue');

      }

      digestDate = today;

    } catch {

      /* ignore */

    }

  }



  await cancelOverdueRecurring();



  if (overdue.length === 0) return digestDate;



  const horizon = isPremium ? PRO_TIER.overdueReminderDays : FREE_TIER.overdueReminderDays;

  const maxItems = isPremium ? PRO_TIER.maxOverdueReminders : FREE_TIER.maxOverdueReminders;



  for (const expense of overdue.slice(0, maxItems)) {

    const creditor = creditors.find((c) => c.id === expense.creditorId);

    if (!creditor) continue;



    const amount = formatAmount(expense.amount);

    const daysLate = Math.max(1, differenceInDays(new Date(), parseISO(expense.dueDate)));



    for (let i = 0; i < horizon; i++) {

      const targetDay = addDays(new Date(), i);

      const at9 = setSeconds(setMinutes(setHours(targetDay, 9), 0), 0);

      if (isBefore(at9, new Date())) continue;



      const id = `overdue-${expense.id}-${format(targetDay, 'yyyy-MM-dd')}`;

      try {

        await scheduleOverdueAt(

          at9,

          creditor.name,

          expense.title,

          amount,

          id,

          daysLate + i,

          settings.soundEnabled

        );

      } catch {

        /* ignore single schedule failure */

      }

    }

  }



  return digestDate;

}



export async function scheduleExpenseNotifications(

  expense: Expense,

  creditor: Creditor,

  settings: NotificationSettings

): Promise<string[]> {

  if (!settings.enabled || !notificationsSupported) return [];



  try {

    const ids: string[] = [];

    const dueDate = parseISO(expense.dueDate);

    const amount = formatAmount(expense.amount);

    const isOverdue = getExpenseStatus(expense) === 'overdue';



    if (!isOverdue) {

      for (const days of settings.daysBefore) {

        const notifyDate = addDays(dueDate, -days);

        if (isBefore(notifyDate, new Date())) continue;



        const id = await scheduleAt(

          notifyDate,

          `⏰ Vencimento em ${days} dia${days > 1 ? 's' : ''}`,

          `${creditor.name}: ${expense.title} — ${amount}`

        );

        ids.push(id);

      }



      if (settings.onDueDate) {

        const id = await scheduleAt(

          dueDate,

          '🔔 Vence HOJE!',

          `${creditor.name}: ${expense.title} — ${amount}. Não esqueça de pagar!`,

          'vencimentos'

        );

        ids.push(id);

      }



      if (settings.onOverdue) {

        const overdueDate = addDays(dueDate, 1);

        if (!isBefore(overdueDate, new Date())) {

          const id = await scheduleOverdueAt(

            overdueDate,

            creditor.name,

            expense.title,

            amount,

            `overdue-first-${expense.id}`,

            undefined,

            settings.soundEnabled

          );

          ids.push(id);

        }

      }

    }



    return ids;

  } catch {

    return [];

  }

}



export async function cancelNotifications(ids: string[]): Promise<void> {

  if (!notificationsSupported || ids.length === 0) return;

  try {

    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));

  } catch {

    /* offline / web */

  }

}



export async function cancelAllNotifications(): Promise<void> {

  if (!notificationsSupported) return;

  try {

    await Notifications.cancelAllScheduledNotificationsAsync();

  } catch {

    /* offline / web */

  }

}



export async function getScheduledCount(): Promise<number> {

  if (!notificationsSupported) return 0;

  try {

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    return scheduled.length;

  } catch {

    return 0;

  }

}


