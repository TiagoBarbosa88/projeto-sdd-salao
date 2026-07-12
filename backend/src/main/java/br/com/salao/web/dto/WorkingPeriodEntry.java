package br.com.salao.web.dto;

import java.time.LocalTime;
import java.util.List;

public record WorkingPeriodEntry(
        int dayOfWeek,
        LocalTime startTime,
        LocalTime endTime
) {
}
