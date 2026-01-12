/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  numberAttribute,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';

import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzConfigKey, NzConfigService, WithConfig } from 'ng-zorro-antd/core/config';
import { NgStyleInterface, NzDirectionVHType } from 'ng-zorro-antd/core/types';
import { numberAttributeWithZeroFallback } from 'ng-zorro-antd/core/util';

import { NzAnchorLinkComponent } from './anchor-link.component';
import { NzAnchorScrollService } from './anchor-scroll.service';
import { NZ_ANCHOR_CONFIG_MODULE_NAME } from './anchor.constants';

@Component({
  selector: 'nz-anchor',
  exportAs: 'nzAnchor',
  imports: [NgTemplateOutlet, NzAffixModule],
  template: `
    @if (nzAffix) {
      <nz-affix [nzOffsetTop]="nzOffsetTop" [nzTarget]="container">
        <ng-template [ngTemplateOutlet]="content"></ng-template>
      </nz-affix>
    } @else {
      <ng-template [ngTemplateOutlet]="content"></ng-template>
    }

    <ng-template #content>
      <div
        class="ant-anchor-wrapper"
        [class]="{ 'ant-anchor-wrapper-horizontal': nzDirection === 'horizontal' }"
        [style]="wrapperStyle"
      >
        <div class="ant-anchor" [class]="{ 'ant-anchor-fixed': !nzAffix && !nzShowInkInFixed }">
          <div class="ant-anchor-ink">
            <div class="ant-anchor-ink-ball" #ink></div>
          </div>
          <ng-content></ng-content>
        </div>
      </div>
    </ng-template>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NzAnchorScrollService]
})
export class NzAnchorComponent implements AfterViewInit, OnChanges {
  public nzConfigService = inject(NzConfigService);
  private cdr = inject(ChangeDetectorRef);
  private doc: Document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  private scrollService = inject(NzAnchorScrollService);

  readonly _nzModuleName: NzConfigKey = NZ_ANCHOR_CONFIG_MODULE_NAME;

  @ViewChild('ink', { static: false }) private ink!: ElementRef;

  @Input({ transform: booleanAttribute }) nzAffix = true;

  @Input({ transform: booleanAttribute })
  @WithConfig()
  nzShowInkInFixed: boolean = false;

  @Input({ transform: numberAttribute })
  @WithConfig()
  nzBounds: number = 5;

  @Input({ transform: numberAttributeWithZeroFallback })
  @WithConfig()
  nzOffsetTop?: number = undefined;

  @Input({ transform: numberAttributeWithZeroFallback })
  @WithConfig()
  nzTargetOffset?: number = undefined;

  @Input() nzContainer?: string | HTMLElement;
  @Input() nzCurrentAnchor?: string;
  @Input() nzDirection: NzDirectionVHType = 'vertical';

  @Output() readonly nzClick = new EventEmitter<string>();
  @Output() readonly nzChange = new EventEmitter<string>();
  @Output() readonly nzScroll = new EventEmitter<NzAnchorLinkComponent>();

  visible = false;
  wrapperStyle: NgStyleInterface = { 'max-height': '100vh' };

  container?: HTMLElement | Window;

  private links: NzAnchorLinkComponent[] = [];

  get activeLink(): string | undefined {
    return this.scrollService.activeLink;
  }

  constructor() {
    this.scrollService.initDestroy(this.destroyRef);
  }

  registerLink(link: NzAnchorLinkComponent): void {
    this.links.push(link);
  }

  unregisterLink(link: NzAnchorLinkComponent): void {
    this.links.splice(this.links.indexOf(link), 1);
  }

  private getContainer(): HTMLElement | Window {
    return this.container || window;
  }

  ngAfterViewInit(): void {
    this.scrollService.registerScrollEvent(this.getContainer(), () => this.handleScroll());
  }

  handleScroll(): void {
    if (typeof document === 'undefined' || this.scrollService.isAnimating()) {
      return;
    }

    const config = {
      offsetTop: this.nzTargetOffset ?? this.nzOffsetTop ?? 0,
      bounds: this.nzBounds,
      targetOffset: this.nzTargetOffset,
      container: this.getContainer()
    };

    const sections = this.scrollService.calculateSections(this.links, config);

    this.visible = !!sections.length;
    if (!this.visible) {
      this.clearActive();
      this.cdr.detectChanges();
    } else {
      const maxSection = this.scrollService.findMaxSection(sections);
      this.handleActive(maxSection.comp);
    }
    this.setVisible();
  }

  private clearActive(): void {
    this.links.forEach(i => i.unsetActive());
  }

  private setActive(comp?: NzAnchorLinkComponent): void {
    const originalActiveLink = this.activeLink;
    const targetComp = (this.nzCurrentAnchor && this.links.find(n => n.nzHref === this.nzCurrentAnchor)) || comp;
    if (!targetComp) return;

    targetComp.setActive();
    this.scrollService.setInkPosition(this.ink, targetComp, this.nzDirection);
    this.scrollService.activeLink = (comp || targetComp).nzHref;

    if (originalActiveLink !== this.activeLink) {
      this.nzChange.emit(this.activeLink);
    }
  }

  private handleActive(comp: NzAnchorLinkComponent): void {
    this.clearActive();
    this.setActive(comp);
    this.visible = true;
    this.setVisible();
    this.nzScroll.emit(comp);
  }

  private setVisible(): void {
    if (this.ink) {
      this.scrollService.setInkVisibility(this.ink, this.visible);
    }
  }

  handleScrollTo(linkComp: NzAnchorLinkComponent): void {
    const offsetTop = this.nzTargetOffset ?? this.nzOffsetTop ?? 0;

    this.scrollService.scrollTo(linkComp, this.getContainer(), offsetTop, () => {
      this.handleActive(linkComp);
    });

    this.nzClick.emit(linkComp.nzHref);
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { nzOffsetTop, nzContainer, nzCurrentAnchor } = changes;

    if (nzOffsetTop) {
      this.wrapperStyle = { 'max-height': `calc(100vh - ${this.nzOffsetTop}px)` };
    }

    if (nzContainer) {
      const container = this.nzContainer;
      this.container = typeof container === 'string' ? this.doc.querySelector<HTMLElement>(container)! : container;
      this.scrollService.registerScrollEvent(this.getContainer(), () => this.handleScroll());
    }

    if (nzCurrentAnchor) {
      this.setActive();
    }
  }
}
