import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem, Cart } from '@zhim/types';

interface CartStore extends Cart {
  surge_message_en?: string;
  surge_message_dz?: string;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  clear: () => void;
  setKarmaPoints: (points: number) => void;
  computeTotals: () => void;
}

const EMPTY_CART: Cart = {
  restaurant_id: '',
  restaurant_name: '',
  items: [],
  subtotal_nu: 0,
  delivery_fee_nu: 0,
  surge_fee_nu: 0,
  discount_nu: 0,
  total_nu: 0,
  karma_points_used: 0,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_CART,

      addItem(item) {
        const state = get();
        const id = `${item.menu_item_id}-${item.variant_id ?? ''}-${Date.now()}`;
        const newItems = [...state.items, { ...item, id }];
        set({ items: newItems });
        get().computeTotals();
      },

      removeItem(itemId) {
        const newItems = get().items.filter((i) => i.id !== itemId);
        set({ items: newItems });
        get().computeTotals();
      },

      updateQuantity(itemId, qty) {
        if (qty <= 0) {
          get().removeItem(itemId);
          return;
        }
        const newItems = get().items.map((i) => i.id === itemId ? { ...i, quantity: qty } : i);
        set({ items: newItems });
        get().computeTotals();
      },

      setKarmaPoints(points) {
        set({ karma_points_used: points });
        get().computeTotals();
      },

      computeTotals() {
        const state = get();
        const subtotal = state.items.reduce((sum, item) => {
          const addonTotal = item.addons.reduce((a, addon) => a + addon.unit_price_nu * addon.quantity, 0);
          return sum + (item.unit_price_nu + addonTotal) * item.quantity;
        }, 0);
        const discount = Math.floor(state.karma_points_used * 0.5);
        const total = subtotal + state.delivery_fee_nu + state.surge_fee_nu - discount;
        set({ subtotal_nu: subtotal, discount_nu: discount, total_nu: total });
      },

      clear() {
        set({ ...EMPTY_CART });
      },
    }),
    {
      name: 'zhim-cart',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
