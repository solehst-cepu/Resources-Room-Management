// SQL Schema Script for Supabase PostgreSQL Database
// Database: Resources Room Management (Lazuardi School)

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- SCHEMA DATABASE SUPABASE: RESOURCES ROOM MANAGEMENT (LAZUARDI SCHOOL)
-- Salin dan jalankan seluruh skrip ini di SQL Editor Dashboard Supabase Anda
-- Dashboard URL: https://supabase.com/dashboard/project/bhovqcmodhsihzuylouz/sql
-- ==============================================================================

-- 1. TABEL USERS & OTENTIKASI
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT,
  password TEXT DEFAULT 'password123',
  role TEXT NOT NULL DEFAULT 'user',
  unit TEXT NOT NULL DEFAULT 'SMP',
  department TEXT NOT NULL DEFAULT 'Guru',
  phone TEXT,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL HAK AKSES PERAN (ROLE CONFIGS)
CREATE TABLE IF NOT EXISTS public.role_configs (
  role TEXT PRIMARY KEY,
  role_name TEXT NOT NULL,
  badge_title TEXT NOT NULL,
  description TEXT,
  security_level TEXT DEFAULT 'Sedang',
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL MASTER BARANG & ATK (MASTER ITEMS)
CREATE TABLE IF NOT EXISTS public.master_items (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_measure TEXT NOT NULL,
  stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  location TEXT,
  price NUMERIC DEFAULT 0,
  supplier TEXT,
  status TEXT DEFAULT 'available',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL KATALOG SERAGAM SEKOLAH (UNIFORM ITEMS)
CREATE TABLE IF NOT EXISTS public.uniform_items (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  size TEXT NOT NULL,
  color TEXT,
  target_unit TEXT DEFAULT 'Semua Unit',
  stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  location TEXT,
  price NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL TITIK DISPENSER AIR GALON (WATER LOCATIONS)
CREATE TABLE IF NOT EXISTS public.water_locations (
  id TEXT PRIMARY KEY,
  unit TEXT NOT NULL,
  room_name TEXT NOT NULL,
  floor TEXT,
  dispenser_count NUMERIC DEFAULT 1,
  active_gallons NUMERIC DEFAULT 1,
  empty_gallons NUMERIC DEFAULT 0,
  last_refill_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL INVENTORI REKAP AIR GALON (WATER INVENTORY)
CREATE TABLE IF NOT EXISTS public.water_inventory (
  id TEXT PRIMARY KEY DEFAULT 'main_inventory',
  initial_total_assets NUMERIC DEFAULT 100,
  filled_gallons NUMERIC DEFAULT 25,
  empty_gallons NUMERIC DEFAULT 15,
  in_distribution NUMERIC DEFAULT 55,
  damaged_gallons NUMERIC DEFAULT 3,
  lost_gallons NUMERIC DEFAULT 2,
  last_opname_date TEXT,
  last_opname_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL LOG PENGANTARAN SUPPLIER GALON (WATER PROVIDER LOGS)
CREATE TABLE IF NOT EXISTS public.water_provider_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  delivery_number TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  driver_name TEXT,
  filled_received NUMERIC DEFAULT 0,
  empty_returned NUMERIC DEFAULT 0,
  received_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL RIWAYAT OPNAME GALON (WATER OPNAME RECORDS)
CREATE TABLE IF NOT EXISTS public.water_opname_records (
  id TEXT PRIMARY KEY,
  opname_number TEXT NOT NULL,
  date TEXT NOT NULL,
  auditor_name TEXT NOT NULL,
  initial_total_assets NUMERIC DEFAULT 0,
  physical_filled NUMERIC DEFAULT 0,
  physical_empty NUMERIC DEFAULT 0,
  physical_in_rooms NUMERIC DEFAULT 0,
  physical_damaged NUMERIC DEFAULT 0,
  physical_lost NUMERIC DEFAULT 0,
  total_physical NUMERIC DEFAULT 0,
  system_total NUMERIC DEFAULT 0,
  variance NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABEL PENGAJUAN LAYANAN & PERMINTAAN (SERVICE REQUESTS)
CREATE TABLE IF NOT EXISTS public.service_requests (
  id TEXT PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  service_type TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  unit TEXT NOT NULL,
  department TEXT NOT NULL,
  request_date TEXT NOT NULL,
  status TEXT NOT NULL,
  urgency TEXT DEFAULT 'Biasa',
  purpose TEXT,
  notes TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  photocopy_detail JSONB,
  laminating_detail JSONB,
  water_detail JSONB,
  approved_by TEXT,
  approval_date TEXT,
  rejection_reason TEXT,
  processed_by TEXT,
  completed_date TEXT,
  picked_up_by TEXT,
  admin_notes TEXT,
  email_sent_to_head BOOLEAN DEFAULT FALSE,
  email_sent_date TEXT,
  email_sent_recipient TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABEL KARTU STOK & TRANSAKSI MUTASI (STOCK TRANSACTIONS)
CREATE TABLE IF NOT EXISTS public.stock_transactions (
  id TEXT PRIMARY KEY,
  transaction_number TEXT NOT NULL UNIQUE,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  type TEXT NOT NULL,
  source_reason TEXT,
  quantity NUMERIC NOT NULL,
  before_stock NUMERIC NOT NULL,
  after_stock NUMERIC NOT NULL,
  unit_measure TEXT,
  date TEXT NOT NULL,
  reference_no TEXT,
  user_id TEXT,
  user_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABEL AUDIT LOG AKTIVITAS (AUDIT LOGS)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details TEXT,
  timestamp TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TABEL NOTIFIKASI SISTEM (APP NOTIFICATIONS)
CREATE TABLE IF NOT EXISTS public.app_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  service_type TEXT,
  request_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. TABEL MASTER UNIT SEKOLAH (MASTER UNITS)
CREATE TABLE IF NOT EXISTS public.master_units (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  head_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. TABEL MASTER DEPARTEMEN / DIVISI (MASTER DEPARTMENTS)
CREATE TABLE IF NOT EXISTS public.master_departments (
  id TEXT PRIMARY KEY,
  unit_id TEXT,
  unit_name TEXT,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. TABEL MASTER SUPPLIER / VENDOR (MASTER SUPPLIERS)
CREATE TABLE IF NOT EXISTS public.master_suppliers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  contact_person TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. TABEL MASTER LOKASI GUDANG & RAK (MASTER LOCATIONS)
CREATE TABLE IF NOT EXISTS public.master_locations (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  zone TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- AKTIFKAN ROW LEVEL SECURITY (RLS) & IZIN AKSES ANONYMOUS
-- ==============================================================================
DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public Full Access" ON public.%I;', tbl);
    EXECUTE format('CREATE POLICY "Public Full Access" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END $$;

-- AKTIFKAN PUBLIKASI REALTIME SUPABASE UNTUK NOTIFIKASI DAN PERUBAHAN DATA LANGSUNG
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'service_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
      public.users, 
      public.master_items, 
      public.uniform_items, 
      public.water_locations, 
      public.water_inventory, 
      public.service_requests, 
      public.stock_transactions, 
      public.app_notifications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
`;

export const SUPABASE_CONFIG_SCHEMA_SQL = SUPABASE_SQL_SCHEMA;
