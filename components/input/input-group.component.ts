/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { FocusMonitor } from '@angular/cdk/a11y';
import { Direction, Directionality } from '@angular/cdk/bidi';
import { NgTemplateOutlet } from '@angular/common';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  DestroyRef,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  QueryList,
  Renderer2,
  SimpleChanges,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  inject
} from '@angular/core';

import { NzFormItemFeedbackIconComponent, NzFormNoStatusService, NzFormStatusService } from 'ng-zorro-antd/core/form';
import { NgClassInterface, NzSizeLDSType, NzValidateStatus } from 'ng-zorro-antd/core/types';
import { NZ_SPACE_COMPACT_ITEM_TYPE, NzSpaceCompactItemDirective } from 'ng-zorro-antd/space';

import { handleInputGroupChanges } from './input-group-changes.helper';
import { setupInputGroupContentInit } from './input-group-content.helper';
import { NzInputGroupSlotComponent } from './input-group-slot.component';
import { setStatusStyles } from './input-group-status.helper';
import { setupInputGroupSubscriptions } from './input-group-subscription.helper';
import { NzInputDirective } from './input.directive';

@Component({
  selector: 'nz-input-group',
  exportAs: 'nzInputGroup',
  imports: [NzInputGroupSlotComponent, NgTemplateOutlet, NzFormItemFeedbackIconComponent],
  encapsulation: ViewEncapsulation.None,
  providers: [NzFormNoStatusService, { provide: NZ_SPACE_COMPACT_ITEM_TYPE, useValue: 'input' }],
  templateUrl: './input-group.component.html',
  host: {
    '[class.ant-input-search-enter-button]': `nzSearch`,
    '[class.ant-input-search]': `nzSearch`,
    '[class.ant-input-search-rtl]': `dir === 'rtl'`,
    '[class.ant-input-search-sm]': `nzSearch && isSmall`,
    '[class.ant-input-search-large]': `nzSearch && isLarge`,
    '[class.ant-input-group-wrapper]': `isAddOn`,
    '[class.ant-input-group-wrapper-rtl]': `dir === 'rtl'`,
    '[class.ant-input-group-wrapper-lg]': `isAddOn && isLarge`,
    '[class.ant-input-group-wrapper-sm]': `isAddOn && isSmall`,
    '[class.ant-input-affix-wrapper]': `isAffix && !isAddOn`,
    '[class.ant-input-affix-wrapper-rtl]': `dir === 'rtl'`,
    '[class.ant-input-affix-wrapper-focused]': `isAffix && focused`,
    '[class.ant-input-affix-wrapper-disabled]': `isAffix && disabled`,
    '[class.ant-input-affix-wrapper-lg]': `isAffix && !isAddOn && isLarge`,
    '[class.ant-input-affix-wrapper-sm]': `isAffix && !isAddOn && isSmall`,
    '[class.ant-input-group]': `!isAffix && !isAddOn`,
    '[class.ant-input-group-rtl]': `dir === 'rtl'`,
    '[class.ant-input-group-lg]': `!isAffix && !isAddOn && isLarge`,
    '[class.ant-input-group-sm]': `!isAffix && !isAddOn && isSmall`
  },
  hostDirectives: [NzSpaceCompactItemDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NzInputGroupComponent implements AfterContentInit, OnChanges, OnInit {
  private focusMonitor = inject(FocusMonitor);
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);
  private cdr = inject(ChangeDetectorRef);
  private directionality = inject(Directionality);
  private destroyRef = inject(DestroyRef);
  private nzFormStatusService = inject(NzFormStatusService, { optional: true });
  private nzFormNoStatusService = inject(NzFormNoStatusService, { optional: true });
  @ContentChildren(NzInputDirective) listOfNzInputDirective!: QueryList<NzInputDirective>;
  @Input() nzAddOnBeforeIcon?: string | null = null;
  @Input() nzAddOnAfterIcon?: string | null = null;
  @Input() nzPrefixIcon?: string | null = null;
  @Input() nzSuffixIcon?: string | null = null;
  @Input() nzAddOnBefore?: string | TemplateRef<void>;
  @Input() nzAddOnAfter?: string | TemplateRef<void>;
  @Input() nzPrefix?: string | TemplateRef<void>;
  @Input() nzStatus?: NzValidateStatus;
  @Input() nzSuffix?: string | TemplateRef<void>;
  @Input() nzSize: NzSizeLDSType = 'default';
  @Input({ transform: booleanAttribute }) nzSearch = false;
  isLarge = false;
  isSmall = false;
  isAffix = false;
  isAddOn = false;
  isFeedback = false;
  focused = false;
  disabled = false;
  dir: Direction = 'ltr';
  prefixCls: string = 'ant-input';
  affixStatusCls: NgClassInterface = {};
  groupStatusCls: NgClassInterface = {};
  affixInGroupStatusCls: NgClassInterface = {};
  status?: NzValidateStatus;
  hasFeedback: boolean = false;
  constructor() {
    this.destroyRef.onDestroy(() => this.focusMonitor.stopMonitoring(this.elementRef));
  }

  private toNzValidateStatus(value: unknown): NzValidateStatus | undefined {
    const validStatuses: NzValidateStatus[] = ['success', 'warning', 'error', 'validating', ''];
    return validStatuses.includes(value as NzValidateStatus) ? (value as NzValidateStatus) : undefined;
  }

  updateChildrenInputSize = (): void => {
    if (this.listOfNzInputDirective) this.listOfNzInputDirective.forEach(item => item['size'].set(this.nzSize));
  };

  ngOnInit = (): void => {
    setupInputGroupSubscriptions(
      this.listOfNzInputDirective,
      this.nzFormStatusService,
      this.focusMonitor,
      this.elementRef,
      this.directionality,
      this.destroyRef,
      this.cdr,
      (status, hasFeedback) => this.setStatusStyles(status ?? '', hasFeedback),
      focused => (this.focused = focused),
      disabled => (this.disabled = disabled),
      dir => (this.dir = dir)
    );
  };
  ngAfterContentInit = (): void => {
    this.updateChildrenInputSize();
    setupInputGroupContentInit(
      this.listOfNzInputDirective,
      this.destroyRef,
      this.cdr,
      disabled => (this.disabled = disabled)
    );
  };
  ngOnChanges = (changes: SimpleChanges): void => {
    const result = handleInputGroupChanges(
      changes,
      this.nzSize,
      this.nzSuffix,
      this.nzPrefix,
      this.nzPrefixIcon,
      this.nzSuffixIcon,
      this.nzAddOnAfter,
      this.nzAddOnBefore,
      this.nzAddOnAfterIcon,
      this.nzAddOnBeforeIcon,
      this.nzStatus,
      this.listOfNzInputDirective,
      this.nzFormNoStatusService,
      (status, hasFeedback) => this.setStatusStyles(status ?? '', hasFeedback),
      this.hasFeedback
    );
    if (changes['nzSize']) this.updateChildrenInputSize();
    this.isLarge = result.isLarge;
    this.isSmall = result.isSmall;
    if (changes['nzSuffix'] || changes['nzPrefix'] || changes['nzPrefixIcon'] || changes['nzSuffixIcon'])
      this.isAffix = result.isAffix;
    if (
      changes['nzAddOnAfter'] ||
      changes['nzAddOnBefore'] ||
      changes['nzAddOnAfterIcon'] ||
      changes['nzAddOnBeforeIcon']
    )
      this.isAddOn = result.isAddOn;
  };
  private setStatusStyles = (status: NzValidateStatus | string, hasFeedback: boolean): void => {
    const safeStatus = this.toNzValidateStatus(status) ?? '';
    const result = setStatusStyles(
      safeStatus,
      hasFeedback,
      (this.nzSuffix as string) ?? '',
      (this.nzPrefix as string) ?? '',
      (this.nzPrefixIcon as string) ?? '',
      (this.nzSuffixIcon as string) ?? '',
      this.isAddOn,
      this.prefixCls,
      this.renderer,
      this.elementRef
    );
    this.status = result.status === null || result.status === undefined ? '' : result.status;
    this.hasFeedback = result.hasFeedback;
    this.isFeedback = result.isFeedback;
    this.isAffix = result.isAffix;
    this.affixInGroupStatusCls = result.affixInGroupStatusCls;
    this.affixStatusCls = result.affixStatusCls;
    this.groupStatusCls = result.groupStatusCls;
    this.cdr.markForCheck();
  };
}
