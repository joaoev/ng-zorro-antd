/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Platform } from '@angular/cdk/platform';
import { NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  forwardRef,
  inject,
  Input,
  NgZone,
  Output,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import type { editor } from 'monaco-editor';

import { NzSafeAny, OnChangeType, OnTouchedType } from 'ng-zorro-antd/core/types';
import { NzSpinComponent } from 'ng-zorro-antd/spin';

import { NzCodeEditorInstanceService } from './code-editor-instance.service';
import { NzCodeEditorService } from './code-editor.service';
import { JoinedEditorOptions, NzEditorMode } from './typings';

type IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
type IStandaloneDiffEditor = editor.IStandaloneDiffEditor;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'nz-code-editor',
  exportAs: 'nzCodeEditor',
  template: `
    @if (nzLoading) {
      <div class="ant-code-editor-loading">
        <nz-spin />
      </div>
    }
    @if (nzToolkit) {
      <div class="ant-code-editor-toolkit">
        <ng-template [ngTemplateOutlet]="nzToolkit" />
      </div>
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NzCodeEditorComponent),
      multi: true
    },
    NzCodeEditorInstanceService
  ],
  imports: [NzSpinComponent, NgTemplateOutlet]
})
export class NzCodeEditorComponent implements AfterViewInit, ControlValueAccessor {
  private nzCodeEditorService = inject(NzCodeEditorService);
  private instanceService = inject(NzCodeEditorInstanceService);
  private ngZone = inject(NgZone);
  private platform = inject(Platform);
  private destroyRef = inject(DestroyRef);

  @Input() nzEditorMode: NzEditorMode = 'normal';
  @Input() nzOriginalText = '';
  @Input({ transform: booleanAttribute }) nzLoading = false;
  @Input({ transform: booleanAttribute }) nzFullControl = false;
  @Input() nzToolkit?: TemplateRef<void>;

  @Input() set nzEditorOption(value: JoinedEditorOptions) {
    this.instanceService.setEditorOption(value);
  }

  @Output() readonly nzEditorInitialized = new EventEmitter<IStandaloneCodeEditor | IStandaloneDiffEditor>();

  get editorOptionCached(): JoinedEditorOptions {
    return this.instanceService.editorOptionCached;
  }

  private readonly el: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private value = '';

  constructor() {
    this.el.classList.add('ant-code-editor');
    this.instanceService.initDestroy(this.destroyRef);
  }

  ngAfterViewInit(): void {
    if (!this.platform.isBrowser) {
      return;
    }

    this.nzCodeEditorService
      .requestToInit()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(option => this.setup(option));
  }

  writeValue(value: string): void {
    this.value = value;
    this.instanceService.setValue(value);
  }

  registerOnChange(fn: OnChangeType): NzSafeAny {
    this.onChange = fn;
  }

  registerOnTouched(fn: OnTouchedType): void {
    this.onTouch = fn;
  }

  onChange: OnChangeType = (_value: string) => {};

  onTouch: OnTouchedType = () => {};

  layout(): void {
    this.instanceService.layout();
  }

  private setup(option: JoinedEditorOptions): void {
    this.instanceService.setup(
      option,
      {
        el: this.el,
        editorMode: this.nzEditorMode,
        fullControl: this.nzFullControl,
        originalText: this.nzOriginalText,
        onInitialized: instance => {
          this.instanceService.setValue(this.value);

          if (!this.nzFullControl) {
            this.instanceService.setupValueEmitter();
          }

          if (this.nzEditorInitialized.observers.length) {
            this.ngZone.run(() => this.nzEditorInitialized.emit(instance));
          }
        },
        onValueChange: value => this.emitValue(value)
      },
      this.destroyRef
    );
  }

  private emitValue(value: string): void {
    if (this.value === value) {
      return;
    }

    this.value = value;
    this.ngZone.run(() => {
      this.onChange(value);
    });
  }
}
