import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { EventDefinition } from '@e7/event-definition/shared';

@Component({
  selector: 'app-event-priority-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `<span [ngClass]="priorityClass()">{{ priority() }}</span>`,
  styles: `
    :host {
      display: contents;

      span {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
        padding: 2px 4px;
        border-radius: 4px;

        font-weight: 500;

        &.priority-0 {
          background: unset;
          color: unset;

          border: var(--mat-divider-color) solid var(--mat-divider-width);
          padding: 1px 3px;
        }
        &.priority-1 {
          background: color-mix(
            in srgb,
            var(--mat-sys-primary-container),
            transparent 60%
          );
        }
        &.priority-2 {
          background: color-mix(
            in srgb,
            var(--mat-sys-primary-container),
            transparent 45%
          );
        }
        &.priority-3 {
          background: color-mix(
            in srgb,
            var(--mat-sys-primary-container),
            transparent 30%
          );
        }
        &.priority-4 {
          background: color-mix(
            in srgb,
            var(--mat-sys-primary-container),
            transparent 15%
          );
        }
        &.priority-5 {
          // default
        }
        &.priority-6 {
          background: color-mix(
            in srgb,
            var(--mat-sys-error-container),
            transparent 75%
          );
        }
        &.priority-7 {
          background: color-mix(
            in srgb,
            var(--mat-sys-error-container),
            transparent 60%
          );
        }
        &.priority-8 {
          background: color-mix(
            in srgb,
            var(--mat-sys-error-container),
            transparent 40%
          );
        }
        &.priority-9 {
          background: color-mix(
            in srgb,
            var(--mat-sys-error-container),
            transparent 25%
          );
        }
        &.priority-10 {
          background: var(--mat-sys-error-container);
          color: var(--mat-sys-on-error-container);
        }
      }
    }
  `,
})
export class EventPriorityBadgeComponent {
  readonly priority = input.required({
    transform: (
      s: EventDefinition['priority'],
    ): Required<EventDefinition>['priority'] => s ?? 0,
  });

  protected readonly priorityClass = computed(
    () => `priority-${this.priority()}`,
  );
}
