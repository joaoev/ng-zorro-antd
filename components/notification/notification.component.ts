/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  viewChild,
  ViewEncapsulation
} from '@angular/core';

import { NzOutletModule } from 'ng-zorro-antd/core/outlet';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMNComponent } from 'ng-zorro-antd/message';

import { NzNotificationData } from './typings';

@Component({
  selector: 'nz-notification',
  exportAs: 'nzNotification',
  imports: [NzIconModule, NzOutletModule, NgTemplateOutlet],
  templateUrl: './notification.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NzNotificationComponent extends NzMNComponent {
  @Input() instance!: Required<NzNotificationData>;
  @Input() index!: number;
  @Input() placement?: string;
  @Output() readonly destroyed = new EventEmitter<{ id: string; userAction: boolean }>();

  readonly animationElement = viewChild.required('animationElement', { read: ElementRef });
  protected readonly _animationKeyframeMap = {
    enter: [
      'antNotificationFadeIn',
      'antNotificationTopFadeIn',
      'antNotificationBottomFadeIn',
      'antNotificationLeftFadeIn'
    ],
    leave: 'antNotificationFadeOut'
  };
  protected readonly _animationClassMap = {
    enter: 'ant-notification-fade-enter',
    leave: 'ant-notification-fade-leave'
  };

  constructor() {
    super();
    this.destroyRef.onDestroy(() => {
      this.instance.onClick.complete();
    });
  }

  onClick = (event: MouseEvent): void => { this.instance.onClick.next(event); };
  close = (): void => { this.destroy(true); };
}
