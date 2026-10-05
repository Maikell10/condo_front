import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CondoReceiptComponent } from './condo-receipt.component';

describe('CondoReceiptComponent', () => {
  let component: CondoReceiptComponent;
  let fixture: ComponentFixture<CondoReceiptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CondoReceiptComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
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
