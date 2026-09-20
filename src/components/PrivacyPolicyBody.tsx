import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_UPDATED,
} from '../content/privacyPolicy';
import { Colors, FontSize, Spacing } from '../constants/theme';

export function PrivacyPolicyBody() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.updated}>Última atualização: {PRIVACY_POLICY_UPDATED}</Text>
      {PRIVACY_POLICY_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.title}>{section.title}</Text>
          {section.body.map((paragraph) => (
            <Text key={paragraph} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: Spacing.xxl },
  updated: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginBottom: Spacing.lg,
  },
  section: { marginBottom: Spacing.lg },
  title: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  paragraph: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
});
