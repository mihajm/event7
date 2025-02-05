import { HttpClient } from '@angular/common/http';
import {
  computed,
  effect,
  inject,
  Injectable,
  Signal,
  untracked,
} from '@angular/core';
import {
  extendedResource,
  InferedRequestLoaderParams,
  queuedMutationResource,
} from '@e7/common/http';
import { removeEmptyKeys } from '@e7/common/object';
import { debounced, stored } from '@e7/common/reactivity';
import { injectApiUrl } from '@e7/common/settings';
import { TableStateValue, toServerFilters } from '@e7/common/table';
import {
  CreateEventDefinitionDTO,
  EventDefinition,
  UpdateEventDefinitionDTO,
} from '@e7/event-definition/shared';
import { map, Observable, of } from 'rxjs';
import { v7 } from 'uuid';

function toPaginationParams(opt: TableStateValue['pagination']) {
  const size = opt?.size ?? 10;
  const page = opt?.page ?? 0;
  return {
    limit: size,
    offset: page * size,
  };
}

function toSortParam(opt?: TableStateValue['sort']): string | undefined {
  if (!opt) return undefined;

  return opt.direction === 'desc' ? `-${opt.id}` : opt.id;
}

function toListParams(opt?: TableStateValue) {
  return {
    ...toPaginationParams(opt?.pagination),
    ...toServerFilters(opt?.columnFilters),
    sort: toSortParam(opt?.sort),
    search: opt?.globalFilter || undefined,
  };
}

function parseContentRange(contentRange?: string | null) {
  if (!contentRange) return { total: 0, offset: 0, limit: 0 };

  const [, range] = contentRange.split(' ');

  const [fromTo, total] = range.split('/');
  const [offset, limit] = fromTo.split('-').map((v) => parseInt(v, 10));

  return { total: parseInt(total), offset, limit };
}

@Injectable({
  providedIn: 'root',
})
export class EventDefinitionService {
  private readonly http = inject(HttpClient);
  private readonly url = injectApiUrl('eventDefinition');

  list(
    opt?: TableStateValue,
  ): Observable<{ events: EventDefinition[]; total: number }> {
    if (!this.url) throw new Error('Event definition api disabled');
    return this.http
      .get<EventDefinition[]>(`${this.url}/event-definition`, {
        params: removeEmptyKeys(toListParams(opt)),
        observe: 'response',
      })
      .pipe(
        map((res) => {
          const length = res.body ? res.body.length : 0;

          const responseHeader = res.headers.get('Content-Range');
          const parsed = parseContentRange(responseHeader);

          const size = isNaN(parsed.total) ? length : parsed.total;

          return {
            events: res.body ?? [],
            total: size,
          };
        }),
      );
  }

  get(id: string): Observable<EventDefinition> {
    if (!this.url) throw new Error('Event definition api disabled');
    return this.http.get<EventDefinition>(`${this.url}/event-definition/${id}`);
  }

  create(body: CreateEventDefinitionDTO): Observable<EventDefinition> {
    if (!this.url) throw new Error('Event definition api disabled');
    return this.http.post<EventDefinition>(
      `${this.url}/event-definition`,
      body,
    );
  }

  patch(
    id: string,
    body: UpdateEventDefinitionDTO,
  ): Observable<EventDefinition> {
    if (!this.url) throw new Error('Event definition api disabled');
    return this.http.patch<EventDefinition>(
      `${this.url}/event-definition/${id}`,
      body,
    );
  }
}

type CreatePackage = {
  type: 'create';
  value: CreateEventDefinitionDTO;
  reOpen: () => void;
};

type UpdatePackage = {
  type: 'update';
  value: UpdateEventDefinitionDTO;
  reOpen?: () => void;
};

type CreateUpdatePackage = CreatePackage | UpdatePackage;

function updateDTOToEventDef(dto: UpdateEventDefinitionDTO): EventDefinition {
  return {
    id: dto.id ?? v7(),
    name: dto.name ?? '',
    description: dto.description ?? '',
    type: dto.type ?? 'app',
    priority: dto.priority ?? 0,
    status: dto.status ?? 'draft',
    createdAt: dto.createdAt ?? new Date(),
    updatedAt: dto.updatedAt ?? new Date(),
  };
}

