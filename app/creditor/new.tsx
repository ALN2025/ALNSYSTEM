import React, { useRef, useState } from 'react';
import {
  StyleSheet, ScrollView, Pressable, Text, View, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FormInput, FormSelect, CurrencyInput, DateInput, DocumentInput, PhoneInput } from '../../src/components/FormInput';
import { PixPayButton } from '../../src/components/PixPayButton';
import { useApp } from '../../src/context/AppContext';
import {
  CREDITOR_CATEGORIES, CREDITOR_COLORS, CREDITOR_ICONS, CREDITOR_TYPES, PAYMENT_METHODS,
} from '../../src/constants/categories';
import { CreditorCategory, CreditorType, PaymentMethod } from '../../src/types';
import { parseCurrencyInput, dateInputToIso } from '../../src/utils/format';
import { showFormError, showFormInfo } from '../../src/utils/alert';
import { closeFormAfterSave } from '../../src/utils/navigation';
import { PremiumPaywall } from '../../src/components/PremiumPaywall';
import { Colors, BorderRadius, FontSize, Spacing } from '../../src/constants/theme';

export default function NewCreditorScreen() {
  const router = useRouter();
  const { addCreditor, addExpense } = useApp();

  const [name, setName] = useState('');
  const [type, setType] = useState<CreditorType>('PJ');
  const [document, setDocument] = useState('');
  const [category, setCategory] = useState<CreditorCategory>('other');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [bank, setBank] = useState('');
  const [agency, setAgency] = useState('');
  const [account, setAccount] = useState('');
  const [preferredDay, setPreferredDay] = useState('10');
  const [preferredMethod, setPreferredMethod] = useState<PaymentMethod>('pix');
  const [color, setColor] = useState(CREDITOR_COLORS[0]);
  const [icon, setIcon] = useState(CREDITOR_ICONS[0]);
  const [notes, setNotes] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [billingType, setBillingType] = useState<'none' | 'monthly' | 'installments'>('none');
  const [installmentCount, setInstallmentCount] = useState('');
  const [firstDueDate, setFirstDueDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPremium, setShowPremium] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    Keyboard.dismiss();
    setFormError('');

    if (!name.trim()) {
      const msg = 'Informe o nome do credor (campo no topo do formulário).';
      setFormError(msg);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      showFormError(msg);
      return;
    }

    const parsedMonthly = parseCurrencyInput(monthlyAmount);
    if (monthlyAmount.trim() && parsedMonthly <= 0) {
      const msg = 'Informe um valor mensal válido.';
      setFormError(msg);
      showFormError(msg);
      return;
    }

    if (billingType === 'installments') {
      const count = parseInt(installmentCount, 10);
      if (!count || count < 2) {
        const msg = 'Informe a quantidade de parcelas (mínimo 2).';
        setFormError(msg);
        showFormError(msg);
        return;
      }
      if (!dateInputToIso(firstDueDate)) {
        const msg = 'Informe o vencimento da 1ª parcela (DD/MM/AAAA).';
        setFormError(msg);
        showFormError(msg);
        return;
      }
    }

    if (billingType === 'monthly' && parsedMonthly <= 0) {
      const msg = 'Informe o valor mensal para cobrança recorrente.';
      setFormError(msg);
      showFormError(msg);
      return;
    }

    setSaving(true);
    try {
      const creditor = await addCreditor({
        name: name.trim(),
        type,
        document: document.trim(),
        category,
        phone: phone.trim(),
        email: email.trim(),
        pixKey: pixKey.trim(),
        bankInfo: { bank: bank.trim(), agency: agency.trim(), account: account.trim(), accountType: 'checking' },
        preferredPaymentDay: parseInt(preferredDay, 10) || 1,
        preferredMethod,
        color,
        icon,
        notes: notes.trim(),
        monthlyAmount: billingType === 'monthly' && parsedMonthly > 0 ? parsedMonthly : undefined,
      });

      if (billingType === 'installments' && parsedMonthly > 0) {
        try {
          await addExpense({
            creditorId: creditor.id,
            title: name.trim(),
            amount: parsedMonthly,
            dueDate: dateInputToIso(firstDueDate)!,
            paymentMethod: preferredMethod,
            recurrence: 'none',
            installment: { current: 1, total: parseInt(installmentCount, 10) },
            notes: notes.trim(),
          });
        } catch {
          showFormInfo(
            'Credor salvo. Não foi possível criar as parcelas — registre na aba Despesas.'
          );
        }
      }

      closeFormAfterSave(router, '/(tabs)/creditors');
    } catch (err) {
      const detail = err instanceof Error ? err.message : '';
      const msg = detail
        ? `Não foi possível salvar o credor: ${detail}`
        : 'Não foi possível salvar o credor. Tente novamente.';
      setFormError(msg);
      if (msg.includes('Limite gratuito') || msg.includes('Pro')) {
        setShowPremium(true);
      }
      showFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = Object.entries(CREDITOR_CATEGORIES).map(([value, info]) => ({
    label: info.label,
    value,
  }));

  const methodOptions = Object.entries(PAYMENT_METHODS).map(([value, info]) => ({
    label: info.label,
    value,
  }));

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.preview}>
          <LinearGradient colors={[color, `${color}88`]} style={styles.previewAvatar}>
            <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={32} color="#FFF" />
          </LinearGradient>
          <Text style={styles.previewName}>{name || 'Nome do Credor'}</Text>
          <Text style={styles.previewType}>{CREDITOR_TYPES[type]}</Text>
        </View>

        <FormInput label="Nome / Razão Social *" icon="business" value={name} onChangeText={setName} placeholder="Ex: Banco XYZ, Netflix, Eletropaulo" />

        <FormSelect
          label="Tipo"
          value={type}
          options={[
            { label: 'Pessoa Jurídica', value: 'PJ' },
            { label: 'Pessoa Física', value: 'PF' },
          ]}
          onChange={(v) => setType(v as CreditorType)}
        />

        <DocumentInput
          label={type === 'PF' ? 'CPF' : 'CNPJ'}
          type={type}
          value={document}
          onChangeValue={setDocument}
        />

        <FormSelect label="Categoria" value={category} options={categoryOptions} onChange={(v) => setCategory(v as CreditorCategory)} />

        <CurrencyInput
          label="Valor da cobrança"
          value={monthlyAmount}
          onChangeValue={setMonthlyAmount}
          placeholder="R$ 0,00"
        />

        <FormSelect
          label="Tipo de cobrança"
          value={billingType}
          options={[
            { label: 'Nenhuma (só cadastro)', value: 'none' },
            { label: 'Mensal recorrente', value: 'monthly' },
            { label: 'Parcelado', value: 'installments' },
          ]}
          onChange={(v) => setBillingType(v as 'none' | 'monthly' | 'installments')}
        />

        {billingType === 'monthly' && (
          <Text style={styles.fieldHint}>
            Cobra todo mês automaticamente — ao pagar, avança para o próximo mês sem criar dezenas de registros.
          </Text>
        )}

        {billingType === 'installments' && (
          <>
            <FormInput
              label="Quantidade de parcelas *"
              icon="layers"
              value={installmentCount}
              onChangeText={setInstallmentCount}
              placeholder="Ex: 12"
              keyboardType="numeric"
            />
            <DateInput
              label="Vencimento da 1ª parcela *"
              value={firstDueDate}
              onChangeValue={setFirstDueDate}
              placeholder="DD/MM/AAAA"
            />
            <Text style={styles.fieldHint}>
              As parcelas ficam ocultas na lista — busque pelo número na ficha da despesa e marque paga ou pendente.
            </Text>
          </>
        )}

        {billingType === 'none' && monthlyAmount.trim() && (
          <Text style={styles.fieldHint}>
            Com &quot;Nenhuma&quot;, o valor fica só como referência. Registre pagamentos na aba Despesas.
          </Text>
        )}

        <Text style={styles.sectionTitle}>Cor & Ícone</Text>
        <View style={styles.colorRow}>
          {CREDITOR_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorSelected]}
            />
          ))}
        </View>
        <View style={styles.iconRow}>
          {CREDITOR_ICONS.map((i) => (
            <Pressable
              key={i}
              onPress={() => setIcon(i)}
              style={[styles.iconChip, icon === i && { backgroundColor: color }]}
            >
              <Ionicons name={i as keyof typeof Ionicons.glyphMap} size={18} color={icon === i ? '#FFF' : Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => setShowAdvanced(!showAdvanced)} style={styles.advancedToggle}>
          <Text style={styles.advancedText}>
            {showAdvanced ? 'Ocultar' : 'Mostrar'} dados de contato e pagamento
          </Text>
          <Ionicons name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.primaryLight} />
        </Pressable>

        {showAdvanced && (
          <>
            <PhoneInput label="Telefone" value={phone} onChangeValue={setPhone} />
            <FormInput label="E-mail" icon="mail" value={email} onChangeText={setEmail} placeholder="contato@empresa.com" keyboardType="email-address" autoCapitalize="none" />
            <FormInput label="Chave PIX" icon="qr-code" value={pixKey} onChangeText={setPixKey} placeholder="CPF, e-mail, telefone ou aleatória" />
            {pixKey.trim() ? (
              <PixPayButton pixKey={pixKey} merchantName={name || 'Credor'} amount={parseCurrencyInput(monthlyAmount) || undefined} />
            ) : null}
            <FormInput label="Banco" icon="business" value={bank} onChangeText={setBank} placeholder="Nome do banco" />
            <View style={styles.row2}>
              <View style={styles.half}>
                <FormInput label="Agência" value={agency} onChangeText={setAgency} placeholder="0000" keyboardType="numeric" />
              </View>
              <View style={styles.half}>
                <FormInput label="Conta" value={account} onChangeText={setAccount} placeholder="00000-0" />
              </View>
            </View>
            <FormInput label="Dia preferencial de pagamento" icon="calendar" value={preferredDay} onChangeText={setPreferredDay} placeholder="10" keyboardType="numeric" />
            <FormSelect label="Forma de pagamento preferida" value={preferredMethod} options={methodOptions} onChange={(v) => setPreferredMethod(v as PaymentMethod)} />
            <FormInput label="Observações" icon="create" value={notes} onChangeText={setNotes} placeholder="Informações adicionais..." multiline numberOfLines={3} />
          </>
        )}

        {formError ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : null}

        <Pressable onPress={handleSave} disabled={saving}>
          <LinearGradient colors={[...Colors.gradients.primary]} style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
            <Ionicons name={saving ? 'hourglass' : 'checkmark-circle'} size={22} color="#FFF" />
            <Text style={styles.saveText}>{saving ? 'Salvando...' : 'Salvar Credor'}</Text>
          </LinearGradient>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
      <PremiumPaywall
        visible={showPremium}
        onClose={() => setShowPremium(false)}
        reason="Você atingiu o limite da versão gratuita."
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  preview: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  previewAvatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  previewType: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  fieldHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: 2,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  advancedText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  row2: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  half: { flex: 1 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Colors.danger}22`,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    flex: 1,
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
