export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

type Listener = (toast: ToastMessage) => void;

let listener: Listener | null = null;

export function setToastListener(fn: Listener | null): void {
  listener = fn;
}

export function showToast(message: string, type: ToastType = 'success'): void {
  listener?.({
    id: `${Date.now()}-${Math.random()}`,
    message,
    type,
  });
}
