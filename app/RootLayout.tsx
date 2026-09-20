import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../src/context/AppContext';
import { StartupBanner } from '../src/components/StartupBanner';
import { ToastHost } from '../src/components/ToastHost';
import { AppErrorBoundary } from '../src/components/AppErrorBoundary';
import { Colors } from '../src/constants/theme';
import { useStartupBanner } from '../src/hooks/useStartupBanner';
import { initAppSounds, setAppSoundsEnabled } from '../src/services/appSounds';

function AppShell() {
  const { settings } = useApp();
  const { showBanner, bannerKey, hideBanner } = useStartupBanner();

  useEffect(() => {
    setAppSoundsEnabled(settings.notifications.soundEnabled);
    void initAppSounds();
  }, [settings.notifications.soundEnabled]);

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.root}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.surface },
            headerTintColor: Colors.primaryLight,
            headerTitleStyle: { fontWeight: '700', color: Colors.text },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="creditor/new" options={{ title: 'Novo Credor', presentation: 'modal' }} />
          <Stack.Screen name="creditor/edit/[id]" options={{ title: 'Editar Credor', presentation: 'modal' }} />
          <Stack.Screen name="creditor/[id]" options={{ title: 'Detalhes do Credor' }} />
          <Stack.Screen name="expense/new" options={{ title: 'Nova Despesa', presentation: 'modal' }} />
          <Stack.Screen name="expense/edit/[id]" options={{ title: 'Editar Despesa', presentation: 'modal' }} />
          <Stack.Screen name="expense/creditor/[creditorId]" options={{ title: 'Histórico da Despesa' }} />
          <Stack.Screen name="guarantor/new" options={{ title: 'Acordo de Fiador', presentation: 'modal' }} />
          <Stack.Screen name="guarantor/edit/[id]" options={{ title: 'Editar Fiador', presentation: 'modal' }} />
          <Stack.Screen name="guarantor/[id]" options={{ title: 'Detalhes do Fiador' }} />
          <Stack.Screen name="privacy" options={{ title: 'Privacidade' }} />
        </Stack>

        <ToastHost />
        <StartupBanner
          visible={showBanner}
          onFinish={hideBanner}
          playOpenSound={bannerKey === 0}
        />
      </View>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
});
