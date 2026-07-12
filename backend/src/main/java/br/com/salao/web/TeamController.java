package br.com.salao.web;

import br.com.salao.domain.entity.Role;
import br.com.salao.service.TeamService;
import br.com.salao.web.dto.CreateTeamMemberRequest;
import br.com.salao.web.dto.ProfessionalResponse;
import br.com.salao.web.dto.TeamMemberResponse;
import br.com.salao.web.dto.UpdateTeamMemberRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/team")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping("/members")
    public List<TeamMemberResponse> listMembers(@RequestParam(required = false) Role role) {
        return teamService.listMembers(role);
    }

    @PostMapping("/members")
    public ProfessionalResponse createProfessional(@RequestBody CreateTeamMemberRequest request) {
        return teamService.createProfessional(request);
    }

    @GetMapping("/professionals")
    public List<ProfessionalResponse> listBookableProfessionals() {
        return teamService.listBookableProfessionals();
    }

    @GetMapping("/profiles")
    public List<ProfessionalResponse> listAllProfessionalProfiles() {
        return teamService.listAllProfessionalProfiles();
    }

    @PutMapping("/members/{publicId}/profile")
    public ProfessionalResponse updateTeamMember(
            @PathVariable UUID publicId,
            @RequestBody UpdateTeamMemberRequest request) {
        return teamService.updateTeamMember(publicId, request);
    }
}
