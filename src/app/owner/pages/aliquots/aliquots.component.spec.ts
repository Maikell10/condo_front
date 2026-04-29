import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AliquotsComponent } from './aliquots.component';

describe('AliquotsComponent', () => {
  let component: AliquotsComponent;
  let fixture: ComponentFixture<AliquotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AliquotsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AliquotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
