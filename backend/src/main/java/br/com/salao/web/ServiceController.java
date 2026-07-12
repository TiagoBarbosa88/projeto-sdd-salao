package br.com.salao.web;

import br.com.salao.service.ServiceCatalogService;
import br.com.salao.web.dto.CreateServiceRequest;
import br.com.salao.web.dto.ServiceResponse;
import br.com.salao.web.dto.UpdateServiceRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/services")
public class ServiceController {

    private final ServiceCatalogService serviceCatalogService;

    public ServiceController(ServiceCatalogService serviceCatalogService) {
        this.serviceCatalogService = serviceCatalogService;
    }

    @GetMapping
    public List<ServiceResponse> listServices() {
        return serviceCatalogService.listServices();
    }

    @GetMapping("/{publicId}")
    public ServiceResponse getService(@PathVariable UUID publicId) {
        return serviceCatalogService.getService(publicId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ServiceResponse createService(@Valid @RequestBody CreateServiceRequest request) {
        return serviceCatalogService.createService(request);
    }

    @PutMapping("/{publicId}")
    public ServiceResponse updateService(
            @PathVariable UUID publicId,
            @Valid @RequestBody UpdateServiceRequest request) {
        return serviceCatalogService.updateService(publicId, request);
    }

    @DeleteMapping("/{publicId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteService(@PathVariable UUID publicId) {
        serviceCatalogService.deactivateService(publicId);
    }
}
