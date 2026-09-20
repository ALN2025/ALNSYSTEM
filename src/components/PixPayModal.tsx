import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { buildPixPayload, isValidPixKey } from '../utils/pix';
import { formatCurrency } from '../utils/format';
import { showToast } from '../utils/toast';
import { Breakpoints } from '../hooks/useResponsive';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

export interface PixPayConfig {
  pixKey: string;
  merchantName: string;
  amount?: number;
  description?: string;
}

interface Props {
  visible: boolean;
  config: PixPayConfig | null;
  onClose: () => void;
}

export function PixPayModal({ visible, config, onClose }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= Breakpoints.md;
  const [copied, setCopied] = useState<'key' | 'code' | null>(null);

  const payload = useMemo(() => {
    if (!config || !isValidPixKey(config.pixKey)) return null;
    try {
      return buildPixPayload({
        pixKey: config.pixKey,
        merchantName: config.merchantName,
        amount: config.amount,
        txid: config.description?.slice(0, 25),
      });
    } catch {
      return null;
    }
  }, [config]);

  if (!config) return null;

  const copyText = async (text: string, kind: 'key' | 'code') => {
    await Clipboard.setStringAsync(text);
    setCopied(kind);
    showToast(kind === 'key' ? 'Chave PIX copiada' : 'Código PIX copiado', 'success');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation?.()}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.pixIcon}>
                <Ionicons name="qr-code" size={28} color={Colors.secondary} />
              </View>
              <Text style={styles.title}>Pagar com PIX</Text>
              <Text style={styles.subtitle}>{config.merchantName}</Text>
              {typeof config.amount === 'number' && config.amount > 0 && (
                <Text style={styles.amount}>{formatCurrency(config.amount)}</Text>
              )}
            </View>

            {!payload ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>Chave PIX inválida ou não informada.</Text>
              </View>
            ) : isDesktop ? (
              <View style={styles.qrBlock}>
                <Text style={styles.hint}>Escaneie com o app do seu banco</Text>
                <View style={styles.qrWrap}>
                  <QRCode value={payload} size={220} backgroundColor="#FFFFFF" color="#000000" />
                </View>
                <Text style={styles.hintSecondary}>
                  Ou copie o código abaixo e cole no PIX Copia e Cola do banco
                </Text>
              </View>
            ) : (
              <View style={styles.mobileBlock}>
                <Ionicons name="phone-portrait-outline" size={40} color={Colors.primaryLight} />
                <Text style={styles.mobileHint}>
                  Copie a chave ou o código PIX e cole no app do seu banco para pagar.
                </Text>
              </View>
            )}

            <View style={styles.keyBox}>
              <Text style={styles.keyLabel}>Chave PIX</Text>
              <Text style={styles.keyValue} selectable>
                {config.pixKey}
              </Text>
            </View>

            <Pressable onPress={() => copyText(config.pixKey, 'key')} style={styles.actionBtn}>
              <Ionicons name={copied === 'key' ? 'checkmark-circle' : 'copy-outline'} size={20} color={Colors.primaryLight} />
              <Text style={styles.actionText}>
                {copied === 'key' ? 'Chave copiada!' : 'Copiar chave PIX'}
              </Text>
            </Pressable>

            {payload && (
              <Pressable onPress={() => copyText(payload, 'code')} style={styles.actionBtn}>
                <Ionicons name={copied === 'code' ? 'checkmark-circle' : 'clipboard-outline'} size={20} color={Colors.secondary} />
                <Text style={[styles.actionText, { color: Colors.secondary }]}>
                  {copied === 'code' ? 'Código copiado!' : 'Copiar PIX Copia e Cola'}
                </Text>
              </Pressable>
            )}

            <Pressable onPress={onClose}>
              <LinearGradient colors={[...Colors.gradients.primary]} style={styles.closeBtn}>
                <Text style={styles.closeText}>Fechar</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  pixIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: `${Colors.secondary}22`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 4,
    textAlign: 'center',
  },
  amount: {
    color: Colors.secondary,
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginTop: Spacing.sm,
  },
  qrBlock: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  qrWrap: {
    padding: Spacing.md,
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.md,
  },
  hint: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  hintSecondary: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  mobileBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: `${Colors.primary}18`,
    borderRadius: BorderRadius.md,
  },
  mobileHint: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  keyBox: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keyLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginBottom: 4,
  },
  keyValue: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  actionText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  closeBtn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  closeText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  errorBox: {
    padding: Spacing.md,
    backgroundColor: `${Colors.danger}22`,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
});
