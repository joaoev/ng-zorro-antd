/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';

import { collapseMotion, NzNoAnimationDirective } from 'ng-zorro-antd/core/animation';
import { NzConfigKey, onConfigChangeEventForComponent, WithConfig } from 'ng-zorro-antd/core/config';
import { NzOutletModule } from 'ng-zorro-antd/core/outlet';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { NzCollapseComponent } from './collapse.component';

const NZ_CONFIG_MODULE_NAME: NzConfigKey = 'collapsePanel';

@Component({
  selector: 'nz-collapse-panel',
  exportAs: 'nzCollapsePanel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [collapseMotion],
  template: `
    <div
      role="button"
      [attr.aria-expanded]="nzActive"
      class="ant-collapse-header"
      [class.ant-collapse-icon-collapsible-only]="nzCollapsible === 'icon'"
      [class.ant-collapse-header-collapsible-only]="nzCollapsible === 'header'"
      (click)="onHeaderClick($event)"
    >
      @if (nzShowArrow) {
        <div role="button" class="ant-collapse-expand-icon" (click)="onIconClick($event)">
          <ng-container *nzStringTemplateOutlet="nzExpandedIcon; let expandedIcon">
            <nz-icon [nzType]="expandedIcon || 'right'" class="ant-collapse-arrow" [nzRotate]="nzActive ? 90 : 0" />
          </ng-container>
        </div>
      }
      <span class="ant-collapse-header-text">
        <ng-container *nzStringTemplateOutlet="nzHeader">{{ nzHeader }}</ng-container>
      </span>
      @if (nzExtra) {
        <div class="ant-collapse-extra">
          <ng-container *nzStringTemplateOutlet="nzExtra">{{ nzExtra }}</ng-container>
        </div>
      }
    </div>
    <div
      class="ant-collapse-content"
      [class.ant-collapse-content-active]="nzActive"
      [@.disabled]="!!noAnimation?.nzNoAnimation?.()"
      [@collapseMotion]="nzActive ? 'expanded' : 'hidden'"
    >
      <div class="ant-collapse-content-box">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  host: {
    class: 'ant-collapse-item',
    '[class.ant-collapse-no-arrow]': '!nzShowArrow',
    '[class.ant-collapse-item-active]': 'nzActive',
    '[class.ant-collapse-item-disabled]': 'nzDisabled || nzCollapsible === "disabled"'
  },
  imports: [NzOutletModule, NzIconModule]
})
export class NzCollapsePanelComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private nzCollapseComponent = inject(NzCollapseComponent, { host: true });
  noAnimation = inject(NzNoAnimationDirective, { optional: true });

  readonly _nzModuleName: NzConfigKey = NZ_CONFIG_MODULE_NAME;

  @Input({ transform: booleanAttribute }) nzActive = false;
  /**
   * @deprecated Use `nzCollapsible` instead with the value `'disabled'`.
   */
  @Input({ transform: booleanAttribute }) nzDisabled = false;
  @Input({ transform: booleanAttribute }) @WithConfig() nzShowArrow: boolean = true;
  @Input() nzExtra?: string | TemplateRef<void>;
  @Input() nzHeader?: string | TemplateRef<void>;
  @Input() nzExpandedIcon?: string | TemplateRef<void>;
  @Input() nzCollapsible?: 'disabled' | 'header' | 'icon';
  @Output() readonly nzActiveChange = new EventEmitter<boolean>();

  markForCheck(): void {
    this.cdr.markForCheck();
  }

  constructor() {
    onConfigChangeEventForComponent(NZ_CONFIG_MODULE_NAME, () => this.cdr.markForCheck());

    this.destroyRef.onDestroy(() => {
      this.nzCollapseComponent.removePanel(this);
    });
  }

  ngOnInit(): void {
    this.nzCollapseComponent.addPanel(this);
  }

  onHeaderClick(_event: MouseEvent): void {
    if (this.nzCollapsible === 'icon') {
      return;
    }
    this.handleClick();
  }

  onIconClick(event: MouseEvent): void {
    event.stopPropagation();
    this.handleClick();
  }

  private handleClick(): void {
    if (this.nzDisabled || this.nzCollapsible === 'disabled') {
      return;
    }
    this.nzCollapseComponent.click(this);
    this.cdr.markForCheck();
  }
}
