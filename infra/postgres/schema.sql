-- ============================================================
-- Zhim Superapp — PostgreSQL + PostGIS Schema
-- Database: zhim_db
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS "unaccent";     -- normalize search terms

-- ─── Enums ──────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('customer', 'restaurant_owner', 'restaurant_staff', 'rider', 'admin', 'super_admin');
CREATE TYPE language_code AS ENUM ('en', 'dz');
CREATE TYPE order_status AS ENUM (
  'pending',         -- awaiting restaurant confirmation
  'confirmed',       -- restaurant accepted
  'preparing',       -- kitchen is cooking
  'ready',           -- ready for pickup
  'rider_assigned',  -- rider dispatched
  'picked_up',       -- rider has food
  'delivered',       -- delivered to customer
  'cancelled',       -- cancelled (any party)
  'refunded'         -- refund issued
);
CREATE TYPE payment_method AS ENUM ('cod', 'mbob', 'mypay', 'bob_qr', 'bnb_pay', 'goob', 'razorpay', 'split');
CREATE TYPE payment_status AS ENUM ('pending', 'initiated', 'completed', 'failed', 'refunded');
CREATE TYPE rider_status AS ENUM ('offline', 'online', 'on_delivery');
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE cuisine_type AS ENUM (
  'bhutanese', 'tibetan', 'indian_north', 'indian_south', 'indian_street',
  'continental', 'chinese', 'fast_food', 'bakery', 'beverages', 'suja', 'ara', 'mixed'
);
CREATE TYPE restaurant_status AS ENUM ('pending_kyc', 'active', 'paused', 'suspended', 'closed');
CREATE TYPE delivery_type AS ENUM ('asap', 'scheduled');
CREATE TYPE zone_status AS ENUM ('active', 'coming_soon', 'inactive');
CREATE TYPE surge_reason AS ENUM ('peak_hour', 'rain', 'snow', 'high_demand', 'low_rider_supply', 'festival');

-- ─── Users ──────────────────────────────────────────────────────────

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone           VARCHAR(15) UNIQUE NOT NULL,     -- +975XXXXXXXX
  cid             VARCHAR(11) UNIQUE,               -- Bhutanese CID (11 digits)
  name            VARCHAR(120),
  name_dz         VARCHAR(120),                    -- Dzongkha name
  email           VARCHAR(254) UNIQUE,
  avatar_url      TEXT,
  role            user_role NOT NULL DEFAULT 'customer',
  language_pref   language_code NOT NULL DEFAULT 'en',
  dzongkha_numerals BOOLEAN DEFAULT false,
  karma_points    INTEGER NOT NULL DEFAULT 0,
  referral_code   VARCHAR(12) UNIQUE,
  referred_by     UUID REFERENCES users(id),
  is_verified     BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_role ON users(role);

-- ─── OTP Sessions ───────────────────────────────────────────────────

CREATE TABLE otp_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       VARCHAR(15) NOT NULL,
  otp_hash    VARCHAR(255) NOT NULL,        -- bcrypt hash
  attempts    SMALLINT NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ NOT NULL,
  verified    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_phone ON otp_sessions(phone);
CREATE INDEX idx_otp_expires ON otp_sessions(expires_at);

-- ─── Zones (Delivery Areas) ─────────────────────────────────────────

CREATE TABLE zones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,        -- e.g. "Thimphu Core"
  name_dz     VARCHAR(100),
  slug        VARCHAR(60) UNIQUE NOT NULL,  -- e.g. "thimphu-core"
  boundary    GEOMETRY(POLYGON, 4326) NOT NULL,
  center      GEOMETRY(POINT, 4326),
  status      zone_status NOT NULL DEFAULT 'coming_soon',
  base_delivery_fee_nu  INTEGER NOT NULL DEFAULT 30,  -- Nu.
  min_order_nu          INTEGER NOT NULL DEFAULT 100,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zones_boundary ON zones USING GIST(boundary);
CREATE INDEX idx_zones_status ON zones(status);

-- ─── Addresses ──────────────────────────────────────────────────────

CREATE TABLE addresses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label           VARCHAR(60),             -- "Home", "Office", "Mom's place"
  label_dz        VARCHAR(60),
  nearest_landmark VARCHAR(200) NOT NULL,  -- "Near Clock Tower"
  landmark_dz     VARCHAR(200),
  building_desc   VARCHAR(200),            -- "Yellow building above Ambient Café"
  building_desc_dz VARCHAR(200),
  floor_or_shop   VARCHAR(100),            -- "2F, Room 4"
  contact_phone   VARCHAR(15),
  location        GEOMETRY(POINT, 4326) NOT NULL,
  entrance_photo_url TEXT,                 -- for rider navigation
  zone_id         UUID REFERENCES zones(id),
  is_default      BOOLEAN NOT NULL DEFAULT false,
  delivery_note   TEXT,                    -- voice note transcription / typed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_location ON addresses USING GIST(location);

