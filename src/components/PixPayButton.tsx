import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PixPayModal, PixPayConfig } from './PixPayModal';
import { isValidPixKey } from '../utils/pix';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

interface Props {
  pixKey?: string;
  merchantName: string;
  amount?: number;
  description?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PixPayButton({
  pixKey,
  merchantName,
  amount,
  description,
  compact = false,
  style,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<PixPayConfig | null>(null);

  if (!pixKey?.trim() || !isValidPixKey(pixKey)) return null;

  const open = () => {
    setConfig({ pixKey: pixKey.trim(), merchantName, amount, description });
    setVisible(true);
  };

  if (compact) {
    return (
      <>
        <Pressable onPress={open} hitSlop={8} style={[styles.compactBtn, style]}>
          <Ionicons name="qr-code" size={22} color={Colors.secondary} />
        </Pressable>
        <PixPayModal visible={visible} config={config} onClose={() => setVisible(false)} />
      </>
    );
  }

  return (
    <>
      <Pressable onPress={open} style={[styles.btn, style]}>
        <LinearGradient colors={[`${Colors.secondary}44`, `${Colors.secondary}22`]} style={styles.gradient}>
          <Ionicons name="qr-code" size={20} color={Colors.secondary} />
          <Text style={styles.text}>Pagar com PIX</Text>
        </LinearGradient>
      </Pressable>
      <PixPayModal visible={visible} config={config} onClose={() => setVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Colors.secondary}55`,
    borderRadius: BorderRadius.lg,
  },
  text: {
    color: Colors.secondary,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  compactBtn: {
    padding: 4,
  },
});
