-- Ensure existing ADMIN/PROFESSIONAL members have bookable profiles
INSERT INTO professional_profile (public_id, tenant_user_id, bookable, active)
SELECT gen_random_uuid(), tu.id, TRUE, TRUE
FROM tenant_user tu
WHERE tu.role IN ('ADMIN', 'PROFESSIONAL')
  AND NOT EXISTS (
      SELECT 1 FROM professional_profile pp WHERE pp.tenant_user_id = tu.id
  );

-- Default working hours Mon-Sat 09:00-22:00 when none exist
INSERT INTO professional_working_period (public_id, tenant_user_id, day_of_week, start_time, end_time)
SELECT gen_random_uuid(), tu.id, d.day_of_week, TIME '09:00', TIME '22:00'
FROM tenant_user tu
CROSS JOIN (VALUES (1), (2), (3), (4), (5), (6)) AS d(day_of_week)
WHERE tu.role IN ('ADMIN', 'PROFESSIONAL')
  AND NOT EXISTS (
      SELECT 1 FROM professional_working_period p WHERE p.tenant_user_id = tu.id
  );
