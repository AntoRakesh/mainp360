import { Component } from '@angular/core';
import { LocatingPage } from './Component/locating-page/locating-page';

@Component({
  selector: 'app-root',
  imports: [LocatingPage],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
