package br.com.salao.web.dto;

import java.util.UUID;

public record PublicTenantResponse(UUID publicId, String name, String slug) {}
