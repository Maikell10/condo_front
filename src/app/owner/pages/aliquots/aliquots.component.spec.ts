import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AliquotsComponent } from './aliquots.component';

describe('AliquotsComponent', () => {
  let component: AliquotsComponent;
  let fixture: ComponentFixture<AliquotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AliquotsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
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
