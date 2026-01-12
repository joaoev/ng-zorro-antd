/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { DestroyRef, ChangeDetectorRef, QueryList } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, merge } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { Direction, Directionality } from '@angular/cdk/bidi';
import { MenuService } from './menu.service';
import { NzSubmenuService } from './submenu.service';
import { NzMenuItemComponent } from './menu-item.component';
import { NzMenuThemeType, NzMenuModeType } from './menu.types';
import { POSITION_MAP, POSITION_TYPE_HORIZONTAL } from 'ng-zorro-antd/core/overlay';

const listOfVerticalPositions = [POSITION_MAP.rightTop, POSITION_MAP.right, POSITION_MAP.rightBottom, POSITION_MAP.leftTop, POSITION_MAP.left, POSITION_MAP.leftBottom];
const listOfHorizontalPositions = [POSITION_MAP.bottomLeft, POSITION_MAP.bottomRight, POSITION_MAP.topRight, POSITION_MAP.topLeft];

export function setupSubmenuSubscriptions(
  nzMenuService: MenuService,
  nzSubmenuService: NzSubmenuService,
  directionality: Directionality,
  destroyRef: DestroyRef,
  cdr: ChangeDetectorRef,
  level: number,
  nzPlacement: POSITION_TYPE_HORIZONTAL,
  setThemeFn: (theme: NzMenuThemeType) => void,
  setModeFn: (mode: NzMenuModeType) => void,
  setOverlayPositionsFn: (positions: any[]) => void,
  setInlinePaddingLeftFn: (padding: number | null) => void,
  setOpenStateFn: (open: boolean) => void,
  setTriggerWidthFn: () => void,
  nzOpen: boolean,
  nzOpenChangeFn: (open: boolean) => void,
  setDirFn: (dir: Direction) => void
): void {
  nzMenuService.theme$.pipe(takeUntilDestroyed(destroyRef)).subscribe(theme => {
    setThemeFn(theme);
    cdr.markForCheck();
  });

  nzSubmenuService.mode$.pipe(takeUntilDestroyed(destroyRef)).subscribe(mode => {
    setModeFn(mode);
    if (mode === 'horizontal') {
      setOverlayPositionsFn([POSITION_MAP[nzPlacement], ...listOfHorizontalPositions]);
    } else if (mode === 'vertical') {
      setOverlayPositionsFn(listOfVerticalPositions);
    }
    cdr.markForCheck();
  });

  combineLatest([nzSubmenuService.mode$, nzMenuService.inlineIndent$])
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe(([mode, inlineIndent]) => {
      setInlinePaddingLeftFn(mode === 'inline' ? level * inlineIndent : null);
      cdr.markForCheck();
    });

  nzSubmenuService.isCurrentSubMenuOpen$.pipe(takeUntilDestroyed(destroyRef)).subscribe(open => {
    setOpenStateFn(open);
    if (open !== nzOpen) {
      setTriggerWidthFn();
      nzOpenChangeFn(open);
      cdr.markForCheck();
    }
  });

  setDirFn(directionality.value);
  directionality.change?.pipe(takeUntilDestroyed(destroyRef)).subscribe(direction => {
    setDirFn(direction);
    cdr.markForCheck();
  });
}

export function setupSubmenuContentInit(
  listOfNzMenuItemDirective: QueryList<NzMenuItemComponent>,
  destroyRef: DestroyRef,
  cdr: ChangeDetectorRef,
  setIsSelectedFn: (selected: boolean) => void
): void {
  const changes = listOfNzMenuItemDirective!.changes;
  const mergedObservable = merge(changes, ...listOfNzMenuItemDirective!.map(menu => menu.selected$));
  changes
    .pipe(
      startWith(listOfNzMenuItemDirective),
      switchMap(() => mergedObservable),
      startWith(true),
      map(() => listOfNzMenuItemDirective!.some(e => e.nzSelected)),
      takeUntilDestroyed(destroyRef)
    )
    .subscribe(selected => {
      setIsSelectedFn(selected);
      cdr.markForCheck();
    });
}
