import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-event-definition-client',
  imports: [CommonModule],
  template: `<p>EventDefinitionClient works!</p>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDefinitionClientComponent {}
