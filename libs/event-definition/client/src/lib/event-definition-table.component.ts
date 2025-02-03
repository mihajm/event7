import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  LOCALE_ID,
  untracked,
} from '@angular/core';
import {
  CellDirective,
  createColumnHelper,
  injectCreateTableState,
  provideTableLocalization,
  TableComponent,
} from '@e7/common/table';
import { EventDefinition } from '@e7/event-definition/shared';
import { endOfYesterday, formatDistanceToNow, isBefore } from 'date-fns';
import { sl } from 'date-fns/locale';
import { ArchiveEventTriggerComponent } from './archive-event-definition-dialog.component';
import { EditEventTriggerComponent } from './edit-event-definition-dialog.component';
import { EventDefinitionStore } from './event-definition.store';
import { injectNamespaceT } from './locale';

const col = createColumnHelper<EventDefinition>();

const yesterday = endOfYesterday();

function injectDisplayDate() {
  const locale = inject(LOCALE_ID);
  const dateFnsLocale = locale === 'sl-SI' ? sl : undefined;

  return (val?: string | Date) => {
    if (!val) return '';
    const date = new Date(val);

    if (isBefore(date, yesterday)) return formatDate(date, 'medium', locale);
    return formatDistanceToNow(date, {
      locale: dateFnsLocale,
      addSuffix: true,
    });
  };
}

function injectDisplayStatus() {
  const t = injectNamespaceT();
  const translations: Record<
    Required<EventDefinition>['status'],
    string | undefined
  > = {
    active: t('eventDef.eventStatus.active'),
    archived: t('eventDef.eventStatus.archived'),
    draft: t('eventDef.eventStatus.draft'),
    ready: t('eventDef.eventStatus.ready'),
  };

  return (status: EventDefinition['status']): string => {
    if (!status) return '';

    return translations[status] ?? status;
  };
}

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

  return [
    col.accessor('name', (e) => e.name ?? '', {
      label: () => t('eventDef.name'),
    }),
    col.accessor('status', (e) => status(e.status), {
      label: () => t('eventDef.status'),
    }),
    col.accessor('type', (e) => type(e.type), {
      label: () => t('eventDef.type'),
    }),
    col.accessor('priority', (e) => e.priority ?? 0, {
      label: () => t('eventDef.priority'),
      align: () => 'right',
    }),
    col.accessor('createdAt', (e) => date(e.createdAt), {
      label: () => t('eventDef.created'),
    }),
    col.accessor('updatedAt', (e) => date(e.updatedAt), {
      label: () => t('eventDef.updated'),
    }),
    col.display('actions', {
      label: () => t('eventDef.actions'),
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
    untracked(store.listState),
    {
      columns,
      pagination: {
        onPaginationChange: (next) =>
          store.listState.update((prev) => ({ ...prev, pagination: next })),
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
    <app-table [state]="state">
      <div *appCell="'actions'; let cell">
        <app-edit-event-trigger [state]="cell.source()" />
        <app-archive-event-trigger [state]="cell.source()" />
      </div>
    </app-table>
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
}
