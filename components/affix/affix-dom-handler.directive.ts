/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[nzAffixDomHandler]',
  exportAs: 'nzAffixDomHandler'
})
export class NzAffixDomHandlerDirective {
  constructor(private el: ElementRef<HTMLElement>) {}

  /**
   * Retorna os parâmetros necessários para cálculo de posição e estilos,
   * sem expor o DOM diretamente.
   */
  getParams(): { width: number; height: number; node: HTMLElement } {
    const native = this.el.nativeElement;
    return {
      width: native.offsetWidth,
      height: native.offsetHeight,
      node: native
    };
  }
}
