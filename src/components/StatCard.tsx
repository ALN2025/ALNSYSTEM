import React from 'react';

import { StyleSheet, Text, View, Pressable, ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';

import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';



interface Props {

  label: string;

  value: string;

  icon: keyof typeof Ionicons.glyphMap;

  gradient: readonly [string, string];

  onPress?: () => void;

  style?: ViewStyle;

  /** Destaque pulsante (ex.: card de atrasadas) */

  alert?: boolean;

}



export function StatCard({ label, value, icon, gradient, onPress, style, alert }: Props) {

  return (

    <Pressable

      onPress={onPress}

      style={({ pressed }) => [styles.wrapper, style, pressed && onPress && styles.pressed]}

    >

      <LinearGradient

        colors={[...gradient]}

        start={{ x: 0, y: 0 }}

        end={{ x: 1, y: 1 }}

        style={[styles.card, alert && styles.cardAlert]}

      >

        {alert && (

          <View style={styles.alertDot}>

            <Ionicons name="alert" size={10} color="#FFF" />

          </View>

        )}

        <View style={styles.iconCircle}>

          <Ionicons name={icon} size={22} color="#FFF" />

        </View>

        <Text style={[styles.value, alert && styles.valueAlert]}>{value}</Text>

        <Text style={styles.label}>{label}</Text>

      </LinearGradient>

    </Pressable>

  );

}



const styles = StyleSheet.create({

  wrapper: {

    flex: 1,

    minWidth: '45%',

  },

  pressed: {

    opacity: 0.88,

    transform: [{ scale: 0.98 }],

  },

  card: {

    borderRadius: BorderRadius.lg,

    padding: Spacing.md,

    minHeight: 110,

    justifyContent: 'space-between',

    position: 'relative',

  },

  cardAlert: {

    borderWidth: 2,

    borderColor: '#FF8787',

    shadowColor: '#FF6B6B',

    shadowOffset: { width: 0, height: 0 },

    shadowOpacity: 0.55,

    shadowRadius: 10,

    elevation: 8,

  },

  alertDot: {

    position: 'absolute',

    top: 8,

    right: 8,

    width: 20,

    height: 20,

    borderRadius: 10,

    backgroundColor: Colors.danger,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 2,

    borderColor: '#FFF',

  },

  iconCircle: {

    width: 36,

    height: 36,

    borderRadius: 18,

    backgroundColor: 'rgba(255,255,255,0.2)',

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: Spacing.sm,

  },

  value: {

    color: Colors.text,

    fontSize: FontSize.lg,

    fontWeight: '700',

  },

  valueAlert: {

    color: '#FFE8E8',

  },

  label: {

    color: 'rgba(255,255,255,0.8)',

    fontSize: FontSize.xs,

    fontWeight: '500',

    marginTop: 2,

  },

});


