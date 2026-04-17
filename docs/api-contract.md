# Zhim REST + WebSocket API Contract

Base URL: `https://api.zhim.bt/api/v1`

All responses: `{ success: boolean, data: T, message?: string }`
All errors: `{ success: false, error: { code: string, message: string, field?: string } }`

---

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/otp/request` | Send OTP to phone |
| POST | `/auth/otp/verify` | Verify OTP → return JWT + user |
| POST | `/auth/refresh` | Refresh access token |

**POST /auth/otp/request**
```json
{ "phone": "+97517123456" }
→ { "message": "OTP sent", "expires_in": 180 }
```

**POST /auth/otp/verify**
```json
{ "phone": "+97517123456", "code": "123456" }
→ { "access_token": "...", "refresh_token": "...", "expires_in": 900, "user": {...}, "is_new": true }
```

---

## Restaurants

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/restaurants` | Optional | List restaurants (zone, cuisine, geo filters) |
| GET | `/restaurants/:slug` | Optional | Restaurant detail + menu |
| GET | `/restaurants/:id/menu` | Optional | Full menu with categories |

**GET /restaurants?lat=27.469&lng=89.641&zone_id=...&cuisine=bhutanese&veg_only=true**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "DEYJUNG Restaurant",
      "name_dz": "རྡེ་ལྗུང།",
      "slug": "deyjung",
      "cuisine_types": ["bhutanese"],
      "avg_rating": 4.7,
      "avg_prep_time_min": 20,
      "delivery_fee_nu": 30,
      "estimated_delivery_min": 35,
      "distance_km": 1.2,
      "is_open": true,
      "cover_image_url": "https://media.zhim.bt/..."
    }
  ]
}
```

---

## Orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/orders` | Customer | Create order |
| GET | `/orders/:id` | Customer | Get order detail |
| GET | `/orders` | Customer | Order history |
| PATCH | `/orders/:id/status` | Restaurant/Rider | Update order status |
| POST | `/orders/:id/cancel` | Customer | Cancel order |
| POST | `/orders/:id/rate` | Customer | Submit rating |

**POST /orders** — see `CreateOrderDto` in `packages/types`

---

## Payments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments/initiate` | Customer | Initiate payment → QR/deep link |
| POST | `/payments/webhook/mbob` | — | mBoB webhook |
| POST | `/payments/webhook/mypay` | — | MyPay webhook |
| POST | `/payments/refund` | Admin | Issue refund |

**POST /payments/initiate**
```json
{ "order_id": "uuid", "method": "mbob" }
→ {
    "payment_id": "uuid",
    "qr_code_url": "https://...",
    "deep_link_url": "mbob://pay?ref=...",
    "qr_expires_at": "2024-04-01T12:10:00Z"
  }
```

---

## Addresses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/addresses` | Customer | List saved addresses |
| POST | `/addresses` | Customer | Create address |
| PATCH | `/addresses/:id` | Customer | Update address |
| DELETE | `/addresses/:id` | Customer | Delete address |
| POST | `/addresses/check-zone` | Optional | Check if lat/lng is serviceable |

---

## Zones

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/zones` | — | List active zones |
| GET | `/zones/:id/surge` | — | Get active surge for zone |

---

## Partner (Restaurant)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/partner/orders` | Restaurant | Order queue |
| PATCH | `/partner/orders/:id/status` | Restaurant | Accept/prepare/ready |
| GET | `/partner/menu` | Restaurant | Full menu |
| POST | `/partner/menu/categories` | Restaurant | Add category |
| POST | `/partner/menu/items` | Restaurant | Add item |
| PATCH | `/partner/menu/items/:id` | Restaurant | Edit item |
| DELETE | `/partner/menu/items/:id` | Restaurant | Delete item |
| POST | `/partner/loyverse/sync` | Restaurant | Manual Loyverse sync |
| GET | `/partner/earnings` | Restaurant | Earnings summary |

---

## Rider

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/rider/orders/available` | Rider | Available orders to pick |
| POST | `/rider/orders/:id/accept` | Rider | Accept delivery |
| PATCH | `/rider/orders/:id/status` | Rider | Update delivery status |
| PATCH | `/rider/status` | Rider | Toggle online/offline |
| POST | `/rider/landmark-photo` | Rider | Upload entrance photo |
| POST | `/rider/sos` | Rider | Send SOS alert |
| GET | `/rider/earnings` | Rider | Earnings summary |

---

## Console (Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/console/dashboard` | Admin | Platform stats |
| GET | `/console/zones` | Admin | All zones |
| PATCH | `/console/zones/:id` | Admin | Update zone status/fee |
| GET | `/console/surge-rules` | Admin | All surge rules |
| POST | `/console/surge-rules` | Admin | Enable surge |
| PATCH | `/console/surge-rules/:id` | Admin | Disable surge |
| GET | `/console/kyc` | Admin | KYC document queue |
| PATCH | `/console/kyc/:id` | Admin | Approve/reject document |
| GET | `/console/orders` | Admin | All orders with filters |
| POST | `/console/notifications` | Admin | Send push notification |

---

## WebSocket Events

**Namespace:** `/delivery`
**Auth:** `{ auth: { userId: string } }` in handshake

### Client → Server

```ts
// Subscribe to order room (customer + rider)
socket.emit('order:subscribe', { order_id: string })

// Rider sends location ping every ~5s
socket.emit('rider:location_update', {
  order_id: string,
  location: { lat: number, lng: number },
  bearing?: number,   // degrees
  speed_kmh?: number
})
```

### Server → Client

```ts
// Order status changed
socket.on('order:status_changed', {
  order_id: string,
  status: OrderStatus,
  message_en: string,
  message_dz?: string
})

// Rider location update (broadcast to customer)
socket.on('rider:location', {
  rider_id: string,
  order_id: string,
  location: { lat: number, lng: number },
  bearing?: number,
  recorded_at: string
})

// ETA updated
socket.on('order:eta_updated', {
  order_id: string,
  eta_min: number
})

// Rider assigned
socket.on('order:rider_assigned', {
  order_id: string,
  rider: RiderPublic
})
```
