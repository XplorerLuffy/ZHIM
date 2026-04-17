// ─── Zhim Shared Types ──────────────────────────────────────────────────────

export type LanguageCode = 'en' | 'dz';
export type CurrencyCode = 'BTN' | 'INR';

export type UserRole =
  | 'customer'
  | 'restaurant_owner'
  | 'restaurant_staff'
  | 'rider'
  | 'admin'
  | 'super_admin';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'rider_assigned'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'cod' | 'mbob' | 'mypay' | 'bob_qr' | 'bnb_pay' | 'goob' | 'razorpay' | 'split';
export type PaymentStatus = 'pending' | 'initiated' | 'completed' | 'failed' | 'refunded';

export type RiderStatus = 'offline' | 'online' | 'on_delivery';
export type RestaurantStatus = 'pending_kyc' | 'active' | 'paused' | 'suspended' | 'closed';
export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type DeliveryType = 'asap' | 'scheduled';
export type ZoneStatus = 'active' | 'coming_soon' | 'inactive';

export type CuisineType =
  | 'bhutanese'
  | 'tibetan'
  | 'indian_north'
  | 'indian_south'
  | 'indian_street'
  | 'continental'
  | 'chinese'
  | 'fast_food'
  | 'bakery'
  | 'beverages'
  | 'suja'
  | 'ara'
  | 'mixed';

export type SpiceLevel = 'mild' | 'medium' | 'hot' | 'extra_hot';

// ─── Geo ─────────────────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone: string;
  cid?: string;
  name?: string;
  name_dz?: string;
  email?: string;
  avatar_url?: string;
  role: UserRole;
  language_pref: LanguageCode;
  dzongkha_numerals: boolean;
  karma_points: number;
  referral_code?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// ─── Zone ─────────────────────────────────────────────────────────────────────

export interface Zone {
  id: string;
  name: string;
  name_dz?: string;
  slug: string;
  status: ZoneStatus;
  base_delivery_fee_nu: number;
  min_order_nu: number;
  center?: LatLng;
}

// ─── Address ──────────────────────────────────────────────────────────────────

export interface Address {
  id: string;
  user_id: string;
  label?: string;
  label_dz?: string;
  nearest_landmark: string;
  landmark_dz?: string;
  building_desc?: string;
  building_desc_dz?: string;
  floor_or_shop?: string;
  contact_phone?: string;
  location: LatLng;
  entrance_photo_url?: string;
  zone_id?: string;
  is_default: boolean;
  delivery_note?: string;
  created_at: string;
}

export interface CreateAddressDto {
  label?: string;
  label_dz?: string;
  nearest_landmark: string;
  landmark_dz?: string;
  building_desc?: string;
  floor_or_shop?: string;
  contact_phone?: string;
  location: LatLng;
  zone_id?: string;
  delivery_note?: string;
}

// ─── Restaurant ───────────────────────────────────────────────────────────────

export interface Restaurant {
  id: string;
  name: string;
  name_dz?: string;
  slug: string;
  description?: string;
  description_dz?: string;
  phone: string;
  cover_image_url?: string;
  logo_url?: string;
  cuisine_types: CuisineType[];
  tags: string[];
  is_veg_only: boolean;
  is_buddhist_friendly: boolean;
  location: LatLng;
  address_text: string;
  address_text_dz?: string;
  zone_id?: string;
  status: RestaurantStatus;
  is_open: boolean;
  opens_at?: string;   // "HH:MM"
  closes_at?: string;
  avg_prep_time_min: number;
  avg_rating: number;
  total_ratings: number;
  delivery_fee_nu?: number;  // resolved from zone
  estimated_delivery_min?: number;
  distance_km?: number;
  created_at: string;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  name_dz?: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  available_from?: string;
  available_to?: string;
  items?: MenuItem[];
}

export interface MenuItemVariant {
  id: string;
  name: string;
  name_dz?: string;
  price_nu: number;
  is_default: boolean;
}

