/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { TemplateRef } from '@angular/core';

export type ColumnCount = 1 | 2 | 3 | 4 | 6 | 8 | 12 | 24;

export interface NzListGrid {
  gutter?: number;
  span?: number;
  column?: ColumnCount;
  xs?: ColumnCount;
  sm?: ColumnCount;
  md?: ColumnCount;
  lg?: ColumnCount;
  xl?: ColumnCount;
  xxl?: ColumnCount;
}

// Interfaces para agrupamento de inputs do componente list
export interface ListDisplayOptions {
  bordered?: boolean;
  size?: 'large' | 'small' | 'default';
  split?: boolean;
  itemLayout?: 'vertical' | 'horizontal';
  loading?: boolean;
}

export interface ListContentOptions {
  header?: string | TemplateRef<void>;
  footer?: string | TemplateRef<void>;
  loadMore?: TemplateRef<void> | null;
  pagination?: TemplateRef<void>;
  noResult?: string | TemplateRef<void>;
}
