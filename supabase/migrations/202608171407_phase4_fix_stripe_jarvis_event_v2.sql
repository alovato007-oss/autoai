-- Phase 4: repair malformed JSON path operators in the canonical Stripe/JARVIS processor.
DO $$
DECLARE
  fn text;
BEGIN
  SELECT pg_get_functiondef(p.oid)
    INTO fn
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'process_stripe_jarvis_event_v2'
    AND pg_get_function_identity_arguments(p.oid) = 'p_event_id text, p_event_type text, p_payload jsonb, p_environment text';

  IF fn IS NULL THEN
    RAISE EXCEPTION 'process_stripe_jarvis_event_v2 function not found';
  END IF;

  fn := replace(fn, 'p_payload->''data''->object', 'p_payload->''data''->''object''');
  fn := replace(fn, 'p_payload->data->', 'p_payload->''data''->');
  EXECUTE fn;
END $$;
