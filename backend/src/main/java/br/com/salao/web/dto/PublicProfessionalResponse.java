package br.com.salao.web.dto;

import java.util.List;
import java.util.UUID;

public record PublicProfessionalResponse(
        UUID publicId,
        String name,
        String phone,
        List<Integer> openDaysOfWeek) {
}
