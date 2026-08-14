import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigSaasModalComponent } from './config-saas-modal.component';

describe('ConfigSaasModalComponent', () => {
  let component: ConfigSaasModalComponent;
  let fixture: ComponentFixture<ConfigSaasModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigSaasModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigSaasModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
