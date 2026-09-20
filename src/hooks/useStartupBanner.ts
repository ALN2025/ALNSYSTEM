import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { playAppSound } from '../services/appSounds';

const isNative = Platform.OS === 'android' || Platform.OS === 'ios';

/** Load screen so na 1a abertura (cold start). No mobile, nao repete ao voltar do background. */
export function useStartupBanner() {
  const [showBanner, setShowBanner] = useState(true);
  const [bannerKey] = useState(0);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const coldStartDone = useRef(false);

  const hideBanner = useCallback(() => {
    setShowBanner(false);
    coldStartDone.current = true;
  }, []);

  useEffect(() => {
    const safety = setTimeout(() => {
      if (!coldStartDone.current) hideBanner();
    }, 5000);
    return () => clearTimeout(safety);
  }, [hideBanner]);

  useEffect(() => {
    if (!isNative) return;

    const sub = AppState.addEventListener('change', (next) => {
      const prev = appState.current;

      if (prev === 'active' && next === 'background') {
        void playAppSound('close');
      }

      if (prev === 'background' && next === 'active') {
        void playAppSound('open');
      }

      appState.current = next;
    });

    return () => sub.remove();
  }, []);

  return { showBanner, bannerKey, hideBanner };
};
