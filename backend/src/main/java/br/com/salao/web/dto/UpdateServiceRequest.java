package br.com.salao.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateServiceRequest(
        @NotBlank @Size(max = 255) String name,
        @Size(max = 1000) String description,
        @NotNull @Min(1) Integer durationMinutes,
        @NotNull @DecimalMin("0.00") BigDecimal price,
        @NotNull Boolean active,
        String imageUrl
) {
}
