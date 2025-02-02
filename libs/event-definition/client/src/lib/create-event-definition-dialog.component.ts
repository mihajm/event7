import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  Signal,
} from '@angular/core';
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
import { Subscription } from 'rxjs';
import { injectNamespaceT } from './locale';

type CreateEventDefinitionDialogData = {
  title: Signal<string>;
};

@Component({
  selector: 'app-create-event-definition-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <header>
      <h2 mat-dialog-title>{{ data.title() }}</h2>
    </header>
    <section mat-dialog-content>yay</section>
    <footer mat-dialog-actions align="end">
      <button type="button" mat-button [mat-dialog-close]="null">
        {{ close }}
      </button>
      <button type="button" mat-button [mat-dialog-close]="null">
        {{ confirm }}
      </button>
    </footer>
  `,
  styles: ``,
})
export class CreateEventDefinitionDialogComponent {
  protected readonly data =
    inject<CreateEventDefinitionDialogData>(MAT_DIALOG_DATA);
  protected readonly t = injectNamespaceT();
  protected readonly close = this.t('shared.close');
  protected readonly confirm = this.t('shared.confirm');
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
      [disabled]="disabled()"
      [matTooltip]="title"
      [matTooltipDisabled]="tooltipDisabled()"
    >
      <mat-icon>add</mat-icon>
    </button>
  `,
  styles: ``,
})
export class CreateEventDefinitionDialogTriggerComponent {
  private readonly dialog = inject(MatDialog);
  private ref: MatDialogRef<CreateEventDefinitionDialogComponent, null> | null =
    null;
  private sub = new Subscription();
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly t = injectNamespaceT();
  protected readonly title = this.t('eventDef.createEventDefinition');
  protected readonly tooltipDisabled = injectDisableTooltips();

  open() {
    this.sub.unsubscribe();
    this.ref?.close();
    this.ref = this.dialog.open<
      CreateEventDefinitionDialogComponent,
      CreateEventDefinitionDialogData,
      null
    >(CreateEventDefinitionDialogComponent, {
      data: {
        title: computed(() => this.title),
      },
    });

    this.sub = this.ref.afterClosed().subscribe();
  }
}
