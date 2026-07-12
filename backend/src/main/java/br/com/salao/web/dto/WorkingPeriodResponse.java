package br.com.salao.web.dto;

import java.time.LocalTime;
import java.util.UUID;

public record WorkingPeriodResponse(
        UUID publicId,
        int dayOfWeek,
        LocalTime startTime,
        LocalTime endTime
) {
}
