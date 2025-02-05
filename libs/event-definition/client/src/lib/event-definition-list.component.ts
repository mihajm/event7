import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  CellDirective,
  createColumnHelper,
  injectCreateTableState,
  provideTableLocalization,
  TableComponent,
} from '@e7/common/table';
import { EventDefinition } from '@e7/event-definition/shared';
import { ArchiveEventTriggerComponent } from './archive-event-definition-dialog.component';
import { EditEventTriggerComponent } from './edit-event-definition-dialog.component';
import {
  EventDefinitionCardsComponent,
  injectDisplayDate,
} from './event-definition-cards.component';
import { EventDefinitionTypeStore } from './event-definition-type.store';
import { EventDefinitionStore } from './event-definition.store';
import { EventPriorityBadgeComponent } from './event-priority-badge.component';
import {
  EventStatusBadgeComponent,
  injectDisplayStatus,
} from './event-status-badge.component';
import { injectNamespaceT } from './locale';

const col = createColumnHelper<EventDefinition>();

function injectDisplayType() {
  const t = injectNamespaceT();
  const translations: Record<
    Required<EventDefinition>['type'],
    string | undefined
  > = {
    crosspromo: t('eventDef.types.crosspromo'),
    liveops: t('eventDef.types.liveops'),
    app: t('eventDef.types.app'),
    ads: t('eventDef.types.ads'),
  };

  return (type: EventDefinition['type']): string => {
    if (!type) return '';

    return translations[type] ?? type;
  };
}

function injectColumns() {
  const t = injectNamespaceT();
  const date = injectDisplayDate();
  const status = injectDisplayStatus();
  const type = injectDisplayType();
  const typeStore = inject(EventDefinitionTypeStore);

  return [
    col.accessor('name', (e) => e.name ?? '', {
      header: {
        label: () => t('eventDef.name'),
        filter: {
          valueType: 'string',
          matcher: 'ilike',
        },
      },
    }),
    col.accessor('status', (e) => status(e.status), {
      header: {
        label: () => t('eventDef.status'),
        filter: {
          valueType: 'string',
          matcher: 'eq',
          options: {
            values: () => ['active', 'archived', 'draft', 'ready'],
            display: (v) => (v ? status(v as EventDefinition['status']) : ''),
          },
        },
      },
    }),
    col.accessor('type', (e) => type(e.type), {
      header: {
        label: () => t('eventDef.type'),
        filter: {
          valueType: 'string',
          matcher: 'eq',
          options: {
            values: () => typeStore.types.value(),
            display: (v) => (v ? type(v as EventDefinition['type']) : ''),
          },
        },
      },
    }),
    col.accessor('priority', (e) => e.priority ?? 0, {
      header: {
        label: () => t('eventDef.priority'),
        filter: {
          valueType: 'number',
          matcher: 'eq',
        },
      },
      align: () => 'right',
    }),
    col.accessor('createdAt', (e) => date(e.createdAt), {
      header: {
        label: () => t('eventDef.created'),
        filter: {
          valueType: 'date',
          matcher: 'eqd',
        },
      },
    }),
    col.accessor('updatedAt', (e) => date(e.updatedAt), {
      header: {
        label: () => t('eventDef.updated'),
        filter: { valueType: 'date', matcher: 'eqd' },
      },
    }),
    col.display('actions', {
      header: { label: () => t('eventDef.actions') },
    }),
  ];
}

function createState() {
  const store = inject(EventDefinitionStore);
  const factory = injectCreateTableState();
  const columns = injectColumns();
  const total = computed(() => store.definitions.value().total);
  const items = computed(() => store.definitions.value().events);

  return factory(
    store.listState,
    {
      columns,
      pagination: {
        total,
      },
    },
    items,
  );
}

@Component({
  selector: 'app-event-definition-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableComponent,
    CellDirective,
    ArchiveEventTriggerComponent,
    EditEventTriggerComponent,
    EventStatusBadgeComponent,
    EventPriorityBadgeComponent,
    EventDefinitionCardsComponent,
  ],
  providers: [
    provideTableLocalization(() => {
      const t = injectNamespaceT();
      return {
        plural: t('eventDef.events'),
      };
    }),
  ],
  template: `
    @if (store.mobile()) {
      <app-event-definition-cards [state]="state" />
    } @else {
      <app-table [state]="state">
        <app-event-priority-badge
          *appCell="'priority'; let cell"
          [priority]="cell.source().priority"
        />
        <app-event-status-badge
          *appCell="'status'; let cell"
          [status]="cell.source().status"
        />
        <div *appCell="'actions'; let cell">
          <app-edit-event-trigger [state]="cell.source()" />
          <app-archive-event-trigger [state]="cell.source()" />
        </div>
      </app-table>
    }
  `,
  styles: `
    :host {
      display: contents;
      --app-paginator-padding-right: calc(3rem + 16px);
    }
  `,
})
export class EventDefinitionTableComponent {
  protected readonly state = createState();
  protected readonly store = inject(EventDefinitionStore);
}
