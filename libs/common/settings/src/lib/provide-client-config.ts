import { inject, InjectionToken, Provider } from '@angular/core';

const KNOWN_APIS = ['eventDefinition', 'eventDefinitionType'] as const;

type KnownApi = (typeof KNOWN_APIS)[number];

const URL_TOKEN = new InjectionToken<Record<KnownApi, string | undefined>>(
  'EVENT7_API_URLS',
);

function validateUrls(
  config: Record<string, string | undefined>,
): Record<KnownApi, string | undefined> {
  const urls = {} as Record<KnownApi, string | undefined>;

  for (const api of KNOWN_APIS) {
    const found = config[api];
    if (!found || typeof found !== 'string') continue;
    urls[api] = config[api];
  }

  return urls;
}

export function provideClientConfig(): Provider[] {
  const API_URLS =
    (
      window as Window &
        typeof globalThis & { API_URLS?: Record<string, string | undefined> }
    ).API_URLS ?? {};

  return [
    {
      provide: URL_TOKEN,
      useValue: validateUrls(API_URLS),
    },
  ];
}

export function injectApiUrl(api: KnownApi): string | null {
  return inject(URL_TOKEN, { optional: true })?.[api] ?? null;
}
