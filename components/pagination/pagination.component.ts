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
  inject,
  input
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReplaySubject } from 'rxjs';

import { NzConfigKey, NzConfigService, PaginationConfig } from 'ng-zorro-antd/core/config';
import { NzBreakpointEnum, NzBreakpointService, gridResponsiveMap } from 'ng-zorro-antd/core/services';
import { NzI18nService, NzPaginationI18nInterface } from 'ng-zorro-antd/i18n';

import { NzPaginationDefaultComponent } from './pagination-default.component';
import { NzPaginationSimpleComponent } from './pagination-simple.component';
import {
  PaginationItemRenderContext,
  PaginationState,
  PaginationDisplayOptions,
  type NzPaginationAlign
} from './pagination.types';

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

  // Agrupamento de inputs para reduzir o número de propriedades @Input
  @Input() nzState: PaginationState = {};
  @Input() nzOptions: PaginationDisplayOptions = {};
  @Input() nzShowTotal: TemplateRef<{ $implicit: number; range: [number, number] }> | null = null;
  @Input() nzItemRender: TemplateRef<PaginationItemRenderContext> | null = null;
  readonly nzAlign = input<NzPaginationAlign>('start');

  // Getters para acessar valores individuais com fallback para valores padrão e configuração global
  private get config(): PaginationConfig {
    const config = this.nzConfigService.getConfigForComponent(this._nzModuleName);
    // Faz o type guard para garantir que é PaginationConfig
    if (config && (config as PaginationConfig).nzSize !== undefined) {
      return config as PaginationConfig;
    }
    return {};
  }

  get nzTotal(): number {
    return this.nzState.total ?? 0;
  }

  get nzPageIndex(): number {
    return this.nzState.pageIndex ?? this._pageIndex;
  }

  get nzPageSize(): number {
    return this.nzState.pageSize ?? this._pageSize;
  }

  get nzSize(): 'default' | 'small' {
    return this.nzOptions.size ?? this.config.nzSize ?? 'default';
  }

  get nzPageSizeOptions(): number[] {
    return this.nzOptions.pageSizeOptions ?? this.config.nzPageSizeOptions ?? [10, 20, 30, 40];
  }

  get nzShowSizeChanger(): boolean {
    return this.nzOptions.showSizeChanger ?? this.config.nzShowSizeChanger ?? false;
  }

  get nzShowQuickJumper(): boolean {
    return this.nzOptions.showQuickJumper ?? this.config.nzShowQuickJumper ?? false;
  }

  get nzSimple(): boolean {
    return this.nzOptions.simple ?? this.config.nzSimple ?? false;
  }

  get nzDisabled(): boolean {
    return this.nzOptions.disabled ?? false;
  }

  get nzResponsive(): boolean {
    return this.nzOptions.responsive ?? false;
  }

  get nzHideOnSinglePage(): boolean {
    return this.nzOptions.hideOnSinglePage ?? false;
  }

  // Propriedades privadas para armazenar valores internos que podem ser modificados
  private _pageIndex: number = 1;
  private _pageSize: number = 10;

  showPagination = true;
  locale!: NzPaginationI18nInterface;
  size: 'default' | 'small' = 'default';
  dir: Direction = 'ltr';

  private total$ = new ReplaySubject<number>(1);

  onPageIndexChange = (index: number): void => {
    const lastIndex = this.getLastIndex(this.nzTotal, this.nzPageSize);
    const validIndex = this.validatePageIndex(index, lastIndex);
    if (validIndex !== this.nzPageIndex && !this.nzDisabled) {
      this._pageIndex = validIndex;
      this.nzPageIndexChange.emit(validIndex);
    }
  };
  /**
   * Garante que o índice da página esteja dentro dos limites válidos.
   */
  private validatePageIndex(index: number, lastIndex: number): number {
    if (index < 1) return 1;
    if (index > lastIndex) return lastIndex;
    return index;
  }

  onPageSizeChange(size: number): void {
    this._pageSize = size;
    this.nzPageSizeChange.emit(size);
    const lastIndex = this.getLastIndex(this.nzTotal, this.nzPageSize);
    if (this.nzPageIndex > lastIndex) this.onPageIndexChange(lastIndex);
  }
  onTotalChange = (total: number): void => {
    const lastIndex = this.getLastIndex(total, this.nzPageSize);
    if (this.nzPageIndex > lastIndex) {
      Promise.resolve().then(() => {
        this.onPageIndexChange(lastIndex);
        this.cdr.markForCheck();
      });
    }
  };

  getLastIndex(total: number, pageSize: number): number {
    return Math.ceil(total / pageSize);
  }

  ngOnInit(): void {
    // Inicializar valores privados a partir dos objetos de entrada
    if (this.nzState.pageIndex !== undefined) {
      this._pageIndex = this.nzState.pageIndex;
    }
    if (this.nzState.pageSize !== undefined) {
      this._pageSize = this.nzState.pageSize;
    }
    if (this.nzState.total !== undefined) {
      this.total$.next(this.nzState.total);
    }
    this.size = this.nzSize;

    this.i18n.localeChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.locale = this.i18n.getLocaleData('Pagination');
      this.cdr.markForCheck();
    });

    this.total$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(total => {
      this.onTotalChange(total);
    });

    this.breakpointService
      .subscribe(gridResponsiveMap)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(bp => {
        if (this.nzResponsive) {
          this.size = bp === NzBreakpointEnum.xs ? 'small' : 'default';
          this.cdr.markForCheck();
        }
      });

    this.directionality.change?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(direction => {
      this.dir = direction;
      this.cdr.detectChanges();
    });
    this.dir = this.directionality.value;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { nzState, nzOptions } = changes;

    if (nzState) {
      const state = nzState.currentValue as PaginationState;
      if (state.total !== undefined) {
        this.total$.next(state.total);
      }
      if (state.pageIndex !== undefined) {
        this._pageIndex = state.pageIndex;
      }
      if (state.pageSize !== undefined) {
        this._pageSize = state.pageSize;
      }
    }

    if (nzState || nzOptions) {
      const state = this.nzState;
      const options = this.nzOptions;
      if (options.hideOnSinglePage !== undefined || state.total !== undefined || state.pageSize !== undefined) {
        this.showPagination =
          (this.nzHideOnSinglePage && this.nzTotal > this.nzPageSize) || (this.nzTotal > 0 && !this.nzHideOnSinglePage);
      }

      if (options.size !== undefined) {
        this.size = this.nzSize;
      }
    }
    if (changes['nzSize']) this.size = changes['nzSize'].currentValue;
  }
}
