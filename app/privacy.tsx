import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { PrivacyPolicyBody } from '../src/components/PrivacyPolicyBody';
import { Colors, FontSize, Spacing } from '../src/constants/theme';

export default function PrivacyScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Privacidade' }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PrivacyPolicyBody />
        <Text style={styles.footer}>
          Este texto no app é a política oficial para você. Na Google Play, usamos apenas a página
          pública de privacidade (sem código-fonte nem APK).
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  footer: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
