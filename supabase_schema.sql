-- ============================================================
-- SQUISHYTRACK PRO - ESQUEMA DE BASE DE DATOS EN SUPABASE
-- ============================================================

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'store',
  is_warehouse BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO locations (id, name, type, is_warehouse)
VALUES 
  ('loc-1', 'Bodega Central', 'warehouse', true),
  ('loc-2', 'Punto de Venta Principal', 'store', false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS products (
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

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  location_id TEXT REFERENCES locations(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
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

CREATE TABLE IF NOT EXISTS orders (
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

CREATE TABLE IF NOT EXISTS sales (
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

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon locations') THEN
    CREATE POLICY "Allow anon locations" ON locations FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon products') THEN
    CREATE POLICY "Allow anon products" ON products FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon inventory') THEN
    CREATE POLICY "Allow anon inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon purchases') THEN
    CREATE POLICY "Allow anon purchases" ON purchases FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon orders') THEN
    CREATE POLICY "Allow anon orders" ON orders FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon sales') THEN
    CREATE POLICY "Allow anon sales" ON sales FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  EXCEPTION WHEN duplicate_object THEN
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
  EXCEPTION WHEN duplicate_object THEN
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  EXCEPTION WHEN duplicate_object THEN
  END;
END $$;
