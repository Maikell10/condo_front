import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankAccountDialogComponent } from './bank-account-dialog.component';

describe('BankAccountDialogComponent', () => {
  let component: BankAccountDialogComponent;
  let fixture: ComponentFixture<BankAccountDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankAccountDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BankAccountDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
