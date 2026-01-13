/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { NzAnchorLinkComponent } from './anchor-link.component';

export interface Section {
  comp: NzAnchorLinkComponent;
  top: number;
}

export interface AnchorScrollConfig {
  offsetTop: number;
  bounds: number;
  targetOffset?: number;
  container: HTMLElement | Window;
}
