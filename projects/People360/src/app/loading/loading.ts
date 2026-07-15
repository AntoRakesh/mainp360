import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
} from '@angular/router';
import { Subscription } from 'rxjs';
import { AUTH_URL } from '../config';

interface Tile {
  key: string;
  bgPosition: string;
  dx: number;
  dy: number;
  delay: number;
}

const GRID = 3;
const TILE_SIZE = 30;
const SPREAD = 22;

@Component({
  selector: 'app-loading',
  templateUrl: './loading.html',
  styleUrl: './loading.scss',
})
export class Loading implements OnInit, OnDestroy {
  loading = signal(false);
  logoUrl = `${AUTH_URL}/assets/icons/PurpleIQLOGOPurpleBright.png`;
  tileSize = TILE_SIZE;
  logoSize = GRID * TILE_SIZE;
  tiles: Tile[] = this.buildTiles();

  private sub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    this.sub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loading.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError ||
        event instanceof NavigationSkipped
      ) {
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private buildTiles(): Tile[] {
    const tiles: Tile[] = [];
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        const dx = (col - 1) * SPREAD;
        const dy = (row - 1) * SPREAD;
        tiles.push({
          key: `${row}-${col}`,
          bgPosition: `${-col * TILE_SIZE}px ${-row * TILE_SIZE}px`,
          dx,
          dy,
          delay: (Math.abs(row - 1) + Math.abs(col - 1)) * 80,
        });
      }
    }
    return tiles;
  }
}
