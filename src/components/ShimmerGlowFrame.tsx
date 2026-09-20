import React, { useEffect, useRef, ReactNode } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const SHIMMER_PRO = {
  bg: ['#5A1848', '#3D1035'] as const,
  border: '#FF2D95',
  borderSoft: '#FF6BB566',
  text: '#FFD6EE',
  star: '#FF4DA6',
};

interface Props {
  children: ReactNode;
  size?: 'sm' | 'md';
  shape?: 'pill' | 'box';
  colors?: typeof SHIMMER_PRO;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
}

export function ShimmerGlowFrame({
  children,
  size = 'md',
  shape = 'pill',
  colors = SHIMMER_PRO,
  style,
  innerStyle,
}: Props) {
  const shimmer = useRef(new Animated.Value(-1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const compact = size === 'sm';
  const isPill = shape === 'pill';

  useEffect(() => {
    const sweep = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(shimmer, { toValue: -1, duration: 0, useNativeDriver: true }),
      ])
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1400, useNativeDriver: false }),
      ])
    );

    sweep.start();
    pulse.start();
    return () => {
      sweep.stop();
      pulse.stop();
    };
  }, [shimmer, glow]);

  const shimmerX = shimmer.interpolate({
    inputRange: [-1, 1],
    outputRange: isPill
      ? [-100, compact ? 160 : 220]
      : [-80, compact ? 220 : 320],
  });

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.borderSoft, colors.border],
  });

  const radius = isPill ? 999 : 8;

  return (
    <Animated.View
      style={[
        styles.outer,
        compact && styles.outerSm,
        !isPill && styles.outerBox,
        { borderColor, borderRadius: radius },
        Platform.OS === 'web'
          ? ({ boxShadow: '0 0 12px rgba(255,45,149,0.35)' } as object)
          : null,
        style,
      ]}
    >
      <LinearGradient
        colors={[...colors.bg]}
        style={[
          styles.fill,
          compact && styles.fillSm,
          !isPill && styles.fillBox,
          { borderRadius: radius },
          innerStyle,
        ]}
      >
        <View style={[styles.shimmerClip, { borderRadius: radius }]}>
          <Animated.View style={[styles.shimmerTrack, { transform: [{ translateX: shimmerX }] }]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.08)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.shimmerBar}
            />
          </Animated.View>
        </View>
        <View style={styles.content}>{children}</View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  outerSm: {
    borderWidth: 1,
  },
  outerBox: {
    alignSelf: 'flex-start',
  },
  fill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fillSm: {},
  fillBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  shimmerClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shimmerTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
  },
  shimmerBar: {
    flex: 1,
    width: 100,
  },
  content: {
    zIndex: 1,
  },
});
