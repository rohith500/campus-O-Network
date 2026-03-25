import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { API_TIMEOUT_MS } from './api.config';
import { ApiError, ApiResult, PaginatedResult, PaginationParams } from './api.types';

export function mapToApiResult<T>(source$: Observable<T>): Observable<ApiResult<T>> {
  return source$.pipe(
    timeout(API_TIMEOUT_MS),
    map((data) => ({ ok: true, data }) as ApiResult<T>),
    catchError((error: unknown) => of({ ok: false, error: normalizeApiError(error) } as ApiResult<T>)),
  );
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof HttpErrorResponse) {
    const messageFromBody = typeof error.error === 'string' ? error.error : error.error?.message;

    return {
      status: error.status || 0,
      code: mapStatusToCode(error.status),
      message: messageFromBody || error.message || 'Request failed',
      details: error.error,
    };
  }

  return {
    status: 0,
    code: 'UNKNOWN_ERROR',
    message: 'Unexpected error occurred',
    details: error,
  };
}

function mapStatusToCode(status: number): string {
  if (status === 0) return 'NETWORK_ERROR';
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 408) return 'TIMEOUT';
  if (status === 409) return 'CONFLICT';
  if (status >= 500) return 'SERVER_ERROR';
  return 'REQUEST_ERROR';
}

export function buildHttpParams(params: Record<string, string | number | boolean | undefined>): HttpParams {
  let httpParams = new HttpParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      httpParams = httpParams.set(key, String(value));
    }
  });

  return httpParams;
}

export function applyClientPagination<T>(items: T[], pagination?: PaginationParams): PaginatedResult<T> {
  const page = Math.max(1, pagination?.page ?? 1);
  const pageSize = Math.max(1, pagination?.pageSize ?? 10);

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: items.slice(start, end),
    page,
    pageSize,
    total: items.length,
  };
}
