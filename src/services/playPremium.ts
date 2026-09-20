import { Linking, Platform } from 'react-native';
import { getPlayStoreUrl, PLAY_STORE_PACKAGE } from '../constants/legal';
import { showAlert } from '../utils/alert';

/** Abre a ficha do app na Play Store. */
export async function openPlayStoreListing(): Promise<void> {
  if (Platform.OS === 'android') {
    const marketUrl = `market://details?id=${PLAY_STORE_PACKAGE}`;
    const canMarket = await Linking.canOpenURL(marketUrl);
    if (canMarket) {
      await Linking.openURL(marketUrl);
      return;
    }
  }
  await Linking.openURL(getPlayStoreUrl());
}

/**
 * Restaura compra Pro (Google Play Billing).
 * Integre react-native-iap ou RevenueCat aqui quando o produto estiver na Play Console.
 */
export async function restorePlayPurchases(): Promise<boolean> {
  showAlert(
    'Restaurar Pro',
    'Após configurar a compra in-app na Play Console, a restauração será automática. ' +
      'Se já comprou, reinstale o app com a mesma conta Google ou aguarde a próxima atualização.'
  );
  return false;
}

export async function purchaseProOnPlayStore(): Promise<boolean> {
  await openPlayStoreListing();
  showAlert(
    'Meu Controle Pro',
    'Complete a compra na Play Store. Quando a integração de pagamento estiver ativa nesta versão, ' +
      'o Pro será liberado automaticamente após a compra.'
  );
  return false;
}
