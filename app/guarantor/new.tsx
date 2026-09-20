import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet, ScrollView, Pressable, Text, View, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FormInput, CurrencyInput, DateInput, DocumentInput, PhoneInput, DecimalInput } from '../../src/components/FormInput';
import { useApp } from '../../src/context/AppContext';
import { CREDITOR_COLORS } from '../../src/constants/categories';
import { parseCurrencyInput, dateInputToIso, parseDecimalInput } from '../../src/utils/format';
import { Colors, BorderRadius, FontSize, Spacing } from '../../src/constants/theme';

export default function NewGuarantorScreen() {
  const router = useRouter();
  const { addGuarantorAgreement, settings, isPremium } = useApp();

  useEffect(() => {
    if (!isPremium()) router.back();
  }, [isPremium, router]);

  const [friendName, setFriendName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [friendDocument, setFriendDocument] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDocument, setStoreDocument] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installmentCount, setInstallmentCount] = useState('12');
  const [firstDueDate, setFirstDueDate] = useState('');
  const [lateFeePercent, setLateFeePercent] = useState(String(settings.defaultLateFeePercent));
  const [color, setColor] = useState(CREDITOR_COLORS[2]);
  const [notes, setNotes] = useState('');

  const installmentAmount = useMemo(() => {
    const total = parseCurrencyInput(totalAmount);
    const count = parseInt(installmentCount, 10);
    if (isNaN(total) || isNaN(count) || count <= 0) return 0;
    return Math.round((total / count) * 100) / 100;
  }, [totalAmount, installmentCount]);

  const handleSave = async () => {
    if (!friendName.trim()) {
      Alert.alert('Atenção', 'Informe o nome do amigo.');
      return;
    }
    if (!storeName.trim()) {
      Alert.alert('Atenção', 'Informe o nome da loja.');
      return;
    }
    const total = parseCurrencyInput(totalAmount);
    const count = parseInt(installmentCount, 10);
    const fee = parseDecimalInput(lateFeePercent);

    if (total <= 0) {
      Alert.alert('Atenção', 'Informe o valor total válido.');
      return;
    }
    if (isNaN(count) || count <= 0) {
      Alert.alert('Atenção', 'Informe a quantidade de parcelas.');
      return;
    }
    if (!dateInputToIso(firstDueDate)) {
      Alert.alert('Atenção', 'Informe a 1ª parcela no formato DD/MM/AAAA (ex: 10/03/2026).');
      return;
    }

    await addGuarantorAgreement({
      friendName: friendName.trim(),
      friendPhone: friendPhone.trim(),
      friendDocument: friendDocument.trim(),
      storeName: storeName.trim(),
      storeDocument: storeDocument.trim(),
      totalAmount: total,
      installmentCount: count,
      installmentAmount,
      firstDueDate: dateInputToIso(firstDueDate)!,
      lateFeePercent: isNaN(fee) ? settings.defaultLateFeePercent : fee,
      color,
      notes: notes.trim(),
    });

    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={Colors.primaryLight} />
          <Text style={styles.infoText}>
            Registre quando você for fiador de um amigo em compra parcelada. O app calcula juros
            automaticamente se atrasar e gera comprovantes para baixar offline.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Amigo (devedor)</Text>
        <FormInput label="Nome do amigo *" icon="person" value={friendName} onChangeText={setFriendName} placeholder="Ex: João Silva" />
        <PhoneInput label="Telefone" value={friendPhone} onChangeValue={setFriendPhone} />
        <DocumentInput label="CPF" type="PF" value={friendDocument} onChangeValue={setFriendDocument} />

        <Text style={styles.sectionTitle}>Loja / Credor</Text>
        <FormInput label="Nome da loja *" icon="storefront" value={storeName} onChangeText={setStoreName} placeholder="Ex: Magazine Luiza, Casas Bahia" />
        <DocumentInput label="CNPJ da loja" type="PJ" value={storeDocument} onChangeValue={setStoreDocument} />

        <Text style={styles.sectionTitle}>Compra parcelada</Text>
        <CurrencyInput label="Valor total *" value={totalAmount} onChangeValue={setTotalAmount} placeholder="R$ 0,00" />
        <FormInput label="Quantidade de parcelas *" icon="layers" value={installmentCount} onChangeText={setInstallmentCount} placeholder="12" keyboardType="numeric" />

        {installmentAmount > 0 && (
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>Valor de cada parcela</Text>
            <Text style={styles.previewValue}>
              {installmentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Text>
          </View>
        )}

        <DateInput label="1ª parcela vence em *" value={firstDueDate} onChangeValue={setFirstDueDate} placeholder="DD/MM/AAAA" />

        <Text style={styles.sectionTitle}>Juros por atraso</Text>
        <DecimalInput
          label="% ao mês (pro-rata por dia)"
          icon="trending-up"
          value={lateFeePercent}
          onChangeValue={setLateFeePercent}
          placeholder="2,00"
          maxDecimals={2}
        />
        <Text style={styles.hint}>
          Ex: 2% a.m. → parcela de R$ 100 atrasada 15 dias = +R$ 1,00 de juros
        </Text>

        <Text style={styles.sectionTitle}>Cor</Text>
        <View style={styles.colorRow}>
          {CREDITOR_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorSelected]}
            />
          ))}
        </View>

        <FormInput label="Observações" icon="create" value={notes} onChangeText={setNotes} placeholder="Detalhes do acordo..." multiline numberOfLines={3} />

        <Pressable onPress={handleSave}>
          <LinearGradient colors={[...Colors.gradients.accent]} style={styles.saveButton}>
            <Ionicons name="hand-left" size={22} color="#FFF" />
            <Text style={styles.saveText}>Salvar Acordo de Fiador</Text>
          </LinearGradient>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  infoBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: `${Colors.primary}22`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  previewBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  previewLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  previewValue: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '800', marginTop: 4 },
  hint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: -8,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: '#FFF' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  saveText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
});
