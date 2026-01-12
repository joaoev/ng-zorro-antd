/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzI18nService, NzModalI18nInterface } from 'ng-zorro-antd/i18n';
import { ModalButtonOptions, ModalOptions } from './modal-types';
import { mergeDefaultOption } from './modal-footer-button.helper';

export function setupModalFooterInit(
  config: ModalOptions,
  i18n: NzI18nService,
  destroyRef: DestroyRef,
  setButtonsFooterFn: (value: boolean) => void,
  setButtonsFn: (buttons: ModalButtonOptions[]) => void,
  setLocaleFn: (locale: NzModalI18nInterface) => void
): void {
  if (Array.isArray(config.nzFooter)) {
    setButtonsFooterFn(true);
    setButtonsFn((config.nzFooter as ModalButtonOptions[]).map(mergeDefaultOption));
  }
  i18n.localeChange.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => { setLocaleFn(i18n.getLocaleData('Modal')); });
}
