import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { newId } from '../utils/id';
import { Creditor, Expense, AppSettings, GuarantorAgreement, GuarantorInstallment } from '../types';
import * as storage from '../services/storage';
import * as notifications from '../services/notifications';
import { enrichAgreement, enrichInstallment, generateInstallments } from '../utils/guarantor';
import { getExpenseStatus, buildMonthlyDueDate, MONTHLY_EXPENSE_PREFIX, isAutoMonthlyExpense, formatShortDate } from '../utils/format';
import {
  syncMonthlyRecurrenceExpenses,
  advanceMonthlyDueDate,
  buildInstallmentSeriesExpenses,
  isRollingMonthly,
} from '../utils/recurrence';
import { showToast } from '../utils/toast';
import { FREE_TIER, isValidLicenseKey, canUseGuarantorModule, isPlayStoreBuild } from '../constants/premium';

interface AppContextType {
  creditors: Creditor[];
  expenses: Expense[];
  guarantorAgreements: GuarantorAgreement[];
  settings: AppSettings;
  loading: boolean;
  addCreditor: (data: Omit<Creditor, 'id' | 'createdAt'>) => Promise<Creditor>;
  updateCreditor: (id: string, data: Partial<Creditor>) => Promise<void>;
  deleteCreditor: (id: string) => Promise<void>;
  addExpense: (data: Omit<Expense, 'id' | 'createdAt' | 'notificationIds' | 'status'>) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  markAsUnpaid: (id: string) => Promise<void>;
  markAsScheduled: (id: string, scheduledDate?: string) => Promise<void>;
  activatePremium: (licenseKey: string) => Promise<boolean>;
  grantPremiumFromPlay: () => Promise<void>;
  isPremium: () => boolean;
  canAddCreditor: () => boolean;
  canAddExpenses: (count?: number) => boolean;
  addGuarantorAgreement: (data: Omit<GuarantorAgreement, 'id' | 'createdAt' | 'installments'> & { installments?: GuarantorInstallment[] }) => Promise<void>;
  updateGuarantorAgreement: (id: string, data: Partial<GuarantorAgreement>) => Promise<void>;
  deleteGuarantorAgreement: (id: string) => Promise<void>;
  markInstallmentPaid: (agreementId: string, installmentNumber: number) => Promise<void>;
  markInstallmentOverdue: (agreementId: string, installmentNumber: number) => Promise<void>;
  getGuarantorById: (id: string) => GuarantorAgreement | undefined;
  refreshGuarantorStatuses: () => Promise<void>;
  updateSettings: (data: Partial<AppSettings>, options?: { silent?: boolean }) => Promise<void>;
  getCreditorById: (id: string) => Creditor | undefined;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [guarantorAgreements, setGuarantorAgreements] = useState<GuarantorAgreement[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    notifications: { enabled: true, daysBefore: [1, 3, 7], onDueDate: true, onOverdue: true, soundEnabled: true },
    currency: 'BRL',
    defaultLateFeePercent: 2,
    premium: { isPremium: false },
  });
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    const [c, e, g, s] = await Promise.all([
      storage.loadCreditors(),
      storage.loadExpenses(),
      storage.loadGuarantorAgreements(),
      storage.loadSettings(),
    ]);

    let syncedExpenses = e.map((exp) => ({ ...exp, status: getExpenseStatus(exp) }));
    const missing: Expense[] = [];

    for (const creditor of c) {
      if (!creditor.monthlyAmount || creditor.monthlyAmount <= 0) continue;
      const hasMonthly = syncedExpenses.some(
        (exp) => exp.creditorId === creditor.id && isAutoMonthlyExpense(exp)
      );
      if (hasMonthly) continue;

      missing.push({
        id: newId(),
        creditorId: creditor.id,
        title: `${MONTHLY_EXPENSE_PREFIX} ${creditor.name}`,
        amount: creditor.monthlyAmount,
        dueDate: buildMonthlyDueDate(creditor.preferredPaymentDay),
        status: 'pending',
        paymentMethod: creditor.preferredMethod,
        recurrence: 'monthly',
        recurrenceSeriesId: newId(),
        notes: 'Gerada automaticamente do valor mensal do credor',
        notificationIds: [],
        createdAt: new Date().toISOString(),
      });
    }

    if (missing.length > 0) {
      syncedExpenses = [...syncedExpenses, ...missing];
    }

    const beforeSync = syncedExpenses.length;
    syncedExpenses = syncMonthlyRecurrenceExpenses(syncedExpenses);

    if (missing.length > 0 || syncedExpenses.length !== beforeSync) {
      await storage.saveExpenses(syncedExpenses);
    }

    setCreditors(c);
    setExpenses(syncedExpenses);
    setGuarantorAgreements(g.map(enrichAgreement));
    setSettings({
      ...s,
      defaultLateFeePercent: s.defaultLateFeePercent ?? 2,
      premium: s.premium ?? { isPremium: false },
      notifications: {
        ...s.notifications,
        onOverdue: s.notifications?.onOverdue ?? true,
      },
    });

    const isPro = s.premium?.isPremium === true;
    const digest = await notifications.syncOverdueNotifications(
      syncedExpenses,
      c,
      s.notifications,
      isPro,
      s.notifications?.lastOverdueDigest
    );
    if (digest && digest !== s.notifications?.lastOverdueDigest) {
      const updatedSettings = {
        ...s,
        notifications: { ...s.notifications, lastOverdueDigest: digest },
      };
      await storage.saveSettings(updatedSettings);
      setSettings((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, lastOverdueDigest: digest },
      }));
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await notifications.setupNotifications();
        await refreshData();
      } catch {
        /* evita fechar o app se storage/notificacao falhar */
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshData]);

  const persistGuarantor = async (updated: GuarantorAgreement[]) => {
    const enriched = updated.map(enrichAgreement);
    setGuarantorAgreements(enriched);
    await storage.saveGuarantorAgreements(enriched);
  };

  const persistExpenses = async (updated: Expense[]) => {
    const synced = syncMonthlyRecurrenceExpenses(updated);
    setExpenses(synced);
    await storage.saveExpenses(synced);

    if (settings.notifications.enabled && settings.notifications.onOverdue) {
      try {
        const digest = await notifications.syncOverdueNotifications(
          synced,
          creditors,
          settings.notifications,
          settings.premium?.isPremium === true,
          settings.notifications.lastOverdueDigest
        );
        if (digest && digest !== settings.notifications.lastOverdueDigest) {
          const nextNotif = { ...settings.notifications, lastOverdueDigest: digest };
          const nextSettings = { ...settings, notifications: nextNotif };
          await storage.saveSettings(nextSettings);
          setSettings(nextSettings);
        }
      } catch {
        /* notificacao nao deve bloquear gravacao */
      }
    }

    return synced;
  };

  const isPremium = () => settings.premium?.isPremium === true;
  const canAddCreditor = () => isPremium() || creditors.length < FREE_TIER.maxCreditors;
  const canAddExpenses = (count = 1) =>
    isPremium() || expenses.length + count <= FREE_TIER.maxExpenses;

  const applyPremiumUnlock = async (premium: AppSettings['premium']) => {
    const updated = { ...settings, premium };
    setSettings(updated);
    await storage.saveSettings(updated);

    if (updated.notifications.enabled && updated.notifications.onOverdue) {
      try {
        const digest = await notifications.syncOverdueNotifications(
          expenses,
          creditors,
          updated.notifications,
          true,
          updated.notifications.lastOverdueDigest
        );
        if (digest && digest !== updated.notifications.lastOverdueDigest) {
          const nextSettings = {
            ...updated,
            notifications: { ...updated.notifications, lastOverdueDigest: digest },
          };
          setSettings(nextSettings);
          await storage.saveSettings(nextSettings);
        }
      } catch {
        /* notificacao nao deve bloquear ativacao */
      }
    }

    showToast('Meu Controle Pro ativado!', 'success');
  };

  const grantPremiumFromPlay = async () => {
    await applyPremiumUnlock({
      isPremium: true,
      licenseKey: 'GOOGLE_PLAY',
      activatedAt: new Date().toISOString(),
    });
  };

  const activatePremium = async (licenseKey: string) => {
    if (isPlayStoreBuild()) return false;
    if (!isValidLicenseKey(licenseKey)) return false;

    const premium = {
      isPremium: true,
      licenseKey: licenseKey.trim().toUpperCase().replace(/\s/g, ''),
      activatedAt: new Date().toISOString(),
    };
    await applyPremiumUnlock(premium);
    return true;
  };

  const assertGuarantorPro = () => {
    if (!canUseGuarantorModule(isPremium())) {
      throw new Error('Módulo Fiador disponível no Meu Controle Pro.');
    }
  };

  const addCreditor = async (data: Omit<Creditor, 'id' | 'createdAt'>) => {
    if (!canAddCreditor()) {
      throw new Error(`Limite gratuito: ${FREE_TIER.maxCreditors} credores. Ative o Pro em Ajustes.`);
    }
    const creditor: Creditor = { ...data, id: newId(), createdAt: new Date().toISOString() };
    const updated = [...creditors, creditor];
    setCreditors(updated);
    try {
      await storage.saveCreditors(updated);
    } catch (err) {
      setCreditors(creditors);
      throw err instanceof Error ? err : new Error('Falha ao gravar credor no dispositivo');
    }

    if (creditor.monthlyAmount && creditor.monthlyAmount > 0) {
      const expense: Expense = {
        id: newId(),
        creditorId: creditor.id,
        title: `${MONTHLY_EXPENSE_PREFIX} ${creditor.name}`,
        amount: creditor.monthlyAmount,
        dueDate: buildMonthlyDueDate(creditor.preferredPaymentDay),
        status: 'pending',
        paymentMethod: creditor.preferredMethod,
        recurrence: 'monthly',
        recurrenceSeriesId: newId(),
        notes: 'Gerada automaticamente do valor mensal do credor',
        notificationIds: [],
        createdAt: new Date().toISOString(),
      };

      try {
        if (settings.notifications.enabled) {
          expense.notificationIds = await notifications.scheduleExpenseNotifications(
            expense,
            creditor,
            settings.notifications
          );
        }
      } catch {
        expense.notificationIds = [];
      }

      const updatedExpenses = [...expenses, expense];
      setExpenses(updatedExpenses);
      await persistExpenses(updatedExpenses);
    }

    showToast(`Credor "${creditor.name}" cadastrado`, 'success');
    return creditor;
  };

  const updateCreditor = async (id: string, data: Partial<Creditor>) => {
    const existing = creditors.find((c) => c.id === id);
    if (!existing) return;

    const merged = { ...existing, ...data };
    const updated = creditors.map((c) => (c.id === id ? merged : c));
    setCreditors(updated);
    try {
      await storage.saveCreditors(updated);
    } catch (err) {
      setCreditors(creditors);
      throw err instanceof Error ? err : new Error('Falha ao gravar credor no dispositivo');
    }

    const monthlyIdx = expenses.findIndex((e) => e.creditorId === id && isAutoMonthlyExpense(e));

    if (merged.monthlyAmount && merged.monthlyAmount > 0) {
      const monthlyData: Partial<Expense> = {
        title: `${MONTHLY_EXPENSE_PREFIX} ${merged.name}`,
        amount: merged.monthlyAmount,
        dueDate: buildMonthlyDueDate(merged.preferredPaymentDay),
        paymentMethod: merged.preferredMethod,
        recurrence: 'monthly',
      };

      if (monthlyIdx >= 0) {
        const existingExp = expenses[monthlyIdx];
        const patched = expenses.map((e, i) =>
          i === monthlyIdx
            ? { ...e, ...monthlyData, status: getExpenseStatus({ ...e, ...monthlyData } as Expense) }
            : e
        );
        setExpenses(patched);
        await persistExpenses(patched);
      } else {
        const expense: Expense = {
          id: newId(),
          creditorId: id,
          title: monthlyData.title!,
          amount: merged.monthlyAmount,
          dueDate: monthlyData.dueDate!,
          status: 'pending',
          paymentMethod: merged.preferredMethod,
          recurrence: 'monthly',
          recurrenceSeriesId: newId(),
          notes: 'Gerada automaticamente do valor mensal do credor',
          notificationIds: [],
          createdAt: new Date().toISOString(),
        };
        const patched = [...expenses, expense];
        setExpenses(patched);
        await persistExpenses(patched);
      }
    } else if (monthlyIdx >= 0) {
      const toRemove = expenses[monthlyIdx];
      await notifications.cancelNotifications(toRemove.notificationIds);
      const patched = expenses.filter((e) => e.id !== toRemove.id);
      setExpenses(patched);
      await storage.saveExpenses(patched);
    }

    showToast(`Credor "${merged.name}" atualizado`, 'success');
  };

  const deleteCreditor = async (id: string) => {
    const creditor = creditors.find((c) => c.id === id);
    const relatedExpenses = expenses.filter((e) => e.creditorId === id);
    for (const exp of relatedExpenses) {
      await notifications.cancelNotifications(exp.notificationIds);
    }
    const updatedCreditors = creditors.filter((c) => c.id !== id);
    const updatedExpenses = expenses.filter((e) => e.creditorId !== id);
    setCreditors(updatedCreditors);
    setExpenses(updatedExpenses);
    await storage.saveCreditors(updatedCreditors);
    await storage.saveExpenses(updatedExpenses);
    showToast(`Credor "${creditor?.name ?? 'removido'}" excluído`, 'info');
  };

  const addExpense = async (
    data: Omit<Expense, 'id' | 'createdAt' | 'notificationIds' | 'status'>
  ) => {
    const creditor = creditors.find((c) => c.id === data.creditorId);
    const installmentTotal = data.installment?.total ?? 0;
    const isInstallmentPlan = installmentTotal > 1;
    const newCount = isInstallmentPlan ? installmentTotal : 1;

    if (!canAddExpenses(newCount)) {
      throw new Error(
        `Limite gratuito: ${FREE_TIER.maxExpenses} despesas. Ative o Pro em Ajustes.`
      );
    }

    const buildOne = (
      payload: Omit<Expense, 'id' | 'createdAt' | 'notificationIds' | 'status'>
    ): Expense => ({
      ...payload,
      id: newId(),
      status: 'pending',
      notificationIds: [],
      createdAt: new Date().toISOString(),
      recurrenceSeriesId: payload.recurrence === 'monthly' ? newId() : undefined,
    });

    let toInsert: Expense[] = [];

    if (isInstallmentPlan) {
      const seriesId = newId();
      const seriesPayloads = buildInstallmentSeriesExpenses(
        { ...data, recurrence: 'none', installment: undefined },
        installmentTotal,
        seriesId
      );
      toInsert = seriesPayloads.map((payload) => buildOne(payload));
    } else {
      toInsert = [buildOne(data)];
    }

    if (creditor && settings.notifications.enabled) {
      for (const expense of toInsert) {
        try {
          expense.notificationIds = await notifications.scheduleExpenseNotifications(
            expense,
            creditor,
            settings.notifications
          );
        } catch {
          expense.notificationIds = [];
        }
      }
    }

    const updated = [...expenses, ...toInsert];
    await persistExpenses(updated);

    if (isInstallmentPlan) {
      showToast(`${installmentTotal} parcelas criadas — busque na ficha da despesa`, 'success');
    } else if (data.recurrence === 'monthly') {
      showToast('Despesa mensal criada — cobra todo mês ao marcar como paga', 'success');
    } else {
      showToast(`Despesa "${toInsert[0].title}" cadastrada`, 'success');
    }
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    const existing = expenses.find((e) => e.id === id);
    if (!existing) return;

    if (data.dueDate && data.dueDate !== existing.dueDate) {
      await notifications.cancelNotifications(existing.notificationIds);
      const creditor = creditors.find((c) => c.id === existing.creditorId);
      if (creditor && settings.notifications.enabled) {
        try {
          const updatedExpense = { ...existing, ...data };
          data.notificationIds = await notifications.scheduleExpenseNotifications(
            updatedExpense as Expense,
            creditor,
            settings.notifications
          );
        } catch {
          data.notificationIds = [];
        }
      }
    }

    const patch: Partial<Expense> = { ...data };
    if (data.recurrence === 'monthly' && !existing.recurrenceSeriesId) {
      patch.recurrenceSeriesId = existing.recurrenceSeriesId ?? existing.id;
    }
    if (data.recurrence === 'none') {
      patch.recurrenceSeriesId = undefined;
    }

    const updated = expenses.map((e) =>
      e.id === id ? { ...e, ...patch, status: getExpenseStatus({ ...e, ...patch } as Expense) } : e
    );
    await persistExpenses(updated);
    const saved = updated.find((e) => e.id === id);
    if (saved) {
      showToast(
        saved.recurrence === 'monthly'
          ? 'Recorrência mensal atualizada'
          : `Despesa "${saved.title}" atualizada`,
        'success'
      );
    }
  };

  const deleteExpense = async (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    if (expense) await notifications.cancelNotifications(expense.notificationIds);
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    await storage.saveExpenses(updated);
    showToast(`Despesa "${expense?.title ?? 'removida'}" excluída`, 'info');
  };

  const markAsPaid = async (id: string) => {
    if (id.endsWith('-next-preview')) return;

    const expense = expenses.find((e) => e.id === id);
    if (!expense || getExpenseStatus(expense) === 'paid') return;

    await notifications.cancelNotifications(expense.notificationIds);

    let updated: Expense[];

    if (isRollingMonthly(expense)) {
      const nextDue = advanceMonthlyDueDate(expense);
      const rolled: Expense = {
        ...expense,
        dueDate: nextDue,
        status: getExpenseStatus({ ...expense, dueDate: nextDue, status: 'pending', paidAt: undefined }),
        paidAt: undefined,
        notificationIds: [],
      };

      const creditor = creditors.find((c) => c.id === expense.creditorId);
      if (creditor && settings.notifications.enabled) {
        try {
          rolled.notificationIds = await notifications.scheduleExpenseNotifications(
            rolled,
            creditor,
            settings.notifications
          );
        } catch {
          rolled.notificationIds = [];
        }
      }

      updated = expenses.map((e) => (e.id === id ? rolled : e));
      await persistExpenses(updated);
      showToast(`Pago! Próximo vencimento: ${formatShortDate(nextDue)}`, 'success');
      return;
    }

    updated = expenses.map((e) =>
      e.id === id
        ? { ...e, status: 'paid' as const, paidAt: new Date().toISOString(), notificationIds: [] }
        : e
    );
    await persistExpenses(updated);
    showToast(`"${expense.title}" marcada como paga`, 'success');
  };

  const markAsUnpaid = async (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    if (!expense || getExpenseStatus(expense) !== 'paid') return;

    const creditor = creditors.find((c) => c.id === expense.creditorId);
    let notificationIds: string[] = [];

    if (creditor && settings.notifications.enabled) {
      try {
        notificationIds = await notifications.scheduleExpenseNotifications(
          { ...expense, status: 'pending', paidAt: undefined },
          creditor,
          settings.notifications
        );
      } catch {
        notificationIds = [];
      }
    }

    const updated = expenses.map((e) =>
      e.id === id
        ? {
            ...e,
            status: getExpenseStatus({ ...e, status: 'pending', paidAt: undefined }),
            paidAt: undefined,
            notificationIds,
          }
        : e
    );
    await persistExpenses(updated);
    showToast(`"${expense.title}" marcada como pendente`, 'info');
  };

  const markAsScheduled = async (id: string, scheduledDate?: string) => {
    const expense = expenses.find((e) => e.id === id);
    if (!expense || getExpenseStatus(expense) === 'paid') return;

    await notifications.cancelNotifications(expense.notificationIds);

    const payDate = scheduledDate ?? expense.dueDate;
    const updated = expenses.map((e) =>
      e.id === id
        ? {
            ...e,
            status: 'scheduled' as const,
            scheduledPayDate: payDate,
            paidAt: undefined,
            notificationIds: [],
          }
        : e
    );
    await persistExpenses(updated);
    showToast(`Pagamento agendado para ${formatShortDate(payDate)}`, 'info');
  };

  const addGuarantorAgreement = async (
    data: Omit<GuarantorAgreement, 'id' | 'createdAt' | 'installments'> & {
      installments?: GuarantorInstallment[];
    }
  ) => {
    assertGuarantorPro();
    const installments =
      data.installments ??
      generateInstallments(
        data.installmentCount,
        data.installmentAmount,
        data.firstDueDate,
        data.lateFeePercent
      );

    const agreement: GuarantorAgreement = {
      ...data,
      installments,
      id: newId(),
      createdAt: new Date().toISOString(),
    };

    await persistGuarantor([...guarantorAgreements, agreement]);
    showToast(`Acordo com ${agreement.friendName} cadastrado`, 'success');
  };

  const updateGuarantorAgreement = async (id: string, data: Partial<GuarantorAgreement>) => {
    assertGuarantorPro();
    const existing = guarantorAgreements.find((a) => a.id === id);
    const updated = guarantorAgreements.map((a) => (a.id === id ? { ...a, ...data } : a));
    await persistGuarantor(updated);
    showToast(`Acordo com ${existing?.friendName ?? 'fiador'} atualizado`, 'success');
  };

  const deleteGuarantorAgreement = async (id: string) => {
    assertGuarantorPro();
    const existing = guarantorAgreements.find((a) => a.id === id);
    await persistGuarantor(guarantorAgreements.filter((a) => a.id !== id));
    showToast(`Acordo com ${existing?.friendName ?? 'fiador'} excluído`, 'info');
  };

  const markInstallmentPaid = async (agreementId: string, installmentNumber: number) => {
    assertGuarantorPro();
    const agreement = guarantorAgreements.find((a) => a.id === agreementId);
    if (!agreement) return;

    const updated = guarantorAgreements.map((a) => {
      if (a.id !== agreementId) return a;
      return {
        ...a,
        installments: a.installments.map((inst) => {
          if (inst.number !== installmentNumber) return inst;
          const enriched = enrichInstallment(inst, a.lateFeePercent);
          return {
            ...enriched,
            status: 'paid' as const,
            paidAt: new Date().toISOString(),
            totalDue: enriched.baseAmount + enriched.lateFeeAmount,
          };
        }),
      };
    });

    await persistGuarantor(updated);
    showToast(`Parcela ${installmentNumber} marcada como paga`, 'success');
  };

  const markInstallmentOverdue = async (agreementId: string, installmentNumber: number) => {
    assertGuarantorPro();
    const updated = guarantorAgreements.map((a) => {
      if (a.id !== agreementId) return a;
      return {
        ...a,
        installments: a.installments.map((inst) => {
          if (inst.number !== installmentNumber || inst.status === 'paid') return inst;
          const enriched = enrichInstallment({ ...inst, status: 'overdue' }, a.lateFeePercent);
          return enriched;
        }),
      };
    });

    await persistGuarantor(updated);
    showToast(`Parcela ${installmentNumber} marcada como atrasada`, 'info');
  };

  const refreshGuarantorStatuses = useCallback(async () => {
    setGuarantorAgreements((current) => {
      const enriched = current.map(enrichAgreement);
      void storage.saveGuarantorAgreements(enriched);
      return enriched;
    });
  }, []);

  const getGuarantorById = (id: string) =>
    guarantorAgreements.find((a) => a.id === id);

  const updateSettings = async (data: Partial<AppSettings>, options?: { silent?: boolean }) => {
    const updated = { ...settings, ...data };
    setSettings(updated);
    await storage.saveSettings(updated);
    if (!options?.silent) showToast('Configurações salvas', 'success');
  };

  const getCreditorById = (id: string) => creditors.find((c) => c.id === id);

  return (
    <AppContext.Provider
      value={{
        creditors,
        expenses,
        guarantorAgreements,
        settings,
        loading,
        addCreditor,
        updateCreditor,
        deleteCreditor,
        addExpense,
        updateExpense,
        deleteExpense,
        markAsPaid,
        markAsUnpaid,
        markAsScheduled,
        activatePremium,
        grantPremiumFromPlay,
        isPremium,
        canAddCreditor,
        canAddExpenses,
        addGuarantorAgreement,
        updateGuarantorAgreement,
        deleteGuarantorAgreement,
        markInstallmentPaid,
        markInstallmentOverdue,
        getGuarantorById,
        refreshGuarantorStatuses,
        updateSettings,
        getCreditorById,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
