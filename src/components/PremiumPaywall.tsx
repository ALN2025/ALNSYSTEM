import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FREE_FEATURES, PREMIUM_FEATURES, isPlayStoreBuild } from '../constants/premium';
import { SUPPORT_EMAIL } from '../constants/legal';
import { purchaseProOnPlayStore, restorePlayPurchases } from '../services/playPremium';
import { useApp } from '../context/AppContext';
import { showFormError } from '../utils/alert';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  reason?: string;
}

export function PremiumPaywall({ visible, onClose, reason }: Props) {
  const router = useRouter();
  const { activatePremium, isPremium } = useApp();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const premium = isPremium();
  const playBuild = isPlayStoreBuild();

  useEffect(() => {
    if (premium && visible) onClose();
  }, [premium, visible, onClose]);

  if (!visible || premium) return null;

  const handleActivate = async () => {
    if (!key.trim()) {
      showFormError('Informe a chave de licença Pro.');
      return;
    }
    setLoading(true);
    try {
      const ok = await activatePremium(key);
      if (ok) {
        setKey('');
        onClose();
      } else {
        showFormError('Chave inválida. Verifique a chave recebida e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPurchase = async () => {
    setLoading(true);
    try {
      await purchaseProOnPlayStore();
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      await restorePlayPurchases();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <LinearGradient colors={['#6C5CE7', '#A29BFE']} style={styles.hero}>
              <Ionicons name="diamond" size={36} color="#FFF" />
              <Text style={styles.heroTitle}>Meu Controle Pro</Text>
              <Text style={styles.heroSub}>Desbloqueie credores, fiador e exportação</Text>
            </LinearGradient>

            {reason ? <Text style={styles.reason}>{reason}</Text> : null}

            <Text style={styles.sectionTitle}>Grátis hoje</Text>
            {FREE_FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Ionicons name="remove-circle-outline" size={18} color={Colors.textMuted} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Inclui no Pro</Text>
            {PREMIUM_FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}

            {playBuild ? (
              <>
                <Text style={styles.sectionTitle}>Assinar na Play Store</Text>
                <Text style={styles.hint}>
                  Compra única pelo Google Play Billing. Os dados continuam no seu celular; o Pro desbloqueia
                  recursos extras no mesmo app.
                </Text>
                <Pressable onPress={handlePlayPurchase} disabled={loading}>
                  <LinearGradient colors={[...Colors.gradients.primary]} style={styles.activateBtn}>
                    <Text style={styles.activateText}>
                      {loading ? 'Abrindo...' : 'Obter Pro na Play Store'}
                    </Text>
                  </LinearGradient>
                </Pressable>
                <Pressable onPress={handleRestore} disabled={loading} style={styles.restoreBtn}>
                  <Text style={styles.restoreText}>Restaurar compras</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Ativar com chave</Text>
                <Text style={styles.hint}>
                  Cole a chave de licença abaixo. Após ativar, o app muda para Meu Controle Pro e libera tudo
                  offline.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="ALNPRO"
                  placeholderTextColor={Colors.textMuted}
                  value={key}
                  onChangeText={setKey}
                  autoCapitalize="characters"
                />
                <Pressable onPress={handleActivate} disabled={loading}>
                  <LinearGradient colors={[...Colors.gradients.primary]} style={styles.activateBtn}>
                    <Text style={styles.activateText}>{loading ? 'Ativando...' : 'Ativar Pro'}</Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}

            <Pressable
              onPress={() => {
                onClose();
                router.push('/privacy');
              }}
              style={styles.legalLink}
            >
              <Text style={styles.legalText}>Política de privacidade</Text>
            </Pressable>
            {Platform.OS !== 'web' ? (
              <Text style={styles.support}>Dúvidas: {SUPPORT_EMAIL}</Text>
            ) : null}

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Agora não</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '88%',
  },
  hero: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.sm,
  },
  reason: {
    color: Colors.warning,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 6,
  },
  featureText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    flex: 1,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    marginBottom: Spacing.md,
  },
  activateBtn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  activateText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  restoreText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  legalLink: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  legalText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textDecorationLine: 'underline',
  },
  support: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: 4,
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  closeText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
});
