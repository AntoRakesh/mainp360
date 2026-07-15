import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'warning' | 'error';

export interface ToastEventDetail {
  type: ToastType;
  message: string;
}

// Each remote is built as a separate bundle, so an Angular DI singleton
// isn't shared across them — the browser's single `window` is, which is
// what lets a toast fired from any remote reach the one container mounted
// in the shell, regardless of which module the user is currently viewing.
export const TOAST_EVENT_NAME = 'shared-ui:toast';

@Injectable({ providedIn: 'root' })
export class ToastService {
  success(message: string) {
    this.emit('success', message);
  }

  warning(message: string) {
    this.emit('warning', message);
  }

  error(message: string) {
    this.emit('error', message);
  }

  private emit(type: ToastType, message: string) {
    window.dispatchEvent(new CustomEvent<ToastEventDetail>(TOAST_EVENT_NAME, { detail: { type, message } }));
  }
}
