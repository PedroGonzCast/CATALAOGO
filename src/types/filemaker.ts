export interface FMAuthResponse {
  response: { token: string };
  messages: FMMessage[];
}

export interface FMMessage {
  code: string;
  message: string;
}

export interface FMRecord<T = Record<string, unknown>> {
  fieldData: T;
  recordId: string;
  modId: string;
  portalData?: Record<string, FMPortalRecord[]>;
}

export interface FMPortalRecord {
  recordId: string;
  modId: string;
  [key: string]: unknown;
}

export interface FMListResponse<T> {
  response: {
    data: FMRecord<T>[];
    dataInfo: FMDataInfo;
  };
  messages: FMMessage[];
}

export interface FMFindResponse<T> {
  response: {
    data: FMRecord<T>[];
    dataInfo: FMDataInfo;
  };
  messages: FMMessage[];
}

export interface FMSingleResponse<T> {
  response: {
    data: FMRecord<T>[];
  };
  messages: FMMessage[];
}

export interface FMDataInfo {
  database: string;
  layout: string;
  table: string;
  totalRecordCount: number;
  foundCount: number;
  returnedCount: number;
}

export interface FMCreateResponse {
  response: { recordId: string; modId: string };
  messages: FMMessage[];
}

export interface FMEditResponse {
  response: { modId: string };
  messages: FMMessage[];
}

export interface FMDeleteResponse {
  response: Record<string, never>;
  messages: FMMessage[];
}

export interface FMQuery {
  query?: Array<Record<string, string>>;
  sort?: Array<{ fieldName: string; sortOrder: 'ascend' | 'descend' }>;
  limit?: number;
  offset?: number;
  portal?: string[];
}
