import {
  addMonths, parseISO, differenceInDays, isPast, isToday, format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GuarantorAgreement, GuarantorInstallment, InstallmentStatus } from '../types';
import { BRAND } from '../constants/branding';

export function calculateLateFee(
  baseAmount: number,
  daysLate: number,
  lateFeePercent: number
): number {
  if (daysLate <= 0) return 0;
  return baseAmount * (lateFeePercent / 100) * (daysLate / 30);
}

export function getInstallmentStatus(
  installment: GuarantorInstallment,
  referenceDate: Date = new Date()
): InstallmentStatus {
  if (installment.status === 'paid') return 'paid';
  const due = parseISO(installment.dueDate);
  if (isPast(due) && !isToday(due)) return 'overdue';
  return 'pending';
}

export function enrichInstallment(
  installment: GuarantorInstallment,
  lateFeePercent: number,
  referenceDate: Date = new Date()
): GuarantorInstallment {
  const status = getInstallmentStatus(installment, referenceDate);

  if (status === 'paid') {
    return {
      ...installment,
      status: 'paid',
      totalDue: installment.baseAmount + installment.lateFeeAmount,
    };
  }

  const due = parseISO(installment.dueDate);
  const daysLate = status === 'overdue' ? Math.max(0, differenceInDays(referenceDate, due)) : 0;
  const percent = installment.lateFeePercent || lateFeePercent;
  const lateFeeAmount = calculateLateFee(installment.baseAmount, daysLate, percent);

  return {
    ...installment,
    status,
    daysLate,
    lateFeePercent: percent,
    lateFeeAmount,
    totalDue: installment.baseAmount + lateFeeAmount,
  };
}

export function enrichAgreement(agreement: GuarantorAgreement): GuarantorAgreement {
  return {
    ...agreement,
    installments: agreement.installments.map((i) =>
      enrichInstallment(i, agreement.lateFeePercent)
    ),
  };
}

export function generateInstallments(
  installmentCount: number,
  installmentAmount: number,
  firstDueDate: string,
  lateFeePercent: number
): GuarantorInstallment[] {
  const first = parseISO(firstDueDate);
  return Array.from({ length: installmentCount }, (_, idx) => {
    const dueDate = addMonths(first, idx).toISOString();
    return {
      number: idx + 1,
      dueDate,
      baseAmount: installmentAmount,
      status: 'pending' as InstallmentStatus,
      daysLate: 0,
      lateFeePercent,
      lateFeeAmount: 0,
      totalDue: installmentAmount,
    };
  });
}

export function getAgreementStats(agreement: GuarantorAgreement) {
  const enriched = enrichAgreement(agreement);
  const paid = enriched.installments.filter((i) => i.status === 'paid');
  const overdue = enriched.installments.filter((i) => i.status === 'overdue');
  const pending = enriched.installments.filter((i) => i.status === 'pending');

  return {
    paidCount: paid.length,
    overdueCount: overdue.length,
    pendingCount: pending.length,
    totalPaid: paid.reduce((s, i) => s + i.totalDue, 0),
    totalOverdue: overdue.reduce((s, i) => s + i.totalDue, 0),
    totalPending: pending.reduce((s, i) => s + i.totalDue, 0),
    totalLateFees: enriched.installments.reduce((s, i) => s + i.lateFeeAmount, 0),
    nextInstallment: pending[0] ?? overdue[0] ?? null,
  };
}

export function buildInstallmentReport(
  agreement: GuarantorAgreement,
  installment: GuarantorInstallment
): string {
  const enriched = enrichInstallment(installment, agreement.lateFeePercent);
  const dueFormatted = format(parseISO(enriched.dueDate), "dd/MM/yyyy", { locale: ptBR });
  const paidFormatted = enriched.paidAt
    ? format(parseISO(enriched.paidAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : '—';

  const statusLabel =
    enriched.status === 'paid' ? 'PAGO' : enriched.status === 'overdue' ? 'ATRASADO' : 'PENDENTE';

  const lines = [
    '══════════════════════════════════════',
    '       MEU CONTROLE',
    '══════════════════════════════════════',
    '',
    `Amigo(a): ${agreement.friendName}`,
    agreement.friendPhone ? `Telefone: ${agreement.friendPhone}` : null,
    agreement.friendDocument ? `CPF: ${agreement.friendDocument}` : null,
    '',
    `Loja: ${agreement.storeName}`,
    agreement.storeDocument ? `CNPJ Loja: ${agreement.storeDocument}` : null,
    '',
    '──────────────────────────────────────',
    `Parcela: ${enriched.number}/${agreement.installmentCount}`,
    `Vencimento: ${dueFormatted}`,
    `Status: ${statusLabel}`,
    '──────────────────────────────────────',
    '',
    `Valor da parcela: ${formatBRL(enriched.baseAmount)}`,
  ];

  if (enriched.status === 'overdue') {
    lines.push(
      `Dias de atraso: ${enriched.daysLate}`,
      `Juros (${enriched.lateFeePercent}% a.m. pro-rata): ${formatBRL(enriched.lateFeeAmount)}`,
      `TOTAL A COBRAR: ${formatBRL(enriched.totalDue)}`
    );
  } else if (enriched.status === 'paid') {
    lines.push(
      enriched.lateFeeAmount > 0
        ? `Juros cobrados: ${formatBRL(enriched.lateFeeAmount)}`
        : null,
      `Valor pago: ${formatBRL(enriched.totalDue)}`,
      `Data do pagamento: ${paidFormatted}`
    );
  } else {
    lines.push(`Total previsto: ${formatBRL(enriched.totalDue)}`);
  }

  if (agreement.notes) {
    lines.push('', `Observações: ${agreement.notes}`);
  }

  lines.push(
    '',
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    `Gerado por ${BRAND.signature} · Meu Controle`,
    '══════════════════════════════════════'
  );

  return lines.filter(Boolean).join('\n');
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function buildAgreementSummaryReport(agreement: GuarantorAgreement): string {
  const enriched = enrichAgreement(agreement);
  const stats = getAgreementStats(agreement);

  const lines = [
    '══════════════════════════════════════',
    '   RESUMO DO ACORDO — FIADOR',
    '══════════════════════════════════════',
    '',
    `Amigo(a): ${agreement.friendName}`,
    `Loja: ${agreement.storeName}`,
    `Total: ${formatBRL(agreement.totalAmount)} em ${agreement.installmentCount}x`,
    `Juros por atraso: ${agreement.lateFeePercent}% ao mês (pro-rata)`,
    '',
    `Pagas: ${stats.paidCount} | Atrasadas: ${stats.overdueCount} | Pendentes: ${stats.pendingCount}`,
    `Total pago: ${formatBRL(stats.totalPaid)}`,
    `Total em atraso: ${formatBRL(stats.totalOverdue)}`,
    `Juros acumulados: ${formatBRL(stats.totalLateFees)}`,
    '',
    'PARCELAS:',
    '──────────────────────────────────────',
  ];

  for (const inst of enriched.installments) {
    const due = format(parseISO(inst.dueDate), 'dd/MM/yy');
    const status =
      inst.status === 'paid' ? '✓ Pago' : inst.status === 'overdue' ? '⚠ Atrasado' : '○ Pendente';
    const extra = inst.lateFeeAmount > 0 ? ` (+${formatBRL(inst.lateFeeAmount)} juros)` : '';
    lines.push(
      `${inst.number}/${agreement.installmentCount} | ${due} | ${formatBRL(inst.totalDue)}${extra} | ${status}`
    );
  }

  lines.push(
    '',
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    '══════════════════════════════════════'
  );

  return lines.join('\n');
}
