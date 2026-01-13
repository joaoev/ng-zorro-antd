/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Directive, ElementRef, inject } from '@angular/core';

/**
 * @deprecated Will be removed in v22.0.0. This component will be removed along with input-group.
 */
@Directive({
  selector: `nz-input-group[nzSuffix], nz-input-group[nzPrefix]`
})
export class NzInputGroupWhitSuffixOrPrefixDirective {
  public readonly elementRef = inject(ElementRef);
}
