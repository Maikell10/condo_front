import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildingDialogComponent } from './building-dialog.component';

describe('BuildingDialogComponent', () => {
  let component: BuildingDialogComponent;
  let fixture: ComponentFixture<BuildingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildingDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuildingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
