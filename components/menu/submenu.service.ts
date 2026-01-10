/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { ConnectedOverlayPositionChange, ConnectionPositionPair } from '@angular/cdk/overlay';
import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, Subject, combineLatest, merge } from 'rxjs';
import { auditTime, distinctUntilChanged, filter, map, mergeMap } from 'rxjs/operators';

import { getPlacementName, POSITION_MAP, POSITION_TYPE_HORIZONTAL } from 'ng-zorro-antd/core/overlay';
import { NzSafeAny } from 'ng-zorro-antd/core/types';

import { MenuService } from './menu.service';
import { NzIsMenuInsideDropdownToken } from './menu.token';
import { NzMenuModeType } from './menu.types';

export const SUBMENU_VERTICAL_POSITIONS = [
  POSITION_MAP.rightTop,
  POSITION_MAP.right,
  POSITION_MAP.rightBottom,
  POSITION_MAP.leftTop,
  POSITION_MAP.left,
  POSITION_MAP.leftBottom
];

export const SUBMENU_HORIZONTAL_POSITIONS = [
  POSITION_MAP.bottomLeft,
  POSITION_MAP.bottomRight,
  POSITION_MAP.topRight,
  POSITION_MAP.topLeft
];

@Injectable()
export class NzSubmenuService {
  public readonly nzMenuService = inject(MenuService);
  private readonly isMenuInsideDropdown = inject(NzIsMenuInsideDropdownToken);
  private readonly nzHostSubmenuService = inject(NzSubmenuService, { optional: true, skipSelf: true });

  mode$: Observable<NzMenuModeType> = this.nzMenuService.mode$.pipe(
    map(mode => {
      if (mode === 'inline') {
        return 'inline';
        /** if inside another submenu, set the mode to vertical **/
      } else if (mode === 'vertical' || this.nzHostSubmenuService) {
        return 'vertical';
      } else {
        return 'horizontal';
      }
    })
  );
  level = 1;
  isCurrentSubMenuOpen$ = new BehaviorSubject<boolean>(false);
  private isChildSubMenuOpen$ = new BehaviorSubject<boolean>(false);
  /** submenu title & overlay mouse enter status **/
  private isMouseEnterTitleOrOverlay$ = new Subject<boolean>();
  private childMenuItemClick$ = new Subject<NzSafeAny>();
  /**
   * menu item inside submenu clicked
   */
  onChildMenuItemClick(menu: NzSafeAny): void {
    this.childMenuItemClick$.next(menu);
  }
  setOpenStateWithoutDebounce(value: boolean): void {
    this.isCurrentSubMenuOpen$.next(value);
  }
  setMouseEnterTitleOrOverlayState(value: boolean): void {
    this.isMouseEnterTitleOrOverlay$.next(value);
  }

  getOverlayPositions(mode: NzMenuModeType, placement: POSITION_TYPE_HORIZONTAL): ConnectionPositionPair[] {
    if (mode === 'horizontal') {
      return [POSITION_MAP[placement], ...SUBMENU_HORIZONTAL_POSITIONS];
    } else if (mode === 'vertical') {
      return SUBMENU_VERTICAL_POSITIONS;
    }
    return SUBMENU_VERTICAL_POSITIONS;
  }

  getPositionFromChange(position: ConnectedOverlayPositionChange): 'left' | 'right' {
    const placement = getPlacementName(position);
    if (placement === 'rightTop' || placement === 'rightBottom' || placement === 'right') {
      return 'right';
    } else if (placement === 'leftTop' || placement === 'leftBottom' || placement === 'left') {
      return 'left';
    }
    return 'right';
  }

  constructor() {
    if (this.nzHostSubmenuService) {
      this.level = this.nzHostSubmenuService.level + 1;
    }

    /** close if menu item clicked **/
    const isClosedByMenuItemClick = this.childMenuItemClick$.pipe(
      mergeMap(() => this.mode$),
      filter(mode => mode !== 'inline' || this.isMenuInsideDropdown),
      map(() => false)
    );
    const isCurrentSubmenuOpen$ = merge(this.isMouseEnterTitleOrOverlay$, isClosedByMenuItemClick);
    /** combine the child submenu status with current submenu status to calculate host submenu open **/
    const isSubMenuOpenWithDebounce$ = combineLatest([this.isChildSubMenuOpen$, isCurrentSubmenuOpen$]).pipe(
      map(([isChildSubMenuOpen, isCurrentSubmenuOpen]) => isChildSubMenuOpen || isCurrentSubmenuOpen),
      auditTime(150)
    );
    isSubMenuOpenWithDebounce$.pipe(distinctUntilChanged(), takeUntilDestroyed()).subscribe(data => {
      this.setOpenStateWithoutDebounce(data);
      if (this.nzHostSubmenuService) {
        /** set parent submenu's child submenu open status **/
        this.nzHostSubmenuService.isChildSubMenuOpen$.next(data);
      } else {
        this.nzMenuService.isChildSubMenuOpen$.next(data);
      }
    });
  }
}
