package br.com.salao.service;

import br.com.salao.domain.entity.ProfessionalProfile;
import br.com.salao.domain.entity.ProfessionalWorkingPeriod;
import br.com.salao.domain.entity.TenantSchedulingSettings;
import br.com.salao.domain.repository.ProfessionalProfileRepository;
import br.com.salao.domain.repository.ProfessionalWorkingPeriodRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class PublicBusinessHoursService {

    private static final String[] DAY_NAMES = {
            null, "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"
    };

    private final ProfessionalProfileRepository professionalProfileRepository;
    private final ProfessionalWorkingPeriodRepository workingPeriodRepository;
    private final SalonSettingsService salonSettingsService;

    public PublicBusinessHoursService(
            ProfessionalProfileRepository professionalProfileRepository,
            ProfessionalWorkingPeriodRepository workingPeriodRepository,
            SalonSettingsService salonSettingsService) {
        this.professionalProfileRepository = professionalProfileRepository;
        this.workingPeriodRepository = workingPeriodRepository;
        this.salonSettingsService = salonSettingsService;
    }

    @Transactional(readOnly = true)
    public List<String> buildLines(Long tenantId) {
        List<ProfessionalProfile> professionals = professionalProfileRepository.findBookableByTenantId(tenantId);
        Map<Integer, DayHours> mergedByDay = mergeProfessionalDays(professionals);

        if (!mergedByDay.isEmpty() && !matchesFactoryDefault(mergedByDay)) {
            return groupIntoLines(mergedByDay);
        }

        return buildFromScheduling(tenantId);
    }

    private Map<Integer, DayHours> mergeProfessionalDays(List<ProfessionalProfile> professionals) {
        Map<Integer, DayHours> mergedByDay = new TreeMap<>();
        for (ProfessionalProfile profile : professionals) {
            Long tenantUserId = profile.getTenantUser().getId();
            List<ProfessionalWorkingPeriod> periods =
                    workingPeriodRepository.findByTenantUser_IdOrderByDayOfWeekAscStartTimeAsc(tenantUserId);
            Map<Integer, DayHours> perProfessional = summarizeByDay(periods);
            for (Map.Entry<Integer, DayHours> entry : perProfessional.entrySet()) {
                mergedByDay.merge(entry.getKey(), entry.getValue(), DayHours::union);
            }
        }
        return mergedByDay;
    }

    private boolean matchesFactoryDefault(Map<Integer, DayHours> mergedByDay) {
        if (mergedByDay.size() != 6 || mergedByDay.containsKey(7)) {
            return false;
        }

        LocalTime defaultStart = LocalTime.of(9, 0);
        LocalTime defaultEnd = LocalTime.of(22, 0);
        for (int day = 1; day <= 6; day++) {
            DayHours hours = mergedByDay.get(day);
            if (hours == null || !hours.start().equals(defaultStart) || !hours.end().equals(defaultEnd)) {
                return false;
            }
        }
        return true;
    }

    private List<String> buildFromScheduling(Long tenantId) {
        TenantSchedulingSettings settings = salonSettingsService.requireSchedulingSettingsForTenant(tenantId);
        String line = "Atendimento das "
                + formatTime(settings.getDayStartTime())
                + " as "
                + formatTime(settings.getDayEndTime());
        return List.of(line);
    }

    private Map<Integer, DayHours> summarizeByDay(List<ProfessionalWorkingPeriod> periods) {
        Map<Integer, DayHours> byDay = new LinkedHashMap<>();
        for (ProfessionalWorkingPeriod period : periods) {
            byDay.merge(
                    period.getDayOfWeek(),
                    new DayHours(period.getStartTime(), period.getEndTime()),
                    DayHours::union);
        }
        return byDay;
    }

    private List<String> groupIntoLines(Map<Integer, DayHours> mergedByDay) {
        List<String> lines = new ArrayList<>();
        List<Integer> days = new ArrayList<>(mergedByDay.keySet());
        days.sort(Comparator.naturalOrder());

        int index = 0;
        while (index < days.size()) {
            int rangeStart = index;
            DayHours current = mergedByDay.get(days.get(index));
            index++;

            while (index < days.size()) {
                int previousDay = days.get(index - 1);
                int nextDay = days.get(index);
                DayHours nextHours = mergedByDay.get(nextDay);
                if (nextDay != previousDay + 1 || !current.equals(nextHours)) {
                    break;
                }
                index++;
            }

            int startDay = days.get(rangeStart);
            int endDay = days.get(index - 1);
            lines.add(formatLine(startDay, endDay, current));
        }

        return lines;
    }

    private String formatLine(int startDay, int endDay, DayHours hours) {
        String dayLabel = startDay == endDay
                ? DAY_NAMES[startDay]
                : DAY_NAMES[startDay] + " a " + DAY_NAMES[endDay];
        return dayLabel + " das " + formatTime(hours.start()) + " as " + formatTime(hours.end());
    }

    private String formatTime(LocalTime time) {
        if (time.getMinute() == 0) {
            return time.getHour() + "h";
        }
        return String.format("%02d:%02d", time.getHour(), time.getMinute());
    }

    private record DayHours(LocalTime start, LocalTime end) {
        DayHours union(DayHours other) {
            return new DayHours(
                    start.isBefore(other.start()) ? start : other.start(),
                    end.isAfter(other.end()) ? end : other.end());
        }
    }
}
