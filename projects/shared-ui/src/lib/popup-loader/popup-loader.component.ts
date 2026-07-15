import { Component, Input } from '@angular/core';

interface Tile {
  key: string;
  bgPosition: string;
  dx: number;
  dy: number;
  delay: number;
}

const GRID = 3;
const TILE_SIZE = 18;
const SPREAD = 14;

@Component({
  selector: 'lib-popup-loader',
  standalone: true,
  templateUrl: './popup-loader.component.html',
  styleUrl: './popup-loader.component.scss',
})
export class PopupLoaderComponent {
  @Input() text = 'Loading';

  logoUrl = `${(window as any).__AUTH_URL__ || 'http://localhost:4201'}/assets/icons/PurpleIQLOGOPurpleBright.png`;
  tileSize = TILE_SIZE;
  logoSize = GRID * TILE_SIZE;
  tiles: Tile[] = this.buildTiles();

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
