/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { DestroyRef, QueryList, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { map, mergeMap, startWith, switchMap } from 'rxjs/operators';

import { NzInputDirective } from './input.directive';

export function setupInputGroupContentInit(
  listOfNzInputDirective: QueryList<NzInputDirective>,
  destroyRef: DestroyRef,
  cdr: ChangeDetectorRef,
  setDisabledFn: (disabled: boolean) => void
): void {
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
