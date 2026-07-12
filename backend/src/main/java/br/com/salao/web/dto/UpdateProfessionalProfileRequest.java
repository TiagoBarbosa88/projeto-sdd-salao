package br.com.salao.web.dto;

public record UpdateProfessionalProfileRequest(
        String phone,
        Boolean bookable,
        Boolean active
) {
}
