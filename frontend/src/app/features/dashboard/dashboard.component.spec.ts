import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;

  const mockSummary = {
    appointmentsToday: 3,
    estimatedRevenue: 150,
    occupancyRate: 0.42,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushSummary(): void {
    const req = httpMock.expectOne('/api/v1/dashboard/summary');
    req.flush(mockSummary);
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
    flushSummary();
  });

  it('should load dashboard summary', () => {
    flushSummary();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('3');
    expect(element.textContent).toContain('Agendamentos hoje');
  });
});
