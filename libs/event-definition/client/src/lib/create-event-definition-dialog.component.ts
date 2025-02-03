import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  Signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule, MatFabButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { injectDisableTooltips } from '@e7/common/settings';
import { CreateEventDefinitionDTO } from '@e7/event-definition/shared';
import { first, Subscription } from 'rxjs';
import {
  CreateUpdateEventState,
  EventDefinitionFormComponent,
  injectCreateFormState,
  NullableEventDefinition,
} from './event-definition-form.component';
import { EventDefinitionStore } from './event-definition.store';
import { injectNamespaceT } from './locale';

type CreateEventDefinitionDialogData = {
  title: Signal<string>;
  state?: CreateUpdateEventState;
};

type CreateEventDefinitionDialogReturn = null | CreateUpdateEventState;

function fromNullableToCreate(
  e: NullableEventDefinition,
): CreateEventDefinitionDTO {
  return {
    id: e.id ?? undefined,
    name: e.name ?? '',
    description: e.description ?? '',
    type: e.type ?? 'app',
    priority: e.priority ?? 0,
    status: e.status ?? 'draft',
  };
}

@Component({
  selector: 'app-create-event-definition-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, EventDefinitionFormComponent],
  template: `
    <header>
      <h2 mat-dialog-title>{{ data.title() }}</h2>
    </header>
    <section mat-dialog-content>
      <app-event-definition-form [state]="state" />
    </section>
    <footer mat-dialog-actions align="end">
      <button type="button" mat-button [mat-dialog-close]="null">
        {{ closeLabel }}
      </button>
      <button type="button" mat-flat-button (click)="confirm()">
        {{ confirmLabel }}
      </button>
    </footer>
  `,
  styles: `
    :host {
      --mat-dialog-with-actions-content-padding: 20px 0;
      header {
        padding: 1rem;
        border-bottom: var(--mat-divider-width) solid var(--mat-divider-color);

        h2 {
          padding: 0;
        }
      }

      section {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 25rem;
      }

      footer {
        padding: 1rem;
        gap: 0.5rem;
      }
    }
  `,
})
export class CreateEventDefinitionDialogComponent {
  protected readonly data =
    inject<CreateEventDefinitionDialogData>(MAT_DIALOG_DATA);
  protected readonly state = this.data.state ?? injectCreateFormState()();
  protected readonly t = injectNamespaceT();
  protected readonly closeLabel = this.t('shared.close');
  protected readonly confirmLabel = this.t('shared.confirm');

  private readonly ref =
    inject<
      MatDialogRef<
        CreateEventDefinitionDialogComponent,
        CreateEventDefinitionDialogReturn
      >
    >(MatDialogRef);

  protected confirm() {
    if (this.state.error()) return this.state.markAllAsTouched();
    this.ref.close(this.state);
  }
}

@Component({
  selector: 'app-create-event-definition-dialog-trigger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFabButton, MatIcon, MatTooltip],
  template: `
    <button
      type="button"
      mat-fab
      (click)="open()"
      [disabled]="disabled() || store.mutation.isLoading()"
      [matTooltip]="title"
      [matTooltipDisabled]="tooltipDisabled()"
    >
      <mat-icon>add</mat-icon>
    </button>
  `,
})
export class CreateEventDefinitionDialogTriggerComponent {
  protected readonly store = inject(EventDefinitionStore);
  private readonly dialog = inject(MatDialog);
  private ref: MatDialogRef<
    CreateEventDefinitionDialogComponent,
    CreateEventDefinitionDialogReturn
  > | null = null;
  private sub = new Subscription();
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly destroy = inject(DestroyRef);
  private readonly t = injectNamespaceT();
  protected readonly title = this.t('eventDef.createEventDefinition');
  protected readonly tooltipDisabled = injectDisableTooltips();

  open(state?: CreateUpdateEventState) {
    this.sub.unsubscribe();
    this.ref?.close(null);
    this.ref = this.dialog.open<
      CreateEventDefinitionDialogComponent,
      CreateEventDefinitionDialogData,
      CreateEventDefinitionDialogReturn
    >(CreateEventDefinitionDialogComponent, {
      data: {
        state,
        title: computed(() => this.title),
      },
      maxHeight: '90vh',
      maxWidth: '90vw',
      autoFocus: false,
    });

    this.sub = this.ref
      .afterClosed()
      .pipe(first(), takeUntilDestroyed(this.destroy))
      .subscribe((v) => {
        if (!v) return;

        const value = fromNullableToCreate(untracked(v.value));

        this.store.create({
          value,
          reOpen: (() => this.open(v)).bind(this),
          type: 'create',
        });
      });
  }
}
