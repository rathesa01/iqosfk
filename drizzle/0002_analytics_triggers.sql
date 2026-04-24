-- =============================================================
-- Customer analytics auto-recompute trigger
-- =============================================================
-- Recomputes totals, last/first order dates, avg frequency,
-- segment, and status for a given customer.
CREATE OR REPLACE FUNCTION public.recompute_customer_analytics(p_customer_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_total_orders int;
  v_total_pieces int;
  v_first timestamptz;
  v_last timestamptz;
  v_lifespan_days numeric;
  v_avg_freq numeric;
  v_days_since int;
  v_segment public.customer_segment;
  v_status public.customer_status;
  v_next timestamptz;
BEGIN
  SELECT
    COUNT(*),
    COALESCE(SUM(o.total_pieces), 0),
    MIN(o.order_date),
    MAX(o.order_date)
  INTO v_total_orders, v_total_pieces, v_first, v_last
  FROM public.orders o
  WHERE o.customer_id = p_customer_id
    AND o.status = 'confirmed';

  IF v_first IS NOT NULL AND v_last IS NOT NULL AND v_total_orders >= 2 THEN
    v_lifespan_days := GREATEST(EXTRACT(EPOCH FROM (v_last - v_first)) / 86400.0, 0);
    IF v_lifespan_days > 0 THEN
      v_avg_freq := ROUND((v_lifespan_days / (v_total_orders - 1))::numeric, 1);
    END IF;
  END IF;

  -- segment
  v_segment := CASE
    WHEN v_total_orders >= 10 THEN 'platinum'::public.customer_segment
    WHEN v_total_orders >= 5  THEN 'gold'::public.customer_segment
    WHEN v_total_orders >= 3  THEN 'regular'::public.customer_segment
    WHEN v_total_orders = 2   THEN 'returning'::public.customer_segment
    ELSE                          'onetime'::public.customer_segment
  END;

  -- status (days since last order)
  IF v_last IS NULL THEN
    v_status := 'active'::public.customer_status;
  ELSE
    v_days_since := GREATEST(EXTRACT(EPOCH FROM (now() - v_last)) / 86400.0, 0)::int;
    v_status := CASE
      WHEN v_days_since <= 30  THEN 'active'::public.customer_status
      WHEN v_days_since <= 60  THEN 'cooling'::public.customer_status
      WHEN v_days_since <= 90  THEN 'cold'::public.customer_status
      WHEN v_days_since <= 180 THEN 'lost'::public.customer_status
      ELSE                          'dead'::public.customer_status
    END;
  END IF;

  -- next expected
  IF v_avg_freq IS NOT NULL AND v_last IS NOT NULL THEN
    v_next := v_last + (v_avg_freq * INTERVAL '1 day');
  END IF;

  UPDATE public.customers
     SET total_orders        = v_total_orders,
         total_pieces        = v_total_pieces,
         first_order_date    = v_first,
         last_order_date     = v_last,
         avg_freq_days       = v_avg_freq,
         next_expected_date  = v_next,
         segment             = v_segment,
         status              = v_status,
         updated_at          = now()
   WHERE id = p_customer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_orders_recompute()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_customer_analytics(OLD.customer_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.recompute_customer_analytics(NEW.customer_id);
    IF NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
      PERFORM public.recompute_customer_analytics(OLD.customer_id);
    END IF;
    RETURN NEW;
  ELSE
    PERFORM public.recompute_customer_analytics(NEW.customer_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_recompute ON public.orders;
CREATE TRIGGER trg_orders_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.trg_orders_recompute();

-- =============================================================
-- Order item -> sync stock + order totals
-- =============================================================
CREATE OR REPLACE FUNCTION public.recompute_order_totals(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.orders o
     SET total_amount = COALESCE((SELECT SUM(subtotal) FROM public.order_items WHERE order_id = p_order_id), 0),
         total_pieces = COALESCE((SELECT SUM(quantity) FROM public.order_items WHERE order_id = p_order_id), 0),
         updated_at   = now()
   WHERE o.id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_order_items_after()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_order_id uuid;
  v_customer_id uuid;
BEGIN
  v_order_id := COALESCE(NEW.order_id, OLD.order_id);
  PERFORM public.recompute_order_totals(v_order_id);

  SELECT customer_id INTO v_customer_id FROM public.orders WHERE id = v_order_id;
  IF v_customer_id IS NOT NULL THEN
    PERFORM public.recompute_customer_analytics(v_customer_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_after ON public.order_items;
CREATE TRIGGER trg_order_items_after
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.trg_order_items_after();

-- =============================================================
-- Order number generator: ORD-YYYYMMDD-NNN  (per-day sequence)
-- =============================================================
CREATE OR REPLACE FUNCTION public.generate_order_number(p_date date DEFAULT (now() AT TIME ZONE 'Asia/Bangkok')::date)
RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  v_prefix text;
  v_count int;
BEGIN
  v_prefix := 'ORD-' || to_char(p_date, 'YYYYMMDD') || '-';
  SELECT COUNT(*) + 1 INTO v_count
    FROM public.orders
   WHERE order_number LIKE v_prefix || '%';
  RETURN v_prefix || lpad(v_count::text, 3, '0');
END;
$$;

-- =============================================================
-- Stock movement -> sync products.current_stock
-- =============================================================
CREATE OR REPLACE FUNCTION public.trg_stock_movement_apply()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.products
       SET current_stock = current_stock + (
         CASE NEW.movement_type
           WHEN 'in' THEN NEW.quantity
           WHEN 'out' THEN -NEW.quantity
           WHEN 'adjustment' THEN NEW.quantity
         END
       ),
       updated_at = now()
     WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stock_movement_apply ON public.stock_movements;
CREATE TRIGGER trg_stock_movement_apply
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.trg_stock_movement_apply();
