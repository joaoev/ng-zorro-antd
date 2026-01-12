/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import {
  NzTableFilterFn,
  NzTableFilterList,
  NzTableFilterValue,
  NzTableSortFn,
  NzTableSortOrder
} from '../table.types';

// Interfaces para agrupamento de inputs do componente th-addon
export interface ThAddonSortOptions {
  sortOrder?: NzTableSortOrder;
  sortPriority?: number | boolean;
  sortDirections?: NzTableSortOrder[];
  sortFn?: NzTableSortFn<any> | boolean | null;
  showSort?: boolean;
}

export interface ThAddonFilterOptions {
  filters?: NzTableFilterList;
  filterFn?: NzTableFilterFn<any> | boolean | null;
  filterMultiple?: boolean;
  showFilter?: boolean;
  customFilter?: boolean;
}

