-- =============================================================
-- Auto-audit trigger -> activity_logs
-- =============================================================
-- Records INSERT / UPDATE / DELETE on key tables. user_id is read
-- from the GUC `app.user_id` set per request (when running through
-- our Drizzle client we leave it null = "system / cron / migration").
CREATE OR REPLACE FUNCTION public.audit_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_action varchar(50);
  v_entity_id uuid;
  v_details jsonb;
BEGIN
  BEGIN
    v_user := nullif(current_setting('app.user_id', true), '')::uuid;
  EXCEPTION WHEN others THEN
    v_user := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    v_action := 'create_' || TG_TABLE_NAME;
    v_entity_id := (to_jsonb(NEW) ->> 'id')::uuid;
    v_details := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update_' || TG_TABLE_NAME;
    v_entity_id := (to_jsonb(NEW) ->> 'id')::uuid;
    v_details := jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_' || TG_TABLE_NAME;
    v_entity_id := (to_jsonb(OLD) ->> 'id')::uuid;
    v_details := to_jsonb(OLD);
  END IF;

  INSERT INTO public.activity_logs(user_id, action, entity_type, entity_id, details)
  VALUES (v_user, v_action, TG_TABLE_NAME, v_entity_id, v_details);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','orders','products','categories',
    'purchases','expenses','customer_contacts'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_audit_%I
         AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.audit_changes()',
      t, t
    );
  END LOOP;
END $$;
