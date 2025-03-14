import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  type ApplicationConfig,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { dedupeRequestsInterceptor } from '@e7/common/http';
import { provideLocalizedRouter } from '@e7/common/locale';
import { provideClientConfig } from '@e7/common/settings';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientConfig(),
    provideExperimentalZonelessChangeDetection(),
    provideLocalizedRouter([
      {
        path: 'event-definition',
        loadChildren: () =>
          import('@e7/event-definition/client').then(
            (m) => m.EVENT_DEFINITION_ROUTES,
          ),
      },
      {
        path: '**',
        redirectTo: 'event-definition',
      },
    ]),
    provideAnimationsAsync(),
    provideHttpClient(
      withFetch(),
      withInterceptors([dedupeRequestsInterceptor()]),
    ),
  ],
};
