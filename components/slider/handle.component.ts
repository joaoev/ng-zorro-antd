/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Direction } from '@angular/cdk/bidi';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
  booleanAttribute,
  inject
} from '@angular/core';

import { NgStyleInterface, NzTSType } from 'ng-zorro-antd/core/types';
import { numberAttributeWithZeroFallback } from 'ng-zorro-antd/core/util';
import { NzTooltipDirective, NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { NzSliderShowTooltip } from './typings';
import { HandlePositionOptions, HandleStateOptions, HandleTooltipOptions } from './handle.types';

@Component({
  selector: 'nz-slider-handle',
  exportAs: 'nzSliderHandle',
  template: `
    <div
      #handle
      class="ant-slider-handle"
      tabindex="0"
      nz-tooltip
      [style]="style"
      [nzTooltipTitle]="tooltipFormatter === null || tooltipVisible === 'never' ? null : tooltipTitle"
      [nzTooltipTitleContext]="{ $implicit: value }"
      [nzTooltipTrigger]="null"
      [nzTooltipPlacement]="tooltipPlacement"
    ></div>
  `,
  host: {
    '(mouseenter)': 'enterHandle()',
    '(mouseleave)': 'leaveHandle()'
  },
  imports: [NzTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NzSliderHandleComponent implements OnChanges {
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('handle', { static: false }) handleEl?: ElementRef;
  @ViewChild(NzTooltipDirective, { static: false }) tooltip?: NzTooltipDirective;

  @Input() nzPositionOptions: HandlePositionOptions = {};
  @Input() nzTooltipOptions: HandleTooltipOptions = { tooltipVisible: 'default' };
  @Input() nzStateOptions: HandleStateOptions = { active: false };

  // Getters para manter compatibilidade com código existente
  get vertical(): boolean {
    return this.nzPositionOptions.vertical ?? false;
  }

  get reverse(): boolean {
    return this.nzPositionOptions.reverse ?? false;
  }

  get offset(): number {
    return this.nzPositionOptions.offset ?? 0;
  }

  get value(): number {
    return this.nzPositionOptions.value ?? 0;
  }

  get dir(): Direction {
    return this.nzPositionOptions.dir ?? 'ltr';
  }

  get tooltipVisible(): NzSliderShowTooltip {
    return this.nzTooltipOptions.tooltipVisible ?? 'default';
  }

  get tooltipPlacement(): string | undefined {
    return this.nzTooltipOptions.tooltipPlacement;
  }

  get tooltipFormatter(): null | ((value: number) => string) | TemplateRef<void> | undefined {
    return this.nzTooltipOptions.tooltipFormatter;
  }

  get active(): boolean {
    return this.nzStateOptions.active ?? false;
  }

  get dragging(): boolean | undefined {
    return this.nzStateOptions.dragging;
  }

  tooltipTitle?: NzTSType;
  style: NgStyleInterface = {};

  ngOnChanges(changes: SimpleChanges): void {
    const { nzPositionOptions, nzTooltipOptions, nzStateOptions } = changes;

    if (nzPositionOptions) {
      const current = nzPositionOptions.currentValue as HandlePositionOptions | undefined;
      const previous = nzPositionOptions.previousValue as HandlePositionOptions | undefined;

      if (
        current?.offset !== previous?.offset ||
        current?.reverse !== previous?.reverse ||
        current?.dir !== previous?.dir
      ) {
        this.updateStyle();
      }

      if (current?.value !== previous?.value && current?.value !== undefined) {
        this.updateTooltipTitle();
        this.updateTooltipPosition();
      }
    }

    if (nzStateOptions) {
      const current = nzStateOptions.currentValue as HandleStateOptions | undefined;
      const previous = nzStateOptions.previousValue as HandleStateOptions | undefined;

      if (current?.active !== previous?.active && current?.active !== undefined) {
        if (current.active) {
          this.toggleTooltip(true);
        } else {
          this.toggleTooltip(false);
        }
      }
    }

    if (nzTooltipOptions) {
      const current = nzTooltipOptions.currentValue as HandleTooltipOptions | undefined;
      if (current?.tooltipVisible === 'always') {
        Promise.resolve().then(() => this.toggleTooltip(true, true));
      }
    }
  }

  enterHandle = (): void => {
    if (!this.dragging) {
      this.toggleTooltip(true);
      this.updateTooltipPosition();
      this.cdr.detectChanges();
    }
  };

  leaveHandle = (): void => {
    if (!this.dragging) {
      this.toggleTooltip(false);
      this.cdr.detectChanges();
    }
  };

  focus(): void {
    this.handleEl?.nativeElement.focus();
  }

  private toggleTooltip(show: boolean, force: boolean = false): void {
    if (!force && (this.tooltipVisible !== 'default' || !this.tooltip)) {
      return;
    }

    if (show) {
      this.tooltip?.show();
    } else {
      this.tooltip?.hide();
    }
  }

  private updateTooltipTitle(): void {
    if (this.tooltipFormatter) {
      this.tooltipTitle =
        typeof this.tooltipFormatter === 'function' ? this.tooltipFormatter(this.value!) : this.tooltipFormatter;
    } else {
      this.tooltipTitle = `${this.value}`;
    }
  }

  private updateTooltipPosition(): void {
    if (this.tooltip) {
      Promise.resolve().then(() => this.tooltip?.updatePosition());
    }
  }

  private updateStyle(): void {
    if (this.vertical) {
      this.style = {
        [this.reverse ? 'top' : 'bottom']: `${this.offset}%`,
        [this.reverse ? 'bottom' : 'top']: 'auto',
        transform: this.reverse ? null : `translateY(+50%)`
      };
    } else {
      this.style = {
        ...this.getHorizontalStylePosition(),
        transform: `translateX(${this.reverse ? (this.dir === 'rtl' ? '-' : '+') : this.dir === 'rtl' ? '+' : '-'}50%)`
      };
    }
    this.cdr.markForCheck();
  }

  private getHorizontalStylePosition(): { left: string; right: string } {
    let left = this.reverse ? 'auto' : `${this.offset}%`;
    let right = this.reverse ? `${this.offset}%` : 'auto';
    if (this.dir === 'rtl') {
      [left, right] = [right, left];
    }
    return { left, right };
  }
}
