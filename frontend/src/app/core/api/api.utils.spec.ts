import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { applyClientPagination, buildHttpParams, mapToApiResult, normalizeApiError } from './api.utils';

describe('api.utils', () => {
  it('buildHttpParams should include only non-empty values', () => {
    const params = buildHttpParams({
      q: 'clubs',
      page: 2,
      empty: '',
      missing: undefined,
      enabled: true,
    });

    expect(params.get('q')).toBe('clubs');
    expect(params.get('page')).toBe('2');
    expect(params.get('enabled')).toBe('true');
    expect(params.has('empty')).toBe(false);
    expect(params.has('missing')).toBe(false);
  });

  it('applyClientPagination should return paged items with metadata', () => {
    const result = applyClientPagination([1, 2, 3, 4, 5], { page: 2, pageSize: 2 });

    expect(result.items).toEqual([3, 4]);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(2);
    expect(result.total).toBe(5);
  });

  it('normalizeApiError should map HttpErrorResponse status to structured code', () => {
    const httpError = new HttpErrorResponse({
      status: 401,
      error: 'unauthorized',
      url: '/clubs',
      statusText: 'Unauthorized',
    });

    const mapped = normalizeApiError(httpError);

    expect(mapped.status).toBe(401);
    expect(mapped.code).toBe('UNAUTHORIZED');
    expect(mapped.message).toBe('unauthorized');
  });

  it('mapToApiResult should wrap successful results', async () => {
    const result = await new Promise((resolve) => {
      mapToApiResult(of({ id: 1 })).subscribe(resolve);
    });

    expect(result).toEqual({ ok: true, data: { id: 1 } });
  });

  it('mapToApiResult should wrap thrown errors into unified error shape', async () => {
    const result = await new Promise((resolve) => {
      mapToApiResult(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 404,
              error: { message: 'club not found' },
              statusText: 'Not Found',
            }),
        ),
      ).subscribe(resolve);
    });

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({
        status: 404,
        code: 'NOT_FOUND',
        message: 'club not found',
      }),
    });
  });
});
