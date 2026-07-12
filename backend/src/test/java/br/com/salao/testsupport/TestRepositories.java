package br.com.salao.testsupport;

import br.com.salao.domain.repository.ProfessionalBlockedPeriodRepository;
import br.com.salao.domain.repository.ProfessionalProfileRepository;
import br.com.salao.domain.repository.ProfessionalWorkingPeriodRepository;
import br.com.salao.domain.repository.TenantSchedulingSettingsRepository;
import org.springframework.stereotype.Component;

@Component
public class TestRepositories {

    private final ProfessionalBlockedPeriodRepository blockedPeriodRepository;
    private final ProfessionalWorkingPeriodRepository workingPeriodRepository;
    private final ProfessionalProfileRepository professionalProfileRepository;
    private final TenantSchedulingSettingsRepository schedulingSettingsRepository;

    public TestRepositories(
            ProfessionalBlockedPeriodRepository blockedPeriodRepository,
            ProfessionalWorkingPeriodRepository workingPeriodRepository,
            ProfessionalProfileRepository professionalProfileRepository,
            TenantSchedulingSettingsRepository schedulingSettingsRepository) {
        this.blockedPeriodRepository = blockedPeriodRepository;
        this.workingPeriodRepository = workingPeriodRepository;
        this.professionalProfileRepository = professionalProfileRepository;
        this.schedulingSettingsRepository = schedulingSettingsRepository;
    }

    public ProfessionalBlockedPeriodRepository blockedPeriodRepository() {
        return blockedPeriodRepository;
    }

    public ProfessionalWorkingPeriodRepository workingPeriodRepository() {
        return workingPeriodRepository;
    }

    public ProfessionalProfileRepository professionalProfileRepository() {
        return professionalProfileRepository;
    }

    public TenantSchedulingSettingsRepository schedulingSettingsRepository() {
        return schedulingSettingsRepository;
    }
}
