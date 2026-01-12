/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { DestroyRef, inject, Injectable, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';

import type { editor, IDisposable } from 'monaco-editor';

import { warn } from 'ng-zorro-antd/core/logger';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { fromEventOutsideAngular, inNextTick } from 'ng-zorro-antd/core/util';

import { NzCodeEditorService } from './code-editor.service';
import { DiffEditorOptions, EditorOptions, JoinedEditorOptions, NzEditorMode } from './typings';

type ITextModel = editor.ITextModel;
type IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
type IStandaloneDiffEditor = editor.IStandaloneDiffEditor;

declare const monaco: NzSafeAny;

export interface EditorSetupConfig {
  el: HTMLElement;
  editorMode: NzEditorMode;
  fullControl: boolean;
  originalText: string;
  onInitialized: (instance: IStandaloneCodeEditor | IStandaloneDiffEditor) => void;
  onValueChange: (value: string) => void;
}

@Injectable()
export class NzCodeEditorInstanceService {
  private nzCodeEditorService = inject(NzCodeEditorService);
  private ngZone = inject(NgZone);

  private resize$ = new Subject<void>();
  private editorOption$ = new BehaviorSubject<JoinedEditorOptions>({});
  private editorInstance: IStandaloneCodeEditor | IStandaloneDiffEditor | null = null;
  private onDidChangeContentDisposable: IDisposable | null = null;
  private modelSet = false;
  private config!: EditorSetupConfig;

  editorOptionCached: JoinedEditorOptions = {};

  get instance(): IStandaloneCodeEditor | IStandaloneDiffEditor | null {
    return this.editorInstance;
  }

  initDestroy(destroyRef: DestroyRef): void {
    destroyRef.onDestroy(() => {
      if (this.onDidChangeContentDisposable) {
        this.onDidChangeContentDisposable.dispose();
        this.onDidChangeContentDisposable = null;
      }

      if (this.editorInstance) {
        this.editorInstance.dispose();
        this.editorInstance = null;
      }
    });
  }

  setEditorOption(value: JoinedEditorOptions): void {
    this.editorOption$.next(value);
  }

  layout(): void {
    this.resize$.next();
  }

  setup(option: JoinedEditorOptions, config: EditorSetupConfig, destroyRef: DestroyRef): void {
    this.config = config;

    this.ngZone.runOutsideAngular(() =>
      inNextTick()
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe(() => {
          this.editorOptionCached = option;
          this.registerOptionChanges(destroyRef);
          this.initMonacoEditorInstance();
          this.registerResizeChange(destroyRef);

          if (this.editorInstance) {
            config.onInitialized(this.editorInstance);
          }
        })
    );
  }

  setValue(value: string): void {
    if (!this.editorInstance) {
      return;
    }

    if (this.config.fullControl && value) {
      warn(`should not set value when you are using full control mode! It would result in ambiguous data flow!`);
      return;
    }

    if (this.config.editorMode === 'normal') {
      if (this.modelSet) {
        const model = this.editorInstance.getModel() as ITextModel;
        this.preservePositionAndSelections(() => model.setValue(value));
      } else {
        (this.editorInstance as IStandaloneCodeEditor).setModel(
          monaco.editor.createModel(value, (this.editorOptionCached as EditorOptions).language)
        );
        this.modelSet = true;
      }
    } else {
      if (this.modelSet) {
        const model = (this.editorInstance as IStandaloneDiffEditor).getModel()!;
        this.preservePositionAndSelections(() => {
          model.modified.setValue(value);
          model.original.setValue(this.config.originalText);
        });
      } else {
        const language = (this.editorOptionCached as EditorOptions).language;
        (this.editorInstance as IStandaloneDiffEditor).setModel({
          original: monaco.editor.createModel(this.config.originalText, language),
          modified: monaco.editor.createModel(value, language)
        });
        this.modelSet = true;
      }
    }
  }

  setupValueEmitter(): void {
    const model = (
      this.config.editorMode === 'normal'
        ? (this.editorInstance as IStandaloneCodeEditor).getModel()
        : (this.editorInstance as IStandaloneDiffEditor).getModel()!.modified
    ) as ITextModel;

    this.onDidChangeContentDisposable = model.onDidChangeContent(() => {
      this.config.onValueChange(model.getValue());
    });
  }

  private registerOptionChanges(destroyRef: DestroyRef): void {
    combineLatest([this.editorOption$, this.nzCodeEditorService.option$])
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(([selfOpt, defaultOpt]) => {
        this.editorOptionCached = {
          ...this.editorOptionCached,
          ...defaultOpt,
          ...selfOpt
        };
        this.updateOptionToMonaco();
      });
  }

  private initMonacoEditorInstance(): void {
    this.ngZone.runOutsideAngular(() => {
      this.editorInstance =
        this.config.editorMode === 'normal'
          ? monaco.editor.create(this.config.el, { ...this.editorOptionCached })
          : monaco.editor.createDiffEditor(this.config.el, {
              ...(this.editorOptionCached as DiffEditorOptions)
            });
    });
  }

  private registerResizeChange(destroyRef: DestroyRef): void {
    fromEventOutsideAngular(window, 'resize')
      .pipe(debounceTime(300), takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        this.layout();
      });

    this.resize$
      .pipe(
        takeUntilDestroyed(destroyRef),
        filter(() => !!this.editorInstance),
        map(() => ({
          width: this.config.el.clientWidth,
          height: this.config.el.clientHeight
        })),
        distinctUntilChanged((a, b) => a.width === b.width && a.height === b.height),
        debounceTime(50)
      )
      .subscribe(() => {
        this.editorInstance!.layout();
      });
  }

  private preservePositionAndSelections(fn: () => unknown): void {
    if (!this.editorInstance) {
      fn();
      return;
    }

    const position = this.editorInstance.getPosition();
    const selections = this.editorInstance.getSelections();

    fn();

    if (position) {
      this.editorInstance.setPosition(position);
    }
    if (selections) {
      this.editorInstance.setSelections(selections);
    }
  }

  private updateOptionToMonaco(): void {
    if (this.editorInstance) {
      this.editorInstance.updateOptions({ ...this.editorOptionCached });
    }
  }
}
