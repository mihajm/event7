import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { extendedResource } from '@e7/common/http';
import {
  createColumnHelper,
  createTableState,
  TableComponent,
} from '@e7/common/table';
import { EventDefinition } from '@e7/event-definition/shared';
import { EventDefinitionService } from './event-definition.service';
import { injectNamespaceT } from './locale';

const col = createColumnHelper<EventDefinition>();

function createState() {
  const t = injectNamespaceT();
  const svc = inject(EventDefinitionService);

  const resource = extendedResource({
    loader: () => svc.list(),
    fallback: [],
  });

  return createTableState(
    {
      columns: [
        col.display(
          'name',
          (e) => e.name ?? '',
          () => t('eventDef.name'),
        ),
        col.display(
          'status',
          (e) => e.status ?? 'draft',
          () => t('eventDef.status'),
        ),
      ],
    },
    resource.value,
  );
}

@Component({
  selector: 'app-event-definition-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TableComponent],
  template: ` <app-table [state]="state" /> `,
  styles: ``,
})
export class EventDefinitionTableComponent {
  protected readonly state = createState();
}
