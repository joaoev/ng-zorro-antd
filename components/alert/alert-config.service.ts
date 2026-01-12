/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Injectable } from '@angular/core';

import { NzAlertType } from './alert-icon.service';

export interface AlertConfigUpdate {
  type?: NzAlertType;
  showIcon?: boolean;
}

@Injectable()
export class AlertConfigService {
  handleBannerConfig(
    isBanner: boolean,
    typeWasSet: boolean,
    showIconWasSet: boolean
  ): AlertConfigUpdate {
    if (!isBanner) {
      return {};
    }

    const update: AlertConfigUpdate = {};
    if (!typeWasSet) {
      update.type = 'warning';
    }
    if (!showIconWasSet) {
      update.showIcon = true;
    }
    return update;
  }
}
