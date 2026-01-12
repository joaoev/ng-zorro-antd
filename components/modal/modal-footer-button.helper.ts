/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { ModalButtonOptions } from './modal-types';
import { NzModalRef } from './modal-ref';
import { isPromise } from 'ng-zorro-antd/core/util';

export function mergeDefaultOption(options: ModalButtonOptions): ModalButtonOptions {
  return { type: null, size: 'default', autoLoading: true, show: true, loading: false, disabled: false, ...options };
}

export function getButtonCallableProp(options: ModalButtonOptions, prop: keyof ModalButtonOptions, modalRef: NzModalRef): boolean {
  const value = options[prop];
  const componentInstance = modalRef.getContentComponent();
  return typeof value === 'function' ? value.apply(options, componentInstance && [componentInstance]) : value;
}

export function handleButtonClick(options: ModalButtonOptions, modalRef: NzModalRef): void {
  const loading = getButtonCallableProp(options, 'loading', modalRef);
  if (!loading) {
    const result = getButtonCallableProp(options, 'onClick', modalRef);
    if (options.autoLoading && isPromise(result)) {
      options.loading = true;
      result.then(() => (options.loading = false)).catch(e => { options.loading = false; throw e; });
    }
  }
}
