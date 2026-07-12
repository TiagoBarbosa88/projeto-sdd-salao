package br.com.salao.web.dto;

import java.time.LocalTime;

public record UpdateSchedulingSettingsRequest(
        String zoneId,
        int bufferMinutes,
        int slotIntervalMinutes,
        LocalTime dayStartTime,
        LocalTime dayEndTime
) {
}
