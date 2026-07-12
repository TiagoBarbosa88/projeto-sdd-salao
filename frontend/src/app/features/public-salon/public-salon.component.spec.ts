import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { PublicSalonComponent } from './public-salon.component';

describe('PublicSalonComponent', () => {
  let fixture: ComponentFixture<PublicSalonComponent>;
  let httpMock: HttpTestingController;

  const mockTenant = {
    publicId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Studio Bella',
    slug: 'studio-bella',
  };

  const mockServices = [
    {
      publicId: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Corte',
      description: 'Corte masculino',
      durationMinutes: 30,
      price: 45,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicSalonComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'slug' ? 'studio-bella' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PublicSalonComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushData(): void {
    httpMock.expectOne('/api/v1/public/tenants/studio-bella').flush(mockTenant);
    httpMock.expectOne('/api/v1/public/tenants/studio-bella/services').flush(mockServices);
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
    flushData();
  });

  it('should render tenant and services', () => {
    flushData();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Studio Bella');
    expect(element.textContent).toContain('Corte');
  });
});
