import { useRouter } from 'expo-router';

type AppRouter = ReturnType<typeof useRouter>;

/** Abre o formulário de nova despesa (opcionalmente já com credor selecionado). */
export function openNewExpense(router: AppRouter, creditorId?: string) {
  if (creditorId) {
    router.push({ pathname: '/expense/new', params: { creditorId } });
    return;
  }
  router.push('/expense/new');
}

/** Volta para a aba Despesas após salvar/cancelar fluxo de despesa. */
export function returnToExpensesTab(router: AppRouter) {
  router.replace('/(tabs)/expenses');
}

/** Fecha modal/tela de formulário após salvar — aguarda toast aparecer (evita minimizar no Android). */
export function closeFormAfterSave(
  router: AppRouter,
  fallback: '/(tabs)/creditors' | '/(tabs)/expenses' = '/(tabs)/expenses',
  delayMs = 550
) {
  setTimeout(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallback);
  }, delayMs);
}
