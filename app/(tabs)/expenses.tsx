import React from 'react';
import { StyleSheet, View, FlatList, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../../src/components/GradientBackground';
import { ExpenseTopicCard } from '../../src/components/ExpenseTopicCard';
import { EmptyState, SectionHeader } from '../../src/components/SectionHeader';
import { FloatingActionButton } from '../../src/components/FloatingActionButton';
import { useApp } from '../../src/context/AppContext';
import { openNewExpense } from '../../src/utils/navigation';
import { Colors, FontSize, Spacing } from '../../src/constants/theme';

export default function ExpensesScreen() {
  const router = useRouter();
  const { creditors } = useApp();

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <SectionHeader
            title="Despesas"
            action={{ label: 'Nova Despesa', onPress: () => openNewExpense(router) }}
          />
        </View>

        <Text style={styles.subtitle}>
          Escolha o tópico e registre um pagamento. O histórico fica no Início.
        </Text>

        <FlatList
          data={creditors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="wallet-outline"
              title="Nenhum tópico cadastrado"
              subtitle="Primeiro cadastre credores na aba Credores. Depois volte aqui para registrar pagamentos."
              actionLabel="Ir para Credores"
              onAction={() => router.push('/(tabs)/creditors')}
            />
          }
          renderItem={({ item }) => (
            <ExpenseTopicCard
              creditor={item}
              onAdd={() => openNewExpense(router, item.id)}
            />
          )}
        />

        {creditors.length > 0 && (
          <FloatingActionButton onPress={() => openNewExpense(router)} />
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
});
