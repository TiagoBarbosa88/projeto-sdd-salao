package br.com.salao.web.dto;

import java.util.UUID;

public record PublicProfessionalResponse(UUID publicId, String name, String phone) {
}
