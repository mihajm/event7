import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactivityComponent } from './reactivity.component';

describe('ReactivityComponent', () => {
  let component: ReactivityComponent;
  let fixture: ComponentFixture<ReactivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactivityComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReactivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
