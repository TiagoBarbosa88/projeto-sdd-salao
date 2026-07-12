package br.com.salao.web.dto;

import java.util.UUID;

public record SalonSettingsResponse(
        UUID publicId,
        String name,
        String slug,
        String description,
        String phone,
        String whatsapp,
        String address,
        String businessHours,
        String logoUrl,
        String instagramUrl,
        String facebookUrl,
        String tiktokUrl,
        String websiteUrl,
        String youtubeUrl,
        String googleMapsUrl,
        String seoTitle,
        String seoDescription,
        String seoImageUrl
) {
}
