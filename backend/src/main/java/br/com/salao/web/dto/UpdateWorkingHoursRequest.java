package br.com.salao.web.dto;

import java.util.List;

public record UpdateWorkingHoursRequest(List<WorkingPeriodEntry> periods) {
}
