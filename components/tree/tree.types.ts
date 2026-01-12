/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { TemplateRef } from '@angular/core';
import { Observable } from 'rxjs';

import {
  NzFormatBeforeDropEvent,
  NzTreeNode,
  NzTreeNodeKey,
  NzTreeNodeOptions
} from 'ng-zorro-antd/core/tree';

// Interfaces para agrupamento de inputs do componente tree
export interface TreeDisplayOptions {
  showIcon?: boolean;
  hideUnMatched?: boolean;
  blockNode?: boolean;
  showExpand?: boolean;
  showLine?: boolean;
  selectMode?: boolean;
}

export interface TreeBehaviorOptions {
  expandAll?: boolean;
  checkStrictly?: boolean;
  checkable?: boolean;
  asyncData?: boolean;
  draggable?: boolean;
  multiple?: boolean;
}

export interface TreeVirtualScrollOptions {
  virtualItemSize?: number;
  virtualMaxBufferPx?: number;
  virtualMinBufferPx?: number;
  virtualHeight?: string | null;
}

export interface TreeTemplateOptions {
  expandedIcon?: TemplateRef<{ $implicit: NzTreeNode; origin: NzTreeNodeOptions }>;
  treeTemplate?: TemplateRef<{ $implicit: NzTreeNode; origin: NzTreeNodeOptions }>;
}

export interface TreeStateOptions {
  expandedKeys?: NzTreeNodeKey[];
  selectedKeys?: NzTreeNodeKey[];
  checkedKeys?: NzTreeNodeKey[];
}

export interface TreeDataOptions {
  data?: NzTreeNodeOptions[] | NzTreeNode[];
  searchValue?: string;
  searchFunc?: (node: NzTreeNodeOptions) => boolean;
}

