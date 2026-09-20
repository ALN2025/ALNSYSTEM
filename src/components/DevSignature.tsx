import React from 'react';
import { Text, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { BRAND } from '../constants/branding';
import { FontSize } from '../constants/theme';
import { ShimmerGlowFrame, SHIMMER_PRO } from './ShimmerGlowFrame';

interface Props {
  compact?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Assinatura com efeito shimmer — rodapé mobile (APK) e sidebar PC. */
export function DevSignature({ compact, fullWidth, style }: Props) {
  return (
    <ShimmerGlowFrame
      size={compact ? 'sm' : 'md'}
      shape="box"
      style={[fullWidth && styles.fullWidth, style]}
      innerStyle={fullWidth ? styles.innerFull : undefined}
    >
      <Text style={[styles.text, compact && styles.textCompact]}>
        {BRAND.devSignature}
      </Text>
    </ShimmerGlowFrame>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  innerFull: {
    width: '100%',
  },
  text: {
    color: SHIMMER_PRO.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? { fontFamily: 'Consolas, monospace' } as object : {}),
  },
  textCompact: {
    fontSize: FontSize.sm,
  },
});