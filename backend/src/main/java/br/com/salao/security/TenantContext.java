package br.com.salao.security;

import java.util.Optional;
import java.util.UUID;

public final class TenantContext {

    private static final ThreadLocal<UUID> TENANT_PUBLIC_ID = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(UUID tenantPublicId) {
        TENANT_PUBLIC_ID.set(tenantPublicId);
    }

    public static Optional<UUID> get() {
        return Optional.ofNullable(TENANT_PUBLIC_ID.get());
    }

    public static void clear() {
        TENANT_PUBLIC_ID.remove();
    }
}
