package br.com.salao.web.dto;

import java.util.UUID;

public record NamedRef(UUID publicId, String name) {
}
