import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setToastListener, ToastMessage, ToastType } from '../utils/toast';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
};

const COLORS: Record<ToastType, string> = {
  success: Colors.success,
  error: Colors.danger,
  info: Colors.primaryLight,
};

function ToastItem({ toast, onHide }: { toast: ToastMessage; onHide: () => void }) {
  const opacity = useState(() => new Animated.Value(0))[0];
  const translateY = useState(() => new Animated.Value(-16))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const duration = toast.type === 'success' ? 3400 : 2800;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -12, duration: 200, useNativeDriver: true }),
      ]).start(onHide);
    }, duration);

    return () => clearTimeout(timer);
  }, [opacity, translateY, onHide]);

  const color = COLORS[toast.type];

  return (
    <Animated.View style={[styles.toast, { borderLeftColor: color, opacity, transform: [{ translateY }] }]}>
      <Ionicons name={ICONS[toast.type]} size={20} color={color} />
      <Text style={styles.toastText}>{toast.message}</Text>
    </Animated.View>
  );
}

export function ToastHost() {
  const [queue, setQueue] = useState<ToastMessage[]>([]);

  useEffect(() => {
    setToastListener((toast) => {
      setQueue((prev) => [...prev.slice(-2), toast]);
    });
    return () => setToastListener(null);
  }, []);

  const remove = (id: string) => setQueue((prev) => prev.filter((t) => t.id !== id));

  if (queue.length === 0) return null;

  return (
    <View style={styles.host} pointerEvents="none">
      {queue.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onHide={() => remove(toast.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 12 : 48,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 99999,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    maxWidth: 480,
    width: '100%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 24px rgba(0,0,0,0.45)' } as object
      : {
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
        }),
  },
  toastText: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
