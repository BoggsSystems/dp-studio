export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
}

type Listener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l([...this.toasts]));
  }

  show(message: string, type: ToastType = 'info', title?: string, durationMs: number = 4000) {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { id, type, title, message, durationMs };
    this.toasts = [...this.toasts, newToast];
    this.notify();

    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }
  }

  success(message: string, title?: string, durationMs?: number) {
    this.show(message, 'success', title, durationMs);
  }

  error(message: string, title?: string, durationMs?: number) {
    this.show(message, 'error', title, durationMs || 5000);
  }

  warning(message: string, title?: string, durationMs?: number) {
    this.show(message, 'warning', title, durationMs);
  }

  info(message: string, title?: string, durationMs?: number) {
    this.show(message, 'info', title, durationMs);
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }
}

export const toast = new ToastManager();
