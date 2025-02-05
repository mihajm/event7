import { Route } from '@angular/router';
import { EventDefinitionShellComponent } from './event-definition-shell.component';
import { resolveNamespaceTranslation } from './locale';

export const EVENT_DEFINITION_ROUTES: Route[] = [
  {
    path: '',
    component: EventDefinitionShellComponent,
    resolve: {
      resolveEventDefTranslation: resolveNamespaceTranslation,
    },
    children: [
      {
        path: 'list',
        loadComponent: () =>
          import('./event-definition-list.component').then(
            (m) => m.EventDefinitionTableComponent,
          ),
      },
      {
        path: '**',
        redirectTo: 'list',
      },
    ],
  },
];
