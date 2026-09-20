import { Alert, Platform } from 'react-native';
import { showToast } from './toast';

export function showAlert(title: string, message: string): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

/** Erros de formulário — toast no mobile (não minimiza o app). */
export function showFormError(message: string): void {
  if (Platform.OS === 'web') {
    window.alert(message);
    return;
  }
  showToast(message, 'error');
}

/** Aviso informativo sem bloquear a tela. */
export function showFormInfo(message: string): void {
  showToast(message, 'info');
}

export function confirmAlert(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>
): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      void onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Confirmar', style: 'destructive', onPress: () => void onConfirm() },
  ]);
}
