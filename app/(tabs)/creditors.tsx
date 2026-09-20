import React, { useState, useMemo } from 'react';
import { StyleSheet, View, FlatList, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../../src/components/GradientBackground';
import { CreditorCard } from '../../src/components/CreditorCard';
import { EmptyState, SectionHeader } from '../../src/components/SectionHeader';
import { FloatingActionButton } from '../../src/components/FloatingActionButton';
import { ResponsiveContainer } from '../../src/components/ResponsiveContainer';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useApp } from '../../src/context/AppContext';
import { confirmAlert } from '../../src/utils/alert';
import { getCreditorInstallmentSummary } from '../../src/utils/installmentStats';
import { getExpenseStatus } from '../../src/utils/format';
import { Colors, BorderRadius, FontSize, Spacing } from '../../src/constants/theme';

export default function CreditorsScreen() {
  const router = useRouter();
  const { horizontalPadding, showFab } = useResponsive();
  const { creditors, expenses, deleteCreditor } = useApp();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return creditors;
    const q = search.toLowerCase();
    return creditors.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.document.includes(q) ||
        c.category.includes(q)
    );
  }, [creditors, search]);

  const handleDelete = (id: string, name: string) => {
    confirmAlert(
      'Excluir credor',
      `Deseja excluir "${name}" e todas as despesas vinculadas?`,
      async () => {
        await deleteCreditor(id);
      }
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ResponsiveContainer padded={false}>
          <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
            <SectionHeader
              title="Credores"
              action={{ label: 'Adicionar Credor', onPress: () => router.push('/creditor/new') }}
            />
          </View>

          <View style={[styles.searchBox, { marginHorizontal: horizontalPadding }]}>
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome, CPF/CNPJ..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.list,
              { paddingHorizontal: horizontalPadding, maxWidth: 1280, alignSelf: 'center', width: '100%' },
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                icon="people-outline"
                title="Nenhum credor cadastrado"
                subtitle="Cadastre bancos, lojas, assinaturas e outros credores"
                actionLabel="Adicionar Credor"
                onAction={() => router.push('/creditor/new')}
              />
            }
            renderItem={({ item }) => {
              const inst = getCreditorInstallmentSummary(expenses, item.id);
              const overdueCount = expenses.filter(
                (e) => e.creditorId === item.id && getExpenseStatus(e) === 'overdue'
              ).length;
              return (
                <CreditorCard
                  creditor={item}
                  overdueCount={overdueCount}
                  installmentLabel={inst ? `${inst.paid}/${inst.total} parcelas pagas` : undefined}
                  onPress={() => router.push(`/expense/creditor/${item.id}` as never)}
                  onEdit={() => router.push(`/creditor/edit/${item.id}` as never)}
                  onDelete={() => handleDelete(item.id, item.name)}
                />
              );
            }}
          />

          {showFab && (
            <FloatingActionButton
              icon="person-add"
              onPress={() => router.push('/creditor/new')}
            />
          )}
        </ResponsiveContainer>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {},
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md,
  },
  list: {
    paddingBottom: 100,
  },
});
