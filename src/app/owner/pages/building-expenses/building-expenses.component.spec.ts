import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { BuildingExpensesComponent } from './building-expenses.component';

describe('BuildingExpensesComponent', () => {
  let component: BuildingExpensesComponent;
  let fixture: ComponentFixture<BuildingExpensesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildingExpensesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuildingExpensesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
