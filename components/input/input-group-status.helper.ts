/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { NgClassInterface, NzValidateStatus } from 'ng-zorro-antd/core/types';
import { getStatusClassNames } from 'ng-zorro-antd/core/util';
import { Renderer2, ElementRef } from '@angular/core';

export function setStatusStyles(
  status: NzValidateStatus,
  hasFeedback: boolean,
  nzSuffix: string | TemplateRef<void> | undefined,
  nzPrefix: string | TemplateRef<void> | undefined,
  nzPrefixIcon: string | null | undefined,
  nzSuffixIcon: string | null | undefined,
  isAddOn: boolean,
  prefixCls: string,
  renderer: Renderer2,
  elementRef: ElementRef
): {
  status: NzValidateStatus;
  hasFeedback: boolean;
  isFeedback: boolean;
  isAffix: boolean;
  affixInGroupStatusCls: NgClassInterface;
  affixStatusCls: NgClassInterface;
  groupStatusCls: NgClassInterface;
} {
  const isFeedback = !!status && hasFeedback;
  const baseAffix = !!(nzSuffix || nzPrefix || nzPrefixIcon || nzSuffixIcon);
  const isAffix = baseAffix || (!isAddOn && hasFeedback);
  const affixInGroupStatusCls = isAffix || isFeedback ? getStatusClassNames(`${prefixCls}-affix-wrapper`, status, hasFeedback) : {};
  const affixStatusCls = getStatusClassNames(`${prefixCls}-affix-wrapper`, isAddOn ? '' : status, isAddOn ? false : hasFeedback);
  const groupStatusCls = getStatusClassNames(`${prefixCls}-group-wrapper`, isAddOn ? status : '', isAddOn ? hasFeedback : false);
  const statusCls = { ...affixStatusCls, ...groupStatusCls };
  Object.keys(statusCls).forEach(key => {
    if (statusCls[key]) renderer.addClass(elementRef.nativeElement, key);
    else renderer.removeClass(elementRef.nativeElement, key);
  });
  return { status, hasFeedback, isFeedback, isAffix, affixInGroupStatusCls, affixStatusCls, groupStatusCls };
}