-- ─── Restaurants ────────────────────────────────────────────────────

CREATE TABLE restaurants (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id            UUID NOT NULL REFERENCES users(id),
  name                VARCHAR(120) NOT NULL,
  name_dz             VARCHAR(120),
  slug                VARCHAR(120) UNIQUE NOT NULL,
  description         TEXT,
  description_dz      TEXT,
  phone               VARCHAR(15) NOT NULL,
  whatsapp            VARCHAR(15),
  email               VARCHAR(254),
  cover_image_url     TEXT,
  logo_url            TEXT,
  cuisine_types       cuisine_type[] NOT NULL DEFAULT '{}',
  tags                TEXT[] DEFAULT '{}',   -- 'veg', 'non-veg', 'buddhist-friendly', 'halal'
  is_veg_only         BOOLEAN NOT NULL DEFAULT false,
  is_buddhist_friendly BOOLEAN NOT NULL DEFAULT false,
  location            GEOMETRY(POINT, 4326) NOT NULL,
  address_text        TEXT NOT NULL,
  address_text_dz     TEXT,
  zone_id             UUID REFERENCES zones(id),
  status              restaurant_status NOT NULL DEFAULT 'pending_kyc',
  is_open             BOOLEAN NOT NULL DEFAULT false,
  opens_at            TIME,
  closes_at           TIME,
  avg_prep_time_min   SMALLINT NOT NULL DEFAULT 20,
  avg_rating          NUMERIC(3,2) DEFAULT 0,
  total_ratings       INTEGER DEFAULT 0,
  commission_pct      NUMERIC(4,2) NOT NULL DEFAULT 15.00,  -- platform commission
  loyverse_store_id   VARCHAR(100),         -- Loyverse POS integration
  loyverse_token      TEXT,                 -- encrypted
  auto_pause_enabled  BOOLEAN DEFAULT false,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restaurants_location ON restaurants USING GIST(location);
CREATE INDEX idx_restaurants_zone ON restaurants(zone_id);
CREATE INDEX idx_restaurants_status ON restaurants(status);
CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_restaurants_name_trgm ON restaurants USING GIN(name gin_trgm_ops);
CREATE INDEX idx_restaurants_name_dz_trgm ON restaurants USING GIN(name_dz gin_trgm_ops);
CREATE INDEX idx_restaurants_cuisine ON restaurants USING GIN(cuisine_types);

-- ─── Restaurant Documents (KYC) ─────────────────────────────────────

CREATE TABLE restaurant_documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  doc_type      VARCHAR(60) NOT NULL,  -- 'trade_license', 'bit_registration', 'bafra_certificate', 'bank_details'
  file_url      TEXT NOT NULL,
  doc_number    VARCHAR(100),
  issued_date   DATE,
  expiry_date   DATE,
  status        document_status NOT NULL DEFAULT 'pending',
  reviewer_id   UUID REFERENCES users(id),
  review_note   TEXT,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restdocs_restaurant ON restaurant_documents(restaurant_id);
CREATE INDEX idx_restdocs_status ON restaurant_documents(status);

-- ─── Menu Categories ────────────────────────────────────────────────

CREATE TABLE menu_categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  name_dz       VARCHAR(100),
  description   TEXT,
  image_url     TEXT,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  available_from TIME,   -- e.g. breakfast only 07:00-11:00
  available_to   TIME,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_cat_restaurant ON menu_categories(restaurant_id);

-- ─── Menu Items ─────────────────────────────────────────────────────

CREATE TABLE menu_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name            VARCHAR(150) NOT NULL,
  name_dz         VARCHAR(150),
  description     TEXT,
  description_dz  TEXT,
  base_price_nu   INTEGER NOT NULL,            -- in Ngultrum, integer (Nu. 85)
  image_url       TEXT,
  is_veg          BOOLEAN NOT NULL DEFAULT false,
  is_buddhist_friendly BOOLEAN NOT NULL DEFAULT false,
  is_available    BOOLEAN NOT NULL DEFAULT true,
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  spice_levels    TEXT[] DEFAULT '{}',         -- ['mild','medium','hot','extra_hot']
  tags            TEXT[] DEFAULT '{}',
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  loyverse_item_id VARCHAR(100),               -- Loyverse item reference
  calories        INTEGER,
  prep_time_min   SMALLINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_name_trgm ON menu_items USING GIN(name gin_trgm_ops);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);

