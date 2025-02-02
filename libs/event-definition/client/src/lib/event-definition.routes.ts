import { Route } from '@angular/router';
import { EventDefinitionShellComponent } from './event-definition-shell.component';
import { EventDefinitionService } from './event-definition.service';
import { resolveNamespaceTranslation } from './locale';

export const EVENT_DEFINITION_ROUTES: Route[] = [
  {
    path: '',
    component: EventDefinitionShellComponent,
    resolve: {
      resolveEventDefTranslation: resolveNamespaceTranslation,
    },
    providers: [EventDefinitionService],
    children: [
      {
        path: 'list',
        loadComponent: () =>
          import('./event-definition-table.component').then(
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
