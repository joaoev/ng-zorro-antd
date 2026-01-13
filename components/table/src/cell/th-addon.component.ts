/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

/* eslint-disable @angular-eslint/component-selector */
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges,
  ViewEncapsulation,
  inject,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { NzConfigKey, NzConfigService } from 'ng-zorro-antd/core/config';
import { fromEventOutsideAngular } from 'ng-zorro-antd/core/util';

import { ThAddonFilterOptions, ThAddonSortOptions } from './th-addon.types';
import { NzTableFilterComponent } from '../addon/filter.component';
import { NzTableSortersComponent } from '../addon/sorters.component';
import {
  NzTableFilterFn,
  NzTableFilterList,
  NzTableFilterValue,
  NzTableSortFn,
  NzTableSortOrder
} from '../table.types';

const NZ_CONFIG_MODULE_NAME: NzConfigKey = 'table';

@Component({
  selector:
    'th[nzColumnKey], th[nzSortFn], th[nzSortOrder], th[nzFilters], th[nzShowSort], th[nzShowFilter], th[nzCustomFilter]',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (nzShowFilter || nzCustomFilter) {
      <nz-table-filter
        [contentTemplate]="notFilterTemplate"
        [extraTemplate]="extraTemplate"
        [customFilter]="nzCustomFilter"
        [filterMultiple]="nzFilterMultiple"
        [listOfFilter]="nzFilters"
        (filterChange)="onFilterValueChange($event)"
      ></nz-table-filter>
    } @else {
      <ng-container [ngTemplateOutlet]="notFilterTemplate"></ng-container>
    }
    <ng-template #notFilterTemplate>
      <ng-template [ngTemplateOutlet]="nzShowSort ? sortTemplate : contentTemplate"></ng-template>
    </ng-template>
    <ng-template #extraTemplate>
      <ng-content select="[nz-th-extra]"></ng-content>
      <ng-content select="nz-filter-trigger"></ng-content>
    </ng-template>
    <ng-template #sortTemplate>
      <nz-table-sorters
        [sortOrder]="sortOrder"
        [sortDirections]="sortDirections"
        [contentTemplate]="contentTemplate"
      ></nz-table-sorters>
    </ng-template>
    <ng-template #contentTemplate>
      <ng-content></ng-content>
    </ng-template>
  `,
  host: {
    '[class.ant-table-column-has-sorters]': 'nzShowSort',
    '[class.ant-table-column-sort]': `sortOrder === 'descend' || sortOrder === 'ascend'`
  },
  imports: [NzTableFilterComponent, NgTemplateOutlet, NzTableSortersComponent]
})
export class NzThAddOnComponent<T> implements OnChanges, OnInit {
  readonly _nzModuleName: NzConfigKey = NZ_CONFIG_MODULE_NAME;

  nzConfigService = inject(NzConfigService);
  private el: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  manualClickOrder$ = new Subject<NzThAddOnComponent<T>>();
  calcOperatorChange$ = new Subject<void>();
  nzFilterValue: NzTableFilterValue = null;
  sortOrder: NzTableSortOrder = null;
  sortDirections: NzTableSortOrder[] = ['ascend', 'descend', null];
  private sortOrderChange$ = new Subject<NzTableSortOrder>();
  private isNzShowSortChanged = false;
  private isNzShowFilterChanged = false;
  private _nzShowSort?: boolean;
  private _nzShowFilter?: boolean;
  @Input() nzColumnKey?: string;
  @Input() nzSortOptions: ThAddonSortOptions = {};
  @Input() nzFilterOptions: ThAddonFilterOptions = {};

  // Getters para manter compatibilidade com código existente
  get nzSortOrder(): NzTableSortOrder {
    return this.nzSortOptions.sortOrder ?? null;
  }

  get nzSortPriority(): number | boolean {
    return this.nzSortOptions.sortPriority ?? false;
  }

  get nzSortDirections(): NzTableSortOrder[] {
    if (this.nzSortOptions.sortDirections !== undefined) {
      return this.nzSortOptions.sortDirections;
    }
    const config = this.nzConfigService.getConfigForComponent(this._nzModuleName);
    if (config && Array.isArray((config as unknown as { nzSortDirections?: NzTableSortOrder[] }).nzSortDirections)) {
      return (config as unknown as { nzSortDirections?: NzTableSortOrder[] }).nzSortDirections!;
    }
    return ['ascend', 'descend', null];
  }

  get nzSortFn(): NzTableSortFn<T> | boolean | null {
    return this.nzSortOptions.sortFn ?? null;
  }

  get nzShowSort(): boolean {
    return !!(this._nzShowSort ?? this.nzSortOptions.showSort);
  }

  get nzFilters(): NzTableFilterList {
    return this.nzFilterOptions.filters ?? [];
  }

  get nzFilterFn(): NzTableFilterFn<T> | boolean | null {
    return this.nzFilterOptions.filterFn ?? null;
  }

  get nzFilterMultiple(): boolean {
    return this.nzFilterOptions.filterMultiple !== undefined ? this.nzFilterOptions.filterMultiple : true;
  }

  get nzShowFilter(): boolean {
    return !!(this._nzShowFilter ?? this.nzFilterOptions.showFilter);
  }

  get nzCustomFilter(): boolean {
    return !!this.nzFilterOptions.customFilter;
  }
  @Output() readonly nzCheckedChange = new EventEmitter<boolean>();
  @Output() readonly nzSortOrderChange = new EventEmitter<string | null>();
  @Output() readonly nzFilterChange = new EventEmitter<NzTableFilterValue>();

  getNextSortDirection(sortDirections: NzTableSortOrder[], current: NzTableSortOrder): NzTableSortOrder {
    const index = sortDirections.indexOf(current);
    if (index === sortDirections.length - 1) {
      return sortDirections[0];
    } else {
      return sortDirections[index + 1];
    }
  }

  setSortOrder(order: NzTableSortOrder): void {
    this.sortOrderChange$.next(order);
  }

  clearSortOrder(): void {
    if (this.sortOrder !== null) {
      this.setSortOrder(null);
    }
  }

  onFilterValueChange(value: NzTableFilterValue): void {
    this.nzFilterChange.emit(value);
    this.nzFilterValue = value;
    this.updateCalcOperator();
  }

  updateCalcOperator(): void {
    this.calcOperatorChange$.next();
  }

  ngOnInit(): void {
    fromEventOutsideAngular(this.el, 'click')
      .pipe(
        filter(() => this.nzShowSort),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        const nextOrder = this.getNextSortDirection(this.sortDirections, this.sortOrder!);
        this.ngZone.run(() => {
          this.setSortOrder(nextOrder);
          this.manualClickOrder$.next(this);
        });
      });

    this.sortOrderChange$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(order => {
      if (this.sortOrder !== order) {
        this.sortOrder = order;
        this.nzSortOrderChange.emit(order);
      }
      this.updateCalcOperator();
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { nzSortOptions, nzFilterOptions } = changes;

    if (nzSortOptions) {
      const current = nzSortOptions.currentValue as ThAddonSortOptions | undefined;
      const previous = nzSortOptions.previousValue as ThAddonSortOptions | undefined;

      if (current?.sortDirections && current.sortDirections.length) {
        this.sortDirections = current.sortDirections;
      } else if (
        previous?.sortDirections !== current?.sortDirections &&
        this.nzSortDirections &&
        this.nzSortDirections.length
      ) {
        this.sortDirections = this.nzSortDirections;
      }

      if (current?.sortOrder !== previous?.sortOrder && current?.sortOrder !== undefined) {
        this.sortOrder = this.nzSortOrder;
        this.setSortOrder(this.nzSortOrder);
      }

      if (current?.showSort !== previous?.showSort) {
        this.isNzShowSortChanged = true;
        if (current?.showSort !== undefined) {
          this._nzShowSort = current.showSort;
        }
      }

      const isFirstChange = (change: SimpleChange | undefined): boolean =>
        !!(change && change.firstChange && change.currentValue !== undefined);

      if (!this.isNzShowSortChanged && isFirstChange(nzSortOptions)) {
        if (current?.sortOrder !== undefined || current?.sortFn !== undefined) {
          this._nzShowSort = true;
        }
      }
    }

    if (nzFilterOptions) {
      const current = nzFilterOptions.currentValue as ThAddonFilterOptions | undefined;
      const previous = nzFilterOptions.previousValue as ThAddonFilterOptions | undefined;

      if (current?.showFilter !== previous?.showFilter) {
        this.isNzShowFilterChanged = true;
        if (current?.showFilter !== undefined) {
          this._nzShowFilter = current.showFilter;
        }
      }

      const isFirstChange = (change: SimpleChange | undefined): boolean =>
        !!(change && change.firstChange && change.currentValue !== undefined);

      if (!this.isNzShowFilterChanged && isFirstChange(nzFilterOptions)) {
        if (current?.filters !== undefined) {
          this._nzShowFilter = true;
        }
      }

      if ((current?.filters || current?.filterMultiple !== undefined) && this.nzShowFilter) {
        const listOfValue = this.nzFilters.filter(item => item.byDefault).map(item => item.value);
        this.nzFilterValue = this.nzFilterMultiple ? listOfValue : listOfValue[0] || null;
      }
    }

    if (nzSortOptions || nzFilterOptions) {
      const currentSort = nzSortOptions?.currentValue as ThAddonSortOptions | undefined;
      const currentFilter = nzFilterOptions?.currentValue as ThAddonFilterOptions | undefined;
      if (
        currentSort?.sortFn ||
        currentFilter?.filterFn ||
        currentSort?.sortPriority !== undefined ||
        currentFilter?.filters
      ) {
        this.updateCalcOperator();
      }
    }
  }
}
