-- Tenant profile / SEO
ALTER TABLE tenant ADD COLUMN description TEXT;
ALTER TABLE tenant ADD COLUMN phone VARCHAR(30);
ALTER TABLE tenant ADD COLUMN whatsapp VARCHAR(30);
ALTER TABLE tenant ADD COLUMN address TEXT;
ALTER TABLE tenant ADD COLUMN logo_url VARCHAR(500);
ALTER TABLE tenant ADD COLUMN seo_title VARCHAR(255);
ALTER TABLE tenant ADD COLUMN seo_description TEXT;
ALTER TABLE tenant ADD COLUMN seo_image_url VARCHAR(500);

-- Scheduling settings per tenant
CREATE TABLE tenant_scheduling_settings (
    id                      BIGSERIAL PRIMARY KEY,
    tenant_id               BIGINT       NOT NULL UNIQUE REFERENCES tenant (id),
    zone_id                 VARCHAR(100) NOT NULL DEFAULT 'America/Sao_Paulo',
    buffer_minutes          INT          NOT NULL DEFAULT 15,
    slot_interval_minutes   INT          NOT NULL DEFAULT 30,
    day_start_time          TIME         NOT NULL DEFAULT '09:00',
    day_end_time            TIME         NOT NULL DEFAULT '22:00'
);

-- Bookable professional profile (linked to tenant membership)
CREATE TABLE professional_profile (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID         NOT NULL UNIQUE,
    tenant_user_id  BIGINT       NOT NULL UNIQUE REFERENCES tenant_user (id),
    bookable        BOOLEAN      NOT NULL DEFAULT FALSE,
    phone           VARCHAR(30),
    active          BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE professional_working_period (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID    NOT NULL UNIQUE,
    tenant_user_id  BIGINT  NOT NULL REFERENCES tenant_user (id),
    day_of_week     INT     NOT NULL,
    start_time      TIME    NOT NULL,
    end_time        TIME    NOT NULL,
    CONSTRAINT chk_working_day CHECK (day_of_week BETWEEN 1 AND 7)
);

CREATE INDEX idx_working_period_tenant_user_day
    ON professional_working_period (tenant_user_id, day_of_week);

CREATE TABLE professional_blocked_period (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID                     NOT NULL UNIQUE,
    tenant_user_id  BIGINT                   NOT NULL REFERENCES tenant_user (id),
    start_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    reason          VARCHAR(255),
    block_type      VARCHAR(50)              NOT NULL DEFAULT 'VACATION',
    CONSTRAINT chk_blocked_period CHECK (start_at < end_at)
);

CREATE INDEX idx_blocked_period_tenant_user_range
    ON professional_blocked_period (tenant_user_id, start_at, end_at);

-- Guest booking support
ALTER TABLE appointment ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE appointment ADD COLUMN guest_name VARCHAR(255);
ALTER TABLE appointment ADD COLUMN guest_phone VARCHAR(30);
ALTER TABLE appointment ADD COLUMN buffer_minutes INT NOT NULL DEFAULT 0;

-- Seed scheduling settings for existing tenants
INSERT INTO tenant_scheduling_settings (tenant_id)
SELECT id FROM tenant
WHERE id NOT IN (SELECT tenant_id FROM tenant_scheduling_settings);
