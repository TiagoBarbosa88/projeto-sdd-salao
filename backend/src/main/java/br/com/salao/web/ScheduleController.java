package br.com.salao.web;

import br.com.salao.service.ScheduleService;
import br.com.salao.web.dto.BlockedPeriodResponse;
import br.com.salao.web.dto.CreateBlockedPeriodRequest;
import br.com.salao.web.dto.UpdateWorkingHoursRequest;
import br.com.salao.web.dto.WorkingPeriodResponse;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/team/members/{publicId}")
public class ScheduleController {

    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping("/working-hours")
    public List<WorkingPeriodResponse> getWorkingHours(@PathVariable UUID publicId) {
        return scheduleService.getWorkingHours(publicId);
    }

    @PutMapping("/working-hours")
    public List<WorkingPeriodResponse> updateWorkingHours(
            @PathVariable UUID publicId,
            @RequestBody UpdateWorkingHoursRequest request) {
        return scheduleService.updateWorkingHours(publicId, request);
    }

    @GetMapping("/blocked-periods")
    public List<BlockedPeriodResponse> listBlockedPeriods(@PathVariable UUID publicId) {
        return scheduleService.listBlockedPeriods(publicId);
    }

    @PostMapping("/blocked-periods")
    public BlockedPeriodResponse createBlockedPeriod(
            @PathVariable UUID publicId,
            @RequestBody CreateBlockedPeriodRequest request) {
        return scheduleService.createBlockedPeriod(publicId, request);
    }

    @DeleteMapping("/blocked-periods/{blockPublicId}")
    public void deleteBlockedPeriod(
            @PathVariable UUID publicId,
            @PathVariable UUID blockPublicId) {
        scheduleService.deleteBlockedPeriod(publicId, blockPublicId);
    }
}
