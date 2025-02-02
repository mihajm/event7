import { inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  EventType,
  NavigationEnd,
  Router,
} from '@angular/router';
import { Injectable } from '@nestjs/common';
import { filter, map } from 'rxjs';

@Injectable()
export class RouterStore {
  private readonly router = inject(Router);

  readonly url = toSignal(
    this.router.events.pipe(
      filter(
        (e): e is NavigationEnd =>
          'type' in e && e.type === EventType.NavigationEnd,
      ),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
}

export function injectUrl() {
  return inject(RouterStore).url;
}

export function routeParam(param: string): Signal<string | null>;

export function routeParam(param: string, fallback: string): Signal<string>;

export function routeParam(
  param: string,
  fallback?: string,
): Signal<string | null> {
  const route = inject(ActivatedRoute);

  return toSignal(
    route.paramMap.pipe(map((p) => p.get(param) ?? fallback ?? null)),
    {
      initialValue: route.snapshot.paramMap.get(param) ?? fallback ?? null,
    },
  );
}
