/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Direction, Directionality } from '@angular/cdk/bidi';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  booleanAttribute,
  forwardRef,
  inject,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';

import { treeCollapseMotion, NzNoAnimationDirective } from 'ng-zorro-antd/core/animation';
import { NzConfigKey, NzConfigService, WithConfig } from 'ng-zorro-antd/core/config';
import {
  NzFormatBeforeDropEvent,
  NzFormatEmitEvent,
  NzTreeBase,
  NzTreeBaseService,
  NzTreeHigherOrderServiceToken,
  NzTreeNode,
  NzTreeNodeKey,
  NzTreeNodeOptions,
  flattenTreeData
} from 'ng-zorro-antd/core/tree';
import { NzSafeAny } from 'ng-zorro-antd/core/types';

import { TreeBehaviorOptions, TreeDataOptions, TreeDisplayOptions, TreeStateOptions, TreeTemplateOptions, TreeVirtualScrollOptions } from './tree.types';
import { NzTreeNodeBuiltinComponent } from './tree-node.component';
import { NzTreeService } from './tree.service';

export function NzTreeServiceFactory(): NzTreeBaseService {
  const higherOrderService = inject(NzTreeHigherOrderServiceToken, { skipSelf: true, optional: true });
  const treeService = inject(NzTreeService);
  return higherOrderService ?? treeService;
}

const NZ_CONFIG_MODULE_NAME: NzConfigKey = 'tree';

