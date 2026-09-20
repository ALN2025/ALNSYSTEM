import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export function ResponsiveContainer({ children, style, padded = true }: Props) {
  const { contentMaxWidth, horizontalPadding } = useResponsive();

  return (
    <View
      style={[
        styles.outer,
        padded && { paddingHorizontal: horizontalPadding },
        style,
      ]}
    >
      <View style={[styles.inner, contentMaxWidth ? { maxWidth: contentMaxWidth } : null]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignSelf: 'center',
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
});
