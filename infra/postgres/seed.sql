-- Zhim — Development Seed Data
-- Zones: Thimphu MVP areas

INSERT INTO zones (name, name_dz, slug, boundary, center, status, base_delivery_fee_nu, min_order_nu) VALUES
(
  'Thimphu Core',
  'ཐིམ་ཕུ་ལྟེ་བ།',
  'thimphu-core',
  ST_GeomFromText('POLYGON((89.62 27.45, 89.66 27.45, 89.66 27.49, 89.62 27.49, 89.62 27.45))', 4326),
  ST_GeomFromText('POINT(89.641 27.469)', 4326),
  'active', 30, 100
),
(
  'Motithang',
  'མོ་ཐི་ཐང་།',
  'motithang',
  ST_GeomFromText('POLYGON((89.60 27.47, 89.63 27.47, 89.63 27.50, 89.60 27.50, 89.60 27.47))', 4326),
  ST_GeomFromText('POINT(89.615 27.485)', 4326),
  'active', 35, 100
),
(
  'Babesa',
  'བ་བེ་ས།',
  'babesa',
  ST_GeomFromText('POLYGON((89.63 27.43, 89.67 27.43, 89.67 27.46, 89.63 27.46, 89.63 27.43))', 4326),
  ST_GeomFromText('POINT(89.650 27.445)', 4326),
  'active', 40, 150
),
(
  'Changzamtog',
  'ལྕང་ཟམ་ཐོག',
  'changzamtog',
  ST_GeomFromText('POLYGON((89.64 27.46, 89.68 27.46, 89.68 27.50, 89.64 27.50, 89.64 27.46))', 4326),
  ST_GeomFromText('POINT(89.660 27.480)', 4326),
  'active', 35, 100
),
(
  'Paro Town',
  'སྤ་རོ།',
  'paro-town',
  ST_GeomFromText('POLYGON((89.40 27.42, 89.44 27.42, 89.44 27.46, 89.40 27.46, 89.40 27.42))', 4326),
  ST_GeomFromText('POINT(89.420 27.430)', 4326),
  'coming_soon', 50, 150
);
