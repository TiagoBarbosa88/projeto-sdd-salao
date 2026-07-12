package br.com.salao.web.dto;

import java.util.List;
import java.util.UUID;

public record PublicTenantResponse(
        UUID publicId,
        String name,
        String slug,
        String description,
        String phone,
        String whatsapp,
        String address,
        List<String> businessHoursLines,
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
