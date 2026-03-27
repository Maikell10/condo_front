import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewInvoiceDialogComponent } from './new-invoice-dialog.component';

describe('NewInvoiceDialogComponent', () => {
  let component: NewInvoiceDialogComponent;
  let fixture: ComponentFixture<NewInvoiceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewInvoiceDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewInvoiceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
