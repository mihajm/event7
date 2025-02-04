import { registerLocaleData } from '@angular/common';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import localeSl from '@angular/common/locales/sl';
import {
  type ApplicationConfig,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideDateFnsAdapter } from '@angular/material-date-fns-adapter';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { dedupeRequestsInterceptor } from '@e7/common/http';
import { provideLocalizedRouter } from '@e7/common/locale';
import { provideClientConfig } from '@e7/common/settings';

registerLocaleData(localeSl);

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
    provideDateFnsAdapter(),
  ],
};