-- ─── Menu Item Variants ─────────────────────────────────────────────

CREATE TABLE menu_item_variants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id     UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,    -- "Half", "Full", "Family"
  name_dz     VARCHAR(100),
  price_nu    INTEGER NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  sort_order  SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_variants_item ON menu_item_variants(item_id);

-- ─── Menu Item Addons ───────────────────────────────────────────────

CREATE TABLE menu_item_addons (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id     UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  group_name  VARCHAR(100) NOT NULL,   -- "Extra", "Sides", "Sauces"
  group_dz    VARCHAR(100),
  name        VARCHAR(100) NOT NULL,   -- "Extra Ema Datshi", "Extra Datshi"
  name_dz     VARCHAR(100),
  price_nu    INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT false,
  max_qty     SMALLINT NOT NULL DEFAULT 1,
  sort_order  SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_addons_item ON menu_item_addons(item_id);

-- ─── Riders ─────────────────────────────────────────────────────────

CREATE TABLE riders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id),
  cid             VARCHAR(11) NOT NULL,
  driving_license VARCHAR(50) NOT NULL,
  vehicle_type    VARCHAR(30) NOT NULL DEFAULT 'scooter',  -- 'bicycle','scooter','motorcycle'
  vehicle_reg     VARCHAR(30),
  zone_id         UUID REFERENCES zones(id),
  status          rider_status NOT NULL DEFAULT 'offline',
  current_location GEOMETRY(POINT, 4326),
  current_location_updated_at TIMESTAMPTZ,
  bank_name       VARCHAR(100),
  bank_account    VARCHAR(50),     -- encrypted in application layer
  commission_pct  NUMERIC(4,2) NOT NULL DEFAULT 80.00,  -- rider's share of delivery fee
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  total_earnings_nu INTEGER NOT NULL DEFAULT 0,
  avg_rating       NUMERIC(3,2) DEFAULT 5.0,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_riders_user ON riders(user_id);
CREATE INDEX idx_riders_location ON riders USING GIST(current_location);
CREATE INDEX idx_riders_status ON riders(status);
CREATE INDEX idx_riders_zone ON riders(zone_id);

-- ─── Rider Documents (KYC) ──────────────────────────────────────────

CREATE TABLE rider_documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id    UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  doc_type    VARCHAR(60) NOT NULL,   -- 'cid', 'driving_license', 'vehicle_rc', 'photo'
  file_url    TEXT NOT NULL,
  status      document_status NOT NULL DEFAULT 'pending',
  reviewer_id UUID REFERENCES users(id),
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_riderdocs_rider ON rider_documents(rider_id);

-- ─── Surge Rules ────────────────────────────────────────────────────

CREATE TABLE surge_rules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id         UUID REFERENCES zones(id),  -- NULL = platform-wide
  reason          surge_reason NOT NULL,
  multiplier      NUMERIC(3,1) NOT NULL DEFAULT 1.5,
  extra_fee_nu    INTEGER DEFAULT 0,
  message_en      TEXT NOT NULL,
  message_dz      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT false,
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_surge_zone ON surge_rules(zone_id);
CREATE INDEX idx_surge_active ON surge_rules(is_active);

-- ─── Orders ─────────────────────────────────────────────────────────

CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number        VARCHAR(20) UNIQUE NOT NULL,  -- ZHIM-20240401-00001
  customer_id         UUID NOT NULL REFERENCES users(id),
  restaurant_id       UUID NOT NULL REFERENCES restaurants(id),
  rider_id            UUID REFERENCES riders(id),
  delivery_address_id UUID NOT NULL REFERENCES addresses(id),

  -- Delivery
  delivery_type       delivery_type NOT NULL DEFAULT 'asap',
  scheduled_for       TIMESTAMPTZ,              -- if delivery_type = scheduled
  pickup_location     GEOMETRY(POINT, 4326),    -- restaurant location snapshot
  dropoff_location    GEOMETRY(POINT, 4326),    -- address location snapshot
  distance_km         NUMERIC(5,2),

  -- Pricing (all in Ngultrum)
  subtotal_nu         INTEGER NOT NULL,
  delivery_fee_nu     INTEGER NOT NULL DEFAULT 30,
  surge_fee_nu        INTEGER NOT NULL DEFAULT 0,
  discount_nu         INTEGER NOT NULL DEFAULT 0,
  total_nu            INTEGER NOT NULL,

  -- Coupon / promo
  coupon_code         VARCHAR(30),
  karma_points_used   INTEGER NOT NULL DEFAULT 0,
  karma_points_earned INTEGER NOT NULL DEFAULT 0,

  -- Status
  status              order_status NOT NULL DEFAULT 'pending',
  cancellation_reason TEXT,
  cancelled_by        user_role,

  -- Timing (all TIMESTAMPTZ)
  estimated_prep_min  SMALLINT,
  estimated_delivery_min SMALLINT,
  confirmed_at        TIMESTAMPTZ,
  preparing_at        TIMESTAMPTZ,
  ready_at            TIMESTAMPTZ,
  rider_assigned_at   TIMESTAMPTZ,
  picked_up_at        TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,

  -- Change for COD
  change_required_nu  INTEGER,    -- customer's "I'm paying with Nu. 500"

  -- Notes
  customer_note       TEXT,
  kitchen_note        TEXT,       -- internal
  rider_note          TEXT,

  -- Loyverse
  loyverse_receipt_id VARCHAR(100),

  -- Surge context snapshot
  surge_multiplier    NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  surge_message_en    TEXT,
  surge_message_dz    TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_rider ON orders(rider_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);

