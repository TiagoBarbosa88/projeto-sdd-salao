CREATE TABLE appointment (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID                     NOT NULL UNIQUE,
    tenant_id       BIGINT                   NOT NULL REFERENCES tenant (id),
    service_id      BIGINT                   NOT NULL REFERENCES service (id),
    professional_id BIGINT                   NOT NULL REFERENCES app_user (id),
    client_id       BIGINT                   NOT NULL REFERENCES app_user (id),
    start_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    status          VARCHAR(50)              NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_appointment_status CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'))
);

CREATE INDEX idx_appointment_tenant_professional_start
    ON appointment (tenant_id, professional_id, start_at);
