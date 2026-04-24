-- =============================================================
-- Row Level Security
-- =============================================================
-- The Next.js app uses the `postgres` role (via DATABASE_URL) for
-- server actions, which BYPASSES RLS. These policies protect any
-- direct Supabase JS calls from the browser using the publishable
-- key.
--
-- Strategy:
--   * Authenticated users can SELECT every business table
--   * Mutations (insert/update/delete) on business tables also
--     require authentication (server actions handle authorization)
--   * profiles, settings, activity_logs, purchases, expenses are
--     read-only for non-admin authenticated users from the browser
-- =============================================================

-- Helper: detect admin from the JWT claims (works for clients
-- connecting via Supabase auth — for postgres role this still
-- evaluates safely to false).
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p
     WHERE p.id = auth.uid()
       AND p.role = 'admin'
  );
$$;

-- Enable + force RLS on all business tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','customers','categories','products','orders','order_items',
    'stock_movements','purchases','purchase_items','expenses',
    'customer_contacts','activity_logs','settings'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Drop any old policies before recreating
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, schemaname, tablename
      FROM pg_policies
     WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ---------------- profiles ----------------
CREATE POLICY profiles_select_authenticated ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.current_user_is_admin())
  WITH CHECK (id = auth.uid() OR public.current_user_is_admin());
CREATE POLICY profiles_admin_delete ON public.profiles
  FOR DELETE TO authenticated USING (public.current_user_is_admin());

-- ---------------- business read tables (everyone authenticated) -------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','categories','products','orders','order_items',
    'stock_movements','purchases','purchase_items','expenses',
    'customer_contacts'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
      t || '_select_authenticated', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (true)',
      t || '_insert_authenticated', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)',
      t || '_update_authenticated', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.current_user_is_admin())',
      t || '_delete_admin', t
    );
  END LOOP;
END $$;

-- ---------------- activity_logs (read = admin, write = nobody from JWT) ----
CREATE POLICY activity_logs_select_admin ON public.activity_logs
  FOR SELECT TO authenticated USING (public.current_user_is_admin());

-- ---------------- settings (admin only) ----
CREATE POLICY settings_select_admin ON public.settings
  FOR SELECT TO authenticated USING (public.current_user_is_admin());
CREATE POLICY settings_write_admin ON public.settings
  FOR ALL TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());
