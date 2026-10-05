import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PendingDetailedComponent } from './pending-detailed.component';

describe('PendingDetailedComponent', () => {
  let component: PendingDetailedComponent;
  let fixture: ComponentFixture<PendingDetailedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingDetailedComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
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
