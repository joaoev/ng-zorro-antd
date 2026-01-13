/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { TemplateRef } from '@angular/core';
import { NzBreakpointKey } from 'ng-zorro-antd/core/services';

// Interfaces para agrupamento de inputs do componente sider
export interface SiderDimensionsOptions {
  width?: string | number;
  collapsedWidth?: number;
}

export interface SiderCollapseOptions {
  collapsible?: boolean;
  reverseArrow?: boolean;
  breakpoint?: NzBreakpointKey | null;
}

export interface SiderTriggerOptions {
  trigger?: TemplateRef<void> | undefined | null;
  zeroTrigger?: TemplateRef<void> | null;
}

