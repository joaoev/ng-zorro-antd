/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Platform } from '@angular/cdk/platform';
import { normalizePassiveListenerOptions } from '@angular/cdk/platform';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { NzScrollService } from 'ng-zorro-antd/core/services';
import { fromEventOutsideAngular } from 'ng-zorro-antd/core/util';

const passiveEventListenerOptions = normalizePassiveListenerOptions({ passive: true });

export function handleScroll(
  platform: Platform,
  scrollSrv: NzScrollService,
  getTarget: () => HTMLElement | Window,
  visibilityHeight: () => number,
  visible: { update: (fn: (v: boolean) => boolean) => void; (): boolean }
): void {
  if (
    !platform.isBrowser ||
    visible() === scrollSrv.getScroll(getTarget()) > visibilityHeight()
  ) {
    return;
  }
  visible.update(v => !v);
}

export function registerScrollEvent(
  platform: Platform,
  scrollSrv: NzScrollService,
  getTarget: () => HTMLElement | Window,
  scrollListenerDestroy$: Subject<void>,
  handleScrollFn: () => void
): void {
  if (!platform.isBrowser) return;
  scrollListenerDestroy$.next();
  handleScrollFn();
  fromEventOutsideAngular(getTarget(), 'scroll', passiveEventListenerOptions as AddEventListenerOptions)
    .pipe(debounceTime(50), takeUntil(scrollListenerDestroy$))
    .subscribe(() => handleScrollFn());
}
