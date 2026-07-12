import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuditComponent } from './audit.component';

describe('AuditComponent', () => {
  let fixture: ComponentFixture<AuditComponent>;
  let httpMock: HttpTestingController;

  const mockLogs = [
    {
      publicId: '550e8400-e29b-41d4-a716-446655440001',
      action: 'LOGIN',
      actor: { publicId: '550e8400-e29b-41d4-a716-446655440002', name: 'Marina' },
      entityType: 'User',
      entityPublicId: '550e8400-e29b-41d4-a716-446655440002',
      metadata: null,
      createdAt: '2026-07-12T12:00:00Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AuditComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushLogs(url = '/api/v1/audit-logs'): void {
    const req = httpMock.expectOne(url);
    req.flush(mockLogs);
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
    flushLogs();
  });

  it('should render audit events', () => {
    flushLogs();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Auditoria');
    expect(element.textContent).toContain('Marina');
    expect(element.textContent).toContain('Login');
    expect(element.textContent).toContain('Ver detalhes');
  });

  it('should filter by action', () => {
    flushLogs();

    const select = fixture.nativeElement.querySelector('#actionFilter') as HTMLSelectElement;
    select.value = 'LOGIN';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/v1/audit-logs?action=LOGIN');
    expect(req.request.method).toBe('GET');
    req.flush(mockLogs);
    fixture.detectChanges();
  });
});
