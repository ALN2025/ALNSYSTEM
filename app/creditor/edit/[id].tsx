import React, { useRef, useState } from 'react';
import {
  StyleSheet, ScrollView, Pressable, Text, View, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FormInput, FormSelect, CurrencyInput, DocumentInput, PhoneInput } from '../../../src/components/FormInput';
import { PixPayButton } from '../../../src/components/PixPayButton';
import { useApp } from '../../../src/context/AppContext';
import {
  CREDITOR_CATEGORIES, CREDITOR_COLORS, CREDITOR_ICONS, CREDITOR_TYPES, PAYMENT_METHODS,
} from '../../../src/constants/categories';
import { CreditorCategory, CreditorType, PaymentMethod } from '../../../src/types';
import { numberToCurrencyInput, parseCurrencyInput } from '../../../src/utils/format';
import { showFormError } from '../../../src/utils/alert';
import { closeFormAfterSave } from '../../../src/utils/navigation';
import { Colors, BorderRadius, FontSize, Spacing } from '../../../src/constants/theme';

export default function EditCreditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getCreditorById, updateCreditor } = useApp();
  const creditor = getCreditorById(id!);

  const [name, setName] = useState(creditor?.name ?? '');
  const [type, setType] = useState<CreditorType>(creditor?.type ?? 'PJ');
  const [document, setDocument] = useState(creditor?.document ?? '');
  const [category, setCategory] = useState<CreditorCategory>(creditor?.category ?? 'other');
  const [phone, setPhone] = useState(creditor?.phone ?? '');
  const [email, setEmail] = useState(creditor?.email ?? '');
  const [pixKey, setPixKey] = useState(creditor?.pixKey ?? '');
  const [bank, setBank] = useState(creditor?.bankInfo.bank ?? '');
  const [agency, setAgency] = useState(creditor?.bankInfo.agency ?? '');
  const [account, setAccount] = useState(creditor?.bankInfo.account ?? '');
  const [preferredDay, setPreferredDay] = useState(String(creditor?.preferredPaymentDay ?? 10));
  const [preferredMethod, setPreferredMethod] = useState<PaymentMethod>(creditor?.preferredMethod ?? 'pix');
  const [color, setColor] = useState(creditor?.color ?? CREDITOR_COLORS[0]);
  const [icon, setIcon] = useState(creditor?.icon ?? CREDITOR_ICONS[0]);
  const [notes, setNotes] = useState(creditor?.notes ?? '');
  const [monthlyAmount, setMonthlyAmount] = useState(numberToCurrencyInput(creditor?.monthlyAmount ?? 0));
  const [showAdvanced, setShowAdvanced] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  if (!creditor) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Credor não encontrado</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (saving) return;
    Keyboard.dismiss();
    setFormError('');

    if (!name.trim()) {
      const msg = 'Informe o nome do credor.';
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

    setSaving(true);
    try {
      await updateCreditor(creditor.id, {
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
        monthlyAmount: parsedMonthly > 0 ? parsedMonthly : undefined,
      });
      closeFormAfterSave(router, '/(tabs)/creditors');
    } catch {
      const msg = 'Não foi possível salvar as alterações.';
      setFormError(msg);
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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.preview}>
          <LinearGradient colors={[color, `${color}88`]} style={styles.previewAvatar}>
            <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={32} color="#FFF" />
          </LinearGradient>
          <Text style={styles.previewName}>{name || 'Nome do Credor'}</Text>
          <Text style={styles.previewType}>{CREDITOR_TYPES[type]}</Text>
        </View>

        <FormInput label="Nome / Razão Social *" icon="business" value={name} onChangeText={setName} />
        <FormSelect label="Tipo" value={type} options={[{ label: 'Pessoa Jurídica', value: 'PJ' }, { label: 'Pessoa Física', value: 'PF' }]} onChange={(v) => setType(v as CreditorType)} />
        <DocumentInput label={type === 'PF' ? 'CPF' : 'CNPJ'} type={type} value={document} onChangeValue={setDocument} />
        <FormSelect label="Categoria" value={category} options={categoryOptions} onChange={(v) => setCategory(v as CreditorCategory)} />
        <CurrencyInput label="Valor que você paga por mês" value={monthlyAmount} onChangeValue={setMonthlyAmount} placeholder="R$ 0,00" />

        <Text style={styles.sectionTitle}>Cor & Ícone</Text>
        <View style={styles.colorRow}>
          {CREDITOR_COLORS.map((c) => (
            <Pressable key={c} onPress={() => setColor(c)} style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorSelected]} />
          ))}
        </View>
        <View style={styles.iconRow}>
          {CREDITOR_ICONS.map((i) => (
            <Pressable key={i} onPress={() => setIcon(i)} style={[styles.iconChip, icon === i && { backgroundColor: color }]}>
              <Ionicons name={i as keyof typeof Ionicons.glyphMap} size={18} color={icon === i ? '#FFF' : Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => setShowAdvanced(!showAdvanced)} style={styles.advancedToggle}>
          <Text style={styles.advancedText}>{showAdvanced ? 'Ocultar' : 'Mostrar'} dados de contato e pagamento</Text>
          <Ionicons name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.primaryLight} />
        </Pressable>

        {showAdvanced && (
          <>
            <PhoneInput label="Telefone" value={phone} onChangeValue={setPhone} />
            <FormInput label="E-mail" icon="mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <FormInput label="Chave PIX" icon="qr-code" value={pixKey} onChangeText={setPixKey} />
            {pixKey.trim() ? (
              <PixPayButton pixKey={pixKey} merchantName={name || 'Credor'} amount={parseCurrencyInput(monthlyAmount) || undefined} />
            ) : null}
            <FormInput label="Banco" icon="business" value={bank} onChangeText={setBank} />
            <View style={styles.row2}>
              <View style={styles.half}><FormInput label="Agência" value={agency} onChangeText={setAgency} keyboardType="numeric" /></View>
              <View style={styles.half}><FormInput label="Conta" value={account} onChangeText={setAccount} /></View>
            </View>
            <FormInput label="Dia preferencial de pagamento" icon="calendar" value={preferredDay} onChangeText={setPreferredDay} keyboardType="numeric" />
            <FormSelect label="Forma de pagamento preferida" value={preferredMethod} options={methodOptions} onChange={(v) => setPreferredMethod(v as PaymentMethod)} />
            <FormInput label="Observações" icon="create" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
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
            <Ionicons name={saving ? 'hourglass' : 'save'} size={22} color="#FFF" />
            <Text style={styles.saveText}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  notFoundText: { color: Colors.textSecondary, fontSize: FontSize.md },
  preview: { alignItems: 'center', marginBottom: Spacing.lg, paddingVertical: Spacing.lg },
  previewAvatar: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  previewName: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginTop: Spacing.md },
  previewType: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 4 },
  sectionTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.sm },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: '#FFF' },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  iconChip: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  advancedToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, marginBottom: Spacing.md },
  advancedText: { color: Colors.primaryLight, fontSize: FontSize.sm, fontWeight: '600' },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  half: { flex: 1 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: `${Colors.danger}22`, borderWidth: 1, borderColor: Colors.danger, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  errorText: { flex: 1, color: Colors.danger, fontSize: FontSize.sm, fontWeight: '600' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.lg },
  saveButtonDisabled: { opacity: 0.7 },
  saveText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
});
