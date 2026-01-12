/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

export interface AutocompleteDataSourceItem {
  value: string;
  label: string;
}

export type AutocompleteDataSource = Array<AutocompleteDataSourceItem | string | number>;

export function normalizeDataSource(value: AutocompleteDataSource): AutocompleteDataSourceItem[] {
  return value?.map(item => {
    if (typeof item === 'number' || typeof item === 'string') {
      return {
        label: item.toString(),
        value: item.toString()
      };
    }
    return item;
  });
}
