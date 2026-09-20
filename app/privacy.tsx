import React from 'react';
import { ScrollView, StyleSheet, Pressable, Text, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { PrivacyPolicyBody } from '../src/components/PrivacyPolicyBody';
import { PRIVACY_POLICY_URL } from '../src/constants/legal';
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
        <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} style={styles.link}>
          <Text style={styles.linkText}>Abrir versão na web (Play Store)</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  link: { alignItems: 'center', paddingVertical: Spacing.md },
  linkText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    textDecorationLine: 'underline',
  },
});
