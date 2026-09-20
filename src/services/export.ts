import { Platform, Alert, Linking } from 'react-native';
import { format } from 'date-fns';

async function exportWeb(content: string, filename: string): Promise<void> {
  const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  if (typeof document !== 'undefined') {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeName}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return;
  }

  await Linking.openURL(url);
}

export async function exportTextFile(content: string, filename: string): Promise<void> {
  if (Platform.OS === 'web') {
    await exportWeb(content, filename);
    return;
  }

  const { documentDirectory, writeAsStringAsync, EncodingType } = await import('expo-file-system/legacy');
  const Sharing = await import('expo-sharing');

  const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dir = documentDirectory ?? '';
  const uri = `${dir}${safeName}.txt`;

  await writeAsStringAsync(uri, content, {
    encoding: EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'text/plain',
      dialogTitle: 'Baixar / Compartilhar comprovante',
      UTI: 'public.plain-text',
    });
  } else if (Platform.OS === 'android') {
    Alert.alert('Arquivo salvo', `Comprovante salvo offline em:\n${uri}`, [{ text: 'OK' }]);
  } else {
    Alert.alert('Exportado', 'Arquivo salvo no dispositivo.');
  }
}

export function makeExportFilename(prefix: string, friendName: string, installmentNumber?: number): string {
  const date = format(new Date(), 'yyyy-MM-dd');
  const friend = friendName.split(' ')[0].toLowerCase();
  const parcel = installmentNumber ? `_parc${installmentNumber}` : '';
  return `${prefix}_${friend}${parcel}_${date}`;
}
