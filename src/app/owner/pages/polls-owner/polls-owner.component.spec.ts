import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PollsOwnerComponent } from './polls-owner.component';

describe('PollsOwnerComponent', () => {
  let component: PollsOwnerComponent;
  let fixture: ComponentFixture<PollsOwnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PollsOwnerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PollsOwnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
