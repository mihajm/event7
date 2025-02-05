import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  Signal,
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
import { injectDisableTooltips } from '@e7/common/settings';
import { EventDefinition } from '@e7/event-definition/shared';
import { first, Subscription } from 'rxjs';
import { EventDefinitionStore } from './event-definition.store';
import { injectNamespaceT } from './locale';

type ArchiveEventDefinitinoDialogData = Signal<EventDefinition>;

type ArchiveEventDefinitionDialogReturn = null | string;

@Component({
  selector: 'app-archive-event-definition-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <header>
      <h2 mat-dialog-title>{{ areYouSureLabel }}</h2>
    </header>

    <section mat-dialog-content>
      <p mat-dialog-subtitle>{{ archiveLabel }}</p>
    </section>

    <footer mat-dialog-actions align="end">
      <button type="button" mat-button [mat-dialog-close]="null">
        {{ closeLabel }}
      </button>
      <button type="button" mat-flat-button [mat-dialog-close]="source().id">
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
        padding: 1.5rem 1rem;
      }
      footer {
        padding: 1rem;
        gap: 0.5rem;
      }
    }
  `,
})
export class ArchiveEventDefinitionDialogComponent {
  private readonly t = injectNamespaceT();
  protected readonly source =
    inject<ArchiveEventDefinitinoDialogData>(MAT_DIALOG_DATA);
  protected readonly closeLabel = this.t('shared.close');
  protected readonly confirmLabel = this.t('shared.confirm');
  protected readonly areYouSureLabel = this.t('shared.areYouSure');
  protected readonly archiveLabel = this.t(
    'eventDef.youWantToArchiveThisEvent',
  );
}

@Component({
  selector: 'app-archive-event-trigger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIcon, MatTooltip],
  template: `
    @if (fullButton()) {
      <button
        type="button"
        mat-button
        [matTooltip]="archiveLabel"
        [matTooltipDisabled]="tooltipDisabled()"
        [disabled]="disabled()"
        (click)="open()"
      >
        <mat-icon>delete</mat-icon>
        {{ archiveShortLabel }}
      </button>
    } @else {
      <button
        type="button"
        mat-icon-button
        [matTooltip]="archiveLabel"
        [matTooltipDisabled]="tooltipDisabled()"
        [disabled]="disabled()"
        (click)="open()"
      >
        <mat-icon>delete</mat-icon>
      </button>
    }
  `,
  styles: `
    button[mat-button]:not(:disabled) {
      color: var(--mat-sys-error);
    }
  `,
})
export class ArchiveEventTriggerComponent {
  private readonly t = injectNamespaceT();
  protected readonly archiveLabel = this.t('eventDef.archiveEventDefinition');
  protected readonly archiveShortLabel = this.t('shared.archive');
  protected readonly tooltipDisabled = injectDisableTooltips();
  private sub = new Subscription();
  private destroy = inject(DestroyRef);
  private ref: MatDialogRef<
    ArchiveEventDefinitionDialogComponent,
    ArchiveEventDefinitionDialogReturn
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
      ArchiveEventDefinitionDialogComponent,
      ArchiveEventDefinitinoDialogData,
      ArchiveEventDefinitionDialogReturn
    >(ArchiveEventDefinitionDialogComponent, {
      autoFocus: false,
      data: this.state,
      maxHeight: '90vh',
      maxWidth: '90vw',
    });

    this.sub = this.ref
      .afterClosed()
      .pipe(first(), takeUntilDestroyed(this.destroy))
      .subscribe((id) => {
        if (!id) return;
        this.store.archive(id);
      });
  }
}
