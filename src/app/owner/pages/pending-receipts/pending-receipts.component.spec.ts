import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PendingReceiptsComponent } from './pending-receipts.component';

describe('PendingReceiptsComponent', () => {
  let component: PendingReceiptsComponent;
  let fixture: ComponentFixture<PendingReceiptsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingReceiptsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingReceiptsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
