import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from 'shared-ui';
import { Loading } from './loading/loading';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Loading, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('People360');
}
