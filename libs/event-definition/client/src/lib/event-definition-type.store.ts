import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Provider } from '@angular/core';
import { extendedResource } from '@e7/common/http';
import { injectApiUrl } from '@e7/common/settings';
import { SnackService } from '@e7/common/snack';
import {
  EventDefinition,
  NO_PERMISSION_EVENT_TYPES,
} from '@e7/event-definition/shared';
import { Observable, of } from 'rxjs';
import { injectNamespaceT } from './locale';

@Injectable({
  providedIn: 'root',
})
export class EventDefinitionTypeService {
  private readonly http = inject(HttpClient);
  private readonly url = injectApiUrl('eventDefinitionType');

  list(): Observable<Required<EventDefinition>['type'][]> {
    if (!this.url) return of(NO_PERMISSION_EVENT_TYPES);

    return this.http.get<Required<EventDefinition>['type'][]>(
      `${this.url}/event-definition-type`,
    );
  }
}

@Injectable({
  providedIn: 'root',
})
export class EventDefinitionTypeStore {
  private readonly snack = inject(SnackService);
  private readonly svc = inject(EventDefinitionTypeService);
  private readonly t = injectNamespaceT();

  readonly types = extendedResource({
    loader: () => this.svc.list(),
    refresh: 10000 * 60 * 60, // 1 hour
    fallback: NO_PERMISSION_EVENT_TYPES,
    onError: () => {
      this.snack.open({
        type: 'error',
        message: this.t('eventDef.failedToFetchTypes'),
        actions: [
          {
            label: this.t('shared.retry'),
            action: (() => this.types.reload(true)).bind(this),
          },
        ],
      });
    },
  });
}

export function provideEventDefinitionTypeStore(): Provider[] {
  return [EventDefinitionTypeService, EventDefinitionTypeStore];
}
