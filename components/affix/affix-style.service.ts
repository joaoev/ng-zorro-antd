/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Directionality } from '@angular/cdk/bidi';
import { inject, Injectable, Renderer2 } from '@angular/core';

import { NgStyleInterface } from 'ng-zorro-antd/core/types';
import { getStyleAsText, shallowEqual } from 'ng-zorro-antd/core/util';

const NZ_AFFIX_CLS_PREFIX = 'ant-affix';

@Injectable()
export class AffixStyleService {
  private readonly renderer = inject(Renderer2);
  private readonly directionality = inject(Directionality);

  private affixStyle?: NgStyleInterface;
  private placeholderStyle?: NgStyleInterface;

  setAffixStyle(
    wrapEl: HTMLElement,
    e: Event,
    affixStyle?: NgStyleInterface,
    isWindowTarget: boolean = false
  ): boolean {
    const originalAffixStyle = this.affixStyle;
    if (e.type === 'scroll' && originalAffixStyle && affixStyle && isWindowTarget) {
      return false;
    }

    if (shallowEqual(originalAffixStyle, affixStyle)) {
      return false;
    }

    const fixed = !!affixStyle;
    this.renderer.setStyle(wrapEl, 'cssText', getStyleAsText(affixStyle));
    this.affixStyle = affixStyle;

    if (fixed) {
      wrapEl.classList.add(NZ_AFFIX_CLS_PREFIX);
    } else {
      wrapEl.classList.remove(NZ_AFFIX_CLS_PREFIX);
    }

    this.updateRtlClass(wrapEl);
    return (affixStyle && !originalAffixStyle) || (!affixStyle && originalAffixStyle);
  }

  setPlaceholderStyle(placeholderNode: HTMLElement, placeholderStyle?: NgStyleInterface): void {
    const originalPlaceholderStyle = this.placeholderStyle;
    if (shallowEqual(placeholderStyle, originalPlaceholderStyle)) {
      return;
    }

    this.renderer.setStyle(placeholderNode, 'cssText', getStyleAsText(placeholderStyle));
    this.placeholderStyle = placeholderStyle;
  }

  syncPlaceholderStyle(
    placeholderNode: HTMLElement,
    fixedEl: HTMLElement,
    e: Event
  ): NgStyleInterface | undefined {
    if (!this.affixStyle) {
      return undefined;
    }

    this.renderer.setStyle(placeholderNode, 'cssText', '');
    this.placeholderStyle = undefined;

    const styleObj = {
      width: placeholderNode.offsetWidth,
      height: fixedEl.offsetHeight
    };

    return {
      ...this.affixStyle,
      ...styleObj
    };
  }

  clearStyles(): void {
    this.affixStyle = undefined;
    this.placeholderStyle = undefined;
  }

  getAffixStyle(): NgStyleInterface | undefined {
    return this.affixStyle;
  }

  private updateRtlClass(wrapEl: HTMLElement): void {
    if (this.directionality.valueSignal() === 'rtl' && wrapEl.classList.contains(NZ_AFFIX_CLS_PREFIX)) {
      wrapEl.classList.add(`${NZ_AFFIX_CLS_PREFIX}-rtl`);
    } else {
      wrapEl.classList.remove(`${NZ_AFFIX_CLS_PREFIX}-rtl`);
    }
  }
}
