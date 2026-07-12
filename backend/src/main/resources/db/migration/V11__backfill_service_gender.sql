UPDATE service
SET gender = 'MASCULINO'
WHERE gender = 'FEMININO'
  AND (
    LOWER(name) LIKE '%barba%'
    OR LOWER(name) LIKE '%degrad%'
    OR LOWER(name) LIKE '%degradê%'
    OR LOWER(name) LIKE '%fade%'
    OR LOWER(name) LIKE '%infantil%'
    OR LOWER(name) LIKE '%tradicional%'
    OR LOWER(name) LIKE '%pigment%'
    OR LOWER(name) LIKE '%navalha%'
    OR LOWER(name) LIKE '%masculin%'
    OR LOWER(COALESCE(description, '')) LIKE '%masculin%'
    OR LOWER(COALESCE(description, '')) LIKE '%barba%'
    OR LOWER(COALESCE(description, '')) LIKE '%degrad%'
    OR LOWER(COALESCE(description, '')) LIKE '%fade%'
  );

UPDATE service
SET gender = 'FEMININO'
WHERE LOWER(name) LIKE '%feminino%'
   OR LOWER(name) LIKE '%escova%'
   OR LOWER(name) LIKE '%progressiva%'
   OR LOWER(name) LIKE '%hidrat%'
   OR LOWER(name) LIKE '%manicure%'
   OR LOWER(name) LIKE '%pedicure%'
   OR LOWER(name) LIKE '%colora%'
   OR LOWER(name) LIKE '%maquiagem%'
   OR LOWER(name) LIKE '%sobrancelha feminina%';
