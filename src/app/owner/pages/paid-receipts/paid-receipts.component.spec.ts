import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaidReceiptsComponent } from './paid-receipts.component';

describe('PaidReceiptsComponent', () => {
  let component: PaidReceiptsComponent;
  let fixture: ComponentFixture<PaidReceiptsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaidReceiptsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaidReceiptsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
