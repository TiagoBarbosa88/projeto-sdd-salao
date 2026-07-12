CREATE TABLE audit_log (
    id                BIGSERIAL PRIMARY KEY,
    public_id         UUID                     NOT NULL UNIQUE,
    tenant_id         BIGINT                   NOT NULL REFERENCES tenant (id),
    actor_user_id     BIGINT                   REFERENCES app_user (id),
    action            VARCHAR(50)              NOT NULL,
    entity_type       VARCHAR(50),
    entity_public_id  UUID,
    metadata          TEXT,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_audit_action CHECK (action IN (
        'LOGIN',
        'SERVICE_CREATED',
        'SERVICE_UPDATED',
        'SERVICE_DEACTIVATED',
        'APPOINTMENT_CREATED',
        'APPOINTMENT_CANCELLED'
    ))
);

CREATE INDEX idx_audit_log_tenant_created ON audit_log (tenant_id, created_at DESC);
CREATE INDEX idx_audit_log_tenant_action ON audit_log (tenant_id, action);
