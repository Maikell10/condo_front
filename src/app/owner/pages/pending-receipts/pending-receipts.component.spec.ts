import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingReceiptsComponent } from './pending-receipts.component';

describe('PendingReceiptsComponent', () => {
  let component: PendingReceiptsComponent;
  let fixture: ComponentFixture<PendingReceiptsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingReceiptsComponent]
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
