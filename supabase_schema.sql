-- ============================================================
-- SQUISHYTRACK PRO - TABLAS CON PREFIJO SQ_ (AISLADAS)
-- Pega este script en el SQL Editor de Supabase y presiona RUN.
-- ============================================================

CREATE TABLE IF NOT EXISTS sq_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'store',
  is_warehouse BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sq_locations (id, name, type, is_warehouse)
VALUES 
  ('loc-1', 'Bodega Central', 'warehouse', true),
  ('loc-2', 'Punto de Venta Principal', 'store', false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS sq_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  images TEXT[] DEFAULT '{}',
  emoji TEXT DEFAULT '🧸',
  cost_price NUMERIC(10,2) DEFAULT 0,
  sale_price NUMERIC(10,2) DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  box_cost_reference NUMERIC(10,2) DEFAULT 0,
  units_per_box_reference INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sq_inventory (
  id TEXT PRIMARY KEY,
  location_id TEXT REFERENCES sq_locations(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES sq_products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sq_purchases (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  supplier TEXT DEFAULT 'Proveedor Mayorista',
  product_id TEXT,
  product_name TEXT,
  box_count NUMERIC(10,2) DEFAULT 1,
  cost_per_box NUMERIC(10,2) DEFAULT 0,
  units_per_box INTEGER DEFAULT 1,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(10,2) DEFAULT 0,
  total_units INTEGER DEFAULT 0,
  calculated_unit_cost NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sq_orders (
  id TEXT PRIMARY KEY,
  folio TEXT NOT NULL,
  date TEXT NOT NULL,
  "timestamp" BIGINT,
  customer_name TEXT DEFAULT 'Cliente WhatsApp',
  customer_phone TEXT,
  delivery_location_id TEXT,
  delivery_location_name TEXT,
  delivery_type TEXT DEFAULT 'Punto de Venta',
  delivery_notes TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total_amount NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(10,2) DEFAULT 0,
  total_profit NUMERIC(10,2) DEFAULT 0,
  profit_margin_percent NUMERIC(5,2) DEFAULT 0,
  status TEXT DEFAULT 'nuevo',
  payment_status TEXT DEFAULT 'pendiente',
  payment_method TEXT DEFAULT 'Por Cobrar',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sq_sales (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  date TEXT NOT NULL,
  "timestamp" BIGINT,
  location_id TEXT,
  location_name TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total_amount NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(10,2) DEFAULT 0,
  total_profit NUMERIC(10,2) DEFAULT 0,
  profit_margin_percent NUMERIC(5,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'Efectivo',
  cash_received NUMERIC(10,2) DEFAULT 0,
  change_given NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'Completado',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sq_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sq_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sq_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sq_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sq_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sq_sales ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon sq_locations') THEN
    CREATE POLICY "Allow anon sq_locations" ON sq_locations FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon sq_products') THEN
    CREATE POLICY "Allow anon sq_products" ON sq_products FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon sq_inventory') THEN
    CREATE POLICY "Allow anon sq_inventory" ON sq_inventory FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon sq_purchases') THEN
    CREATE POLICY "Allow anon sq_purchases" ON sq_purchases FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon sq_orders') THEN
    CREATE POLICY "Allow anon sq_orders" ON sq_orders FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon sq_sales') THEN
    CREATE POLICY "Allow anon sq_sales" ON sq_sales FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE sq_orders;
  EXCEPTION WHEN duplicate_object THEN
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE sq_inventory;
  EXCEPTION WHEN duplicate_object THEN
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE sq_products;
  EXCEPTION WHEN duplicate_object THEN
  END;
END $$;
