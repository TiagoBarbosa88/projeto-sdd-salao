import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render agenda view controls', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Dia');
    expect(element.textContent).toContain('Semana');
    expect(element.textContent).toContain('Mes');
    expect(element.textContent).toContain('Com agendamento');
    expect(element.textContent).toContain('Dia livre');
  });
});
