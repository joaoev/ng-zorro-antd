/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Direction, Directionality } from '@angular/cdk/bidi';
import {
  AnimationCallbackEvent,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NzNoAnimationDirective } from 'ng-zorro-antd/core/animation';
import { NzConfigKey, onConfigChangeEventForComponent, WithConfig } from 'ng-zorro-antd/core/config';
import { NzOutletModule } from 'ng-zorro-antd/core/outlet';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { AlertIconService, NzAlertType } from './alert-icon.service';
import { AlertConfigService } from './alert-config.service';
import { AlertAnimationService } from './alert-animation.service';

const NZ_CONFIG_MODULE_NAME: NzConfigKey = 'alert';

@Component({
  selector: 'nz-alert',
  exportAs: 'nzAlert',
  imports: [NzIconModule, NzOutletModule, NzNoAnimationDirective],
  templateUrl: './alert.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NzAlertComponent implements OnChanges, OnInit {
  private cdr = inject(ChangeDetectorRef);
  private directionality = inject(Directionality);
  private readonly destroyRef = inject(DestroyRef);
  private readonly iconService = inject(AlertIconService);
  private readonly configService = inject(AlertConfigService);
  private readonly animationService = inject(AlertAnimationService);
  readonly _nzModuleName: NzConfigKey = NZ_CONFIG_MODULE_NAME;

  @Input() nzAction: string | TemplateRef<void> | null = null;
  @Input() nzCloseText: string | TemplateRef<void> | null = null;
  @Input() nzIconType: string | null = null;
  @Input() nzMessage: string | TemplateRef<void> | null = null;
  @Input() nzDescription: string | TemplateRef<void> | null = null;
  @Input() nzType: NzAlertType = 'info';
  @Input({ transform: booleanAttribute }) @WithConfig() nzCloseable: boolean = false;
  @Input({ transform: booleanAttribute }) @WithConfig() nzShowIcon: boolean = false;
  @Input({ transform: booleanAttribute }) nzBanner = false;
  @Input({ transform: booleanAttribute }) nzNoAnimation = false;
  @Input() nzIcon: string | TemplateRef<void> | null = null;
  @Output() readonly nzOnClose = new EventEmitter<boolean>();
  closed = false;
  iconTheme: 'outline' | 'fill' = 'fill';
  inferredIconType: string = 'info-circle';
  dir: Direction = 'ltr';
  private isTypeSet = false;
  private isShowIconSet = false;

  constructor() {
    onConfigChangeEventForComponent(NZ_CONFIG_MODULE_NAME, () => this.cdr.markForCheck());
  }

  ngOnInit(): void {
    this.dir = this.directionality.value;
    this.directionality.change?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((d: Direction) => {
      this.dir = d;
      this.cdr.detectChanges();
    });
  }

  closeAlert(): void {
    this.closed = true;
    this.animationService.handleClose(this.nzNoAnimation, this.nzOnClose);
  }

  onLeaveAnimationDone(event: AnimationCallbackEvent): void {
    this.animationService.handleLeaveAnimation(event, this.nzNoAnimation, this.nzOnClose);
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { nzShowIcon, nzDescription, nzType, nzBanner } = changes;
    if (nzShowIcon) this.isShowIconSet = true;
    if (nzType) {
      this.isTypeSet = true;
      this.inferredIconType = this.iconService.getIconType(this.nzType);
    }
    if (nzDescription) this.iconTheme = this.iconService.getIconTheme(!!this.nzDescription);
    if (nzBanner) {
      const update = this.configService.handleBannerConfig(this.nzBanner, this.isTypeSet, this.isShowIconSet);
      if (update.type) this.nzType = update.type;
      if (update.showIcon) this.nzShowIcon = update.showIcon;
    }
  }
}
