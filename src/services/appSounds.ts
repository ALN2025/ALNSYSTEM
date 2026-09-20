import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

type SoundKind = 'open' | 'close' | 'overdue';

const SOURCES: Record<SoundKind, number> = {
  open: require('../../assets/sounds/app-open.wav'),
  close: require('../../assets/sounds/app-close.wav'),
  overdue: require('../../assets/sounds/overdue_alert.wav'),
};

let soundEnabled = true;
let initPromise: Promise<void> | null = null;
const players = new Map<SoundKind, AudioPlayer>();

export function setAppSoundsEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export async function initAppSounds(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      });

      (Object.keys(SOURCES) as SoundKind[]).forEach((kind) => {
        if (!players.has(kind)) {
          players.set(kind, createAudioPlayer(SOURCES[kind]));
        }
      });
    } catch {
      /* fallback para haptics */
    }
  })();

  return initPromise;
}

async function hapticFallback(kind: SoundKind): Promise<void> {
  try {
    if (kind === 'open') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (kind === 'close') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  } catch {
    /* opcional */
  }
}

export async function playAppSound(kind: SoundKind): Promise<void> {
  if (!soundEnabled || Platform.OS === 'web') return;

  try {
    await initAppSounds();
    const player = players.get(kind);
    if (!player) {
      await hapticFallback(kind);
      return;
    }
    player.seekTo(0);
    player.play();
  } catch {
    await hapticFallback(kind);
  }
}
