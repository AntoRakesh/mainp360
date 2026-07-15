import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { TOAST_EVENT_NAME, ToastEventDetail } from './toast.service';

interface Toast extends ToastEventDetail {
  id: number;
}

@Component({
  selector: 'lib-toast-container',
  standalone: true,
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts = signal<Toast[]>([]);

  private nextId = 0;
  private hoverTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly onToastEvent = (event: Event) => {
    const detail = (event as CustomEvent<ToastEventDetail>).detail;
    const id = this.nextId++;
    this.toasts.update(list => [...list, { id, ...detail }]);
  };

  ngOnInit() {
    window.addEventListener(TOAST_EVENT_NAME, this.onToastEvent);
  }

  ngOnDestroy() {
    window.removeEventListener(TOAST_EVENT_NAME, this.onToastEvent);
    this.hoverTimers.forEach(timer => clearTimeout(timer));
  }

  dismiss(id: number) {
    const timer = this.hoverTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.hoverTimers.delete(id);
    }
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  onHover(id: number) {
    if (this.hoverTimers.has(id)) return;
    const timer = setTimeout(() => this.dismiss(id), 3000);
    this.hoverTimers.set(id, timer);
  }
}
