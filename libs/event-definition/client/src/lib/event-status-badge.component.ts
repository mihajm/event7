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
  template: `<span [ngClass]="statusClass()">{{ label() }}</span>`,
  styles: `
    :host {
      display: contents;

      --active-bg-light: color-mix(
        in srgb,
        hsl(150, 80%, 60%),
        var(--mat-sys-primary) 10%
      );

      --active-bg-dark: color-mix(
        in srgb,
        hsl(150, 80%, 20%),
        var(--mat-sys-primary) 10%
      );

      span {
        background: light-dark(var(--draft-bg-light), var(--draft-bg-dark));
        color: var(--mat-app-text-color);
        padding: 2px 4px;
        border-radius: 4px;

        font-weight: 500;

        &.active {
          background: light-dark(var(--active-bg-light), var(--active-bg-dark));
          color: var(--mat-app-text-color);
        }

        &.archived {
          background: light-dark(hsl(0, 0%, 45%), hsl(0, 0%, 65%));
          color: light-dark(hsl(0, 0%, 90%), hsl(0, 0%, 10%));
        }

        &.ready {
          background: var(--mat-sys-primary-container);
          color: var(--mat-sys-on-primary-container);
        }

        &.draft {
          background: var(--mat-sys-primary);
          color: var(--mat-sys-on-primary);
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

  protected readonly statusClass = computed(() => `${this.status()}`);
}
