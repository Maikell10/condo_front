import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CondoReceiptComponent } from './condo-receipt.component';

describe('CondoReceiptComponent', () => {
  let component: CondoReceiptComponent;
  let fixture: ComponentFixture<CondoReceiptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CondoReceiptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CondoReceiptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
