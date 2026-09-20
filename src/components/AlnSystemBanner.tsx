import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BANNER, LOGO_LINES_COMPACT, getSignatureBoxLines } from '../constants/branding';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'brand' | 'signature';

interface Props {
  size?: Size;
  /** brand = A.L.N SYSTEM (início) | signature = Dev ⩿ A.L.N/⪀ (cabeçalho) */
  variant?: Variant;
}

const FONT: Record<Size, number> = { sm: 9, md: 11, lg: 13 };

export function AlnSystemBanner({ size = 'md', variant = 'brand' }: Props) {
  const fontSize = FONT[size];
  const lines = variant === 'signature' ? getSignatureBoxLines() : LOGO_LINES_COMPACT;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.deco, { color: BANNER.accent, fontSize: fontSize - 1 }]}>''</Text>
      <View style={[styles.box, { backgroundColor: BANNER.background }]}>
        {lines.map((line, i) => (
          <Text
            key={i}
            style={[styles.line, { color: BANNER.accent, fontSize, lineHeight: fontSize + 4 }]}
          >
            {line}
          </Text>
        ))}
      </View>
      <Text style={[styles.deco, { color: BANNER.accent, fontSize: fontSize - 1 }]}>||</Text>
    </View>
  );
}

const mono = Platform.select({ web: 'Consolas, monospace', ios: 'Courier', default: 'monospace' });

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  deco: {
    fontFamily: mono,
    marginHorizontal: 5,
    opacity: 0.9,
  },
  box: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  line: {
    fontFamily: mono,
    fontWeight: '600',
  },
});
