/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { normalizePassiveListenerOptions } from '@angular/cdk/platform';

import { NzConfigKey } from 'ng-zorro-antd/core/config';

export const VISIBLE_CLASSNAME = 'ant-anchor-ink-ball-visible';
export const NZ_ANCHOR_CONFIG_MODULE_NAME: NzConfigKey = 'anchor';
export const SHARP_MATCHER_REGEX = /#([^#]+)$/;
export const PASSIVE_EVENT_LISTENER_OPTIONS = normalizePassiveListenerOptions({ passive: true });
export const SCROLL_THROTTLE_TIME = 50;
