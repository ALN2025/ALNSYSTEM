import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShimmerGlowFrame, SHIMMER_PRO } from './ShimmerGlowFrame';

interface Props {
  onPress: () => void;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  label?: string;
  fullWidth?: boolean;
}

export function GetProButton({
  onPress,
  size = 'md',
  style,
  label = 'Obter o Pro',
  fullWidth = false,
}: Props) {
  const compact = size === 'sm';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <ShimmerGlowFrame
        size={size}
        shape="pill"
        style={fullWidth ? styles.frameFull : undefined}
        innerStyle={[styles.fill, compact && styles.fillSm, fullWidth && styles.frameFull]}
      >
        <View style={styles.row}>
          <Ionicons name="star" size={compact ? 11 : 13} color={SHIMMER_PRO.star} />
          <Text style={[styles.label, compact && styles.labelSm]}>{label}</Text>
        </View>
      </ShimmerGlowFrame>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  frameFull: {
    width: '100%',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  fill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    minWidth: 130,
  },
  fillSm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 108,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: SHIMMER_PRO.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  labelSm: {
    fontSize: 12,
  },
});
