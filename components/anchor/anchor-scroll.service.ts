/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import { DestroyRef, ElementRef, inject, Injectable, Renderer2 } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, throttleTime } from 'rxjs/operators';

import { NzScrollService } from 'ng-zorro-antd/core/services';
import { NzDirectionVHType } from 'ng-zorro-antd/core/types';
import { fromEventOutsideAngular } from 'ng-zorro-antd/core/util';

import { NzAnchorLinkComponent } from './anchor-link.component';
import {
  PASSIVE_EVENT_LISTENER_OPTIONS,
  SCROLL_THROTTLE_TIME,
  SHARP_MATCHER_REGEX,
  VISIBLE_CLASSNAME
} from './anchor.constants';
import { AnchorScrollConfig, Section } from './anchor.types';
import { getOffsetTop } from './util';

@Injectable()
export class NzAnchorScrollService {
  private scrollSrv = inject(NzScrollService);
  private platform = inject(Platform);
  private renderer = inject(Renderer2);
  private doc: Document = inject(DOCUMENT);

  private destroy$ = new Subject<boolean>();
  private handleScrollTimeoutID?: ReturnType<typeof setTimeout>;
  private animating = false;

  visible = false;
  activeLink?: string;

  initDestroy(destroyRef: DestroyRef): void {
    destroyRef.onDestroy(() => {
      clearTimeout(this.handleScrollTimeoutID);
      this.destroy$.next(true);
      this.destroy$.complete();
    });
  }

  registerScrollEvent(container: HTMLElement | Window, onScroll: () => void): void {
    if (!this.platform.isBrowser) {
      return;
    }

    this.destroy$.next(true);

    fromEventOutsideAngular(container, 'scroll', PASSIVE_EVENT_LISTENER_OPTIONS)
      .pipe(throttleTime(SCROLL_THROTTLE_TIME), takeUntil(this.destroy$))
      .subscribe(() => onScroll());

    this.handleScrollTimeoutID = setTimeout(() => onScroll());
  }

  calculateSections(links: NzAnchorLinkComponent[], config: AnchorScrollConfig): Section[] {
    const scope = (config.targetOffset ?? config.offsetTop) + config.bounds;
    const sections: Section[] = [];

    links.forEach(comp => {
      const sharpLinkMatch = SHARP_MATCHER_REGEX.exec(comp.nzHref.toString());
      if (!sharpLinkMatch) {
        return;
      }

      const target = this.doc.getElementById(sharpLinkMatch[1]);
      if (target) {
        const top = getOffsetTop(target, config.container);
        if (top < scope) {
          sections.push({ top, comp });
        }
      }
    });

    return sections;
  }

  findMaxSection(sections: Section[]): Section {
    return sections.reduce((prev, curr) => (curr.top > prev.top ? curr : prev));
  }

  isAnimating(): boolean {
    return this.animating;
  }

  setInkPosition(inkElement: ElementRef, linkComp: NzAnchorLinkComponent, direction: NzDirectionVHType): void {
    const linkNode = linkComp.getLinkTitleElement();

    if (direction === 'vertical') {
      (inkElement as { ['nativeElement']: HTMLElement })['nativeElement'].style.top =
        `${linkNode.offsetTop + linkNode.clientHeight / 2 - 4.5}px`;
    } else {
      (inkElement as { ['nativeElement']: HTMLElement })['nativeElement'].style.left =
        `${linkNode.offsetLeft + linkNode.clientWidth / 2}px`;
    }
  }

  setInkVisibility(inkElement: ElementRef, visible: boolean): void {
    const nativeElement = (inkElement as { ['nativeElement']: HTMLElement })['nativeElement'];
    if (visible) {
      this.renderer.addClass(nativeElement, VISIBLE_CLASSNAME);
    } else {
      this.renderer.removeClass(nativeElement, VISIBLE_CLASSNAME);
    }
  }

  scrollTo(
    linkComp: NzAnchorLinkComponent,
    container: HTMLElement | Window,
    offsetTop: number,
    onComplete: () => void
  ): void {
    const el = this.doc.querySelector<HTMLElement>(linkComp.nzHref);
    if (!el) {
      return;
    }

    this.animating = true;
    const containerScrollTop = this.scrollSrv.getScroll(container);
    const elOffsetTop = getOffsetTop(el, container);
    const targetScrollTop = containerScrollTop + elOffsetTop - offsetTop;

    this.scrollSrv.scrollTo(container, targetScrollTop, {
      callback: () => {
        this.animating = false;
        onComplete();
      }
    });
  }
}
