# Zhim Brand Style Guide

## Identity

**Name:** Zhim (ཞིམ)
**Pronunciation:** /zheem/ — rhymes with "dream"
**Meaning:** "Delicious" in Dzongkha
**Tagline:** *Zhim means delicious. Now it means delivery too.*

---

## Logo System

### Primary Mark
The primary wordmark uses a custom **"Zh"** ligature — the "Z" crossbar cuts through the "h" ascender, forming a single glyph that evokes a delivery route. The dot of the "h" is replaced by a subtle flame/butter-lamp motif referencing Bhutanese monastery aesthetics.

```
Zh im
└─┘
 ↑
 Custom ligature — Z crossbar slices through h
```

### Secondary Mark
**ཞིམ།** — Uchen script rendered in Jomolhari, displayed below or beside the Latin wordmark. Never used in isolation at small sizes (< 16px rendered height).

### App Icons
- **Zhim** (customer): Saffron background, white "Zh" ligature
- **Zhim Partner**: Forest green background, white "Zh" ligature + fork/spatula accent
- **Zhim Rider**: Deep slate background, white "Zh" ligature + arrow accent
- **Zhim Console**: Dark neutral background, white "Zh" ligature + grid accent

### Clear Space
Minimum clear space = x-height of the "Z" on all sides.

### Prohibited Uses
- Do not recolour the logo outside the approved palette
- Do not stretch or distort either the Latin or Uchen marks
- Do not place the logo on busy photographic backgrounds without a protective scrim
- Do not render ཞིམ in a generic system Tibetan fallback font — always load Jomolhari

---

## Colour Palette

### Primary — Saffron
Rooted in the colour of kira textiles, butter lamps, and monastery walls.

| Token          | Hex       | Use |
|----------------|-----------|-----|
| primary-500    | `#F5A800` | Primary buttons, active states, brand accent |
| primary-600    | `#D08C00` | Hover states |
| primary-50     | `#FFF8E7` | Chip backgrounds, badges |
| primary-900    | `#4D3300` | Dark text on light brand surfaces |

### Secondary — Forest Green
Bhutanese pine forests; also signals "veg", "confirmed", "delivered".

| Token          | Hex       | Use |
|----------------|-----------|-----|
| secondary-500  | `#2A9A58` | Secondary CTAs, success states, veg indicator |
| secondary-600  | `#228A4C` | Hover |
| secondary-50   | `#EAF4EE` | Veg badge background |

### Neutral — Warm Stone
Yak-wool grey. Never cold or clinical.

| Token          | Hex       | Use |
|----------------|-----------|-----|
| neutral-50     | `#FAF9F7` | App background |
| neutral-100    | `#F2EFE9` | Card borders, dividers |
| neutral-900    | `#201D19` | Body text |
| neutral-500    | `#9E9285` | Muted text |

### Semantic
| Purpose   | Hex       |
|-----------|-----------|
| Error     | `#D93030` |
| Warning   | `#F5A800` (primary) |
| Info      | `#1A73E8` |
| Veg       | `#2E7D32` |
| Non-veg   | `#C62828` |
| Buddhist  | `#7B1FA2` |

---

## Typography

### Latin — Inter
Used for all English UI text. Variable font; load 400, 500, 600, 700.

```
Display  — Inter Bold 32px  / tight leading  — page heroes
H1       — Inter Bold 28px  / tight
H2       — Inter SemiBold 24px
H3       — Inter SemiBold 20px
Body     — Inter Regular 15px / 1.5 leading
Body SM  — Inter Regular 13px
Caption  — Inter Regular 11px / muted colour
Label    — Inter SemiBold 13px / 0.3 tracking
```

### Dzongkha — Jomolhari
Authentic Uchen script rendering. **Always set line-height ≥ 2.0** — Uchen stacking marks require vertical space.

```
Dzongkha Hero  — Jomolhari 40px / 2.0 lh  — onboarding ཞིམ།
Dzongkha H1    — Jomolhari 28px / 2.0 lh
Dzongkha Body  — Jomolhari 16px / 2.2 lh
```

Font loading order: `Jomolhari` → `Wangdi29` → `Tibetan Machine Uni` → system serif fallback.
Never use `Noto Serif Tibetan` as primary — it uses Tibetan glyph variants that differ from Bhutanese Uchen convention.

---

## Iconography

- Line icons at 24px / 2px stroke (Lucide base)
- Filled icons reserved for active tab states only
- Food-specific icons: custom illustration set (momo, ema datshi bowl, butter lamp, suja thermos)
- Avoid generic Western food emoji as primary UI icons — use custom SVG assets

---

## Voice & Tone

| Situation        | Voice |
|------------------|-------|
| Empty states     | Warm, encouraging — never clinical. "Your order history will appear here 🙏" |
| Errors           | Honest, helpful — never blaming. "Something went wrong — tap to try again." |
| Success          | Celebratory but measured. "Delivered! Enjoy your meal 🙏" |
| Surge pricing    | Transparent, never hidden. "Delivering takes a bit longer in rain — Nu. 20 extra applies." |
| Onboarding       | Proud, teaching — "ཞིམ means delicious. Now you know." |

**Never use:** dark patterns, fake scarcity ("Only 2 slots left!"), countdown pressure for standard orders, hidden fees revealed at checkout.

---

## Karma Points Framing

Loyalty points are called **Karma Points** — a GNH-aligned reference, not a religious appropriation. Copy always frames them as a natural reward for good ordering behaviour:

- "Earn Karma Points with every order"
- "Your karma is building up — 120 points"
- Never "Earn rewards" or "Loyalty credits" — keep the Zhim voice

---

## Accessibility

- Minimum contrast 4.5:1 for body text (WCAG AA)
- Touch targets minimum 44×44pt
- Dzongkha text always uses Jomolhari — never substitute with emoji or Latin characters
- Surge banners include both English and Dzongkha text regardless of user language preference (safety-critical)
- All destructive actions (cancel order, delete address) require explicit confirmation
