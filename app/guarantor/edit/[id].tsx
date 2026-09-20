import React, { useState } from 'react';
import {
  StyleSheet, ScrollView, Pressable, Text, View, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FormInput } from '../../../src/components/FormInput';
import { useApp } from '../../../src/context/AppContext';
import { CREDITOR_COLORS } from '../../../src/constants/categories';
import { showAlert } from '../../../src/utils/alert';
import { Colors, BorderRadius, FontSize, Spacing } from '../../../src/constants/theme';
import { canUseGuarantorModule } from '../../../src/constants/premium';
import { PremiumPaywall } from '../../../src/components/PremiumPaywall';

export default function EditGuarantorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getGuarantorById, updateGuarantorAgreement, isPremium } = useApp();
  const agreement = getGuarantorById(id!);

  const [friendName, setFriendName] = useState(agreement?.friendName ?? '');
  const [friendPhone, setFriendPhone] = useState(agreement?.friendPhone ?? '');
  const [friendDocument, setFriendDocument] = useState(agreement?.friendDocument ?? '');
  const [storeName, setStoreName] = useState(agreement?.storeName ?? '');
  const [storeDocument, setStoreDocument] = useState(agreement?.storeDocument ?? '');
  const [lateFeePercent, setLateFeePercent] = useState(String(agreement?.lateFeePercent ?? 2));
  const [color, setColor] = useState(agreement?.color ?? CREDITOR_COLORS[2]);
  const [notes, setNotes] = useState(agreement?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const guarantorAllowed = canUseGuarantorModule(isPremium());

  if (!agreement) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Acordo não encontrado</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (!friendName.trim()) {
      showAlert('Atenção', 'Informe o nome do amigo.');
      return;
    }
    if (!storeName.trim()) {
      showAlert('Atenção', 'Informe o nome da loja.');
      return;
    }

    const fee = parseFloat(lateFeePercent.replace(',', '.'));
    if (!guarantorAllowed) {
      setShowPremium(true);
      return;
    }

    setSaving(true);
    try {
      await updateGuarantorAgreement(agreement.id, {
        friendName: friendName.trim(),
        friendPhone: friendPhone.trim(),
        friendDocument: friendDocument.trim(),
        storeName: storeName.trim(),
        storeDocument: storeDocument.trim(),
        lateFeePercent: isNaN(fee) ? agreement.lateFeePercent : fee,
        color,
        notes: notes.trim(),
      });
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('Fiador')) setShowPremium(true);
      else showAlert('Erro', msg || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (!guarantorAllowed) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Edição do Fiador disponível no Meu Controle Pro.</Text>
        <Pressable onPress={() => setShowPremium(true)} style={{ marginTop: Spacing.lg }}>
          <LinearGradient colors={[...Colors.gradients.primary]} style={styles.saveButton}>
            <Text style={styles.saveText}>Ver Pro</Text>
          </LinearGradient>
        </Pressable>
        <PremiumPaywall visible={showPremium} onClose={() => setShowPremium(false)} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Amigo (devedor)</Text>
        <FormInput label="Nome do amigo *" icon="person" value={friendName} onChangeText={setFriendName} />
        <FormInput label="Telefone" icon="call" value={friendPhone} onChangeText={setFriendPhone} keyboardType="phone-pad" />
        <FormInput label="CPF" icon="document-text" value={friendDocument} onChangeText={setFriendDocument} />

        <Text style={styles.sectionTitle}>Loja / Credor</Text>
        <FormInput label="Nome da loja *" icon="storefront" value={storeName} onChangeText={setStoreName} />
        <FormInput label="CNPJ da loja" icon="business" value={storeDocument} onChangeText={setStoreDocument} />

        <Text style={styles.sectionTitle}>Juros por atraso</Text>
        <FormInput label="% ao mês" icon="trending-up" value={lateFeePercent} onChangeText={setLateFeePercent} keyboardType="decimal-pad" />

        <Text style={styles.sectionTitle}>Cor</Text>
        <View style={styles.colorRow}>
          {CREDITOR_COLORS.map((c) => (
            <Pressable key={c} onPress={() => setColor(c)} style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorSelected]} />
          ))}
        </View>

        <FormInput label="Observações" icon="create" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

        <Pressable onPress={handleSave} disabled={saving}>
          <LinearGradient colors={[...Colors.gradients.accent]} style={styles.saveButton}>
            <Ionicons name="save" size={22} color="#FFF" />
            <Text style={styles.saveText}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
      <PremiumPaywall visible={showPremium} onClose={() => setShowPremium(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  notFoundText: { color: Colors.textSecondary, fontSize: FontSize.md },
  sectionTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.sm, marginTop: Spacing.sm },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: '#FFF' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.lg },
  saveText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
});
