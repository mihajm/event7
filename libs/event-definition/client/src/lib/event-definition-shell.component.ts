import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterOutlet } from '@angular/router';
import { CreateEventDefinitionDialogTriggerComponent } from './create-event-definition-dialog.component';

@Component({
  selector: 'app-event-definition-shell',
  imports: [
    RouterOutlet,
    MatCardModule,
    CreateEventDefinitionDialogTriggerComponent,
  ],
  template: `
    <mat-card>
      <router-outlet />
    </mat-card>

    <app-create-event-definition-dialog-trigger />
  `,
  styles: ``,
})
export class EventDefinitionShellComponent {}
