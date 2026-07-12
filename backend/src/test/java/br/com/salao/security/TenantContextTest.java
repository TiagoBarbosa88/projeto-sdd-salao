package br.com.salao.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class TenantContextTest {

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void setAndGetTenantPublicId() {
        UUID tenantPublicId = UUID.randomUUID();

        TenantContext.set(tenantPublicId);

        assertThat(TenantContext.get()).contains(tenantPublicId);
    }

    @Test
    void clearRemovesTenantPublicId() {
        TenantContext.set(UUID.randomUUID());

        TenantContext.clear();

        assertThat(TenantContext.get()).isEmpty();
    }
}
