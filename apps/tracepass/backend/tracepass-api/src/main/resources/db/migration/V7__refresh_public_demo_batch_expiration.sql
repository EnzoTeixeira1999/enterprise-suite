-- Refresh only the published portfolio fixture if its original dates are still present.
UPDATE batches
SET expiration_date = DATE '2030-08-03',
    updated_at = CURRENT_TIMESTAMP
WHERE id = '1528bb74-adcd-46a8-aa1b-f6ea556bb7ef'
  AND batch_code = 'LOTE-2026-001'
  AND manufacture_date = DATE '2026-08-03'
  AND expiration_date = DATE '2026-08-03'
  AND status = 'IN_STORAGE';
