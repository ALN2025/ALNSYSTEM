import React from 'react';
import { StyleSheet, Text, View, TextInput, TextInputProps, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  formatCurrencyInput,
  formatDateInput,
  formatDateTimeInput,
  formatDocumentInput,
  formatPhoneInput,
  formatDecimalInput,
} from '../utils/format';
import { CreditorType } from '../types';
import { Colors, BorderRadius, FontSize, Spacing } from '../constants/theme';

interface Props extends TextInputProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
}

export function FormInput({ label, icon, error, ...props }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {icon && (
          <Ionicons name={icon} size={18} color={Colors.textMuted} style={styles.icon} />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          {...props}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

interface CurrencyProps {
  label: string;
  value: string;
  onChangeValue: (value: string) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  placeholder?: string;
}

export function CurrencyInput({ label, value, onChangeValue, icon = 'cash', error, placeholder = 'R$ 0,00' }: CurrencyProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {icon && (
          <Ionicons name={icon} size={18} color={Colors.textMuted} style={styles.icon} />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          placeholder={placeholder}
          value={value}
          onChangeText={(text) => onChangeValue(formatCurrencyInput(text))}
          keyboardType="numeric"
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

interface DateProps {
  label: string;
  value: string;
  onChangeValue: (value: string) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  placeholder?: string;
}

export function DateInput({
  label,
  value,
  onChangeValue,
  icon = 'calendar',
  error,
  placeholder = 'DD/MM/AAAA',
}: DateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {icon && (
          <Ionicons name={icon} size={18} color={Colors.textMuted} style={styles.icon} />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          placeholder={placeholder}
          value={value}
          onChangeText={(text) => onChangeValue(formatDateInput(text))}
          keyboardType="numeric"
          maxLength={10}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

interface DateTimeProps extends Omit<DateProps, 'placeholder'> {
  placeholder?: string;
}

export function DateTimeInput({
  label,
  value,
  onChangeValue,
  icon = 'time',
  error,
  placeholder = 'DD/MM/AAAA HH:MM',
}: DateTimeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {icon && (
          <Ionicons name={icon} size={18} color={Colors.textMuted} style={styles.icon} />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          placeholder={placeholder}
          value={value}
          onChangeText={(text) => onChangeValue(formatDateTimeInput(text))}
          keyboardType="numeric"
          maxLength={16}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

interface DocumentProps {
  label: string;
  value: string;
  onChangeValue: (value: string) => void;
  type: CreditorType;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  placeholder?: string;
}

export function DocumentInput({
  label,
  value,
  onChangeValue,
  type,
  icon = 'document-text',
  error,
  placeholder,
}: DocumentProps) {
  const defaultPlaceholder = type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00';
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {icon && (
          <Ionicons name={icon} size={18} color={Colors.textMuted} style={styles.icon} />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          placeholder={placeholder ?? defaultPlaceholder}
          value={value}
          onChangeText={(text) => onChangeValue(formatDocumentInput(text, type))}
          keyboardType="numeric"
          maxLength={type === 'PF' ? 14 : 18}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

interface PhoneProps {
  label: string;
  value: string;
  onChangeValue: (value: string) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  placeholder?: string;
}

export function PhoneInput({
  label,
  value,
  onChangeValue,
  icon = 'call',
  error,
  placeholder = '(11) 99999-9999',
}: PhoneProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {icon && (
          <Ionicons name={icon} size={18} color={Colors.textMuted} style={styles.icon} />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          placeholder={placeholder}
          value={value}
          onChangeText={(text) => onChangeValue(formatPhoneInput(text))}
          keyboardType="phone-pad"
          maxLength={15}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

interface DecimalProps {
  label: string;
  value: string;
  onChangeValue: (value: string) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  placeholder?: string;
  maxDecimals?: number;
}

export function DecimalInput({
  label,
  value,
  onChangeValue,
  icon,
  error,
  placeholder = '0,00',
  maxDecimals = 2,
}: DecimalProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {icon && (
          <Ionicons name={icon} size={18} color={Colors.textMuted} style={styles.icon} />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          placeholder={placeholder}
          value={value}
          onChangeText={(text) => onChangeValue(formatDecimalInput(text, maxDecimals))}
          keyboardType="decimal-pad"
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

interface SelectProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

export function FormSelect({ label, value, options, onChange }: SelectProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.selectRow}>
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.selectChip, value === opt.value && styles.selectChipActive]}
          >
            <Text style={[styles.selectText, value === opt.value && styles.selectTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md,
  },
  error: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  selectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  selectChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  selectTextActive: {
    color: Colors.text,
    fontWeight: '700',
  },
});
