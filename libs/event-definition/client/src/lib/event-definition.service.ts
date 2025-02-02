import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { injectApiUrl } from '@e7/common/settings';
import { EventDefinition } from '@e7/event-definition/shared';
import { Observable, of } from 'rxjs';

@Injectable()
export class EventDefinitionService {
  private readonly http = inject(HttpClient);
  private readonly url = injectApiUrl('eventDefinition');

  list(): Observable<EventDefinition[]> {
    if (!this.url) return of([]);
    return this.http.get<EventDefinition[]>(this.url);
  }
}
