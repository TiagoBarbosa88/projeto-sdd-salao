CREATE TABLE service (
    id                BIGSERIAL PRIMARY KEY,
    public_id         UUID           NOT NULL UNIQUE,
    tenant_id         BIGINT         NOT NULL REFERENCES tenant (id),
    name              VARCHAR(255)   NOT NULL,
    description       VARCHAR(1000),
    duration_minutes  INTEGER        NOT NULL,
    price             NUMERIC(12, 2) NOT NULL,
    active            BOOLEAN        NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_service_tenant_active ON service (tenant_id, active);
