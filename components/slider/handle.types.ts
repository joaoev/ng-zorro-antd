/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Direction } from '@angular/cdk/bidi';
import { TemplateRef } from '@angular/core';
import { NzSliderShowTooltip } from './typings';

// Interfaces para agrupamento de inputs do componente slider-handle
export interface HandlePositionOptions {
  vertical?: boolean;
  reverse?: boolean;
  offset?: number;
  value?: number;
  dir?: Direction;
}

export interface HandleTooltipOptions {
  tooltipVisible?: NzSliderShowTooltip;
  tooltipPlacement?: string;
  tooltipFormatter?: null | ((value: number) => string) | TemplateRef<void>;
}

export interface HandleStateOptions {
  active?: boolean;
  dragging?: boolean;
}