-- ─── Order Items ────────────────────────────────────────────────────

CREATE TABLE order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id    UUID NOT NULL REFERENCES menu_items(id),
  variant_id      UUID REFERENCES menu_item_variants(id),
  name            VARCHAR(150) NOT NULL,   -- snapshot at order time
  name_dz         VARCHAR(150),
  quantity        SMALLINT NOT NULL DEFAULT 1,
  unit_price_nu   INTEGER NOT NULL,
  spice_level     VARCHAR(20),
  special_note    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ─── Order Item Addons ──────────────────────────────────────────────

CREATE TABLE order_item_addons (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  addon_id      UUID REFERENCES menu_item_addons(id),
  name          VARCHAR(100) NOT NULL,   -- snapshot
  name_dz       VARCHAR(100),
  quantity      SMALLINT NOT NULL DEFAULT 1,
  unit_price_nu INTEGER NOT NULL
);

-- ─── Payments ───────────────────────────────────────────────────────

CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id            UUID NOT NULL REFERENCES orders(id),
  method              payment_method NOT NULL,
  status              payment_status NOT NULL DEFAULT 'pending',
  amount_nu           INTEGER NOT NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'BTN',

  -- Provider fields
  provider_ref        VARCHAR(200),     -- mBoB txn ID / QR ref
  provider_payload    JSONB,            -- raw webhook response (encrypted at rest)
  qr_code_url         TEXT,             -- for QR payment methods
  qr_expires_at       TIMESTAMPTZ,

  -- Split payment (partial wallet + cash)
  is_split            BOOLEAN DEFAULT false,
  split_wallet_nu     INTEGER DEFAULT 0,
  split_cash_nu       INTEGER DEFAULT 0,

  -- Refund
  refunded_amount_nu  INTEGER DEFAULT 0,
  refund_ref          VARCHAR(200),
  refunded_at         TIMESTAMPTZ,

  -- BIT / Tax
  bit_invoice_number  VARCHAR(100),
  tax_amount_nu       INTEGER DEFAULT 0,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider_ref ON payments(provider_ref);

-- ─── Ratings & Reviews ──────────────────────────────────────────────

CREATE TABLE ratings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL UNIQUE REFERENCES orders(id),
  customer_id     UUID NOT NULL REFERENCES users(id),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id),
  rider_id        UUID REFERENCES riders(id),
  food_rating     SMALLINT NOT NULL CHECK (food_rating BETWEEN 1 AND 5),
  delivery_rating SMALLINT CHECK (delivery_rating BETWEEN 1 AND 5),
  review_text     TEXT,
  review_text_dz  TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ratings_restaurant ON ratings(restaurant_id);
CREATE INDEX idx_ratings_rider ON ratings(rider_id);

-- ─── Delivery Tracking (location history) ────────────────────────────

