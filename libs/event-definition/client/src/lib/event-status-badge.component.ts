import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { EventDefinition } from '@e7/event-definition/shared';
import { injectNamespaceT } from './locale';

export function injectDisplayStatus() {
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

@Component({
  selector: 'app-event-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `<span [ngClass]="$any(status())">{{ label() }}</span>`,
  styles: `
    :host {
      display: contents;

      span {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
        padding: 2px 4px;
        border-radius: 4px;

        font-weight: 500;
        &.active {
          background: hsl(164, 59%, 30%);
          color: white;
        }
      }
    }
  `,
})
export class EventStatusBadgeComponent {
  private readonly translator = injectDisplayStatus();
  readonly status = input.required({
    transform: (
      s: EventDefinition['status'],
    ): Required<EventDefinition>['status'] => s ?? 'draft',
  });
  protected readonly label = computed(() => this.translator(this.status()));
}
