/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { ElementRef, Renderer2 } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, startWith } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export function setupLoadingIcon(
  loading$: Subject<boolean>,
  initialLoading: boolean,
  iconElement: ElementRef | undefined,
  renderer: Renderer2,
  destroyRef: any
): void {
  if (!iconElement) return;
  loading$
    .pipe(
      startWith(initialLoading),
      filter(() => !!iconElement),
      takeUntilDestroyed(destroyRef)
    )
    .subscribe(loading => {
      const nativeElement = iconElement.nativeElement;
      if (loading) {
        renderer.setStyle(nativeElement, 'display', 'none');
      } else {
        renderer.removeStyle(nativeElement, 'display');
      }
    });
}

export function insertTextSpans(elementRef: ElementRef<HTMLElement>, renderer: Renderer2): void {
  elementRef.nativeElement.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent!.trim().length > 0) {
      const span = renderer.createElement('span');
      const parent = renderer.parentNode(node);
      renderer.insertBefore(parent, span, node);
      renderer.appendChild(span, node);
    }
  });
}

export function setupElementOnlyDetection(
  elementRef: ElementRef<HTMLElement>,
  setElementOnly: (value: boolean) => void,
  afterEveryRender: any
): void {
  afterEveryRender({
    read: () => {
      const { children } = elementRef.nativeElement;
      const visibleElement = Array.from(children).filter(
        element => (element as HTMLElement).style.display !== 'none'
      );
      setElementOnly(visibleElement.length === 1);
    }
  });
}
