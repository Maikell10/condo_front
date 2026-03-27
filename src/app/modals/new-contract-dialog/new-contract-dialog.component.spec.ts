import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewContractDialogComponent } from './new-contract-dialog.component';

describe('NewContractDialogComponent', () => {
  let component: NewContractDialogComponent;
  let fixture: ComponentFixture<NewContractDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewContractDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewContractDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
