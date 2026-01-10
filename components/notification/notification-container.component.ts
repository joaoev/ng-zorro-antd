/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Direction } from '@angular/cdk/bidi';
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';

import { NotificationConfig, onConfigChangeEventForComponent } from 'ng-zorro-antd/core/config';
import { toCssPixel } from 'ng-zorro-antd/core/util';
import { NzMNContainerComponent } from 'ng-zorro-antd/message';

import { NzNotificationComponent } from './notification.component';
import { NzNotificationData, NzNotificationDataOptions, NzNotificationPlacement } from './typings';

const NZ_CONFIG_MODULE_NAME = 'notification';

const NZ_NOTIFICATION_DEFAULT_CONFIG: Required<NotificationConfig> = {
  nzTop: '24px',
  nzBottom: '24px',
  nzPlacement: 'topRight',
  nzDuration: 4500,
  nzMaxStack: 8,
  nzPauseOnHover: true,
  nzAnimate: true,
  nzDirection: 'ltr'
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'nz-notification-container',
  exportAs: 'nzNotificationContainer',
  templateUrl: './notification-container.component.html',
  imports: [NzNotificationComponent]
})
export class NzNotificationContainerComponent extends NzMNContainerComponent<NotificationConfig, NzNotificationData> {
  dir: Direction = this.nzConfigService.getConfigForComponent(NZ_CONFIG_MODULE_NAME)?.nzDirection || 'ltr';
  bottom?: string | null;
  top?: string | null;
  topLeftInstances: Array<Required<NzNotificationData>> = [];
  topRightInstances: Array<Required<NzNotificationData>> = [];
  bottomLeftInstances: Array<Required<NzNotificationData>> = [];
  bottomRightInstances: Array<Required<NzNotificationData>> = [];
  topInstances: Array<Required<NzNotificationData>> = [];
  bottomInstances: Array<Required<NzNotificationData>> = [];

  constructor() {
    super();
    this.updateConfig();
  }

  override create(notification: NzNotificationData): Required<NzNotificationData> {
    const instance = this.onCreate(notification);
    const key = instance.options.nzKey;
    const notificationWithSameKey = this.instances.find(
      msg => msg.options.nzKey === (notification.options as Required<NzNotificationDataOptions>).nzKey
    );
    if (key && notificationWithSameKey) {
      this.replaceNotification(notificationWithSameKey, instance);
    } else {
      if (this.instances.length >= this.config!.nzMaxStack) {
        this.instances = this.instances.slice(1);
      }
      this.instances = [...this.instances, instance];
    }

    this.readyInstances();

    return instance;
  }

  protected override onCreate(instance: NzNotificationData): Required<NzNotificationData> {
    instance.options = this.mergeOptions(instance.options);
    instance.onClose = new Subject<boolean>();
    instance.onClick = new Subject<MouseEvent>();
    return instance as Required<NzNotificationData>;
  }

  protected subscribeConfigChange(): void {
    onConfigChangeEventForComponent(NZ_CONFIG_MODULE_NAME, () => {
      this.updateConfig();
      this.dir = this.nzConfigService.getConfigForComponent(NZ_CONFIG_MODULE_NAME)?.nzDirection || this.dir;
    });
  }

  protected updateConfig(): void {
    this.config = {
      ...NZ_NOTIFICATION_DEFAULT_CONFIG,
      ...this.config,
      ...this.nzConfigService.getConfigForComponent(NZ_CONFIG_MODULE_NAME)
    };

    this.top = toCssPixel(this.config.nzTop!);
    this.bottom = toCssPixel(this.config.nzBottom!);

    this.cdr.markForCheck();
  }

  private replaceNotification(old: NzNotificationData, _new: NzNotificationData): void {
    old.title = _new.title;
    old.content = _new.content;
    old.template = _new.template;
    old.type = _new.type;
    old.options = _new.options;
  }

  protected override readyInstances(): void {
    const instancesMap = this.createInstancesMap();
    this.instances.forEach(m => this.addInstanceToMap(instancesMap, m));
    this.assignInstancesToProperties(instancesMap);
    this.cdr.detectChanges();
  }

  private createInstancesMap(): Record<NzNotificationPlacement, Array<Required<NzNotificationData>>> {
    return {
      topLeft: [],
      topRight: [],
      bottomLeft: [],
      bottomRight: [],
      top: [],
      bottom: []
    };
  }

  private addInstanceToMap(
    instancesMap: Record<NzNotificationPlacement, Array<Required<NzNotificationData>>>,
    instance: Required<NzNotificationData>
  ): void {
    const placement = instance.options.nzPlacement || 'topRight';
    instancesMap[placement].unshift(instance);
  }

  private assignInstancesToProperties(
    instancesMap: Record<NzNotificationPlacement, Array<Required<NzNotificationData>>>
  ): void {
    this.topLeftInstances = instancesMap.topLeft;
    this.topRightInstances = instancesMap.topRight;
    this.bottomLeftInstances = instancesMap.bottomLeft;
    this.bottomRightInstances = instancesMap.bottomRight;
    this.topInstances = instancesMap.top;
    this.bottomInstances = instancesMap.bottom;
  }

  protected override mergeOptions(options?: NzNotificationDataOptions): NzNotificationDataOptions {
    const { nzDuration, nzAnimate, nzPauseOnHover, nzPlacement } = this.config!;
    return { nzDuration, nzAnimate, nzPauseOnHover, nzPlacement, ...options };
  }
}
