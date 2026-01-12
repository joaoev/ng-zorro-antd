/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { AfterViewInit, ChangeDetectionStrategy, Component, effect, ElementRef, input, viewChild } from '@angular/core';

import { CrossOrigin, Excavation, Modules } from './typing';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_FRONT_COLOR, excavateModules, generatePath, isSupportPath2d } from './utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'nz-qrcode-canvas',
  exportAs: 'nzQRCodeCanvas',
  template: `
    <canvas role="img" #canvas></canvas>
    @if (icon()) {
      <img style="display:none;" #image alt="QR-Code" [attr.src]="this.icon()" crossorigin="anonymous" />
    }
  `,
  styles: `
    :host {
      display: block;
      line-height: 0;
    }
  `
})
export class NzQrcodeCanvasComponent implements AfterViewInit {
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  image = viewChild<ElementRef<HTMLImageElement>>('image');
  readonly icon = input<string>('');
  readonly margin = input<number>(0);
  readonly cells = input<Modules>([]);
  readonly numCells = input<number>(0);
  readonly calculatedImageSettings = input<{
    x: number;
    y: number;
    h: number;
    w: number;
    excavation: Excavation | null;
    opacity: number;
    crossOrigin: CrossOrigin;
  } | null>(null);
  readonly size = input<number>(160);
  readonly color = input<string>(DEFAULT_FRONT_COLOR);
  readonly bgColor = input<string>(DEFAULT_BACKGROUND_COLOR);

  private get canvasElement(): HTMLCanvasElement | null {
    const canvas = this.canvas();
    return canvas ? (canvas as { ['nativeElement']: HTMLCanvasElement })['nativeElement'] : null;
  }

  private get imageElement(): HTMLImageElement | null {
    const image = this.image();
    return image ? (image as { ['nativeElement']: HTMLImageElement })['nativeElement'] : null;
  }

  constructor() {
    effect(() => {
      this.icon();
      this.margin();
      this.cells();
      this.numCells();
      this.calculatedImageSettings();
      this.size();
      this.color();
      this.bgColor();
      if (!this.canvasElement) {
        return;
      }

      this.render();
    });
  }

  ngAfterViewInit(): void {
    this.render();
  }

  private render(): void {
    const canvasEl = this.canvasElement;
    if (!canvasEl) {
      return;
    }

    const ctx = canvasEl.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) {
      return;
    }

    this.setupCanvas(ctx);
    this.drawQRCode(ctx);
    this.handleImageLoading(ctx);
  }

  private setupCanvas(ctx: CanvasRenderingContext2D): void {
    const canvasEl = this.canvasElement;
    if (!canvasEl) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvasEl.height = canvasEl.width = this.size() * pixelRatio;
    canvasEl.style.width = canvasEl.style.height = `${this.size()}px`;

    const scale = (this.size() / this.numCells()) * pixelRatio;
    ctx.scale(scale, scale);

    ctx.fillStyle = this.bgColor();
    ctx.fillRect(0, 0, this.numCells(), this.numCells());
    ctx.fillStyle = this.color();
  }

  private drawQRCode(ctx: CanvasRenderingContext2D): void {
    const cellsToDraw = this.getCellsToDraw();
    const haveImageToRender = this.haveImageToRender();

    if (!haveImageToRender) {
      this.renderQRCode(ctx, cellsToDraw);
    }
  }

  private getCellsToDraw(): Modules {
    let cellsToDraw = this.cells();
    const imageSettings = this.calculatedImageSettings();
    if (this.haveImageToRender() && imageSettings && imageSettings.excavation) {
      cellsToDraw = excavateModules(this.cells(), imageSettings.excavation);
    }
    return cellsToDraw;
  }

  private haveImageToRender(): boolean {
    return this.calculatedImageSettings() != null && !!this.image();
  }

  private renderQRCode(ctx: CanvasRenderingContext2D, cells: Modules): void {
    if (isSupportPath2d) {
      ctx.fill(new Path2D(generatePath(cells, this.margin())));
    } else {
      cells.forEach((row, rdx) => {
        row.forEach((cell, cdx) => {
          if (cell) {
            ctx.fillRect(cdx + this.margin(), rdx + this.margin(), 1, 1);
          }
        });
      });
    }
  }

  private handleImageLoading(ctx: CanvasRenderingContext2D): void {
    if (!this.haveImageToRender()) {
      return;
    }

    const imageEl = this.imageElement;
    if (!imageEl) {
      return;
    }

    const onLoad = (): void => {
      this.cleanupImageListeners(onLoad, onError);
      this.onImageLoadSuccess(ctx);
    };

    const onError = (): void => {
      this.cleanupImageListeners(onLoad, onError);
      this.onImageLoadError(ctx);
    };

    imageEl.addEventListener('load', onLoad);
    imageEl.addEventListener('error', onError);
  }

  private onImageLoadSuccess(ctx: CanvasRenderingContext2D): void {
    const cellsToDraw = this.getCellsToDraw();
    this.renderQRCode(ctx, cellsToDraw);

    const imageSettings = this.calculatedImageSettings();
    const imageEl = this.imageElement;
    if (imageSettings && imageEl) {
      ctx.globalAlpha = imageSettings.opacity;
      ctx.drawImage(
        imageEl,
        imageSettings.x + this.margin(),
        imageSettings.y + this.margin(),
        imageSettings.w,
        imageSettings.h
      );
    }
  }

  private onImageLoadError(ctx: CanvasRenderingContext2D): void {
    const cellsToDraw = this.getCellsToDraw();
    this.renderQRCode(ctx, cellsToDraw);
  }

  private cleanupImageListeners(onLoad: () => void, onError: () => void): void {
    const imageEl = this.imageElement;
    if (imageEl) {
      imageEl.removeEventListener('load', onLoad);
      imageEl.removeEventListener('error', onError);
    }
  }
}
