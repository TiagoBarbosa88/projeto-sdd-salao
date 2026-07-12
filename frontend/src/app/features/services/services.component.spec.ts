import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ServicesComponent } from './services.component';

describe('ServicesComponent', () => {
  let fixture: ComponentFixture<ServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ServicesComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render services heading', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Servicos');
  });
});
