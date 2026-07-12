package br.com.salao.web.dto;

import java.math.BigDecimal;

public record DashboardSummaryResponse(
        long appointmentsToday,
        BigDecimal estimatedRevenue,
        double occupancyRate
) {
}
