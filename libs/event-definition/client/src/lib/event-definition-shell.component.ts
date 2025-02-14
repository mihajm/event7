import { Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { RouterOutlet } from '@angular/router';
import { CreateEventDefinitionDialogTriggerComponent } from './create-event-definition-dialog.component';
import { EventDefinitionTypeStore } from './event-definition-type.store';
import { EventDefinitionStore } from './event-definition.store';

@Component({
  selector: 'app-event-definition-shell',
  imports: [
    RouterOutlet,
    MatCardModule,
    CreateEventDefinitionDialogTriggerComponent,
    MatProgressBar,
  ],
  host: {
    '[class.mobile]': 'store.mobile()',
  },
  template: `
    <div>
      <mat-card>
        @if (Loading()) {
          <mat-progress-bar />
        }
        <router-outlet />
      </mat-card>
    </div>
    <app-create-event-definition-dialog-trigger />
  `,
  styles: `
    :host {
      position: relative;
      max-height: calc(100% - 4rem);
      width: 100%;
      display: flex;
      box-sizing: border-box;
      padding: 1rem;
      flex: 1;

      div {
        height: 100%;
        width: 100%;
        overflow: hidden;
        mat-card {
          position: relative;
          overflow: hidden;
          max-height: 100%;
          padding: max(
              var(--mdc-linear-progress-track-height, 4px),
              var(--mdc-linear-progress-active-indicator-height, 4px)
            )
            0;

          mat-progress-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
          }
        }
      }

      app-create-event-definition-dialog-trigger {
        position: absolute;
        bottom: 1.4rem;
        right: 1.5rem;
      }

      &.mobile {
        padding: 0;
        position: unset;
        div mat-card {
          border-width: 0;
          height: 100%;
          position: unset;
        }

        app-create-event-definition-dialog-trigger {
          bottom: 1.5rem;
          right: 1.5rem;
        }
      }
    }
  `,
})
export class EventDefinitionShellComponent {
  protected readonly store = inject(EventDefinitionStore);
  private readonly typeStore = inject(EventDefinitionTypeStore);

  protected readonly Loading = computed(
    () => this.store.loading() || this.typeStore.types.isLoading(),
  );
}
