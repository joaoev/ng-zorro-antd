/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { FocusMonitor } from '@angular/cdk/a11y';
import { Direction, Directionality } from '@angular/cdk/bidi';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
  booleanAttribute,
  forwardRef,
  inject,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { NzConfigKey, NzConfigService, WithConfig } from 'ng-zorro-antd/core/config';
import { NzOutletModule } from 'ng-zorro-antd/core/outlet';
import { NzSizeDSType, OnChangeType, OnTouchedType } from 'ng-zorro-antd/core/types';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzIconModule } from 'ng-zorro-antd/icon';

const NZ_CONFIG_MODULE_NAME: NzConfigKey = 'switch';

@Component({
  selector: 'nz-switch',
  exportAs: 'nzSwitch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NzSwitchComponent),
      multi: true
    }
  ],
  template: `
    <button
      nz-wave
      type="button"
      class="ant-switch"
      #switchElement
      [attr.id]="nzId"
      [disabled]="nzDisabled"
      [class.ant-switch-checked]="isChecked"
      [class.ant-switch-loading]="nzLoading"
      [class.ant-switch-disabled]="nzDisabled"
      [class.ant-switch-small]="nzSize === 'small'"
      [class.ant-switch-rtl]="dir === 'rtl'"
      [nzWaveExtraNode]="true"
      (click)="onHostClick($event)"
      (keydown)="onKeyDown($event)"
    >
      <span class="ant-switch-handle">
        @if (nzLoading) {
          <nz-icon nzType="loading" class="ant-switch-loading-icon" />
        }
      </span>
      <span class="ant-switch-inner">
        @if (isChecked) {
          <ng-container *nzStringTemplateOutlet="nzCheckedChildren">{{ nzCheckedChildren }}</ng-container>
        } @else {
          <ng-container *nzStringTemplateOutlet="nzUnCheckedChildren">{{ nzUnCheckedChildren }}</ng-container>
        }
      </span>
      <div class="ant-click-animating-node"></div>
    </button>
  `,
  imports: [NzWaveModule, NzIconModule, NzOutletModule]
})
export class NzSwitchComponent implements ControlValueAccessor, AfterViewInit, OnInit {
  readonly _nzModuleName: NzConfigKey = NZ_CONFIG_MODULE_NAME;

  nzConfigService = inject(NzConfigService);
  private cdr = inject(ChangeDetectorRef);
  private focusMonitor = inject(FocusMonitor);
  private directionality = inject(Directionality);
  private destroyRef = inject(DestroyRef);

  isChecked = false;
  onChange: OnChangeType = () => {};
  onTouched: OnTouchedType = () => {};
  @ViewChild('switchElement', { static: true }) switchElement!: ElementRef<HTMLElement>;
  @Input({ transform: booleanAttribute }) nzLoading = false;
  @Input({ transform: booleanAttribute }) nzDisabled = false;
  @Input({ transform: booleanAttribute }) nzControl = false;
  @Input() nzCheckedChildren: string | TemplateRef<void> | null = null;
  @Input() nzUnCheckedChildren: string | TemplateRef<void> | null = null;
  @Input() @WithConfig() nzSize: NzSizeDSType = 'default';
  @Input() nzId: string | null = null;

  dir: Direction = 'ltr';

  private isNzDisableFirstChange = true;

  private get switchNativeElement(): HTMLElement {
    return (this.switchElement as { ['nativeElement']: HTMLElement })['nativeElement'];
  }

  updateValue(value: boolean): void {
    if (this.isChecked !== value) {
      this.isChecked = value;
      this.onChange(this.isChecked);
    }
  }

  focus(): void {
    this.focusMonitor.focusVia(this.switchNativeElement, 'keyboard');
  }

  blur(): void {
    this.switchNativeElement.blur();
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.focusMonitor.stopMonitoring(this.switchNativeElement);
    });
  }

  ngOnInit(): void {
    this.directionality.change.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(direction => {
      this.dir = direction;
      this.cdr.detectChanges();
    });

    this.dir = this.directionality.value;
  }

  onHostClick(event: MouseEvent): void {
    event.preventDefault();
    if (this.nzControl || this.nzDisabled || this.nzLoading) {
      return;
    }
    this.updateValue(!this.isChecked);
    this.cdr.markForCheck();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.nzControl || this.nzDisabled || this.nzLoading) {
      return;
    }

    const { key } = event;
    if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== ' ' && key !== 'Enter') {
      return;
    }

    event.preventDefault();

    if (key === 'ArrowLeft') {
      this.updateValue(false);
    } else if (key === 'ArrowRight') {
      this.updateValue(true);
    } else if (key === ' ' || key === 'Enter') {
      this.updateValue(!this.isChecked);
    }

    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {
    this.focusMonitor
      .monitor(this.switchNativeElement, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(focusOrigin => {
        if (!focusOrigin) {
          /** https://github.com/angular/angular/issues/17793 **/
          Promise.resolve().then(() => this.onTouched());
        }
      });
  }

  writeValue(value: boolean): void {
    this.isChecked = value;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: OnChangeType): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: OnTouchedType): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.nzDisabled = (this.isNzDisableFirstChange && this.nzDisabled) || disabled;
    this.isNzDisableFirstChange = false;
    this.cdr.markForCheck();
  }
}
