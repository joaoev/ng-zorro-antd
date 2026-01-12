/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { DOCUMENT } from '@angular/core';
import { inject, Injectable } from '@angular/core';

import { NzScrollService } from 'ng-zorro-antd/core/services';
import { NgStyleInterface } from 'ng-zorro-antd/core/types';

import { SimpleRect } from './utils';

export interface PositionCalculationResult {
  affixStyle?: NgStyleInterface;
  placeholderStyle?: NgStyleInterface;
}

export interface AffixPositionParams {
  target: Element | Window;
  placeholderNode: HTMLElement;
  fixedNode: HTMLElement;
  offsetTop?: null | number;
  offsetBottom?: null | number;
  scrollTop: number;
}

@Injectable()
export class AffixPositionService {
  private readonly scrollSrv = inject(NzScrollService);
  private readonly document = inject(DOCUMENT);

  getOffset(element: Element, target: Element | Window | undefined): SimpleRect {
    const elemRect = element.getBoundingClientRect();
    const targetRect = this.getTargetRect(target!);

    const scrollTop = this.scrollSrv.getScroll(target, true);
    const scrollLeft = this.scrollSrv.getScroll(target, false);

    const docElem = this.document.body;
    const clientTop = docElem.clientTop || 0;
    const clientLeft = docElem.clientLeft || 0;

    return {
      top: elemRect.top - targetRect.top + scrollTop - clientTop,
      left: elemRect.left - targetRect.left + scrollLeft - clientLeft,
      width: elemRect.width,
      height: elemRect.height
    };
  }

  calculatePosition(params: AffixPositionParams, e: Event): PositionCalculationResult {
    const { target, placeholderNode, fixedNode, offsetTop, offsetBottom, scrollTop } = params;

    const elemOffset = this.getOffset(placeholderNode, target!);
    const elemSize = {
      width: fixedNode.offsetWidth,
      height: fixedNode.offsetHeight
    };

    const offsetMode = this.getOffsetMode(offsetTop, offsetBottom);
    const adjustedOffsetTop = offsetMode.top ? (offsetTop ?? 0) : undefined;

    const targetRect = this.getTargetRect(target);
    const targetInnerHeight = (target as Window).innerHeight || (target as HTMLElement).clientHeight;

    if (scrollTop >= elemOffset.top - adjustedOffsetTop! && offsetMode.top) {
      return this.calculateTopPosition(targetRect, elemOffset, adjustedOffsetTop!, elemSize);
    }

    if (
      scrollTop <= elemOffset.top + elemSize.height + (offsetBottom as number) - targetInnerHeight &&
      offsetMode.bottom
    ) {
      return this.calculateBottomPosition(target, targetRect, elemOffset, offsetBottom as number);
    }

    return this.calculateDefaultPosition(e, placeholderNode, fixedNode);
  }

  private getOffsetMode(
    offsetTop?: null | number,
    offsetBottom?: null | number
  ): { top: boolean; bottom: boolean } {
    if (typeof offsetTop !== 'number' && typeof offsetBottom !== 'number') {
      return { top: true, bottom: false };
    }
    return {
      top: typeof offsetTop === 'number',
      bottom: typeof offsetBottom === 'number'
    };
  }

  private calculateTopPosition(
    targetRect: SimpleRect,
    elemOffset: SimpleRect,
    offsetTop: number,
    elemSize: { width: number; height: number }
  ): PositionCalculationResult {
    const width = elemOffset.width;
    const top = targetRect.top + offsetTop;
    return {
      affixStyle: {
        position: 'fixed',
        top,
        left: targetRect.left + elemOffset.left,
        width
      },
      placeholderStyle: {
        width,
        height: elemSize.height
      }
    };
  }

  private calculateBottomPosition(
    target: Element | Window,
    targetRect: SimpleRect,
    elemOffset: SimpleRect,
    offsetBottom: number
  ): PositionCalculationResult {
    const targetBottomOffset = target === window ? 0 : window.innerHeight - targetRect.bottom!;
    const width = elemOffset.width;
    return {
      affixStyle: {
        position: 'fixed',
        bottom: targetBottomOffset + offsetBottom,
        left: targetRect.left + elemOffset.left,
        width
      },
      placeholderStyle: {
        width,
        height: elemOffset.height
      }
    };
  }

  private calculateDefaultPosition(
    e: Event,
    placeholderNode: HTMLElement,
    fixedNode: HTMLElement
  ): PositionCalculationResult {
    // This will be handled by the component to check for resize events
    return {};
  }

  private getTargetRect(target: Element | Window): SimpleRect {
    return target !== window
      ? (target as Element).getBoundingClientRect()
      : {
          top: 0,
          left: 0,
          bottom: 0
        };
  }
}
