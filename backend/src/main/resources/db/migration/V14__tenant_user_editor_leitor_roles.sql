ALTER TABLE tenant_user DROP CONSTRAINT chk_tenant_user_role;
ALTER TABLE tenant_user ADD CONSTRAINT chk_tenant_user_role CHECK (role IN ('ADMIN', 'PROFESSIONAL', 'EDITOR', 'LEITOR', 'CLIENT'));
