import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingDetailedComponent } from './pending-detailed.component';

describe('PendingDetailedComponent', () => {
  let component: PendingDetailedComponent;
  let fixture: ComponentFixture<PendingDetailedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingDetailedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingDetailedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
