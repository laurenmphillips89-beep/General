# Cart rewards for the Local theme (no app)

Adds to the slide-out cart drawer:
- A two-goal progress bar: free shipping at $75, free gift at $100
- Auto-add / auto-remove of the free gift product
- A "Little ones also love" slider with one-tap Add buttons that changes with what's in the cart

## Files
| File | What it is |
|---|---|
| `theme/snippets/nbn-cart-rewards.liquid` | Progress bar. Gift goal and gift product handle are set at the top. Free shipping amount comes from Theme settings > Cart. |
| `theme/snippets/nbn-cart-upsells.liquid` | Slider and its suggestion rules |
| `theme/assets/nbn-cart-rewards.js` | Gift add/remove, slider buttons, bar animation |
| `theme/snippets/cart-form.liquid` | The theme's drawer file with two `render` lines added (replaces the old single free shipping notice) |
| `theme/sections/nbn-cart-page.liquid` | Cart page in the NBN design. Wraps the theme's own cart items and subtotal, and adds the reward bar, slider, trust strip and an optional customer quote (editable in the theme editor) |
| `theme/templates/cart.json` | Points the cart page at `nbn-cart-page` |
| `theme/original/` | Untouched copies of `cart-form.liquid` and `cart.json`, for rolling back |

## Needs, outside the theme
- A product with handle `free-marker-pack-gift`, price $0, compare-at $9.95, active on the Online Store.
- A $0 shipping rate on orders $75+ in Settings > Shipping and delivery.
