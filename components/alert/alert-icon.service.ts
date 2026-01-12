/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Injectable } from '@angular/core';

export type NzAlertType = 'success' | 'info' | 'warning' | 'error';

export interface AlertIconConfig {
  iconType: string;
  iconTheme: 'outline' | 'fill';
}

@Injectable()
export class AlertIconService {
  private readonly iconTypeMap: Record<NzAlertType, string> = {
    error: 'close-circle',
    success: 'check-circle',
    info: 'info-circle',
    warning: 'exclamation-circle'
  };

  getIconConfig(type: NzAlertType, hasDescription: boolean): AlertIconConfig {
    return {
      iconType: this.iconTypeMap[type] || 'info-circle',
      iconTheme: hasDescription ? 'outline' : 'fill'
    };
  }

  getIconType(type: NzAlertType): string {
    return this.iconTypeMap[type] || 'info-circle';
  }

  getIconTheme(hasDescription: boolean): 'outline' | 'fill' {
    return hasDescription ? 'outline' : 'fill';
  }
}
