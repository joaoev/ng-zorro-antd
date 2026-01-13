/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  DestroyRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControlDirective, FormControlName, NgControl, NgModel } from '@angular/forms';
import { Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

import { withAnimationCheck } from 'ng-zorro-antd/core/animation';
import { NzFormStatusService } from 'ng-zorro-antd/core/form';
import { NzOutletModule } from 'ng-zorro-antd/core/outlet';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzI18nService } from 'ng-zorro-antd/i18n';

import { NzFormControlValidationService } from './form-control-validation.service';
import { NzFormControlStatusType, NzFormItemComponent } from './form-item.component';
import { NzFormDirective } from './form.directive';

@Component({
  selector: 'nz-form-control',
  exportAs: 'nzFormControl',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ant-form-item-control-input">
      <div class="ant-form-item-control-input-content">
        <ng-content></ng-content>
      </div>
    </div>
    @if (innerTip) {
      <div
        [animate.enter]="nzValidateAnimationEnter()"
        [animate.leave]="nzValidateAnimationLeave()"
        class="ant-form-item-explain ant-form-item-explain-connected"
      >
        <div role="alert" [class]="['ant-form-item-explain-' + status]">
          <ng-container *nzStringTemplateOutlet="innerTip; context: { $implicit: validateControl }">{{
            innerTip
          }}</ng-container>
        </div>
      </div>
    }

    @if (nzExtra) {
      <div class="ant-form-item-extra">
        <ng-container *nzStringTemplateOutlet="nzExtra">{{ nzExtra }}</ng-container>
      </div>
    }
  `,
  providers: [NzFormStatusService, NzFormControlValidationService],
  host: {
    class: 'ant-form-item-control'
  },
  imports: [NzOutletModule]
})
export class NzFormControlComponent implements OnChanges, OnInit, AfterContentInit {
  private cdr = inject(ChangeDetectorRef);
  public i18n = inject(NzI18nService);
  private nzFormStatusService = inject(NzFormStatusService);
  private validationService = inject(NzFormControlValidationService);

  private _hasFeedback = false;
  private validateString: string | null = null;
  private localeId!: string;

  protected readonly nzValidateAnimationEnter = withAnimationCheck(() => 'ant-form-validate_animation-enter');
  protected readonly nzValidateAnimationLeave = withAnimationCheck(() => 'ant-form-validate_animation-leave');

  status: NzFormControlStatusType = '';
  validateControl: AbstractControl | NgModel | null = null;
  innerTip: string | TemplateRef<{ $implicit: AbstractControl | NgModel }> | null = null;

  @ContentChild(NgControl, { static: false }) defaultValidateControl?: FormControlName | FormControlDirective;
  @Input() nzSuccessTip?: string | TemplateRef<{ $implicit: AbstractControl | NgModel }>;
  @Input() nzWarningTip?: string | TemplateRef<{ $implicit: AbstractControl | NgModel }>;
  @Input() nzErrorTip?: string | TemplateRef<{ $implicit: AbstractControl | NgModel }>;
  @Input() nzValidatingTip?: string | TemplateRef<{ $implicit: AbstractControl | NgModel }>;
  @Input() nzExtra?: string | TemplateRef<void>;
  @Input() nzAutoTips: Record<string, Record<string, string>> = {};
  @Input({ transform: booleanAttribute }) nzDisableAutoTips?: boolean;

  @Input({ transform: booleanAttribute })
  set nzHasFeedback(value: boolean) {
    this._hasFeedback = value;
    this.nzFormStatusService.formStatusChanges.next({ status: this.status, hasFeedback: this._hasFeedback });
    if (this.nzFormItemComponent) {
      this.nzFormItemComponent.setHasFeedback(this._hasFeedback);
    }
  }

  get nzHasFeedback(): boolean {
    return this._hasFeedback;
  }

  @Input()
  set nzValidateStatus(value: string | AbstractControl | FormControlName | NgModel) {
    if (value instanceof AbstractControl || value instanceof NgModel) {
      this.validateControl = value;
      this.validateString = null;
      this.watchControl();
    } else if (value instanceof FormControlName) {
      this.validateControl = value.control;
      this.validateString = null;
      this.watchControl();
    } else {
      this.validateString = value;
      this.validateControl = null;
      this.setStatus();
    }
  }

  private watchControl(): void {
    this.validationService.watchControl(this.validateControl, () => {
      if (!this.validationService.isAutoTipsDisabled(this.nzDisableAutoTips)) {
        this.validationService.updateAutoErrorTip(this.validateControl, this.localeId, this.nzAutoTips);
      }
      this.setStatus();
      this.cdr.markForCheck();
    });
  }

  private setStatus(): void {
    this.status = this.validationService.getControlStatus(this.validateString, this.validateControl);
    this.innerTip = this.getInnerTip(this.status);
    this.nzFormStatusService.formStatusChanges.next({ status: this.status, hasFeedback: this.nzHasFeedback });
    if (this.nzFormItemComponent) {
      this.nzFormItemComponent.setWithHelpViaTips(!!this.innerTip);
      this.nzFormItemComponent.setStatus(this.status);
    }
  }

  private getInnerTip(
    status: NzFormControlStatusType
  ): string | TemplateRef<{ $implicit: AbstractControl | NgModel }> | null {
    const disableAutoTips = this.validationService.isAutoTipsDisabled(this.nzDisableAutoTips);
    switch (status) {
      case 'error':
        return (!disableAutoTips && this.validationService.getAutoErrorTip()) || this.nzErrorTip || null;
      case 'validating':
        return this.nzValidatingTip || null;
      case 'success':
        return this.nzSuccessTip || null;
      case 'warning':
        return this.nzWarningTip || null;
      default:
        return null;
    }
  }

  private subscribeAutoTips(observable?: Observable<NzSafeAny>): void {
    observable?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (!this.validationService.isAutoTipsDisabled(this.nzDisableAutoTips)) {
        this.validationService.updateAutoErrorTip(this.validateControl, this.localeId, this.nzAutoTips);
        this.setStatus();
        this.cdr.markForCheck();
      }
    });
  }

  private nzFormItemComponent = inject(NzFormItemComponent, { host: true, optional: true });
  private nzFormDirective = inject(NzFormDirective, { optional: true });
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.subscribeAutoTips(this.i18n.localeChange.pipe(tap(locale => (this.localeId = locale.locale))));
    this.subscribeAutoTips(this.nzFormDirective?.getInputObservable('nzAutoTips'));
    this.subscribeAutoTips(
      this.nzFormDirective
        ?.getInputObservable('nzDisableAutoTips')
        .pipe(filter(() => this.nzDisableAutoTips === undefined))
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { nzDisableAutoTips, nzAutoTips, nzSuccessTip, nzWarningTip, nzErrorTip, nzValidatingTip } = changes;

    if (nzDisableAutoTips || nzAutoTips) {
      this.validationService.updateAutoErrorTip(this.validateControl, this.localeId, this.nzAutoTips);
      this.setStatus();
    } else if (nzSuccessTip || nzWarningTip || nzErrorTip || nzValidatingTip) {
      this.setStatus();
    }
  }

  ngOnInit(): void {
    this.setStatus();
  }

  ngAfterContentInit(): void {
    if (!this.validateControl && !this.validateString) {
      if (this.defaultValidateControl instanceof FormControlDirective) {
        this.nzValidateStatus = this.defaultValidateControl.control;
      } else {
        this.nzValidateStatus = this.defaultValidateControl!;
      }
    }
  }
}