function debounceState(
  state: Signal<TableStateValue>,
): Signal<TableStateValue> {
  const sort = computed(() => state().sort, {
    equal: (a, b) => a?.direction === b?.direction && a?.id === b?.id,
  });

  const pagination = computed(() => state().pagination, {
    equal: (a, b) => a?.page === b?.page && a?.size === b?.size,
  });

  const filters = debounced(computed(() => state().columnFilters));
  const globalFilter = debounced(computed(() => state().globalFilter));

  return computed(() => ({
    sort: sort(),
    pagination: pagination(),
    columnFilters: filters(),
    globalFilter: globalFilter(),
  }));
}

@Injectable({
  providedIn: 'root',
})
export class EventDefinitionStore {
  private readonly svc = inject(EventDefinitionService);

  readonly listState = stored<TableStateValue>(
    {},
    {
      key: 'EVENT_DEFINITIONS_TABLE',
    },
  );

  readonly debouncedState = debounceState(this.listState);

  private readonly isMobile = computed(() => false);

  private readonly mobileOrDesktopState = computed((): TableStateValue => {
    if (!this.isMobile()) return this.debouncedState();

    return {
      pagination: this.debouncedState().pagination,
    };
  });

  readonly definitions = extendedResource({
    request: () => this.mobileOrDesktopState(),
    loader: ({ request }) => this.svc.list(request),
    keepPrevious: true,
    fallback: {
      events: [],
      total: 0,
    },
    cache: {
      prefix: 'event-definition',
      ttl: 1000 * 60 * 60, // 1 hour
    },
  });

  constructor() {
    effect(() => {
      if (this.definitions.isLoading()) return;
      const state = this.mobileOrDesktopState();
      const { total } = this.definitions.value();
      const page = state.pagination?.page ?? 0;
      const size = state.pagination?.size ?? 10;

      if (page > 0) {
        this.definitions.prefetch({
          ...state,
          pagination: {
            page: page - 1,
            size,
          },
        });
      }

      // no next page
      if (total <= (page + 1) * size) return;

      this.definitions.prefetch({
        ...state,
        pagination: {
          page: page + 1,
          size,
        },
      });
    });
  }

  readonly mutation = queuedMutationResource({
    loader: ({ request }: InferedRequestLoaderParams<CreateUpdatePackage>) => {
      if (!request) return of(null);
      if (request.type === 'create') return this.svc.create(request.value);
      if (request.type === 'update' && request.value.id)
        return this.svc.patch(request.value.id, request.value);
      return of(null);
    },
    fallback: null,
    onMutate: (r) => {
      if (!r)
        return {
          revert: () => {
            // noop;
          },
          reOpen: () => {
            // noop
          },
          retry: () => {
            // noop
          },
        };

      if (r.type === 'create') {
        return {
          revert: () => {
            // noop;
          },
          reOpen: r.reOpen,
          retry: () => {
            this.mutation.next(r);
          },
        };
      }

      const found = untracked(this.definitions.value).events.find(
        (d) => d.id === r.value.id,
      );

      if (!r.value.id || !found)
        return {
          revert: () => {
            // noop;
          },
          reOpen:
            r.reOpen ??
            (() => {
              // noop
            }),
          retry: () => {
            this.mutation.next(r);
          },
        };

      const prev = untracked(this.definitions.value);

      const next = {
        ...prev,
        events: untracked(this.definitions.value).events.map((d) =>
          d.id === r.value.id ? updateDTOToEventDef(r.value) : d,
        ),
      };

      this.definitions.set(next);

      return {
        revert: () => {
          this.definitions.set(prev);
        },
        reOpen:
          r.reOpen ??
          (() => {
            // noop
          }),
        retry: () => {
          this.mutation.next(r);
        },
      };
    },
    onError: (_, { revert }) => {
      revert();
    },
    onSuccess: () => {
      this.definitions.reload(true);
    },
  });

  create(pck: CreatePackage): void {
    this.mutation.next(pck);
  }

  update(id: string, pck: UpdatePackage): void {
    this.mutation.next({ ...pck, value: { ...pck.value, id } });
  }

  archive(id: string) {
    this.mutation.next({ type: 'update', value: { id, status: 'archived' } });
  }
}
