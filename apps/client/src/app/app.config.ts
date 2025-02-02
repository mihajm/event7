import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  type ApplicationConfig,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideDateFnsAdapter } from '@angular/material-date-fns-adapter';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
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
    provideHttpClient(withFetch()),
    provideDateFnsAdapter(),
  ],
};
