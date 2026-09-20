import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Platform, useWindowDimensions,
} from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../src/components/AppHeader';
import { DevSignature } from '../../src/components/DevSignature';
import { GetProButton } from '../../src/components/GetProButton';
import { PremiumPaywall } from '../../src/components/PremiumPaywall';
import { useApp } from '../../src/context/AppContext';
import { BRAND, getAppDisplayName } from '../../src/constants/branding';
import { Breakpoints } from '../../src/hooks/useResponsive';
import { Colors, FontSize, Spacing, BorderRadius } from '../../src/constants/theme';

const NAV_ITEMS: { name: string; title: string; icon: keyof typeof Ionicons.glyphMap; href: string }[] = [
  { name: 'index', title: 'Início', icon: 'grid', href: '/(tabs)' },
  { name: 'creditors', title: 'Credores', icon: 'people', href: '/(tabs)/creditors' },
  { name: 'expenses', title: 'Despesas', icon: 'wallet', href: '/(tabs)/expenses' },
  { name: 'guarantor', title: 'Fiador', icon: 'hand-left', href: '/(tabs)/guarantor' },
  { name: 'settings', title: 'Ajustes', icon: 'settings', href: '/(tabs)/settings' },
];

function getActiveItem(pathname: string) {
  if (pathname.includes('/expense') || pathname.includes('/(tabs)/expenses')) return NAV_ITEMS[2];
  if (pathname.includes('/creditor') || pathname.includes('/(tabs)/creditors')) return NAV_ITEMS[1];
  if (pathname.includes('guarantor')) return NAV_ITEMS[3];
  if (pathname.includes('settings')) return NAV_ITEMS[4];
  return NAV_ITEMS[0];
}

function DesktopSidebar({ width }: { width: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = getActiveItem(pathname);
  const { isPremium } = useApp();
  const premium = isPremium();
  const [showPremium, setShowPremium] = useState(false);

  return (
    <View style={[styles.sidebar, { width }]}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarAppName}>{getAppDisplayName(premium)}</Text>
        <View style={styles.offlinePill}>
          <Ionicons name="cloud-offline" size={12} color={Colors.secondary} />
          <Text style={styles.offlineText}>Offline · v{BRAND.version}{premium ? ' Pro' : ''}</Text>
        </View>
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const focused = active.name === item.name;
          return (
            <Pressable
              key={item.name}
              onPress={() => router.push(item.href as never)}
              style={({ pressed }) => [
                styles.navItem,
                focused && styles.navItemActive,
                pressed && styles.navItemPressed,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={focused ? Colors.primaryLight : Colors.textMuted}
              />
              <Text style={[styles.navLabel, focused && styles.navLabelActive]}>
                {item.title}
              </Text>
            </Pressable>
          );
        })}

        {!premium && (
          <View style={styles.proNavWrap}>
            <GetProButton
              onPress={() => setShowPremium(true)}
              size="sm"
              fullWidth
            />
          </View>
        )}
      </View>

      <View style={styles.sidebarFooter}>
        <DevSignature compact />
      </View>

      <PremiumPaywall visible={showPremium} onClose={() => setShowPremium(false)} />
    </View>
  );
}

function DesktopScreenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const page = getActiveItem(pathname);
  const [showPremium, setShowPremium] = useState(false);

  return (
    <View style={styles.mainColumn}>
      <AppHeader pageTitle={page.title} onGetPro={() => setShowPremium(true)} />
      <View style={styles.screenBody}>{children}</View>
      <PremiumPaywall visible={showPremium} onClose={() => setShowPremium(false)} />
    </View>
  );
}

export default function DesktopTabLayout() {
  const { width } = useWindowDimensions();
  const sidebarWidth = width >= Breakpoints.xl ? 260 : 220;

  return (
    <View style={styles.root}>
      <DesktopSidebar width={sidebarWidth} />
      <View style={styles.contentArea}>
        <Tabs
          tabBar={() => null}
          screenLayout={({ children }) => (
            <DesktopScreenLayout>{children}</DesktopScreenLayout>
          )}
          screenOptions={{
            headerShown: false,
            sceneStyle: {
              flex: 1,
              backgroundColor: Colors.background,
            },
          }}
        >
          {NAV_ITEMS.map((item) => (
            <Tabs.Screen key={item.name} name={item.name} options={{ title: item.title }} />
          ))}
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background,
    minHeight: Platform.OS === 'web' ? ('100vh' as unknown as number) : undefined,
  },
  contentArea: {
    flex: 1,
    minWidth: 0,
  },
  mainColumn: {
    flex: 1,
    flexDirection: 'column',
    minHeight: Platform.OS === 'web' ? ('100vh' as unknown as number) : undefined,
  },
  screenBody: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sidebar: {
    height: '100%',
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
  },
  sidebarHeader: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  sidebarAppName: {
    color: Colors.primaryLight,
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    backgroundColor: `${Colors.secondary}18`,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  offlineText: {
    color: Colors.secondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  nav: {
    flex: 1,
    gap: 4,
  },
  proNavWrap: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  navItemActive: {
    backgroundColor: `${Colors.primary}33`,
  },
  navItemPressed: {
    opacity: 0.85,
  },
  navLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  navLabelActive: {
    color: Colors.text,
    fontWeight: '700',
  },
  sidebarFooter: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
