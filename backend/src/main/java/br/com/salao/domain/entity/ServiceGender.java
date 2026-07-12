package br.com.salao.domain.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ServiceGender {
    MASCULINO,
    FEMININO;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ServiceGender fromJson(String value) {
        if (value == null || value.isBlank()) {
            return FEMININO;
        }
        return ServiceGender.valueOf(value.trim().toUpperCase());
    }
}
