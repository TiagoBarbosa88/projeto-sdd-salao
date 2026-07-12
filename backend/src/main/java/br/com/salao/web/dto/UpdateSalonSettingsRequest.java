package br.com.salao.web.dto;

public record UpdateSalonSettingsRequest(
        String name,
        String description,
        String phone,
        String whatsapp,
        String address,
        String logoUrl,
        String seoTitle,
        String seoDescription,
        String seoImageUrl
) {
}
