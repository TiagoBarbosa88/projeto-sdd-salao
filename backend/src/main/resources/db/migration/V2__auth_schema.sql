CREATE TABLE tenant (
    id          BIGSERIAL PRIMARY KEY,
    public_id   UUID         NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE app_user (
    id            BIGSERIAL PRIMARY KEY,
    public_id     UUID         NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE tenant_user (
    id        BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT       NOT NULL REFERENCES tenant (id),
    user_id   BIGINT       NOT NULL REFERENCES app_user (id),
    role      VARCHAR(50)  NOT NULL,
    CONSTRAINT uq_tenant_user UNIQUE (tenant_id, user_id),
    CONSTRAINT chk_tenant_user_role CHECK (role IN ('ADMIN', 'PROFESSIONAL', 'CLIENT'))
);

CREATE INDEX idx_tenant_slug ON tenant (slug);
CREATE INDEX idx_app_user_email ON app_user (email);
