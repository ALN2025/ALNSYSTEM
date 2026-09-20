import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../src/components/AppHeader';
import { PremiumPaywall } from '../../src/components/PremiumPaywall';
import { DevSignature } from '../../src/components/DevSignature';
import { Colors, Spacing } from '../../src/constants/theme';

const TAB_BAR_HEIGHT = 56;

function TabHeader({ title }: { title?: string }) {
  const [showPremium, setShowPremium] = useState(false);

  return (
    <>
      <AppHeader pageTitle={title} compact onGetPro={() => setShowPremium(true)} />
      <PremiumPaywall visible={showPremium} onClose={() => setShowPremium(false)} />
    </>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const signatureBottom = TAB_BAR_HEIGHT + Math.max(insets.bottom, 4);

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: true,
          header: ({ options }) => <TabHeader title={options.title} />,
          headerStyle: {
            backgroundColor: Colors.surface,
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            height: TAB_BAR_HEIGHT + Math.max(insets.bottom, 4),
            paddingBottom: Math.max(insets.bottom, 4),
            paddingTop: 6,
          },
          tabBarActiveTintColor: Colors.primaryLight,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          sceneStyle: {
            paddingBottom: 36,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="creditors"
          options={{
            title: 'Credores',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: 'Despesas',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="guarantor"
          options={{
            title: 'Fiador',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="hand-left" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Ajustes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <View style={[styles.signatureBar, { bottom: signatureBottom }]}>
        <DevSignature compact fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  signatureBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
    zIndex: 10,
    ...(Platform.OS === 'android' ? { elevation: 10 } : {}),
  },
});