export interface MenuItemAddon {
  id: string;
  group_name: string;
  group_dz?: string;
  name: string;
  name_dz?: string;
  price_nu: number;
  is_required: boolean;
  max_qty: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  name_dz?: string;
  description?: string;
  description_dz?: string;
  base_price_nu: number;
  image_url?: string;
  is_veg: boolean;
  is_buddhist_friendly: boolean;
  is_available: boolean;
  is_featured: boolean;
  spice_levels: SpiceLevel[];
  variants: MenuItemVariant[];
  addons: MenuItemAddon[];
  calories?: number;
  prep_time_min?: number;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartAddon {
  addon_id: string;
  name: string;
  name_dz?: string;
  quantity: number;
  unit_price_nu: number;
}

export interface CartItem {
  id: string;                // local UUID
  menu_item_id: string;
  variant_id?: string;
  name: string;
  name_dz?: string;
  quantity: number;
  unit_price_nu: number;
  spice_level?: SpiceLevel;
  addons: CartAddon[];
  special_note?: string;
  image_url?: string;
}

export interface Cart {
  restaurant_id: string;
  restaurant_name: string;
  items: CartItem[];
  subtotal_nu: number;
  delivery_fee_nu: number;
  surge_fee_nu: number;
  discount_nu: number;
  total_nu: number;
  coupon_code?: string;
  karma_points_used: number;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  restaurant_id: string;
  rider_id?: string;
  delivery_address_id: string;
  delivery_type: DeliveryType;
  scheduled_for?: string;
  subtotal_nu: number;
  delivery_fee_nu: number;
  surge_fee_nu: number;
  discount_nu: number;
  total_nu: number;
  status: OrderStatus;
  estimated_prep_min?: number;
  estimated_delivery_min?: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  items: OrderItem[];
  restaurant?: Pick<Restaurant, 'id' | 'name' | 'name_dz' | 'logo_url' | 'phone'>;
  rider?: RiderPublic;
  created_at: string;
  updated_at: string;
  // Surge context
  surge_multiplier: number;
  surge_message_en?: string;
  surge_message_dz?: string;
}

export interface OrderItem {
  id: string;
  menu_item_id: string;
  variant_id?: string;
  name: string;
  name_dz?: string;
  quantity: number;
  unit_price_nu: number;
  spice_level?: SpiceLevel;
  special_note?: string;
  addons: OrderItemAddon[];
}

export interface OrderItemAddon {
  addon_id?: string;
  name: string;
  name_dz?: string;
  quantity: number;
  unit_price_nu: number;
}

export interface CreateOrderDto {
  restaurant_id: string;
  delivery_address_id: string;
  delivery_type: DeliveryType;
  scheduled_for?: string;
  items: CreateOrderItemDto[];
  payment_method: PaymentMethod;
  coupon_code?: string;
  karma_points_used?: number;
  customer_note?: string;
  change_required_nu?: number;  // COD change
}

export interface CreateOrderItemDto {
  menu_item_id: string;
  variant_id?: string;
  quantity: number;
  spice_level?: SpiceLevel;
  addons?: { addon_id: string; quantity: number }[];
  special_note?: string;
}

// ─── Rider ────────────────────────────────────────────────────────────────────

export interface RiderPublic {
  id: string;
  name?: string;
  avatar_url?: string;
  phone?: string;
  vehicle_type: string;
  avg_rating: number;
  current_location?: LatLng;
}

export interface RiderLocation {
  rider_id: string;
  order_id: string;
  location: LatLng;
  bearing?: number;
  speed_kmh?: number;
  recorded_at: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface PaymentIntent {
  payment_id: string;
  order_id: string;
  method: PaymentMethod;
  amount_nu: number;
  qr_code_url?: string;
  deep_link_url?: string;     // mBoB / MyPay app deep link
  qr_expires_at?: string;
  instructions_en?: string;
  instructions_dz?: string;
}

// ─── Socket Events ────────────────────────────────────────────────────────────

export interface SocketEvents {
  // Client → Server
  'order:subscribe': { order_id: string };
  'rider:location_update': { order_id: string; location: LatLng; bearing?: number };

  // Server → Client
  'order:status_changed': { order_id: string; status: OrderStatus; message_en: string; message_dz?: string };
  'order:eta_updated': { order_id: string; eta_min: number };
  'rider:location': RiderLocation;
  'order:rider_assigned': { order_id: string; rider: RiderPublic };
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    has_next: boolean;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
  };
}

// ─── i18n ─────────────────────────────────────────────────────────────────────

export interface LocalizedString {
  en: string;
  dz?: string;
}

export type TranslationKey = string;