CREATE TABLE delivery_pings (
  id          BIGSERIAL PRIMARY KEY,
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rider_id    UUID NOT NULL REFERENCES riders(id),
  location    GEOMETRY(POINT, 4326) NOT NULL,
  bearing     NUMERIC(5,2),   -- degrees
  speed_kmh   NUMERIC(5,2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pings_order ON delivery_pings(order_id, recorded_at DESC);

-- Retention: auto-delete pings older than 30 days (run via cron)
-- DELETE FROM delivery_pings WHERE recorded_at < NOW() - INTERVAL '30 days';

-- ─── Loyalty / Karma Points ─────────────────────────────────────────

CREATE TABLE karma_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id),
  order_id    UUID REFERENCES orders(id),
  delta       INTEGER NOT NULL,          -- positive = earn, negative = spend
  balance     INTEGER NOT NULL,          -- balance after this tx
  reason      VARCHAR(100) NOT NULL,     -- 'order_earn', 'referral_bonus', 'spent_on_order', etc.
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_karma_user ON karma_transactions(user_id);

-- ─── Referral Codes ─────────────────────────────────────────────────

CREATE TABLE referral_rewards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id     UUID NOT NULL REFERENCES users(id),
  referee_id      UUID NOT NULL UNIQUE REFERENCES users(id),
  referrer_points INTEGER NOT NULL DEFAULT 50,
  referee_points  INTEGER NOT NULL DEFAULT 30,
  rewarded_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Notifications ──────────────────────────────────────────────────

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id),
  title_en    VARCHAR(200) NOT NULL,
  title_dz    VARCHAR(200),
  body_en     TEXT NOT NULL,
  body_dz     TEXT,
  type        VARCHAR(60) NOT NULL,   -- 'order_update', 'promo', 'rider_assigned', etc.
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN NOT NULL DEFAULT false,
  sent_via    TEXT[] DEFAULT '{}',    -- ['fcm', 'sms']
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notif_unread ON notifications(user_id, is_read) WHERE NOT is_read;

-- ─── Loyverse Sync Log ──────────────────────────────────────────────

CREATE TABLE loyverse_sync_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id),
  sync_type       VARCHAR(30) NOT NULL,   -- 'menu_pull', 'receipt_push'
  status          VARCHAR(20) NOT NULL,   -- 'success', 'partial', 'failed'
  items_synced    INTEGER DEFAULT 0,
  error_message   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_loyverse_restaurant ON loyverse_sync_logs(restaurant_id, started_at DESC);

-- ─── System Config ──────────────────────────────────────────────────

CREATE TABLE system_config (
  key         VARCHAR(100) PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_by  UUID REFERENCES users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default config values
INSERT INTO system_config (key, value, description) VALUES
  ('platform_commission_default_pct', '15', 'Default restaurant commission percentage'),
  ('delivery_fee_base_nu', '30', 'Base delivery fee in Nu.'),
  ('karma_points_per_nu', '0.1', 'Karma points earned per Nu. spent'),
  ('karma_points_value_nu', '0.5', 'Nu. value of 1 karma point'),
  ('otp_expiry_seconds', '180', 'OTP validity window'),
  ('max_otp_attempts', '3', 'Max OTP verification attempts before block'),
  ('rider_ping_interval_seconds', '5', 'How often rider app sends location'),
  ('support_whatsapp', '"+97517123456"', 'Support WhatsApp number'),
  ('support_phone', '"+97517123456"', 'Support phone number'),
  ('min_order_nu', '100', 'Minimum order value platform-wide');

-- ─── Updated_at triggers ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at           BEFORE UPDATE ON users           FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_zones_updated_at           BEFORE UPDATE ON zones           FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_addresses_updated_at       BEFORE UPDATE ON addresses       FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_restaurants_updated_at     BEFORE UPDATE ON restaurants     FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_menu_categories_updated_at BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_menu_items_updated_at      BEFORE UPDATE ON menu_items      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_riders_updated_at          BEFORE UPDATE ON riders          FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_orders_updated_at          BEFORE UPDATE ON orders          FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_payments_updated_at        BEFORE UPDATE ON payments        FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─── Order Number Generator ─────────────────────────────────────────

CREATE SEQUENCE order_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.order_number := 'ZH-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(nextval('order_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ─── Materialized View: Nearby Restaurants ──────────────────────────
-- Refresh every 5 min via cron; used by search/home feed

CREATE MATERIALIZED VIEW restaurant_search_view AS
SELECT
  r.id,
  r.name,
  r.name_dz,
  r.slug,
  r.cuisine_types,
  r.tags,
  r.is_veg_only,
  r.is_buddhist_friendly,
  r.avg_rating,
  r.total_ratings,
  r.avg_prep_time_min,
  r.cover_image_url,
  r.logo_url,
  r.location,
  r.zone_id,
  r.status,
  r.is_open,
  r.opens_at,
  r.closes_at,
  z.base_delivery_fee_nu,
  z.name AS zone_name
FROM restaurants r
JOIN zones z ON z.id = r.zone_id
WHERE r.status = 'active'
WITH DATA;

CREATE UNIQUE INDEX ON restaurant_search_view(id);
CREATE INDEX ON restaurant_search_view USING GIST(location);
CREATE INDEX ON restaurant_search_view(zone_id);
CREATE INDEX ON restaurant_search_view(is_open);
