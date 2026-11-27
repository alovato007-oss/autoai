-- Remove permissive SELECT policies that let every authenticated user
-- read every organization's AI reports. Preserve the existing organization
-- scoped ai_reports_org_all policy.

DO $$
DECLARE
  scoped_policy text;
BEGIN
  SELECT qual
    INTO scoped_policy
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'ai_reports'
     AND policyname = 'ai_reports_org_all';

  IF scoped_policy IS NULL
     OR position('organization_id' in scoped_policy) = 0
     OR position('current_user_organization_id' in scoped_policy) = 0 THEN
    RAISE EXCEPTION
      'Expected organization-scoped ai_reports_org_all policy is missing or does not match the required predicate; refusing to remove fallback policies';
  END IF;
END
$$;

DROP POLICY IF EXISTS ai_reports_select_authenticated ON public.ai_reports;
DROP POLICY IF EXISTS replace_with_policy_name ON public.ai_reports;

COMMENT ON POLICY ai_reports_org_all ON public.ai_reports IS
  'Restricts AI report access to the current organization. Do not add broader SELECT policies.';
