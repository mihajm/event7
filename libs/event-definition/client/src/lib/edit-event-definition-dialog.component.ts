import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  Signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { keys } from '@e7/common/object';
import { injectDisableTooltips } from '@e7/common/settings';
import {
  EventDefinition,
  UpdateEventDefinitionDTO,
} from '@e7/event-definition/shared';
import { first, Subscription } from 'rxjs';
import {
  CreateUpdateEventState,
  EventDefinitionFormComponent,
  injectCreateFormState,
} from './event-definition-form.component';
import { EventDefinitionStore } from './event-definition.store';
import { injectNamespaceT } from './locale';

type EditEventDefinitinoDialogData = {
  source: Signal<EventDefinition>;
  state?: CreateUpdateEventState;
};

type EditEventDefinitionDialogReturn = null | {
  id: string;
  state: CreateUpdateEventState;
};

type EditEventStateSource = {
  source: EventDefinition;
  state?: CreateUpdateEventState;
};

function fromNullableToUpdate(
  id: string,
  e: CreateUpdateEventState,
): UpdateEventDefinitionDTO {
  const obj: UpdateEventDefinitionDTO = {};

  if (!untracked(e.dirty)) return obj;

  if (untracked(e.children.name.dirty))
    obj['name'] = untracked(e.children.name.value);

  if (untracked(e.children.description.dirty))
    obj['description'] = untracked(e.children.description.value);

  if (untracked(e.children.type.dirty))
    obj['type'] = untracked(e.children.type.value);

  if (untracked(e.children.priority.dirty))
    obj['priority'] = untracked(e.children.priority.value) ?? 0;

  return {
    ...obj,
    id,
  };
}

@Component({
  selector: 'app-archive-event-definition-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, EventDefinitionFormComponent],
  template: `
    <header>
      <h2 mat-dialog-title>{{ title() }}</h2>
    </header>

    <section mat-dialog-content>
      <app-event-definition-form [state]="state()" />
    </section>

    <footer mat-dialog-actions align="end">
      <button type="button" mat-button [mat-dialog-close]="null">
        {{ closeLabel }}
      </button>
      <button
        type="button"
        mat-flat-button
        (click)="confirm()"
        [disabled]="isArchived()"
      >
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

        ::ng-deep mat-form-field,
        div {
          flex: 1;
        }

        div {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;

          ::ng-deep mat-form-field {
            flex: 1 0 calc(50% - 0.25rem);
            min-width: 250px;
          }
        }
      }

      footer {
        padding: 1rem;
        gap: 0.5rem;
      }
    }
  `,
})
export class EditEventDefinitionDialogComponent {
  private readonly t = injectNamespaceT();
  protected readonly data =
    inject<EditEventDefinitinoDialogData>(MAT_DIALOG_DATA);
  protected readonly closeLabel = this.t('shared.close');
  protected readonly confirmLabel = this.t('shared.confirm');
  private readonly stateFactory = injectCreateFormState();

  protected readonly state = linkedSignal<
    EditEventStateSource,
    CreateUpdateEventState
  >({
    source: () => ({ source: this.data.source(), state: this.data.state }),
    computation: ({ source, state }, prev) => {
      if (state) return state;

      return this.stateFactory(source, prev?.value);
    },
  });

  readonly isArchived = computed(
    () => this.data.source().status === 'archived',
  );

  protected readonly title = computed(() =>
    this.t('shared.editItem', {
      item: this.data.source().name ?? this.data.source().id,
    }),
  );

  private readonly ref =
    inject<
      MatDialogRef<
        EditEventDefinitionDialogComponent,
        EditEventDefinitionDialogReturn
      >
    >(MatDialogRef);

  protected confirm() {
    const state = untracked(this.state);
    if (untracked(state.error)) return state.markAllAsTouched();

    this.ref.close({ id: untracked(this.data.source).id, state });
  }
}

@Component({
  selector: 'app-edit-event-trigger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIcon, MatTooltip],
  template: `
    @if (fullButton()) {
      <button
        mat-button
        (click)="open()"
        [disabled]="disabled()"
        [matTooltip]="editLabel"
        [matTooltipDisabled]="tooltipDisabled()"
      >
        <mat-icon>edit</mat-icon>
        <span>{{ editShortLabel }}</span>
      </button>
    } @else {
      <button
        type="button"
        mat-icon-button
        [matTooltip]="editLabel"
        [matTooltipDisabled]="tooltipDisabled()"
        [disabled]="disabled()"
        (click)="open()"
      >
        <mat-icon>edit</mat-icon>
      </button>
    }
  `,
})
export class EditEventTriggerComponent {
  private readonly t = injectNamespaceT();
  protected readonly editLabel = this.t('eventDef.modifyEventDefinition');
  protected readonly editShortLabel = this.t('shared.edit');

  protected readonly tooltipDisabled = injectDisableTooltips();
  private sub = new Subscription();
  private destroy = inject(DestroyRef);
  private ref: MatDialogRef<
    EditEventDefinitionDialogComponent,
    EditEventDefinitionDialogReturn
  > | null = null;
  private readonly dialog = inject(MatDialog);
  private readonly store = inject(EventDefinitionStore);
  readonly state = input.required<EventDefinition>();
  readonly fullButton = input(false, { transform: booleanAttribute });

  protected readonly disabled = computed(
    () => this.state().status === 'archived' || this.store.mutation.isLoading(),
  );

  protected open() {
    this.sub.unsubscribe();
    this.ref?.close();

    this.ref = this.dialog.open<
      EditEventDefinitionDialogComponent,
      EditEventDefinitinoDialogData,
      EditEventDefinitionDialogReturn
    >(EditEventDefinitionDialogComponent, {
      autoFocus: false,
      data: {
        source: this.state,
      },
      maxHeight: '90vh',
      maxWidth: '90vw',
    });

    this.sub = this.ref
      .afterClosed()
      .pipe(first(), takeUntilDestroyed(this.destroy))
      .subscribe((r) => {
        if (!r) return;

        const value = fromNullableToUpdate(r.id, r.state);

        if (!keys(value).length) return;

        this.store.update(r.id, {
          value,
          type: 'update',
        });
      });
  }
}
