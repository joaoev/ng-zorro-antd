/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { DestroyRef, inject, Injectable, QueryList } from '@angular/core';
import { Observable, defer, merge, Subscription } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';

import { NZ_AFTER_NEXT_RENDER$ } from 'ng-zorro-antd/core/render';
import { NzSafeAny } from 'ng-zorro-antd/core/types';

import { NzAutocompleteOptionComponent, NzOptionSelectionChange } from './autocomplete-option.component';

export interface OptionChangeCallbacks {
  onSelectionChange: (option: NzAutocompleteOptionComponent) => void;
  onMouseEnter: (option: NzAutocompleteOptionComponent) => void;
}

@Injectable()
export class NzAutocompleteOptionService {
  private afterNextRender$ = inject(NZ_AFTER_NEXT_RENDER$);

  private selectionChangeSubscription: Subscription | null = Subscription.EMPTY;
  private optionMouseEnterSubscription: Subscription | null = Subscription.EMPTY;
  private dataSourceChangeSubscription: Subscription | null = Subscription.EMPTY;

  initDestroy(destroyRef: DestroyRef): void {
    destroyRef.onDestroy(() => {
      this.dataSourceChangeSubscription!.unsubscribe();
      this.selectionChangeSubscription!.unsubscribe();
      this.optionMouseEnterSubscription!.unsubscribe();
      this.dataSourceChangeSubscription = this.selectionChangeSubscription = this.optionMouseEnterSubscription = null;
    });
  }

  subscribeToDataSourceChanges(
    changes: Observable<QueryList<NzAutocompleteOptionComponent>>,
    isOpen: () => boolean,
    onVisibilityChange: () => void,
    onSubscribe: () => void
  ): void {
    this.dataSourceChangeSubscription = changes.subscribe(e => {
      if (!(e as NzSafeAny).dirty && isOpen()) {
        setTimeout(() => onVisibilityChange());
      }
      onSubscribe();
    });
  }

  subscribeOptionChanges(options: QueryList<NzAutocompleteOptionComponent>, callbacks: OptionChangeCallbacks): void {
    const optionSelectionChanges = this.createOptionSelectionChanges(options);
    const optionMouseEnter = this.createOptionMouseEnter(options);

    this.selectionChangeSubscription!.unsubscribe();
    this.selectionChangeSubscription = optionSelectionChanges
      .pipe(filter((event: NzOptionSelectionChange) => event.isUserInput))
      .subscribe((event: NzOptionSelectionChange) => {
        callbacks.onSelectionChange(event.source);
      });

    this.optionMouseEnterSubscription!.unsubscribe();
    this.optionMouseEnterSubscription = optionMouseEnter.subscribe((option: NzAutocompleteOptionComponent) => {
      callbacks.onMouseEnter(option);
    });
  }

  private createOptionSelectionChanges(
    options: QueryList<NzAutocompleteOptionComponent>
  ): Observable<NzOptionSelectionChange> {
    return defer(() => {
      if (options) {
        return merge<NzOptionSelectionChange[]>(...options.map(option => option.selectionChange));
      }
      return this.afterNextRender$.pipe(switchMap(() => this.createOptionSelectionChanges(options)));
    });
  }

  private createOptionMouseEnter(
    options: QueryList<NzAutocompleteOptionComponent>
  ): Observable<NzAutocompleteOptionComponent> {
    return defer(() => {
      if (options) {
        return merge<NzAutocompleteOptionComponent[]>(...options.map(option => option.mouseEntered));
      }
      return this.afterNextRender$.pipe(switchMap(() => this.createOptionMouseEnter(options)));
    });
  }
}
