package br.com.salao.web;

import br.com.salao.service.PublicTenantService;
import br.com.salao.web.dto.PublicServiceResponse;
import br.com.salao.web.dto.PublicTenantResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/public/tenants")
public class PublicTenantController {

    private final PublicTenantService publicTenantService;

    public PublicTenantController(PublicTenantService publicTenantService) {
        this.publicTenantService = publicTenantService;
    }

    @GetMapping("/{slug}")
    public PublicTenantResponse getTenant(@PathVariable String slug) {
        return publicTenantService.getTenantBySlug(slug);
    }

    @GetMapping("/{slug}/services")
    public List<PublicServiceResponse> listServices(@PathVariable String slug) {
        return publicTenantService.getActiveServicesBySlug(slug);
    }
}
