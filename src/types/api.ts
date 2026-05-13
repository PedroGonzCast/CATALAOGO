export interface ApiSuccess<T> {
  ok: true;
  data: T;
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface ApiError {
  ok: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface SearchParams extends PaginationParams {
  search?: string;
}
