import React, { useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, Platform, useWindowDimensions, Animated, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, BANNER } from '../constants/branding';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { playAppSound } from '../services/appSounds';

interface Props {
  visible: boolean;
  onFinish: () => void;
  playOpenSound?: boolean;
}

const mono = Platform.select({ web: 'Consolas, monospace', ios: 'Courier', default: 'monospace' });
const isNative = Platform.OS === 'android' || Platform.OS === 'ios';

function BrandLogo() {
  return (
    <View style={styles.brandOuter}>
      <LinearGradient
        colors={[`${BANNER.accent}22`, `${BANNER.accent}08`]}
        style={styles.brandGlow}
      />
      <View style={[styles.brandFrame, { borderColor: `${BANNER.accent}66`, backgroundColor: BANNER.background }]}>
        <Text style={[styles.brandLine1, { color: BANNER.accent }]}>{BANNER.line1}</Text>
        <View style={[styles.brandInnerRule, { backgroundColor: `${BANNER.accent}55` }]} />
        <Text style={[styles.brandLine2, { color: BANNER.accent }]}>{BANNER.line2}</Text>
      </View>
    </View>
  );
}

function BannerContent({ onFinish, playOpenSound }: Omit<Props, 'visible'>) {
  const fade = useRef(new Animated.Value(1)).current;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? Spacing.xl : insets.top + Spacing.md;

  useEffect(() => {
    if (playOpenSound) void playAppSound('open');
  }, [playOpenSound]);

  useEffect(() => {
    const hide = () => {
      Animated.timing(fade, { toValue: 0, duration: 400, useNativeDriver: true }).start(({ finished }) => {
        if (finished) onFinish();
      });
    };
    const timer = setTimeout(hide, 2800);
    return () => clearTimeout(timer);
  }, [fade, onFinish]);

  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]}>
      <LinearGradient colors={['#030306', '#0A0A12', '#10101A']} style={StyleSheet.absoluteFill} />
      <View style={[styles.screen, { paddingTop: topPad, paddingBottom: insets.bottom + Spacing.md }]}>
        <View style={[styles.content, { maxWidth: Math.min(width - 32, 480) }]}>
          <BrandLogo />
          <Text style={styles.appName}>{BRAND.appName}</Text>
          <Text style={styles.tagline}>{BRAND.tagline}</Text>
          <Text style={styles.version}>v{BRAND.version}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export function StartupBanner({ visible, onFinish, playOpenSound = true }: Props) {
  if (!visible) return null;

  if (isNative) {
    return (
      <Modal visible transparent={false} animationType="fade" statusBarTranslucent onRequestClose={onFinish}>
        <BannerContent onFinish={onFinish} playOpenSound={playOpenSound} />
      </Modal>
    );
  }

  return (
    <View style={styles.webHost} pointerEvents="auto">
      <BannerContent onFinish={onFinish} playOpenSound={playOpenSound} />
    </View>
  );
}

const styles = StyleSheet.create({
  webHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    gap: Spacing.md,
  },
  brandOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
    width: '100%',
  },
  brandGlow: {
    position: 'absolute',
    width: 260,
    height: 120,
    borderRadius: 60,
  },
  brandFrame: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    minWidth: 240,
    maxWidth: '100%',
  },
  brandLine1: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 8,
    fontFamily: mono,
  },
  brandInnerRule: {
    width: 56,
    height: 2,
    marginVertical: Spacing.sm,
    borderRadius: 1,
  },
  brandLine2: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 6,
    fontFamily: mono,
  },
  appName: {
    color: Colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.sm,
    maxWidth: 320,
  },
  version: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    letterSpacing: 1,
  },
});
