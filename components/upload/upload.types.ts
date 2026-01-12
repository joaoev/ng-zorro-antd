/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { TemplateRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import {
  NzBeforeUploadFileType,
  NzIconRenderTemplate,
  NzShowUploadList,
  NzUploadFile,
  NzUploadListType,
  NzUploadTransformFileType,
  NzUploadType,
  NzUploadXHRArgs,
  UploadFilter
} from './interface';

// Interfaces para agrupamento de inputs do componente upload
export interface UploadRequestOptions {
  action?: string | ((file: NzUploadFile) => string | Observable<string>);
  data?: {} | ((file: NzUploadFile) => {} | Observable<{}>);
  headers?: {} | ((file: NzUploadFile) => {} | Observable<{}>);
  name?: string;
  withCredentials?: boolean;
  customRequest?: (item: NzUploadXHRArgs) => Subscription;
}

export interface UploadFileOptions {
  accept?: string | string[];
  fileType?: string;
  limit?: number;
  size?: number;
  filter?: UploadFilter[];
  directory?: boolean;
  multiple?: boolean;
  openFileDialogOnClick?: boolean;
}

export interface UploadDisplayOptions {
  type?: NzUploadType;
  listType?: NzUploadListType;
  showButton?: boolean;
  showUploadList?: boolean | NzShowUploadList;
  disabled?: boolean;
}

export interface UploadCallbacks {
  beforeUpload?: (file: NzUploadFile, fileList: NzUploadFile[]) => NzBeforeUploadFileType;
  remove?: (file: NzUploadFile) => boolean | Observable<boolean>;
  preview?: (file: NzUploadFile) => void;
  previewFile?: (file: NzUploadFile) => Observable<string>;
  previewIsImage?: (file: NzUploadFile) => boolean;
  transformFile?: (file: NzUploadFile) => NzUploadTransformFileType;
  download?: (file: NzUploadFile) => void;
}

export interface UploadTemplates {
  iconRender?: NzIconRenderTemplate | null;
  fileListRender?: TemplateRef<{ $implicit: NzUploadFile[] }> | null;
}

