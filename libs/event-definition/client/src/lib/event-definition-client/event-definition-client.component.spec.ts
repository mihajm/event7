import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDefinitionClientComponent } from './event-definition-client.component';

describe('EventDefinitionClientComponent', () => {
  let component: EventDefinitionClientComponent;
  let fixture: ComponentFixture<EventDefinitionClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventDefinitionClientComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EventDefinitionClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
