/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { NzTSType } from 'ng-zorro-antd/core/types';

// Interfaces para agrupamento de inputs do componente typography
export interface TypographyBehaviorOptions {
  copyable?: boolean;
  editable?: boolean;
  expandable?: boolean;
  ellipsis?: boolean;
  disabled?: boolean;
}

export interface TypographyCopyOptions {
  copyTooltips?: [NzTSType, NzTSType] | null;
  copyIcons?: [NzTSType, NzTSType];
  copyText?: string;
}

export interface TypographyEditOptions {
  editTooltip?: null | NzTSType;
  editIcon?: NzTSType;
}

export interface TypographyEllipsisOptions {
  ellipsisRows?: number;
  suffix?: string;
}

