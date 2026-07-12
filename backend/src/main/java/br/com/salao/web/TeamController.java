package br.com.salao.web;

import br.com.salao.domain.entity.Role;
import br.com.salao.service.TeamService;
import br.com.salao.web.dto.TeamMemberResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
}
