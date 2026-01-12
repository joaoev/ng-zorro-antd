/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Directionality } from '@angular/cdk/bidi';
import { Platform } from '@angular/cdk/platform';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  NgZone,
  numberAttribute,
  OnInit,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription } from 'rxjs';

import { withAnimationCheck } from 'ng-zorro-antd/core/animation';
import { withConfigFactory } from 'ng-zorro-antd/core/config';
import { NzScrollService } from 'ng-zorro-antd/core/services';
import { NzShapeSCType } from 'ng-zorro-antd/core/types';
import { fromEventOutsideAngular, generateClassName } from 'ng-zorro-antd/core/util';

import { NzFloatButtonComponent } from './float-button.component';
import { NzFloatButtonBadge, NzFloatButtonType } from './typings';
import { handleScroll, registerScrollEvent } from './float-button-top-scroll.helper';

const withConfig = withConfigFactory('floatButton');
const CLASS_NAME = 'ant-float-btn';

@Component({
  selector: 'nz-float-button-top',
  exportAs: 'nzFloatButtonTop',
  imports: [NzFloatButtonComponent],
  templateUrl: './float-button-top.component.html',
  host: {
    '[class]': 'class()'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NzFloatButtonTopComponent implements OnInit {
  private readonly scrollSrv = inject(NzScrollService);
  private readonly platform = inject(Platform);
  private readonly ngZone = inject(NgZone);
  private readonly directionality = inject(Directionality);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  readonly backTop = viewChild('backTop', { read: ElementRef });

  readonly nzVisibilityHeight = input<number>();
  readonly nzHref = input<string | null>(null);
  readonly nzType = input<NzFloatButtonType>('default');
  readonly nzShape = input<NzShapeSCType>('circle');
  readonly nzIcon = input<string | TemplateRef<void> | null>(null);
  readonly nzDescription = input<TemplateRef<void> | null>(null);
  readonly nzTemplate = input<TemplateRef<void> | null>(null);
  readonly nzTarget = input<string | HTMLElement | null>(null);
  readonly nzDuration = input(450, { transform: numberAttribute });
  readonly nzBadge = input<NzFloatButtonBadge | null>(null);
  readonly nzOnClick = output<boolean>();

  protected readonly visible = signal<boolean>(false);
  // compact global config
  private readonly visibilityHeight = withConfig('nzVisibilityHeight', this.nzVisibilityHeight, 400);
  readonly shape = linkedSignal(() => this.nzShape());
  protected readonly class = computed<string[]>(() => {
    const dir = this.directionality.valueSignal();
    const classes = [CLASS_NAME, `${CLASS_NAME}-top`, this.generateClass(this.shape())];
    if (dir === 'rtl') classes.push(this.generateClass(dir));
    return classes;
  });

  protected readonly fadeAnimationEnter = withAnimationCheck(() => `${CLASS_NAME}-top-motion-enter`);
  protected readonly fadeAnimationLeave = withAnimationCheck(() => `${CLASS_NAME}-top-motion-leave`);

  private target?: HTMLElement | null = null;
  private backTopClickSubscription = Subscription.EMPTY;
  private scrollListenerDestroy$ = new Subject<void>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.scrollListenerDestroy$.next();
      this.scrollListenerDestroy$.complete();
    });
    effect(() => {
      const target = this.nzTarget();
      if (target) {
        this.target = typeof target === 'string' ? this.document.querySelector(target) : target;
        this.registerScrollEvent();
      }
    });
    effect(onCleanup => {
      const backTop = this.backTop();
      if (backTop) {
        this.backTopClickSubscription.unsubscribe();
        this.backTopClickSubscription = fromEventOutsideAngular(backTop.nativeElement, 'click')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.scrollSrv.scrollTo(this.getTarget(), 0, { duration: this.nzDuration() });
            this.ngZone.run(() => this.nzOnClick.emit(true));
          });
      }
      return onCleanup(() => this.backTopClickSubscription.unsubscribe());
    });
    effect(() => {
      this.visibilityHeight();
      untracked(() => this.handleScroll());
    });
  }

  ngOnInit(): void {
    this.registerScrollEvent();
  }

  private getTarget(): HTMLElement | Window {
    return this.target || window;
  }

  private handleScroll(): void {
    handleScroll(
      this.platform,
      this.scrollSrv,
      () => this.getTarget(),
      () => this.visibilityHeight(),
      this.visible
    );
  }

  private registerScrollEvent(): void {
    registerScrollEvent(
      this.platform,
      this.scrollSrv,
      () => this.getTarget(),
      this.scrollListenerDestroy$,
      () => this.handleScroll()
    );
  }

  private generateClass(suffix: string): string {
    return generateClassName(CLASS_NAME, suffix);
  }
}
