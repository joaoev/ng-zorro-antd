/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NgModel } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';

import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { toBoolean } from 'ng-zorro-antd/core/util';

import { NzFormControlStatusType } from './form-item.component';
import { NzFormDirective } from './form.directive';

export interface FormControlValidationState {
  status: NzFormControlStatusType;
  autoErrorTip: string;
}

@Injectable()
export class NzFormControlValidationService {
  private destroyRef = inject(DestroyRef);
  private nzFormDirective = inject(NzFormDirective, { optional: true });

  private validateChanges: Subscription = Subscription.EMPTY;
  private autoErrorTip = '';

  getAutoErrorTip(): string {
    return this.autoErrorTip;
  }

  isAutoTipsDisabled(componentDisableAutoTips: boolean | undefined): boolean {
    return componentDisableAutoTips !== undefined
      ? toBoolean(componentDisableAutoTips)
      : !!this.nzFormDirective?.nzDisableAutoTips;
  }

  watchControl(validateControl: AbstractControl | NgModel | null, onStatusChange: () => void): void {
    this.validateChanges.unsubscribe();
    if (validateControl && validateControl.statusChanges) {
      this.validateChanges = (validateControl.statusChanges as Observable<NzSafeAny>)
        .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => onStatusChange());
    }
  }

  getControlStatus(
    validateString: string | null,
    validateControl: AbstractControl | NgModel | null
  ): NzFormControlStatusType {
    if (validateString === 'warning' || this.validateControlStatus(validateControl, 'INVALID', 'warning')) {
      return 'warning';
    } else if (validateString === 'error' || this.validateControlStatus(validateControl, 'INVALID')) {
      return 'error';
    } else if (
      validateString === 'validating' ||
      validateString === 'pending' ||
      this.validateControlStatus(validateControl, 'PENDING')
    ) {
      return 'validating';
    } else if (validateString === 'success' || this.validateControlStatus(validateControl, 'VALID')) {
      return 'success';
    }
    return '';
  }

  private validateControlStatus(
    validateControl: AbstractControl | NgModel | null,
    validStatus: string,
    statusType?: NzFormControlStatusType
  ): boolean {
    if (!validateControl) {
      return false;
    }
    const { dirty, touched, status } = validateControl;
    return (!!dirty || !!touched) && (statusType ? validateControl.hasError(statusType) : status === validStatus);
  }

  updateAutoErrorTip(
    validateControl: AbstractControl | NgModel | null,
    localeId: string,
    nzAutoTips: Record<string, Record<string, string>>
  ): void {
    if (validateControl) {
      const errors = validateControl.errors || {};
      let autoErrorTip = '';
      for (const key in errors) {
        if (errors.hasOwnProperty(key)) {
          autoErrorTip =
            errors[key]?.[localeId] ??
            nzAutoTips?.[localeId]?.[key] ??
            nzAutoTips.default?.[key] ??
            this.nzFormDirective?.nzAutoTips?.[localeId]?.[key] ??
            this.nzFormDirective?.nzAutoTips.default?.[key];
        }
        if (autoErrorTip) {
          break;
        }
      }
      this.autoErrorTip = autoErrorTip;
    }
  }

  destroy(): void {
    this.validateChanges.unsubscribe();
  }
}
