import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PublicTenant } from '../../../../core/services/public-salon.service';
import {
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsOpenUrl,
  buildOsmStaticMapUrl,
  extractMapCoordinates,
} from '../../../../core/utils/maps.util';
import { buildWhatsAppUrl } from '../../../../core/utils/phone.util';

@Component({
  selector: 'app-public-salon-footer',
  standalone: true,
  templateUrl: './public-salon-footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicSalonFooterComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly tenant = input.required<PublicTenant>();

  protected readonly mapsEmbedUrl = computed((): SafeResourceUrl | null => {
    const tenant = this.tenant();
    if (!tenant.googleMapsUrl) {
      return null;
    }
    const url = buildGoogleMapsEmbedUrl(tenant.googleMapsUrl, tenant.address);
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  protected readonly mapsPreviewImageUrl = computed((): string | null => {
    const tenant = this.tenant();
    if (!tenant.googleMapsUrl) {
      return null;
    }
    const coords = extractMapCoordinates(tenant.googleMapsUrl, tenant.address);
    if (!coords) {
      return null;
    }
    return buildOsmStaticMapUrl(coords.lat, coords.lng);
  });

  protected readonly mapsOpenUrl = computed(
    (): string => buildGoogleMapsOpenUrl(this.tenant().googleMapsUrl, this.tenant().address) ?? '#'
  );

  protected hasContactLinks(): boolean {
    const tenant = this.tenant();
    return !!(
      tenant.whatsapp ||
      tenant.instagramUrl ||
      tenant.facebookUrl ||
      tenant.tiktokUrl ||
      tenant.youtubeUrl ||
      tenant.websiteUrl
    );
  }

  protected whatsappLink(): string {
    const tenant = this.tenant();
    const phone = tenant.whatsapp ?? '';
    if (!phone) {
      return '#';
    }
    const salonName = tenant.name?.trim() || 'nosso salao';
    return buildWhatsAppUrl(
      phone,
      `Ola! Vim pelo site do ${salonName} e gostaria de saber mais sobre os servicos. Pode me ajudar?`
    );
  }

  protected whatsappLinkTitle(): string {
    const salonName = this.tenant().name?.trim() || 'Salao';
    return `Fale com ${salonName} no WhatsApp`;
  }

  protected businessHoursLines(): string[] {
    return this.tenant().businessHoursLines ?? [];
  }
}
