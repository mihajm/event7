import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { StringFieldComponent } from '@e7/common/form';
import { injectDateFnsLocale } from '@e7/common/locale';
import { injectTableLocalization, TableState } from '@e7/common/table';
import { EventDefinition } from '@e7/event-definition/shared';
import { endOfYesterday, formatDistanceToNow, isBefore } from 'date-fns';
import { ArchiveEventTriggerComponent } from './archive-event-definition-dialog.component';
import { EditEventTriggerComponent } from './edit-event-definition-dialog.component';
import { EventDefinitionStore } from './event-definition.store';
import { EventPriorityBadgeComponent } from './event-priority-badge.component';
import { EventStatusBadgeComponent } from './event-status-badge.component';
import { injectNamespaceT } from './locale';

const yesterday = endOfYesterday();

export function injectDisplayDate() {
  const locale = inject(LOCALE_ID);
  const dateFnsLocale = injectDateFnsLocale();

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

@Component({
  selector: 'app-event-definition-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    EventStatusBadgeComponent,
    EventPriorityBadgeComponent,
    EditEventTriggerComponent,
    ArchiveEventTriggerComponent,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title-group>
          <mat-card-title>
            {{ definition().name }}
          </mat-card-title>
          <mat-card-subtitle>{{ definition().type }}</mat-card-subtitle>
          <div>
            <div>
              <app-event-status-badge [status]="definition().status" />
            </div>
            <span>{{ updatedLabel }}{{ updatedDate() }}</span>
          </div>
        </mat-card-title-group>
      </mat-card-header>
      <mat-card-content>
        <p>
          {{ createdAndPriortyLabel() }}
          <app-event-priority-badge [priority]="definition().priority" />
        </p>

        <p>{{ definition().description }}</p>
      </mat-card-content>
      <mat-card-actions align="end">
        <app-archive-event-trigger [fullButton]="true" [state]="definition()" />
        <app-edit-event-trigger [fullButton]="true" [state]="definition()" />
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    :host {
      display: contents;

      mat-card {
        height: 300px;
        display: flex;

        mat-card-header {
          border-bottom: var(--mat-divider-width) solid var(--mat-divider-color);
          padding-bottom: 0.5rem;

          mat-card-title {
            font-weight: 500;
          }

          div {
            display: flex;
            gap: 0.125rem;
            flex-direction: column;
            align-items: flex-end;

            div {
              flex-direction: row;
              gap: 0.5rem;
            }
          }
        }

        mat-card-content {
          flex: 1;
          padding: 1rem;
          overflow: auto;
        }

        mat-card-actions {
          gap: 1rem;
          padding-bottom: 1rem;
        }
      }
    }
  `,
})
export class EventDefinitionCardComponent {
  private readonly t = injectNamespaceT();
  protected readonly updatedLabel = this.t('eventDef.updated') + ': ';
  readonly definition = input.required<EventDefinition>();

  private readonly displayDate = injectDisplayDate();

  protected readonly updatedDate = computed(() => {
    const date = this.definition().updatedAt;
    if (!date) return '/';
    return this.displayDate(date);
  });

  protected readonly createdDate = computed(() => {
    const date = this.definition().createdAt;
    if (!date) return '/';
    return this.displayDate(date);
  });

  protected readonly createdAndPriortyLabel = computed(() =>
    this.t('eventDef.createdWithPriority', { date: this.createdDate() }),
  );
}

@Component({
  selector: 'app-event-definition-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EventDefinitionCardComponent, StringFieldComponent],
  template: `
    <app-string-field
      iconPrefix="search"
      [state]="state().header.globalFilter"
      subscriptSizing="dynamic"
    />

    <section>
      @for (def of store.definitions.value().events; track def.id) {
        <app-event-definition-card [definition]="def" />
      } @empty {
        <span>{{ loc.noItemsFound }}</span>
      }
    </section>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      height: 100%;

      --mdc-outlined-text-field-outline-color: var(
        --mdc-outlined-card-outline-color
      );

      ::ng-deep mat-form-field {
        padding-left: 1px;
        padding-right: 1px;
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        width: 70%;
      }

      section {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow-y: auto;
        height: 100%;
        gap: 25px;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        padding-left: 0.5rem;
        scrollbar-gutter: stable;
        padding-right: 3px;

        span.trigger {
          height: 0px;
          width: 0px;
        }
      }
    }
  `,
})
export class EventDefinitionCardsComponent {
  protected readonly loc = injectTableLocalization();
  protected readonly store = inject(EventDefinitionStore);
  readonly state = input.required<TableState<EventDefinition>>();
}
