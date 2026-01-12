/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { TemplateRef } from '@angular/core';

export type NzCalendarDateTemplate = TemplateRef<{ $implicit: Date }>;

export function getTemplate(input?: NzCalendarDateTemplate, child?: NzCalendarDateTemplate): NzCalendarDateTemplate {
  return (input || child)!;
}
