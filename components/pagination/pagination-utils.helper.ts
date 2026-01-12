/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

export function validatePageIndex(value: number, lastIndex: number): number {
  if (value > lastIndex) return lastIndex;
  else if (value < 1) return 1;
  else return value;
}

export function getLastIndex(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}