@Component({
  selector: 'nz-tree',
  exportAs: 'nzTree',
  animations: [treeCollapseMotion],
  template: `
    <div>
      <input [style]="HIDDEN_STYLE" />
    </div>
    <div class="ant-tree-treenode" [style]="HIDDEN_NODE_STYLE">
      <div class="ant-tree-indent">
        <div class="ant-tree-indent-unit"></div>
      </div>
    </div>
    <div class="ant-tree-list" [class.ant-select-tree-list]="nzSelectMode" style="position: relative">
      @if (nzVirtualHeight) {
        <cdk-virtual-scroll-viewport
          [class.ant-select-tree-list-holder-inner]="nzSelectMode"
          [class.ant-tree-list-holder-inner]="!nzSelectMode"
          [itemSize]="nzVirtualItemSize"
          [minBufferPx]="nzVirtualMinBufferPx"
          [maxBufferPx]="nzVirtualMaxBufferPx"
          [style.height]="nzVirtualHeight"
        >
          <ng-container *cdkVirtualFor="let node of nzFlattenNodes; trackBy: trackByFlattenNode">
            <ng-template
              [ngTemplateOutlet]="nodeTemplate"
              [ngTemplateOutletContext]="{ $implicit: node }"
            ></ng-template>
          </ng-container>
        </cdk-virtual-scroll-viewport>
      } @else {
        <div
          [class.ant-select-tree-list-holder-inner]="nzSelectMode"
          [class.ant-tree-list-holder-inner]="!nzSelectMode"
          [@.disabled]="beforeInit || !!noAnimation?.nzNoAnimation?.()"
          [nzNoAnimation]="noAnimation?.nzNoAnimation?.()"
          [@treeCollapseMotion]="nzFlattenNodes.length"
        >
          @for (node of nzFlattenNodes; track trackByFlattenNode($index, node)) {
            <ng-template
              [ngTemplateOutlet]="nodeTemplate"
              [ngTemplateOutletContext]="{ $implicit: node }"
            ></ng-template>
          }
        </div>
      }
    </div>
    <ng-template #nodeTemplate let-treeNode>
      <nz-tree-node
        builtin
        [icon]="treeNode.icon"
        [title]="treeNode.title"
        [isLoading]="treeNode.isLoading"
        [isSelected]="treeNode.isSelected"
        [isDisabled]="treeNode.isDisabled"
        [isMatched]="treeNode.isMatched"
        [isExpanded]="treeNode.isExpanded"
        [isLeaf]="treeNode.isLeaf"
        [isStart]="treeNode.isStart"
        [isEnd]="treeNode.isEnd"
        [isChecked]="treeNode.isChecked"
        [isHalfChecked]="treeNode.isHalfChecked"
        [isDisableCheckbox]="treeNode.isDisableCheckbox"
        [isSelectable]="treeNode.isSelectable"
        [canHide]="treeNode.canHide"
        [nzTreeNode]="treeNode"
        [nzSelectMode]="nzSelectMode"
        [nzShowLine]="nzShowLine"
        [nzExpandedIcon]="nzExpandedIcon"
        [nzDraggable]="nzDraggable"
        [nzCheckable]="nzCheckable"
        [nzShowExpand]="nzShowExpand"
        [nzAsyncData]="nzAsyncData"
        [nzSearchValue]="nzSearchValue"
        [nzHideUnMatched]="nzHideUnMatched"
        [nzBeforeDrop]="nzBeforeDrop"
        [nzShowIcon]="nzShowIcon"
        [nzTreeTemplate]="nzTreeTemplate || nzTreeTemplateChild"
        (nzExpandChange)="eventTriggerChanged($event)"
        (nzClick)="eventTriggerChanged($event)"
        (nzDblClick)="eventTriggerChanged($event)"
        (nzContextMenu)="eventTriggerChanged($event)"
        (nzCheckboxChange)="eventTriggerChanged($event)"
        (nzOnDragStart)="eventTriggerChanged($event)"
        (nzOnDragEnter)="eventTriggerChanged($event)"
        (nzOnDragOver)="eventTriggerChanged($event)"
        (nzOnDragLeave)="eventTriggerChanged($event)"
        (nzOnDragEnd)="eventTriggerChanged($event)"
        (nzOnDrop)="eventTriggerChanged($event)"
      ></nz-tree-node>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    NzTreeService,
    {
      provide: NzTreeBaseService,
      useFactory: NzTreeServiceFactory
    },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NzTreeComponent),
      multi: true
    }
  ],
  host: {
    '[class.ant-select-tree]': `nzSelectMode`,
    '[class.ant-select-tree-show-line]': `nzSelectMode && nzShowLine`,
    '[class.ant-select-tree-icon-hide]': `nzSelectMode && !nzShowIcon`,
    '[class.ant-select-tree-block-node]': `nzSelectMode && nzBlockNode`,
    '[class.ant-tree]': `!nzSelectMode`,
    '[class.ant-tree-rtl]': `dir === 'rtl'`,
    '[class.ant-tree-show-line]': `!nzSelectMode && nzShowLine`,
    '[class.ant-tree-icon-hide]': `!nzSelectMode && !nzShowIcon`,
    '[class.ant-tree-block-node]': `!nzSelectMode && nzBlockNode`,
    '[class.draggable-tree]': `nzDraggable`
  },
  imports: [
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    NgTemplateOutlet,
    NzNoAnimationDirective,
    NzTreeNodeBuiltinComponent
  ]
})
export class NzTreeComponent extends NzTreeBase implements OnInit, ControlValueAccessor, OnChanges, AfterViewInit {
  readonly _nzModuleName: NzConfigKey = NZ_CONFIG_MODULE_NAME;

  noAnimation = inject(NzNoAnimationDirective, { host: true, optional: true });
  nzConfigService = inject(NzConfigService);
  private cdr = inject(ChangeDetectorRef);
  private directionality = inject(Directionality);
  private destroyRef = inject(DestroyRef);

  @Input() nzDisplayOptions: TreeDisplayOptions = {};
  @Input() nzBehaviorOptions: TreeBehaviorOptions = {};
  @Input() nzVirtualScrollOptions: TreeVirtualScrollOptions = {};
  @Input() nzTemplateOptions: TreeTemplateOptions = {};
  @Input() nzStateOptions: TreeStateOptions = {};
  @Input() nzDataOptions: TreeDataOptions = {};
  @Input() nzBeforeDrop?: (confirm: NzFormatBeforeDropEvent) => Observable<boolean>;

  // Getters para manter compatibilidade com código existente
  get nzShowIcon(): boolean {
    if (this.nzDisplayOptions.showIcon !== undefined) {
      return this.nzDisplayOptions.showIcon;
    }
    return this.nzConfigService.getConfigForComponent(this._nzModuleName)?.nzShowIcon ?? false;
  }

  get nzHideUnMatched(): boolean {
    if (this.nzDisplayOptions.hideUnMatched !== undefined) {
      return this.nzDisplayOptions.hideUnMatched;
    }
    return this.nzConfigService.getConfigForComponent(this._nzModuleName)?.nzHideUnMatched ?? false;
  }

  get nzBlockNode(): boolean {
    if (this.nzDisplayOptions.blockNode !== undefined) {
      return this.nzDisplayOptions.blockNode;
    }
    return this.nzConfigService.getConfigForComponent(this._nzModuleName)?.nzBlockNode ?? false;
  }

  get nzShowExpand(): boolean {
    return this.nzDisplayOptions.showExpand ?? true;
  }

  get nzShowLine(): boolean {
    return this.nzDisplayOptions.showLine ?? false;
  }

  get nzSelectMode(): boolean {
    return this.nzDisplayOptions.selectMode ?? false;
  }

  get nzExpandAll(): boolean {
    return this.nzBehaviorOptions.expandAll ?? false;
  }

  get nzCheckStrictly(): boolean {
    return this.nzBehaviorOptions.checkStrictly ?? false;
  }

  get nzCheckable(): boolean {
    return this.nzBehaviorOptions.checkable ?? false;
  }

  get nzAsyncData(): boolean {
    return this.nzBehaviorOptions.asyncData ?? false;
  }

  get nzDraggable(): boolean {
    return this.nzBehaviorOptions.draggable ?? false;
  }

  get nzMultiple(): boolean {
    return this.nzBehaviorOptions.multiple ?? false;
  }

  get nzExpandedIcon(): TemplateRef<{ $implicit: NzTreeNode; origin: NzTreeNodeOptions }> | undefined {
    return this.nzTemplateOptions.expandedIcon;
  }

  get nzTreeTemplate(): TemplateRef<{ $implicit: NzTreeNode; origin: NzTreeNodeOptions }> | undefined {
    return this.nzTemplateOptions.treeTemplate;
  }

  get nzVirtualItemSize(): number {
    return this.nzVirtualScrollOptions.virtualItemSize ?? 28;
  }

  get nzVirtualMaxBufferPx(): number {
    return this.nzVirtualScrollOptions.virtualMaxBufferPx ?? 500;
  }

  get nzVirtualMinBufferPx(): number {
    return this.nzVirtualScrollOptions.virtualMinBufferPx ?? 28;
  }

  get nzVirtualHeight(): string | null {
    return this.nzVirtualScrollOptions.virtualHeight ?? null;
  }

  get nzData(): NzTreeNodeOptions[] | NzTreeNode[] {
    return this.nzDataOptions.data ?? [];
  }

  get nzExpandedKeys(): NzTreeNodeKey[] {
    return this.nzStateOptions.expandedKeys ?? [];
  }

  get nzSelectedKeys(): NzTreeNodeKey[] {
    return this.nzStateOptions.selectedKeys ?? [];
  }

  get nzCheckedKeys(): NzTreeNodeKey[] {
    return this.nzStateOptions.checkedKeys ?? [];
  }

  get nzSearchValue(): string {
    return this.nzDataOptions.searchValue ?? '';
  }

  get nzSearchFunc(): ((node: NzTreeNodeOptions) => boolean) | undefined {
    return this.nzDataOptions.searchFunc;
  }
  @ContentChild('nzTreeTemplate', { static: true }) nzTreeTemplateChild!: TemplateRef<{
    $implicit: NzTreeNode;
    origin: NzTreeNodeOptions;
  }>;
  @ViewChild(CdkVirtualScrollViewport, { read: CdkVirtualScrollViewport })
  cdkVirtualScrollViewport!: CdkVirtualScrollViewport;
  nzFlattenNodes: NzTreeNode[] = [];
  beforeInit = true;
  dir: Direction = 'ltr';

  @Output() readonly nzExpandedKeysChange: EventEmitter<string[]> = new EventEmitter<string[]>();
  @Output() readonly nzSelectedKeysChange: EventEmitter<string[]> = new EventEmitter<string[]>();
  @Output() readonly nzCheckedKeysChange: EventEmitter<NzTreeNodeKey[]> = new EventEmitter<NzTreeNodeKey[]>();
  @Output() readonly nzSearchValueChange = new EventEmitter<NzFormatEmitEvent>();
  @Output() readonly nzClick = new EventEmitter<NzFormatEmitEvent>();
  @Output() readonly nzDblClick = new EventEmitter<NzFormatEmitEvent>();
  @Output() readonly nzContextMenu = new EventEmitter<NzFormatEmitEvent>();
  @Output() readonly nzCheckboxChange = new EventEmitter<NzFormatEmitEvent>();
  @Output() readonly nzExpandChange = new EventEmitter<NzFormatEmitEvent>();
  @Output() readonly nzOnDragStart = new EventEmitter<NzFormatEmitEvent>();
  @Output() readonly nzOnDragEnter = new EventEmitter<NzFormatEmitEvent>();
  @Output() readonly nzOnDragOver = new EventEmitter<NzFormatEmitEvent>();
  @Output() readonly nzOnDragLeave = new EventEmitter<NzFormatEmitEvent>();
  @Output() readonly nzOnDrop = new EventEmitter<NzFormatEmitEvent>();
  @Output() readonly nzOnDragEnd = new EventEmitter<NzFormatEmitEvent>();

  HIDDEN_STYLE = {
    width: 0,
    height: 0,
    display: 'flex',
    overflow: 'hidden',
    opacity: 0,
    border: 0,
    padding: 0,
    margin: 0
  };

  HIDDEN_NODE_STYLE = {
    position: 'absolute',
    pointerEvents: 'none',
    visibility: 'hidden',
    height: 0,
    overflow: 'hidden'
  };

  onChange: (value: NzTreeNode[]) => void = () => null;
  onTouched: () => void = () => null;

  writeValue(value: NzTreeNode[]): void {
    this.handleNzData(value);
  }

  registerOnChange(fn: (_: NzTreeNode[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Render all properties of nzTree
   *
   * @param changes all changes from @Input
   */
  renderTreeProperties(changes: SimpleChanges): void {
    let useDefaultExpandedKeys = false;
    let expandAll = false;
    const {
      nzDataOptions,
      nzStateOptions,
      nzBehaviorOptions
    } = changes;

    if (nzBehaviorOptions) {
      if (nzBehaviorOptions.previousValue?.expandAll !== nzBehaviorOptions.currentValue?.expandAll) {
        useDefaultExpandedKeys = true;
        expandAll = this.nzExpandAll;
      }

      if (nzBehaviorOptions.previousValue?.multiple !== nzBehaviorOptions.currentValue?.multiple) {
        this.nzTreeService.isMultiple = this.nzMultiple;
      }

      if (nzBehaviorOptions.previousValue?.checkStrictly !== nzBehaviorOptions.currentValue?.checkStrictly) {
        this.nzTreeService.isCheckStrictly = this.nzCheckStrictly;
        this.handleCheckedKeys(null);
      }
    }

    if (nzDataOptions) {
      if (nzDataOptions.previousValue?.data !== nzDataOptions.currentValue?.data) {
        this.handleNzData(this.nzData);
      }

      if (nzDataOptions.previousValue?.searchValue !== nzDataOptions.currentValue?.searchValue) {
        const searchValue = nzDataOptions.currentValue?.searchValue;
        if (!(nzDataOptions.firstChange && !searchValue)) {
          useDefaultExpandedKeys = false;
          this.handleSearchValue(searchValue, this.nzSearchFunc);
          this.nzSearchValueChange.emit(this.nzTreeService.formatEvent('search', null, null));
        }
      }
    }

    if (nzStateOptions) {
      if (nzStateOptions.previousValue?.checkedKeys !== nzStateOptions.currentValue?.checkedKeys) {
        this.handleCheckedKeys(this.nzCheckedKeys);
      }

      if (nzStateOptions.previousValue?.expandedKeys !== nzStateOptions.currentValue?.expandedKeys || nzBehaviorOptions) {
        useDefaultExpandedKeys = true;
        this.handleExpandedKeys(expandAll || this.nzExpandedKeys);
      }

      if (nzStateOptions.previousValue?.selectedKeys !== nzStateOptions.currentValue?.selectedKeys) {
        this.handleSelectedKeys(this.nzSelectedKeys, this.nzMultiple);
      }
    }

    // flatten data
    const currentExpandedKeys = this.getExpandedNodeList().map(v => v.key);
    const newExpandedKeys = useDefaultExpandedKeys ? expandAll || this.nzExpandedKeys : currentExpandedKeys;
    this.handleFlattenNodes(this.nzTreeService.rootNodes, newExpandedKeys);
  }

  trackByFlattenNode(_: number, node: NzTreeNode): string {
    return node.key;
  }
  // Deal with properties
  /**
   * nzData
   *
   * @param value
   */
  handleNzData(value: NzSafeAny[]): void {
    if (Array.isArray(value)) {
      const data = this.coerceTreeNodes(value);
      this.nzTreeService.initTree(data);
    }
  }

  handleFlattenNodes(data: NzTreeNode[], expandKeys: NzTreeNodeKey[] | true = []): void {
    this.nzTreeService.flattenTreeData(data, expandKeys);
  }

  handleCheckedKeys(keys: NzTreeNodeKey[] | null): void {
    this.nzTreeService.conductCheck(keys, this.nzCheckStrictly);
  }

  handleExpandedKeys(keys: NzTreeNodeKey[] | true = []): void {
    this.nzTreeService.conductExpandedKeys(keys);
  }

  handleSelectedKeys(keys: NzTreeNodeKey[], isMulti: boolean): void {
    this.nzTreeService.conductSelectedKeys(keys, isMulti);
  }

  handleSearchValue(value: string, searchFunc?: (node: NzTreeNodeOptions) => boolean): void {
    const dataList = flattenTreeData(this.nzTreeService.rootNodes, true).map(v => v.data);
    const checkIfMatched = (node: NzTreeNode): boolean => {
      if (searchFunc) {
        return searchFunc(node.origin);
      }
      return !!value && node.title.toLowerCase().includes(value.toLowerCase());
    };
    dataList.forEach(v => {
      v.isMatched = checkIfMatched(v);
      v.canHide = !v.isMatched;
      if (!v.isMatched) {
        v.setExpanded(false);
        this.nzTreeService.setExpandedNodeList(v);
      } else {
        // expand
        this.nzTreeService.expandNodeAllParentBySearch(v);
      }
      this.nzTreeService.setMatchedNodeList(v);
    });
  }

  /**
   * Handle emit event
   *
   * @param event
   * handle each event
   */
  eventTriggerChanged(event: NzFormatEmitEvent): void {
    const node = event.node!;
    switch (event.eventName) {
      case 'expand':
        this.renderTree();
        this.nzExpandChange.emit(event);
        break;
      case 'click':
        this.nzClick.emit(event);
        break;
      case 'dblclick':
        this.nzDblClick.emit(event);
        break;
      case 'contextmenu':
        this.nzContextMenu.emit(event);
        break;
      case 'check': {
        // Render checked state with nodes' property `isChecked`
        this.nzTreeService.setCheckedNodeList(node);
        if (!this.nzCheckStrictly) {
          this.nzTreeService.conduct(node);
        }
        // Cause check method will rerender list, so we need recover it and next the new event to user
        const eventNext = this.nzTreeService.formatEvent('check', node, event.event!);
        this.nzCheckboxChange.emit(eventNext);
        const checkedKeys = this.nzTreeService.getCheckedNodeKeys();
        this.nzCheckedKeysChange.emit(checkedKeys);
        break;
      }
      case 'dragstart':
        // if node is expanded
        if (node.isExpanded) {
          node.setExpanded(!node.isExpanded);
          this.renderTree();
        }
        this.nzOnDragStart.emit(event);
        break;
      case 'dragenter': {
        const selectedNode = this.nzTreeService.getSelectedNode();
        if (selectedNode && selectedNode.key !== node.key && !node.isExpanded && !node.isLeaf) {
          node.setExpanded(true);
          this.renderTree();
        }
        this.nzOnDragEnter.emit(event);
        break;
      }
      case 'dragover':
        this.nzOnDragOver.emit(event);
        break;
      case 'dragleave':
        this.nzOnDragLeave.emit(event);
        break;
      case 'dragend':
        this.nzOnDragEnd.emit(event);
        break;
      case 'drop':
        this.renderTree();
        this.nzOnDrop.emit(event);
        break;
    }
  }

  /**
   * Click expand icon
   */
  renderTree(): void {
    this.handleFlattenNodes(
      this.nzTreeService.rootNodes,
      this.getExpandedNodeList().map(v => v.key)
    );
    this.cdr.markForCheck();
  }

  constructor() {
    super(inject(NzTreeBaseService));
  }

  ngOnInit(): void {
    this.nzTreeService.flattenNodes$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.nzFlattenNodes =
        !!this.nzVirtualHeight && this.nzHideUnMatched && this.nzSearchValue?.length > 0
          ? data.filter(d => !d.canHide)
          : data;
      this.cdr.markForCheck();
    });

    this.dir = this.directionality.value;
    this.directionality.change?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((direction: Direction) => {
      this.dir = direction;
      this.cdr.detectChanges();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.renderTreeProperties(changes);
  }

  ngAfterViewInit(): void {
    this.beforeInit = false;
  }
}
