import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

/** Gera ID único — requer polyfill no React Native (Android/iOS). */
export function newId(): string {
  return uuidv4();
}
