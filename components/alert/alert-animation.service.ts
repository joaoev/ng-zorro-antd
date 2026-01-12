/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { inject, Injectable } from '@angular/core';
import { AnimationCallbackEvent, EventEmitter } from '@angular/core';

@Injectable()
export class AlertAnimationService {
  private readonly animationType = inject(ANIMATION_MODULE_TYPE, { optional: true });

  shouldEmitImmediately(noAnimation: boolean): boolean {
    return noAnimation || this.animationType === 'NoopAnimations';
  }

  handleClose(noAnimation: boolean, onClose: EventEmitter<boolean>): void {
    if (this.shouldEmitImmediately(noAnimation)) {
      onClose.emit(true);
    }
  }

  handleLeaveAnimation(event: AnimationCallbackEvent, noAnimation: boolean, onClose: EventEmitter<boolean>): void {
    if (this.shouldEmitImmediately(noAnimation)) {
      event.animationComplete();
      return;
    }

    const element = event.target as HTMLElement;
    element.classList.add('ant-alert-motion-leave', 'ant-alert-motion-leave-active');

    const onTransitionEnd = (): void => {
      element.removeEventListener('transitionend', onTransitionEnd);
      onClose.emit(true);
      event.animationComplete();
    };

    element.addEventListener('transitionend', onTransitionEnd);
  }
}
