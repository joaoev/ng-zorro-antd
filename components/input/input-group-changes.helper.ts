/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { SimpleChanges, QueryList, TemplateRef } from '@angular/core';

import { NzFormNoStatusService } from 'ng-zorro-antd/core/form';
import { NzValidateStatus, NzSizeLDSType } from 'ng-zorro-antd/core/types';

import { NzInputDirective } from './input.directive';

export function handleInputGroupChanges(
  changes: SimpleChanges,
  nzSize: NzSizeLDSType,
  nzSuffix: string | TemplateRef<void> | undefined,
  nzPrefix: string | TemplateRef<void> | undefined,
  nzPrefixIcon: string | null | undefined,
  nzSuffixIcon: string | null | undefined,
  nzAddOnAfter: string | TemplateRef<void> | undefined,
  nzAddOnBefore: string | TemplateRef<void> | undefined,
  nzAddOnAfterIcon: string | null | undefined,
  nzAddOnBeforeIcon: string | null | undefined,
  nzStatus: NzValidateStatus | undefined,
  listOfNzInputDirective: QueryList<NzInputDirective>,
  nzFormNoStatusService: NzFormNoStatusService | null,
  setStatusStylesFn: (status: NzValidateStatus | undefined, hasFeedback: boolean) => void,
  hasFeedback: boolean
): {
  isLarge: boolean;
  isSmall: boolean;
  isAffix: boolean;
  isAddOn: boolean;
} {
  const {
    nzSize: nzSizeChange,
    nzSuffix: _nzSuffixChange,
    nzPrefix: _nzPrefixChange,
    nzPrefixIcon: _nzPrefixIconChange,
    nzSuffixIcon: _nzSuffixIconChange,
    nzAddOnAfter: _nzAddOnAfterChange,
    nzAddOnBefore: _nzAddOnBeforeChange,
    nzAddOnAfterIcon: _nzAddOnAfterIconChange,
    nzAddOnBeforeIcon: _nzAddOnBeforeIconChange,
    nzStatus: nzStatusChange
  } = changes;
  let isLarge = false;
  let isSmall = false;
  let isAffix = false;
  let isAddOn = false;

  if (nzSizeChange) {
    if (listOfNzInputDirective) listOfNzInputDirective.forEach(item => item['size'].set(nzSize));
    isLarge = nzSize === 'large';
    isSmall = nzSize === 'small';
  }
  if (nzSuffix || nzPrefix || nzPrefixIcon || nzSuffixIcon) {
    isAffix = !!(nzSuffix || nzPrefix || nzPrefixIcon || nzSuffixIcon);
  }
  if (nzAddOnAfter || nzAddOnBefore || nzAddOnAfterIcon || nzAddOnBeforeIcon) {
    isAddOn = !!(nzAddOnAfter || nzAddOnBefore || nzAddOnAfterIcon || nzAddOnBeforeIcon);
    nzFormNoStatusService?.noFormStatus?.next(isAddOn);
  }
  if (nzStatusChange) {
    setStatusStylesFn(nzStatus, hasFeedback);
  }

  return { isLarge, isSmall, isAffix, isAddOn };
}
