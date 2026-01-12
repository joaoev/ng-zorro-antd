/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef,
  booleanAttribute,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import { NzButtonType } from 'ng-zorro-antd/button';
import { NzSafeAny } from 'ng-zorro-antd/core/types';

import { NzModalContentDirective } from './modal-content.directive';
import { NzModalFooterDirective } from './modal-footer.directive';
import { NzModalLegacyAPI } from './modal-legacy-api';
import { NzModalRef } from './modal-ref';
import { NzModalTitleDirective } from './modal-title.directive';
import {
  ModalOptions,
  ModalTypes,
  OnClickCallback,
  StyleObjectLike,
  ModalMaskOptions,
  ModalButtonConfigOptions,
  ModalDisplayOptions,
  ModalContentOptions
} from './modal-types';
import { NzModalService } from './modal.service';
import { getConfigFromComponent } from './utils';

@Component({
  selector: 'nz-modal',
  exportAs: 'nzModal',
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NzModalComponent<T extends ModalOptions = NzSafeAny, R = NzSafeAny>
  implements OnChanges, NzModalLegacyAPI<T, R>
{
  /**
   * Rodapé do modal. Pode ser string ou TemplateRef.
   */
  nzFooter?: string | TemplateRef<{}>;
  /**
   * Título do modal. Pode ser string ou TemplateRef.
   */
  nzTitle?: string | TemplateRef<{}>;
  /**
   * Conteúdo do modal. Pode ser string, TemplateRef ou Type.
   */
  nzContent?: string | TemplateRef<{}> | NzSafeAny;
  private cdr = inject(ChangeDetectorRef);
  private modal = inject(NzModalService);
  private viewContainerRef = inject(ViewContainerRef);
  private destroyRef = inject(DestroyRef);

  // Agrupamento de inputs para reduzir o número de propriedades @Input
  @Input() nzMaskOptions: ModalMaskOptions = {};
  @Input() nzButtonOptions: ModalButtonConfigOptions = {};
  @Input() nzDisplayOptions: ModalDisplayOptions = {};
  @Input() nzContentOptions: ModalContentOptions = {};

  // Input que precisa permanecer separado (two-way binding)
  @Input({ transform: booleanAttribute }) nzVisible: boolean = false;

  // Getters para acessar valores individuais (necessários para getConfigFromComponent)
  get nzMask(): boolean | undefined {
    return this.nzMaskOptions.mask;
  }

  get nzMaskClosable(): boolean | undefined {
    return this.nzMaskOptions.maskClosable;
  }

  get nzCloseOnNavigation(): boolean | undefined {
    return this.nzMaskOptions.closeOnNavigation;
  }

  get nzMaskStyle(): StyleObjectLike | undefined {
    return this.nzMaskOptions.maskStyle;
  }

  get nzClosable(): boolean {
    return this.nzMaskOptions.closable ?? true;
  }

  get nzKeyboard(): boolean {
    return this.nzMaskOptions.keyboard ?? true;
  }

  get nzNoAnimation(): boolean {
    return this.nzMaskOptions.noAnimation ?? false;
  }

  get nzCentered(): boolean {
    return this.nzMaskOptions.centered ?? false;
  }

  get nzDraggable(): boolean {
    return this.nzMaskOptions.draggable ?? false;
  }

  get nzOkLoading(): boolean {
    return this.nzButtonOptions.okLoading ?? false;
  }

  get nzOkDisabled(): boolean {
    return this.nzButtonOptions.okDisabled ?? false;
  }

  get nzCancelDisabled(): boolean {
    return this.nzButtonOptions.cancelDisabled ?? false;
  }

  get nzCancelLoading(): boolean {
    return this.nzButtonOptions.cancelLoading ?? false;
  }

  get nzOkText(): string | null | undefined {
    return this.nzButtonOptions.okText;
  }

  get nzCancelText(): string | null | undefined {
    return this.nzButtonOptions.cancelText;
  }

  get nzOkType(): NzButtonType {
    return this.nzButtonOptions.okType ?? 'primary';
  }

  get nzOkDanger(): boolean {
    return this.nzButtonOptions.okDanger ?? false;
  }

  get nzAutofocus(): 'ok' | 'cancel' | 'auto' | null {
    return this.nzButtonOptions.autofocus ?? 'auto';
  }

  get nzWidth(): number | string {
    return this.nzDisplayOptions.width ?? 520;
  }

  get nzZIndex(): number {
    return this.nzDisplayOptions.zIndex ?? 1000;
  }

  get nzWrapClassName(): string | undefined {
    return this.nzDisplayOptions.wrapClassName;
  }

  get nzClassName(): string | undefined {
    return this.nzDisplayOptions.className;
  }

  get nzStyle(): object | undefined {
    return this.nzDisplayOptions.style;
  }

  get nzBodyStyle(): StyleObjectLike | undefined {
    return this.nzDisplayOptions.bodyStyle;
  }

  get nzCloseIcon(): string | TemplateRef<void> {
    return this.nzDisplayOptions.closeIcon ?? 'close';
  }

  get nzModalType(): ModalTypes {
    return this.nzDisplayOptions.modalType ?? 'default';
  }

  get nzIconType(): string {
    return this.nzDisplayOptions.iconType ?? 'question-circle';
  }

  // TODO(@hsuanxyz) Input will not be supported
  @Input()
  @Output()
  readonly nzOnOk: EventEmitter<T> | OnClickCallback<T> | NzSafeAny = new EventEmitter<T>();

  // TODO(@hsuanxyz) Input will not be supported
  @Input()
  @Output()
  readonly nzOnCancel: EventEmitter<T> | OnClickCallback<T> | NzSafeAny = new EventEmitter<T>();

  @Output() readonly nzAfterOpen = new EventEmitter<void>();
  @Output() readonly nzAfterClose = new EventEmitter<R>();
  @Output() readonly nzVisibleChange = new EventEmitter<boolean>();

  @ContentChild(NzModalTitleDirective, { static: true, read: TemplateRef })
  set modalTitle(value: TemplateRef<NzSafeAny>) {
    if (value) {
      this.setTitleWithTemplate(value);
    }
  }

  @ContentChild(NzModalContentDirective, { static: true, read: TemplateRef })
  contentFromContentChild!: TemplateRef<NzSafeAny>;

  @ContentChild(NzModalFooterDirective, { static: true, read: TemplateRef })
  set modalFooter(value: TemplateRef<NzSafeAny>) {
    if (value) {
      this.setFooterWithTemplate(value);
    }
  }

  private modalRef: NzModalRef | null = null;

  get afterOpen(): Observable<void> {
    // Observable alias for nzAfterOpen
    return this.nzAfterOpen.asObservable();
  }

  get afterClose(): Observable<R> {
    // Observable alias for nzAfterClose
    return this.nzAfterClose.asObservable();
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.modalRef?._finishDialogClose();
    });
  }

  open(): void {
    if (!this.nzVisible) {
      this.nzVisible = true;
      this.nzVisibleChange.emit(true);
    }

    if (!this.modalRef) {
      const config = this.getConfig();
      this.modalRef = this.modal.create(config);

      // When the modal is implicitly closed (e.g. closeAll) the nzVisible needs to be set to the correct value and emit.
      this.modalRef.afterClose
        .asObservable()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.close();
        });
    }
  }

  close(result?: R): void {
    if (this.nzVisible) {
      this.nzVisible = false;
      this.nzVisibleChange.emit(false);
    }

    if (this.modalRef) {
      this.modalRef.close(result);
      this.modalRef = null;
    }
  }

  destroy(result?: R): void {
    this.close(result);
  }

  triggerOk(): void {
    this.modalRef?.triggerOk();
  }

  triggerCancel(): void {
    this.modalRef?.triggerCancel();
  }

  getContentComponent(): T | void {
    return this.modalRef?.getContentComponent();
  }

  getElement(): HTMLElement | void {
    return this.modalRef?.getElement();
  }

  getModalRef(): NzModalRef | null {
    return this.modalRef;
  }

  private setTitleWithTemplate(templateRef: TemplateRef<{}>): void {
    this.nzTitle = templateRef;
    if (this.modalRef) {
      // If modalRef already created, set the title in next tick
      Promise.resolve().then(() => {
        this.modalRef!.updateConfig({
          nzTitle: this.nzTitle
        });
      });
    }
  }

  private setFooterWithTemplate(templateRef: TemplateRef<{}>): void {
    this.nzFooter = templateRef;
    if (this.modalRef) {
      // If modalRef already created, set the footer in next tick
      Promise.resolve().then(() => {
        this.modalRef!.updateConfig({
          nzFooter: this.nzFooter
        });
      });
    }

    this.cdr.markForCheck();
  }

  private getConfig(): ModalOptions {
    const componentConfig = getConfigFromComponent(this);
    componentConfig.nzViewContainerRef = this.viewContainerRef;
    componentConfig.nzContent = this.nzContent || this.contentFromContentChild;
    return componentConfig;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { nzVisible, nzMaskOptions, nzButtonOptions, nzDisplayOptions, nzContentOptions, ...otherChanges } = changes;

    if (
      (nzMaskOptions || nzButtonOptions || nzDisplayOptions || nzContentOptions || Object.keys(otherChanges).length) &&
      this.modalRef
    ) {
      this.modalRef.updateConfig(getConfigFromComponent(this));
    }

    if (nzVisible) {
      if (this.nzVisible) {
        this.open();
      } else {
        this.close();
      }
    }
  }
}
