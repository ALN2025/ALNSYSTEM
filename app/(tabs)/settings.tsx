import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Switch, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../../src/components/GradientBackground';
import { SectionHeader } from '../../src/components/SectionHeader';
import { useApp } from '../../src/context/AppContext';
import * as storage from '../../src/services/storage';
import * as notifications from '../../src/services/notifications';
import { confirmAlert, showAlert } from '../../src/utils/alert';
import { showToast } from '../../src/utils/toast';
import { Colors, BorderRadius, FontSize, Spacing } from '../../src/constants/theme';
import { BRAND, getAppDisplayName, getAppTagline } from '../../src/constants/branding';
import { getBuildDateLabel } from '../../src/constants/buildInfo';
import { PremiumPaywall } from '../../src/components/PremiumPaywall';
import { GetProButton } from '../../src/components/GetProButton';
import { FREE_FEATURES, PREMIUM_FEATURES } from '../../src/constants/premium';

const DAY_OPTIONS = [1, 3, 7];

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, isPremium } = useApp();
  const { notifications: notifSettings } = settings;
  const [showPremium, setShowPremium] = useState(false);

  const toggleDay = (day: number) => {
    const current = notifSettings.daysBefore;
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b);
    updateSettings({
      notifications: { ...notifSettings, daysBefore: updated },
    });
  };

  const handleClearData = () => {
    confirmAlert(
      'Apagar todos os dados',
      'Esta ação não pode ser desfeita. Todos os credores, despesas, acordos de fiador e notificações serão removidos.',
      async () => {
        await notifications.cancelAllNotifications();
        await storage.clearAllData();
        showToast('Todos os dados foram apagados', 'info');
        showAlert('Dados apagados', 'Reinicie o app para ver as alterações.');
      }
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <SectionHeader title="Ajustes" />

          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <Ionicons name="cloud-offline" size={22} color={Colors.secondary} />
              <View style={styles.aboutInfo}>
                <Text style={styles.rowTitle}>Modo offline</Text>
                <Text style={styles.rowSubtitle}>
                  Todos os dados ficam salvos no celular. Funciona sem internet.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <Ionicons name="trending-up" size={22} color={Colors.warning} />
              <View style={styles.aboutInfo}>
                <Text style={styles.rowTitle}>Juros padrão (fiador)</Text>
                <Text style={styles.rowSubtitle}>% ao mês aplicado quando amigo atrasa</Text>
              </View>
            </View>
            <View style={styles.feeInputRow}>
              <TextInput
                style={styles.feeInput}
                value={String(settings.defaultLateFeePercent)}
                onChangeText={(v) => {
                  const n = parseFloat(v.replace(',', '.'));
                  if (!isNaN(n)) updateSettings({ defaultLateFeePercent: n });
                }}
                keyboardType="decimal-pad"
              />
              <Text style={styles.feeSuffix}>% a.m.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.planTitle}>Plano atual: {isPremium() ? 'Pro ✓' : 'Grátis'}</Text>
            {!isPremium() ? (
              <>
                {FREE_FEATURES.map((f) => (
                  <View key={f} style={styles.planRow}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.secondary} />
                    <Text style={styles.planText}>{f}</Text>
                  </View>
                ))}
                <Text style={styles.planHint}>
                  Pro: lembretes de atraso por 14 dias, fiador, credores ilimitados e mais.
                </Text>
                <GetProButton
                  onPress={() => setShowPremium(true)}
                  style={styles.getProBtn}
                />
              </>
            ) : (
              PREMIUM_FEATURES.map((f) => (
                <View key={f} style={styles.planRow}>
                  <Ionicons name="diamond" size={14} color={Colors.accent} />
                  <Text style={styles.planText}>{f}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Ionicons name="notifications" size={22} color={Colors.primaryLight} />
                <View>
                  <Text style={styles.rowTitle}>Notificações</Text>
                  <Text style={styles.rowSubtitle}>Alertas de vencimento</Text>
                </View>
              </View>
              <Switch
                value={notifSettings.enabled}
                onValueChange={(v) =>
                  updateSettings({ notifications: { ...notifSettings, enabled: v } })
                }
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#FFF"
              />
            </View>

            {notifSettings.enabled && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>Avisar com antecedência</Text>
                <View style={styles.dayRow}>
                  {DAY_OPTIONS.map((day) => (
                    <Pressable
                      key={day}
                      onPress={() => toggleDay(day)}
                      style={[
                        styles.dayChip,
                        notifSettings.daysBefore.includes(day) && styles.dayChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          notifSettings.daysBefore.includes(day) && styles.dayTextActive,
                        ]}
                      >
                        {day} dia{day > 1 ? 's' : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.divider} />
                <View style={styles.row}>
                  <View style={styles.rowInfo}>
                    <Ionicons name="today" size={22} color={Colors.warning} />
                    <Text style={styles.rowTitle}>No dia do vencimento</Text>
                  </View>
                  <Switch
                    value={notifSettings.onDueDate}
                    onValueChange={(v) =>
                      updateSettings({ notifications: { ...notifSettings, onDueDate: v } })
                    }
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor="#FFF"
                  />
                </View>

                <View style={styles.divider} />
                <View style={styles.row}>
                  <View style={styles.rowInfo}>
                    <Ionicons name="alert-circle" size={22} color={Colors.danger} />
                    <View>
                      <Text style={styles.rowTitle}>Quando atrasar</Text>
                      <Text style={styles.rowSubtitle}>
                        Lembretes diários às 9h enquanto houver atraso (Free: 7 dias · Pro: 14 dias)
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={notifSettings.onOverdue ?? true}
                    onValueChange={(v) =>
                      updateSettings({ notifications: { ...notifSettings, onOverdue: v } })
                    }
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor="#FFF"
                  />
                </View>

                <View style={styles.divider} />
                <View style={styles.row}>
                  <View style={styles.rowInfo}>
                    <Ionicons name="volume-high" size={22} color={Colors.secondary} />
                    <Text style={styles.rowTitle}>Som nas notificações</Text>
                  </View>
                  <Switch
                    value={notifSettings.soundEnabled}
                    onValueChange={(v) =>
                      updateSettings({ notifications: { ...notifSettings, soundEnabled: v } })
                    }
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor="#FFF"
                  />
                </View>
              </>
            )}
          </View>

          <Pressable
            style={styles.card}
            onPress={() => router.push('/privacy')}
          >
            <View style={styles.aboutRow}>
              <Ionicons name="shield-checkmark" size={22} color={Colors.secondary} />
              <View style={styles.aboutInfo}>
                <Text style={styles.rowTitle}>Privacidade</Text>
                <Text style={styles.rowSubtitle}>
                  Dados só no aparelho. Leia a política completa (também exigida na Play Store).
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
          </Pressable>

          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <Ionicons name="information-circle" size={22} color={Colors.primaryLight} />
              <View style={styles.aboutInfo}>
                <Text style={styles.rowTitle}>
                  {getAppDisplayName(isPremium())} v{BRAND.version}
                </Text>
                <Text style={styles.rowSubtitle}>
                  {getAppTagline(isPremium())} · desenvolvido por {BRAND.signature}
                </Text>
                <Text style={styles.buildStamp}>
                  APK compilado em {getBuildDateLabel()}
                </Text>
              </View>
            </View>
          </View>

          <Pressable onPress={handleClearData} style={styles.dangerButton}>
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
            <Text style={styles.dangerText}>Apagar todos os dados</Text>
          </Pressable>
        </ScrollView>
        <PremiumPaywall visible={showPremium} onClose={() => setShowPremium(false)} />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  rowTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  dayRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dayChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  dayTextActive: {
    color: Colors.text,
    fontWeight: '700',
  },
  aboutRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  aboutInfo: { flex: 1 },
  feeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  feeInput: {
    backgroundColor: Colors.surfaceLight,
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 80,
    textAlign: 'center',
  },
  feeSuffix: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.danger}44`,
    marginTop: Spacing.lg,
  },
  dangerText: {
    color: Colors.danger,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  planTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: 6,
  },
  planText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  planHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  getProBtn: {
    marginTop: Spacing.md,
    alignSelf: 'center',
  },
  buildStamp: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 6,
  },
});
