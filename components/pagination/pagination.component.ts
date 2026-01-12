/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Direction, Directionality } from '@angular/cdk/bidi';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  input,
  numberAttribute
} from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { NzConfigKey, NzConfigService, WithConfig } from 'ng-zorro-antd/core/config';
import { NzBreakpointEnum, NzBreakpointService, gridResponsiveMap } from 'ng-zorro-antd/core/services';
import { NzI18nService, NzPaginationI18nInterface } from 'ng-zorro-antd/i18n';

import { NzPaginationDefaultComponent } from './pagination-default.component';
import { NzPaginationSimpleComponent } from './pagination-simple.component';
import { PaginationItemRenderContext, type NzPaginationAlign } from './pagination.types';
import { validatePageIndex, getLastIndex } from './pagination-utils.helper';
import { setupPaginationSubscriptions } from './pagination-subscription.helper';

const NZ_CONFIG_MODULE_NAME: NzConfigKey = 'pagination';

@Component({
  selector: 'nz-pagination',
  exportAs: 'nzPagination',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.component.html',
  host: {
    class: 'ant-pagination',
    '[class.ant-pagination-simple]': 'nzSimple',
    '[class.ant-pagination-disabled]': 'nzDisabled',
    '[class.ant-pagination-mini]': `!nzSimple && size === 'small'`,
    '[class.ant-pagination-rtl]': `dir === 'rtl'`,
    '[class.ant-pagination-start]': 'nzAlign() === "start"',
    '[class.ant-pagination-center]': 'nzAlign() === "center"',
    '[class.ant-pagination-end]': 'nzAlign() === "end"'
  },
  imports: [NgTemplateOutlet, NzPaginationSimpleComponent, NzPaginationDefaultComponent]
})
export class NzPaginationComponent implements OnInit, OnChanges {
  readonly _nzModuleName: NzConfigKey = NZ_CONFIG_MODULE_NAME;

  private readonly i18n = inject(NzI18nService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly breakpointService = inject(NzBreakpointService);
  protected readonly nzConfigService = inject(NzConfigService);
  private readonly directionality = inject(Directionality);
  private readonly destroyRef = inject(DestroyRef);

  @Output() readonly nzPageSizeChange = new EventEmitter<number>();
  @Output() readonly nzPageIndexChange = new EventEmitter<number>();
  @Input() nzShowTotal: TemplateRef<{ $implicit: number; range: [number, number] }> | null = null;
  @Input() nzItemRender: TemplateRef<PaginationItemRenderContext> | null = null;
  @Input() @WithConfig() nzSize: 'default' | 'small' = 'default';
  @Input() @WithConfig() nzPageSizeOptions: number[] = [10, 20, 30, 40];
  @Input({ transform: booleanAttribute }) @WithConfig() nzShowSizeChanger = false;
  @Input({ transform: booleanAttribute }) @WithConfig() nzShowQuickJumper = false;
  @Input({ transform: booleanAttribute }) @WithConfig() nzSimple = false;
  @Input({ transform: booleanAttribute }) nzDisabled = false;
  @Input({ transform: booleanAttribute }) nzResponsive = false;
  @Input({ transform: booleanAttribute }) nzHideOnSinglePage = false;
  @Input({ transform: numberAttribute }) nzTotal = 0;
  @Input({ transform: numberAttribute }) nzPageIndex = 1;
  @Input({ transform: numberAttribute }) nzPageSize = 10;
  readonly nzAlign = input<NzPaginationAlign>('start');

  showPagination = true;
  locale!: NzPaginationI18nInterface;
  size: 'default' | 'small' = 'default';
  dir: Direction = 'ltr';

  private total$ = new ReplaySubject<number>(1);

  onPageIndexChange = (index: number): void => {
    const lastIndex = getLastIndex(this.nzTotal, this.nzPageSize);
    const validIndex = validatePageIndex(index, lastIndex);
    if (validIndex !== this.nzPageIndex && !this.nzDisabled) {
      this.nzPageIndex = validIndex;
      this.nzPageIndexChange.emit(this.nzPageIndex);
    }
  };
  onPageSizeChange = (size: number): void => {
    this.nzPageSize = size;
    this.nzPageSizeChange.emit(size);
    const lastIndex = getLastIndex(this.nzTotal, this.nzPageSize);
    if (this.nzPageIndex > lastIndex) this.onPageIndexChange(lastIndex);
  };
  onTotalChange = (total: number): void => {
    const lastIndex = getLastIndex(total, this.nzPageSize);
    if (this.nzPageIndex > lastIndex) {
      Promise.resolve().then(() => {
        this.onPageIndexChange(lastIndex);
        this.cdr.markForCheck();
      });
    }
  };

  ngOnInit = (): void => {
    setupPaginationSubscriptions(
      this.i18n,
      this.breakpointService,
      this.directionality,
      this.destroyRef,
      this.cdr,
      this.total$,
      this.nzResponsive,
      (locale) => this.locale = locale,
      (total) => this.onTotalChange(total),
      (size) => this.size = size,
      (dir) => this.dir = dir
    );
  };

  ngOnChanges = (changes: SimpleChanges): void => {
    if (changes['nzTotal']) this.total$.next(this.nzTotal);
    if (changes['nzHideOnSinglePage'] || changes['nzTotal'] || changes['nzPageSize']) {
      this.showPagination = (this.nzHideOnSinglePage && this.nzTotal > this.nzPageSize) || (this.nzTotal > 0 && !this.nzHideOnSinglePage);
    }
    if (changes['nzSize']) this.size = changes['nzSize'].currentValue;
  };
}
