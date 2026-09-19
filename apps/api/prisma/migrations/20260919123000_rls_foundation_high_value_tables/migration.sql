-- 🔒 RLS foundation for high-value tables
--
-- Why FORCE + permissive policies?
-- Neon/app DATABASE_URL is typically the table owner. Owners bypass RLS unless
-- FORCE ROW LEVEL SECURITY is set. Tenant-scoped policies (userId = GUC) are
-- deferred until request-scoped set_config middleware (or a non-owner DB role)
-- is wired — shipping those policies today would empty result sets.
--
-- What this buys us now:
-- 1) Table owners are subject to RLS (FORCE).
-- 2) Explicit policies document access; extra roles cannot SELECT without a policy.
-- 3) Ready for a follow-up migration that replaces USING (true) with tenant checks.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'sessions',
    'developer_api_keys',
    'developer_whatsapp_accounts',
    'identity_verifications',
    'form_integrations'
  ]
  LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      RAISE NOTICE 'skip RLS: table % missing', t;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);

    -- Drop prior foundation policy if re-run
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_app_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (true) WITH CHECK (true)',
      t || '_app_all',
      t
    );
  END LOOP;
END $$;
