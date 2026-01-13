/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, Input, Output } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzOutletModule } from 'ng-zorro-antd/core/outlet';
import { NzI18nService, NzModalI18nInterface } from 'ng-zorro-antd/i18n';

import { NzModalRef } from './modal-ref';
import { ModalButtonOptions, ModalOptions } from './modal-types';
import { getButtonCallableProp, handleButtonClick } from './modal-footer-button.helper';
import { setupModalFooterInit } from './modal-footer-init.helper';

@Component({
  selector: 'div[nz-modal-footer]',
  exportAs: 'nzModalFooterBuiltin',
  templateUrl: './modal-footer.component.html',
  host: {
    class: 'ant-modal-footer'
  },
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [NzOutletModule, NzButtonModule]
})
export class NzModalFooterComponent {
  private i18n = inject(NzI18nService);
  private destroyRef = inject(DestroyRef);
  public readonly config = inject(ModalOptions);
  buttonsFooter = false;
  buttons: ModalButtonOptions[] = [];
  locale!: NzModalI18nInterface;
  @Output() readonly cancelTriggered = new EventEmitter<void>();
  @Output() readonly okTriggered = new EventEmitter<void>();
  @Input() modalRef!: NzModalRef;
  constructor() {
    setupModalFooterInit(
      this.config,
      this.i18n,
      this.destroyRef,
      (value) => this.buttonsFooter = value,
      (buttons) => this.buttons = buttons,
      (locale) => this.locale = locale
    );
  }

  onCancel = (): void => { this.cancelTriggered.emit(); };
  onOk = (): void => { this.okTriggered.emit(); };
  getButtonCallableProp = (options: ModalButtonOptions, prop: keyof ModalButtonOptions): boolean => getButtonCallableProp(options, prop, this.modalRef);
  onButtonClick = (options: ModalButtonOptions): void => handleButtonClick(options, this.modalRef);
}
