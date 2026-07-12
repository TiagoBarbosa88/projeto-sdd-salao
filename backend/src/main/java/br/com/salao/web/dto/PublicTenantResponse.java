package br.com.salao.web.dto;

import java.util.UUID;

public record PublicTenantResponse(
        UUID publicId,
        String name,
        String slug,
        String description,
        String phone,
        String whatsapp,
        String address,
        String logoUrl,
        String instagramUrl,
        String facebookUrl,
        String tiktokUrl,
        String websiteUrl,
        String googleMapsUrl,
        String seoTitle,
        String seoDescription,
        String seoImageUrl
) {
}
