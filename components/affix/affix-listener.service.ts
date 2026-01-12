/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { DOCUMENT, DestroyRef } from '@angular/core';
import { inject, Injectable, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, merge, ReplaySubject, Subscription } from 'rxjs';
import { map, throttleTime } from 'rxjs/operators';

import { NzResizeObserver } from 'ng-zorro-antd/cdk/resize-observer';
import { Platform } from '@angular/cdk/platform';

import { AffixRespondEvents } from './respond-events';

const NZ_AFFIX_DEFAULT_SCROLL_TIME = 20;
const NOOP_EVENT = {} as Event;

@Injectable()
export class AffixListenerService {
  private readonly ngZone = inject(NgZone);
  private readonly platform = inject(Platform);
  private readonly nzResizeObserver = inject(NzResizeObserver);
  private readonly document = inject(DOCUMENT);

  private positionChangeSubscription = Subscription.EMPTY;
  private offsetChanged$ = new ReplaySubject<void>(1);
  private timeout?: ReturnType<typeof setTimeout>;

  registerListeners(
    target: Element | Window,
    destroyRef: DestroyRef,
    onPositionChange: (e: Event) => void
  ): void {
    if (!this.platform.isBrowser) {
      return;
    }

    this.removeListeners();
    const el = target === window ? this.document.body : (target as Element);
    this.positionChangeSubscription = this.ngZone.runOutsideAngular(() =>
      merge(
        ...Object.keys(AffixRespondEvents).map(evName => fromEvent(target, evName)),
        this.offsetChanged$.pipe(map(() => NOOP_EVENT)),
        this.nzResizeObserver.observe(el)
      )
        .pipe(
          throttleTime(NZ_AFFIX_DEFAULT_SCROLL_TIME, undefined, { trailing: true }),
          takeUntilDestroyed(destroyRef)
        )
        .subscribe(e => onPositionChange(e as Event))
    );
    this.timeout = setTimeout(() => onPositionChange(NOOP_EVENT));
  }

  removeListeners(): void {
    clearTimeout(this.timeout);
    this.positionChangeSubscription.unsubscribe();
  }

  notifyOffsetChanged(): void {
    this.offsetChanged$.next();
  }
}
