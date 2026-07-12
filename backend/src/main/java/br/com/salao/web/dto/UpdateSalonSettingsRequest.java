package br.com.salao.web.dto;

public record UpdateSalonSettingsRequest(
        String name,
        String description,
        String phone,
        String whatsapp,
        String address,
        String logoUrl,
        String instagramUrl,
        String facebookUrl,
        String tiktokUrl,
        String websiteUrl,
        String youtubeUrl,
        String googleMapsUrl
) {
}
