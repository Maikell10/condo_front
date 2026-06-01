import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPaymentModalComponent } from './admin-payment-modal.component';

describe('AdminPaymentModalComponent', () => {
  let component: AdminPaymentModalComponent;
  let fixture: ComponentFixture<AdminPaymentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPaymentModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPaymentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
