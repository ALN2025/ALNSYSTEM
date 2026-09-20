import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from './GradientBackground';
import { ResponsiveContainer } from './ResponsiveContainer';
import { useResponsive } from '../hooks/useResponsive';

interface Props {
  children: React.ReactNode;
  edges?: ('top' | 'bottom')[];
  style?: ViewStyle;
  centered?: boolean;
}

export function ScreenShell({ children, edges = ['top'], style, centered = true }: Props) {
  const { horizontalPadding } = useResponsive();

  return (
    <GradientBackground>
      <SafeAreaView style={[styles.safe, style]} edges={edges}>
        {centered ? (
          <ResponsiveContainer padded={false}>
            <View style={{ paddingHorizontal: horizontalPadding, flex: 1 }}>
              {children}
            </View>
          </ResponsiveContainer>
        ) : (
          children
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});
