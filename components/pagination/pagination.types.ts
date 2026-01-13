/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

export interface PaginationItemRenderContext {
  $implicit: PaginationItemType;
  page: number;
}

export type PaginationItemType = 'page' | 'prev' | 'next' | 'prev_5' | 'next_5';

export type NzPaginationAlign = 'start' | 'center' | 'end';

export interface PaginationState {
  total?: number;
  pageIndex?: number;
  pageSize?: number;
}

export interface PaginationDisplayOptions {
  size?: 'default' | 'small';
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  simple?: boolean;
  disabled?: boolean;
  responsive?: boolean;
  hideOnSinglePage?: boolean;
  pageSizeOptions?: number[];
}

export interface PaginationOptionsState {
  total?: number;
  pageIndex?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
}

export interface PaginationOptionsDisplay {
  size?: 'default' | 'small';
  disabled?: boolean;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
}
