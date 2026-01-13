/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { ElementRef } from '@angular/core';
import { fromEventOutsideAngular } from 'ng-zorro-antd/core/util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export function setupClickHandler(
  elementRef: ElementRef<HTMLElement>,
  disabled: boolean,
  loading: boolean,
  destroyRef: any
): void {
  fromEventOutsideAngular<MouseEvent>(elementRef.nativeElement, 'click', { capture: true })
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe(event => {
      if ((disabled && (event.target as HTMLElement)?.tagName === 'A') || loading) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    });
}
