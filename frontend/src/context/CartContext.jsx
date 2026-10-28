import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartService } from '../services/cartService';
import { getErrorMessage } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);
const EMPTY = { items: [], totalItems: 0, subtotal: 0, total: 0 };

/** The backend cart is the single source of truth. We only display what the API returns. */
export function CartProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setCart(await cartService.get());
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not load your cart.'));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) refresh(); else setCart(EMPTY);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Runs an API call, stores the returned cart, and reports errors. Resolves to true/false.
  const run = useCallback(async (fn, successMessage) => {
    setBusy(true);
    try {
      setCart(await fn());
      if (successMessage) toast.success(successMessage);
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  }, [toast]);

  const addItem = useCallback((productId, quantity = 1) => run(() => cartService.add(productId, quantity), 'Added to cart'), [run]);
  const updateItem = useCallback((itemId, quantity) => run(() => cartService.update(itemId, quantity)), [run]);
  const removeItem = useCallback((itemId) => run(() => cartService.remove(itemId), 'Item removed'), [run]);

  const value = useMemo(() => ({ cart, loading, busy, refresh, addItem, updateItem, removeItem }),
    [cart, loading, busy, refresh, addItem, updateItem, removeItem]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
