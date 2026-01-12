/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Direction, Directionality } from '@angular/cdk/bidi';
import { CdkOverlayOrigin, ConnectedOverlayPositionChange, OverlayModule } from '@angular/cdk/overlay';
import { Platform } from '@angular/cdk/platform';
import {
  AfterContentInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  DestroyRef,
  ElementRef,
  EventEmitter,
  forwardRef,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';

import { NzNoAnimationDirective } from 'ng-zorro-antd/core/animation';
import { POSITION_TYPE_HORIZONTAL } from 'ng-zorro-antd/core/overlay';

import { NzMenuItemComponent } from './menu-item.component';
import { MenuService } from './menu.service';
import { NzIsMenuInsideDropdownToken } from './menu.token';
import { NzMenuModeType, NzMenuThemeType, NzSubmenuTrigger } from './menu.types';
import { NzSubmenuInlineChildComponent } from './submenu-inline-child.component';
import { NzSubmenuNoneInlineChildComponent } from './submenu-non-inline-child.component';
import { NzSubMenuTitleComponent } from './submenu-title.component';
import { NzSubmenuService } from './submenu.service';
import { setupSubmenuSubscriptions, setupSubmenuContentInit } from './submenu-subscription.helper';


@Component({
  selector: '[nz-submenu]',
  exportAs: 'nzSubmenu',
  providers: [NzSubmenuService],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './submenu.component.html',
  host: {
    '[class.ant-dropdown-menu-submenu]': `isMenuInsideDropdown`,
    '[class.ant-dropdown-menu-submenu-disabled]': `isMenuInsideDropdown && nzDisabled`,
    '[class.ant-dropdown-menu-submenu-open]': `isMenuInsideDropdown && nzOpen`,
    '[class.ant-dropdown-menu-submenu-selected]': `isMenuInsideDropdown && isSelected`,
    '[class.ant-dropdown-menu-submenu-vertical]': `isMenuInsideDropdown && mode === 'vertical'`,
    '[class.ant-dropdown-menu-submenu-horizontal]': `isMenuInsideDropdown && mode === 'horizontal'`,
    '[class.ant-dropdown-menu-submenu-inline]': `isMenuInsideDropdown && mode === 'inline'`,
    '[class.ant-dropdown-menu-submenu-active]': `isMenuInsideDropdown && isActive`,
    '[class.ant-menu-submenu]': `!isMenuInsideDropdown`,
    '[class.ant-menu-submenu-disabled]': `!isMenuInsideDropdown && nzDisabled`,
    '[class.ant-menu-submenu-open]': `!isMenuInsideDropdown && nzOpen`,
    '[class.ant-menu-submenu-selected]': `!isMenuInsideDropdown && isSelected`,
    '[class.ant-menu-submenu-vertical]': `!isMenuInsideDropdown && mode === 'vertical'`,
    '[class.ant-menu-submenu-horizontal]': `!isMenuInsideDropdown && mode === 'horizontal'`,
    '[class.ant-menu-submenu-inline]': `!isMenuInsideDropdown && mode === 'inline'`,
    '[class.ant-menu-submenu-active]': `!isMenuInsideDropdown && isActive`,
    '[class.ant-menu-submenu-rtl]': `dir === 'rtl'`
  },
  imports: [
    NzSubMenuTitleComponent,
    NzSubmenuInlineChildComponent,
    NzNoAnimationDirective,
    NzSubmenuNoneInlineChildComponent,
    OverlayModule
  ]
})
export class NzSubMenuComponent implements OnInit, AfterContentInit, OnChanges {
  public readonly nzSubmenuService = inject(NzSubmenuService);
  protected readonly isMenuInsideDropdown = inject(NzIsMenuInsideDropdownToken);
  protected readonly noAnimation = inject(NzNoAnimationDirective, { optional: true, host: true });
  private readonly directionality = inject(Directionality);
  private readonly destroyRef = inject(DestroyRef);
  private readonly nzMenuService = inject(MenuService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platform = inject(Platform);

  @Input() nzMenuClassName: string = '';
  @Input() nzPaddingLeft: number | null = null;
  @Input() nzTitle: string | TemplateRef<void> | null = null;
  @Input() nzIcon: string | null = null;
  @Input() nzTriggerSubMenuAction: NzSubmenuTrigger = 'hover';
  @Input({ transform: booleanAttribute }) nzOpen = false;
  @Input({ transform: booleanAttribute }) nzDisabled = false;
  @Input() nzPlacement: POSITION_TYPE_HORIZONTAL = 'bottomLeft';
  @Output() readonly nzOpenChange = new EventEmitter<boolean>();
  @ViewChild(CdkOverlayOrigin, { static: true, read: ElementRef }) cdkOverlayOrigin: ElementRef | null = null;
  @ContentChildren(forwardRef(() => NzSubMenuComponent), { descendants: true }) listOfNzSubMenuComponent: QueryList<NzSubMenuComponent> | null = null;
  @ContentChildren(NzMenuItemComponent, { descendants: true })
  listOfNzMenuItemDirective: QueryList<NzMenuItemComponent> | null = null;

  private level = this.nzSubmenuService.level;
  position = 'right';
  triggerWidth: number | null = null;
  theme: NzMenuThemeType = 'light';
  mode: NzMenuModeType = 'vertical';
  inlinePaddingLeft: number | null = null;
  overlayPositions: any[] = [];
  isSelected = false;
  isActive = false;
  dir: Direction = 'ltr';

  /** set the submenu host open status directly **/
  setOpenStateWithoutDebounce(open: boolean): void {
    this.nzSubmenuService.setOpenStateWithoutDebounce(open);
  }

  toggleSubMenu(): void {
    this.setOpenStateWithoutDebounce(!this.nzOpen);
  }

  setMouseEnterState(value: boolean): void {
    this.isActive = value;
    if (this.mode !== 'inline') {
      this.nzSubmenuService.setMouseEnterTitleOrOverlayState(value);
    }
  }

  setTriggerWidth(): void {
    if (
      this.mode === 'horizontal' &&
      this.platform.isBrowser &&
      this.cdkOverlayOrigin &&
      this.nzPlacement === 'bottomLeft'
    ) {
      /** TODO: fast dom */
      this.triggerWidth = this.cdkOverlayOrigin!.nativeElement.getBoundingClientRect().width;
    }
  }

  onPositionChange(position: ConnectedOverlayPositionChange): void {
    this.position = this.nzSubmenuService.getPositionFromChange(position);
  }

  ngOnInit = (): void => {
    setupSubmenuSubscriptions(
      this.nzMenuService,
      this.nzSubmenuService,
      this.directionality,
      this.destroyRef,
      this.cdr,
      this.level,
      this.nzPlacement,
      (theme) => this.theme = theme,
      (mode) => { this.mode = mode; },
      (positions) => this.overlayPositions = positions,
      (padding) => this.inlinePaddingLeft = padding,
      (open) => { this.isActive = open; this.nzOpen = open; },
      () => this.setTriggerWidth(),
      this.nzOpen,
      (open) => { this.nzOpen = open; this.nzOpenChange.emit(this.nzOpen); },
      (dir) => this.dir = dir
    );
  };
  ngAfterContentInit = (): void => {
    this.setTriggerWidth();
    setupSubmenuContentInit(this.listOfNzMenuItemDirective!, this.destroyRef, this.cdr, (selected) => this.isSelected = selected);
  };

  ngOnChanges = (changes: SimpleChanges): void => {
    if (changes['nzOpen']) {
      this.nzSubmenuService.setOpenStateWithoutDebounce(this.nzOpen);
      this.setTriggerWidth();
    }
  };
}
