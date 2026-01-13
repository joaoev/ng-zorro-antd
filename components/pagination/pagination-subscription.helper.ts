/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { DestroyRef, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReplaySubject } from 'rxjs';
import { Direction, Directionality } from '@angular/cdk/bidi';
import { NzI18nService, NzPaginationI18nInterface } from 'ng-zorro-antd/i18n';
import { NzBreakpointEnum, NzBreakpointService, gridResponsiveMap } from 'ng-zorro-antd/core/services';

export function setupPaginationSubscriptions(
  i18n: NzI18nService,
  breakpointService: NzBreakpointService,
  directionality: Directionality,
  destroyRef: DestroyRef,
  cdr: ChangeDetectorRef,
  total$: ReplaySubject<number>,
  nzResponsive: boolean,
  setLocaleFn: (locale: NzPaginationI18nInterface) => void,
  onTotalChangeFn: (total: number) => void,
  setSizeFn: (size: 'default' | 'small') => void,
  setDirFn: (dir: Direction) => void
): void {
  i18n.localeChange.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
    setLocaleFn(i18n.getLocaleData('Pagination'));
    cdr.markForCheck();
  });

  total$.pipe(takeUntilDestroyed(destroyRef)).subscribe(total => onTotalChangeFn(total));

  breakpointService
    .subscribe(gridResponsiveMap)
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe(bp => {
      if (nzResponsive) {
        setSizeFn(bp === NzBreakpointEnum.xs ? 'small' : 'default');
        cdr.markForCheck();
      }
    });

  directionality.change?.pipe(takeUntilDestroyed(destroyRef)).subscribe(direction => {
    setDirFn(direction);
    cdr.detectChanges();
  });
  setDirFn(directionality.value);
}
