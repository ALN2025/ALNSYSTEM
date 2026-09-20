import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, getAppDisplayName, getAppTagline } from '../constants/branding';
import { useApp } from '../context/AppContext';
import { GetProButton } from './GetProButton';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';

interface Props {
  pageTitle?: string;
  compact?: boolean;
  onGetPro?: () => void;
}

export function AppHeader({ pageTitle, compact, onGetPro }: Props) {
  const { isPremium } = useApp();
  const premium = isPremium();
  const appName = getAppDisplayName(premium);

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      <View style={styles.accentBar} />

      <View style={styles.content}>
        <View style={styles.titleBlock}>
          <Text style={[styles.appName, compact && styles.appNameCompact, premium && styles.appNamePro]}>
            {appName}
          </Text>
          {!compact && (
            <Text style={styles.tagline}>{getAppTagline(premium)}</Text>
          )}
          {pageTitle ? (
            <View style={styles.pageRow}>
              <View style={styles.pageDot} />
              <Text style={styles.pageTitle}>{pageTitle}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.right}>
          {!premium && onGetPro ? (
            <GetProButton onPress={onGetPro} size="sm" />
          ) : null}
          <View style={styles.offlinePill}>
            <Ionicons name="cloud-offline" size={14} color={Colors.secondary} />
            <Text style={styles.offlineText}>Offline · v{BRAND.version}{premium ? ' Pro' : ''}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.primary}55`,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { minHeight: 88 } : {}),
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.primary,
  },
  wrapperCompact: {
    paddingVertical: Spacing.md,
    minHeight: undefined,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  titleBlock: {
    flex: 1,
    minWidth: 200,
    gap: 4,
  },
  appName: {
    color: Colors.primaryLight,
    fontSize: Platform.OS === 'web' ? 28 : 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    ...(Platform.OS === 'web' ? { textShadow: '0 0 20px rgba(162,155,254,0.4)' } as object : {}),
  },
  appNameCompact: {
    fontSize: FontSize.lg,
  },
  appNamePro: {
    color: Colors.accent,
  },
  tagline: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xs,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  pageTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${Colors.secondary}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${Colors.secondary}44`,
  },
  offlineText: {
    color: Colors.secondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
