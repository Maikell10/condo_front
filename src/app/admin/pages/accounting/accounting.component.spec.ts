import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AccountingComponent } from './accounting.component';

describe('AccountingComponent', () => {
  let component: AccountingComponent;
  let fixture: ComponentFixture<AccountingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountingComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
