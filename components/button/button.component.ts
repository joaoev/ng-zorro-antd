/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Direction, Directionality } from '@angular/cdk/bidi';
import {
  AfterContentInit,
  afterEveryRender,
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  contentChild,
  ContentChild,
  DestroyRef,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnInit,
  Renderer2,
  signal,
  SimpleChanges,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';

import { NzConfigKey, onConfigChangeEventForComponent, WithConfig } from 'ng-zorro-antd/core/config';
import { NzSizeLDSType } from 'ng-zorro-antd/core/types';
import { fromEventOutsideAngular } from 'ng-zorro-antd/core/util';
import { NzIconDirective, NzIconModule } from 'ng-zorro-antd/icon';
import { NZ_SPACE_COMPACT_ITEM_TYPE, NZ_SPACE_COMPACT_SIZE, NzSpaceCompactItemDirective } from 'ng-zorro-antd/space';
import { setupLoadingIcon, insertTextSpans, setupElementOnlyDetection } from './button-init.helper';
import { setupClickHandler } from './button-events.helper';

export type NzButtonType = 'primary' | 'default' | 'dashed' | 'link' | 'text' | null;
export type NzButtonShape = 'circle' | 'round' | null;
export type NzButtonSize = NzSizeLDSType;

const NZ_CONFIG_MODULE_NAME: NzConfigKey = 'button';

@Component({
  selector: 'button[nz-button], a[nz-button]',
  exportAs: 'nzButton',
  imports: [NzIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './button.component.html',
  host: {
    class: 'ant-btn',
    '[class.ant-btn-default]': `nzType === 'default'`,
    '[class.ant-btn-primary]': `nzType === 'primary'`,
    '[class.ant-btn-dashed]': `nzType === 'dashed'`,
    '[class.ant-btn-link]': `nzType === 'link'`,
    '[class.ant-btn-text]': `nzType === 'text'`,
    '[class.ant-btn-circle]': `nzShape === 'circle'`,
    '[class.ant-btn-round]': `nzShape === 'round'`,
    '[class.ant-btn-lg]': `finalSize() === 'large'`,
    '[class.ant-btn-sm]': `finalSize() === 'small'`,
    '[class.ant-btn-dangerous]': `nzDanger`,
    '[class.ant-btn-loading]': `nzLoading`,
    '[class.ant-btn-background-ghost]': `nzGhost`,
    '[class.ant-btn-block]': `nzBlock`,
    '[class.ant-input-search-button]': `nzSearch`,
    '[class.ant-btn-rtl]': `dir === 'rtl'`,
    '[class.ant-btn-icon-only]': `iconOnly()`,
    '[attr.tabindex]': 'disabled ? -1 : (tabIndex === null ? null : tabIndex)',
    '[attr.disabled]': 'disabled || null'
  },
  hostDirectives: [NzSpaceCompactItemDirective],
  providers: [{ provide: NZ_SPACE_COMPACT_ITEM_TYPE, useValue: 'btn' }]
})
export class NzButtonComponent implements OnChanges, AfterViewInit, AfterContentInit, OnInit {
  private elementRef: ElementRef<HTMLButtonElement | HTMLAnchorElement> = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  private directionality = inject(Directionality);
  private destroyRef = inject(DestroyRef);
  readonly _nzModuleName: NzConfigKey = NZ_CONFIG_MODULE_NAME;

  @ContentChild(NzIconDirective, { read: ElementRef }) nzIconDirectiveElement!: ElementRef;
  @Input({ transform: booleanAttribute }) nzBlock: boolean = false;
  @Input({ transform: booleanAttribute }) nzGhost: boolean = false;
  /**
   * @deprecated Will be removed in v22.0.0. Please use `nz-input-search` instead.
   */
  @Input({ transform: booleanAttribute }) nzSearch: boolean = false;
  @Input({ transform: booleanAttribute }) nzLoading: boolean = false;
  @Input({ transform: booleanAttribute }) nzDanger: boolean = false;
  @Input({ transform: booleanAttribute }) disabled: boolean = false;
  @Input() tabIndex: number | string | null = null;
  @Input() nzType: NzButtonType = null;
  @Input() nzShape: NzButtonShape = null;
  @Input() @WithConfig() nzSize: NzButtonSize = 'default';
  dir: Direction = 'ltr';

  private readonly elementOnly = signal(false);
  private readonly size = signal<NzSizeLDSType>(this.nzSize);
  private readonly compactSize = inject(NZ_SPACE_COMPACT_SIZE, { optional: true });
  private readonly loading$ = new Subject<boolean>();

  protected readonly finalSize = computed(() => {
    if (this.compactSize) {
      return this.compactSize();
    }
    return this.size();
  });

  readonly iconDir = contentChild(NzIconDirective);
  readonly loadingIconDir = viewChild(NzIconDirective);

  readonly iconOnly = computed(() => this.elementOnly() && (!!this.iconDir() || !!this.loadingIconDir()));

  constructor() {
    onConfigChangeEventForComponent(NZ_CONFIG_MODULE_NAME, () => {
      this.size.set(this.nzSize);
      this.cdr.markForCheck();
    });
    setupElementOnlyDetection(this.elementRef, (v) => this.elementOnly.set(v), afterEveryRender);
  }

  ngOnInit(): void {
    this.size.set(this.nzSize);
    this.dir = this.directionality.value;
    this.directionality.change?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((d: Direction) => {
      this.dir = d;
      this.cdr.detectChanges();
    });
    setupClickHandler(this.elementRef, this.disabled, this.nzLoading, this.destroyRef);
  }

  ngOnChanges({ nzLoading, nzSize }: SimpleChanges): void {
    if (nzLoading) {
      this.loading$.next(this.nzLoading);
    }
    if (nzSize) {
      this.size.set(nzSize.currentValue);
    }
  }

  ngAfterViewInit(): void {
    insertTextSpans(this.elementRef, this.renderer);
  }

  ngAfterContentInit(): void {
    setupLoadingIcon(this.loading$, this.nzLoading, this.nzIconDirectiveElement, this.renderer, this.destroyRef);
  }
}
