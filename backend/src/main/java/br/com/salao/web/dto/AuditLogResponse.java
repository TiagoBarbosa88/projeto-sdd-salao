package br.com.salao.web.dto;

import br.com.salao.domain.entity.AuditAction;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AuditLogResponse(
        UUID publicId,
        AuditAction action,
        NamedRef actor,
        String entityType,
        UUID entityPublicId,
        String metadata,
        OffsetDateTime createdAt) {}
