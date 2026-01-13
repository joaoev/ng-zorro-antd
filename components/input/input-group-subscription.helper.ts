/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { FocusMonitor } from '@angular/cdk/a11y';
import { Direction, Directionality } from '@angular/cdk/bidi';
import { DestroyRef, ElementRef, QueryList, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { distinctUntilChanged, map, mergeMap, startWith, switchMap } from 'rxjs/operators';

import { NzFormStatusService } from 'ng-zorro-antd/core/form';

import { NzInputDirective } from './input.directive';

export function setupInputGroupSubscriptions(
  listOfNzInputDirective: QueryList<NzInputDirective>,
  nzFormStatusService: NzFormStatusService | null,
  focusMonitor: FocusMonitor,
  elementRef: ElementRef,
  directionality: Directionality,
  destroyRef: DestroyRef,
  cdr: ChangeDetectorRef,
  setStatusStylesFn: (status: string, hasFeedback: boolean) => void,
  setFocusedFn: (focused: boolean) => void,
  setDisabledFn: (disabled: boolean) => void,
  setDirFn: (dir: Direction) => void
): void {
  nzFormStatusService?.formStatusChanges
    .pipe(
      distinctUntilChanged((pre, cur) => pre.status === cur.status && pre.hasFeedback === cur.hasFeedback),
      takeUntilDestroyed(destroyRef)
    )
    .subscribe(({ status, hasFeedback }) => setStatusStylesFn(status, hasFeedback));

  focusMonitor
    .monitor(elementRef, true)
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe(focusOrigin => {
      setFocusedFn(!!focusOrigin);
      cdr.markForCheck();
    });

  setDirFn(directionality.value);
  directionality.change?.pipe(takeUntilDestroyed(destroyRef)).subscribe(direction => setDirFn(direction));

  const listOfInputChange$ = listOfNzInputDirective.changes.pipe(startWith(listOfNzInputDirective));
  listOfInputChange$
    .pipe(
      switchMap(list => merge(...[listOfInputChange$, ...list.map((input: NzInputDirective) => input.disabled$)])),
      mergeMap(() => listOfInputChange$),
      map(list => list.some((input: NzInputDirective) => input.finalDisabled())),
      takeUntilDestroyed(destroyRef)
    )
    .subscribe(disabled => {
      setDisabledFn(disabled);
      cdr.markForCheck();
    });
}
