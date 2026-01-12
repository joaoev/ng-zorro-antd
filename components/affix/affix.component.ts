/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Directionality } from '@angular/cdk/bidi';
import { Platform } from '@angular/cdk/platform';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  Input,
  OnChanges,
  output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';

import { NzConfigKey, WithConfig } from 'ng-zorro-antd/core/config';
import { NzScrollService } from 'ng-zorro-antd/core/services';
import { numberAttributeWithZeroFallback } from 'ng-zorro-antd/core/util';

import { AffixRespondEvents } from './respond-events';
import { AffixPositionService, PositionCalculationResult } from './affix-position.service';
import { AffixStyleService } from './affix-style.service';
import { AffixListenerService } from './affix-listener.service';

const NZ_CONFIG_MODULE_NAME: NzConfigKey = 'affix';

@Component({
  selector: 'nz-affix',
  exportAs: 'nzAffix',
  template: `
    <div #fixedEl>
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NzAffixComponent implements OnChanges {
  private readonly scrollSrv = inject(NzScrollService);
  private readonly platform = inject(Platform);
  private readonly directionality = inject(Directionality);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly placeholderNode: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly positionService = inject(AffixPositionService);
  private readonly styleService = inject(AffixStyleService);
  private readonly listenerService = inject(AffixListenerService);

  readonly _nzModuleName: NzConfigKey = NZ_CONFIG_MODULE_NAME;

  @ViewChild('fixedEl', { static: true }) private readonly fixedEl!: ElementRef<HTMLDivElement>;

  @Input() nzTarget?: string | Element | Window;

  @Input({ transform: numberAttributeWithZeroFallback })
  @WithConfig()
  nzOffsetTop?: null | number;

  @Input({ transform: numberAttributeWithZeroFallback })
  @WithConfig()
  nzOffsetBottom?: null | number;

  readonly nzChange = output<boolean>();

  private get target(): Element | Window {
    const el = this.nzTarget;
    const resolvedTarget = typeof el === 'string' ? this.document.querySelector(el) : el;

    return (
      (resolvedTarget as Element | Window | null) ?? (this.document.defaultView as Window | null) ?? this.document.body
    );
  }

  constructor() {
    effect(() => {
      this.directionality.valueSignal();
      this.registerListeners();
      this.updatePosition({} as Event);
    });

    this.destroyRef.onDestroy(() => {
      this.listenerService.removeListeners();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { nzOffsetBottom, nzOffsetTop, nzTarget } = changes;

    if (nzOffsetBottom || nzOffsetTop) {
      this.listenerService.notifyOffsetChanged();
    }
    if (nzTarget) {
      this.registerListeners();
    }
  }

  private registerListeners(): void {
    this.listenerService.registerListeners(
      this.target,
      this.destroyRef,
      (e: Event) => this.updatePosition(e)
    );
  }

  updatePosition(e: Event): void {
    if (!this.platform.isBrowser) {
      return;
    }

    const positionResult = this.calculatePosition(e);
    this.applyStyles(positionResult, e);

    if (e.type === 'resize') {
      this.handleResize(e);
    }
  }

  private calculatePosition(e: Event): PositionCalculationResult {
    const targetNode = this.target;
    const params = {
      target: targetNode,
      placeholderNode: this.placeholderNode,
      fixedNode: this.fixedEl.nativeElement,
      offsetTop: this.nzOffsetTop,
      offsetBottom: this.nzOffsetBottom,
      scrollTop: this.scrollSrv.getScroll(targetNode, true)
    };
    let result = this.positionService.calculatePosition(params, e);
    if (
      e.type === AffixRespondEvents.resize &&
      !result.affixStyle &&
      this.styleService.getAffixStyle()?.position === 'fixed' &&
      this.placeholderNode.offsetWidth
    ) {
      result = {
        affixStyle: { ...this.styleService.getAffixStyle()!, width: this.placeholderNode.offsetWidth },
        placeholderStyle: result.placeholderStyle
      };
    }
    return result;
  }

  private applyStyles(result: PositionCalculationResult, e: Event): void {
    const fixedNode = this.fixedEl.nativeElement;
    const isWindowTarget = this.target === window;
    const styleChanged = this.styleService.setAffixStyle(fixedNode, e, result.affixStyle, isWindowTarget);
    if (styleChanged) {
      this.nzChange.emit(!!result.affixStyle);
    }
    this.styleService.setPlaceholderStyle(this.placeholderNode, result.placeholderStyle);
  }

  private handleResize(e: Event): void {
    const fixedNode = this.fixedEl.nativeElement;
    const syncedStyle = this.styleService.syncPlaceholderStyle(this.placeholderNode, fixedNode, e);
    if (syncedStyle) {
      const isWindowTarget = this.target === window;
      this.styleService.setAffixStyle(fixedNode, e, syncedStyle, isWindowTarget);
      this.styleService.setPlaceholderStyle(this.placeholderNode, {
        width: this.placeholderNode.offsetWidth,
        height: fixedNode.offsetHeight
      });
    }
  }
}
