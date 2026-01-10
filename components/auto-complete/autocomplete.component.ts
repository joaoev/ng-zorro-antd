/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { AnimationEvent } from '@angular/animations';
import { Direction, Directionality } from '@angular/cdk/bidi';
import { NgTemplateOutlet } from '@angular/common';
import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
  booleanAttribute
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { slideMotion, NzNoAnimationDirective } from 'ng-zorro-antd/core/animation';
import { CompareWith, NzSafeAny } from 'ng-zorro-antd/core/types';
import { numberAttributeWithZeroFallback } from 'ng-zorro-antd/core/util';

import { NzAutocompleteOptionComponent } from './autocomplete-option.component';
import { NzAutocompleteOptionService } from './autocomplete-option.service';
import { AutocompleteDataSource, AutocompleteDataSourceItem, normalizeDataSource } from './autocomplete.types';

export { AutocompleteDataSource, AutocompleteDataSourceItem };

@Component({
  selector: 'nz-autocomplete',
  exportAs: 'nzAutocomplete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet, NzAutocompleteOptionComponent, NzNoAnimationDirective],
  templateUrl: './autocomplete.component.html',
  animations: [slideMotion],
  providers: [NzAutocompleteOptionService]
})
export class NzAutocompleteComponent implements AfterContentInit, AfterViewInit, OnInit, OnChanges {
  private changeDetectorRef = inject(ChangeDetectorRef);
  private directionality = inject(Directionality);
  private destroyRef = inject(DestroyRef);
  @Input({ transform: numberAttributeWithZeroFallback }) nzWidth?: number;
  @Input() nzOverlayClassName = '';
  @Input() nzOverlayStyle: Record<string, string> = {};
  @Input({ transform: booleanAttribute }) nzDefaultActiveFirstOption = true;
  @Input({ transform: booleanAttribute }) nzBackfill = false;
  @Input() compareWith: CompareWith = (o1, o2) => o1 === o2;
  @Input() nzDataSource?: AutocompleteDataSource;
  @Output()
  readonly selectionChange: EventEmitter<NzAutocompleteOptionComponent> =
    new EventEmitter<NzAutocompleteOptionComponent>();

  showPanel: boolean = true;
  isOpen: boolean = false;
  activeItem: NzAutocompleteOptionComponent | null = null;
  dir: Direction = 'ltr';
  normalizedDataSource: AutocompleteDataSourceItem[] = [];
  animationStateChange = new EventEmitter<AnimationEvent>();

  /**
   * Options accessor, its source may be content or dataSource
   */
  get options(): QueryList<NzAutocompleteOptionComponent> {
    // first dataSource
    if (this.nzDataSource) {
      return this.fromDataSourceOptions;
    } else {
      return this.fromContentOptions;
    }
  }

  /** Provided by content */
  @ContentChildren(NzAutocompleteOptionComponent, { descendants: true })
  fromContentOptions!: QueryList<NzAutocompleteOptionComponent>;
  /** Provided by dataSource */
  @ViewChildren(NzAutocompleteOptionComponent) fromDataSourceOptions!: QueryList<NzAutocompleteOptionComponent>;

  /** cdk-overlay */
  @ViewChild(TemplateRef, { static: false }) template?: TemplateRef<{}>;
  @ViewChild('panel', { static: false }) panel?: ElementRef;
  @ViewChild('content', { static: false }) content?: ElementRef;

  private activeItemIndex: number = -1;
  private optionService = inject(NzAutocompleteOptionService);

  noAnimation = inject(NzNoAnimationDirective, { host: true, optional: true });

  constructor() {
    this.optionService.initDestroy(this.destroyRef);
  }

  ngOnInit(): void {
    this.directionality.change?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((direction: Direction) => {
      this.dir = direction;
      this.changeDetectorRef.detectChanges();
    });

    this.dir = this.directionality.value;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { nzDataSource } = changes;
    if (nzDataSource) {
      this.normalizedDataSource = normalizeDataSource(nzDataSource.currentValue);
    }
  }

  onAnimationEvent(event: AnimationEvent): void {
    this.animationStateChange.emit(event);
  }

  ngAfterContentInit(): void {
    if (!this.nzDataSource) {
      this.optionsInit();
    }
  }

  ngAfterViewInit(): void {
    if (this.nzDataSource) {
      this.optionsInit();
    }
  }

  setVisibility(): void {
    this.showPanel = !!this.options.length;
    this.changeDetectorRef.markForCheck();
  }

  setActiveItem(index: number): void {
    const activeItem = this.options.get(index);
    if (activeItem && !activeItem.active) {
      this.activeItem = activeItem;
      this.activeItemIndex = index;
      this.clearSelectedOptions(this.activeItem);
      this.activeItem.setActiveStyles();
    } else {
      this.activeItem = null;
      this.activeItemIndex = -1;
      this.clearSelectedOptions();
    }
    this.changeDetectorRef.markForCheck();
  }

  setNextItemActive(): void {
    const nextIndex = this.activeItemIndex + 1 <= this.options.length - 1 ? this.activeItemIndex + 1 : 0;
    this.setActiveItem(nextIndex);
  }

  setPreviousItemActive(): void {
    const previousIndex = this.activeItemIndex - 1 < 0 ? this.options.length - 1 : this.activeItemIndex - 1;
    this.setActiveItem(previousIndex);
  }

  getOptionIndex(value: NzSafeAny): number {
    return this.options.reduce(
      (result: number, current: NzAutocompleteOptionComponent, index: number) =>
        result === -1 ? (this.compareWith(value, current.nzValue) ? index : -1) : result,
      -1
    )!;
  }

  getOption(value: NzSafeAny): NzAutocompleteOptionComponent | null {
    return this.options.find(item => this.compareWith(value, item.nzValue)) || null;
  }

  private optionsInit(): void {
    this.setVisibility();
    this.subscribeOptionChanges();
    const changes = this.nzDataSource ? this.fromDataSourceOptions.changes : this.fromContentOptions.changes;

    this.optionService.subscribeToDataSourceChanges(
      changes,
      () => this.isOpen,
      () => this.setVisibility(),
      () => this.subscribeOptionChanges()
    );
  }

  /**
   * Clear the status of options
   */
  clearSelectedOptions(skip?: NzAutocompleteOptionComponent | null, deselect: boolean = false): void {
    this.options.forEach(option => {
      if (option !== skip) {
        if (deselect) {
          option.deselect();
        }
        option.setInactiveStyles();
      }
    });
  }

  private subscribeOptionChanges(): void {
    this.optionService.subscribeOptionChanges(this.options, {
      onSelectionChange: (option: NzAutocompleteOptionComponent) => {
        option.select();
        option.setActiveStyles();
        this.activeItem = option;
        this.activeItemIndex = this.getOptionIndex(this.activeItem.nzValue);
        this.clearSelectedOptions(option, true);
        this.selectionChange.emit(option);
      },
      onMouseEnter: (option: NzAutocompleteOptionComponent) => {
        option.setActiveStyles();
        this.activeItem = option;
        this.activeItemIndex = this.getOptionIndex(this.activeItem.nzValue);
        this.clearSelectedOptions(option);
      }
    });
  }
}
