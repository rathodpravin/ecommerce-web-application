import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { orderService } from '../services/orderService';
import { getErrorMessage, getFieldErrors } from '../services/api';
import { money } from '../utils/format';
import ProductImage from '../components/ProductImage';
import Loading from '../components/Loading';
import StateMessage from '../components/StateMessage';
import '../styles/Checkout.css';

export default function Checkout() {
  const { cart, loading, refresh } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false); // blocks double-clicks even before React re-renders

  if (loading && cart.items.length === 0) return <div className="container section"><Loading label="Loading your cart…" /></div>;
  if (cart.items.length === 0) {
    return (
      <div className="container section">
        <StateMessage title="Nothing to check out" message="Your cart is empty.">
          <Link to="/products" className="btn btn-primary">Browse products</Link>
        </StateMessage>
      </div>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (inFlight.current) return;
    const trimmed = address.trim();
    setFormError('');
    if (trimmed.length < 5) { setError('Please enter a shipping address (at least 5 characters).'); return; }
    if (trimmed.length > 500) { setError('Address is too long (max 500 characters).'); return; }
    setError('');

    inFlight.current = true;
    setSubmitting(true);
    try {
      const order = await orderService.checkout(trimmed);
      await refresh(); // backend cleared the cart
      toast.success(`Order ${order.orderNumber} placed!`);
      navigate(`/orders/${order.id}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (fieldErrors.shippingAddress) setError(fieldErrors.shippingAddress);
      setFormError(getErrorMessage(err, 'We could not place your order.'));
      if (err.response?.status === 409 || err.response?.status === 400) refresh(); // stock may have changed
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="container section">
      <div className="page-head"><h1>Checkout</h1></div>
      <div className="cart-layout">
        <form className="checkout-form" onSubmit={onSubmit} noValidate>
          <h2>Shipping address</h2>
          {formError && <div className="alert alert-error" role="alert">{formError}</div>}
          <div className="field">
            <label htmlFor="address">Delivery address</label>
            <textarea id="address" rows="4" maxLength={500} value={address} placeholder="House / street, city, postal code"
              onChange={(e) => { setAddress(e.target.value); setError(''); }} aria-invalid={!!error} aria-describedby="address-error" />
            <span id="address-error" className="field-error" role="alert">{error}</span>
          </div>

          <div className="alert alert-info">
            <strong>No payment is taken.</strong> Placing an order only records it in the store. No card details are collected and nothing is charged.
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? <><span className="spinner spinner-sm" /> Placing order…</> : 'Place Order'}
          </button>
          <Link to="/cart" className="btn btn-ghost">Back to cart</Link>
        </form>

        <aside className="summary">
          <h2>Order summary</h2>
          <ul className="summary-items">
            {cart.items.map((i) => (
              <li key={i.itemId}>
                <ProductImage src={i.imageUrl} alt="" />
                <div><span>{i.productName}</span><span className="muted"> × {i.quantity}</span></div>
                <span>{money(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl>
            <div><dt>Subtotal</dt><dd>{money(cart.subtotal)}</dd></div>
            <div className="summary-total"><dt>Total</dt><dd>{money(cart.total)}</dd></div>
          </dl>
          <p className="muted small">The final total is calculated by the server when you place the order.</p>
        </aside>
      </div>
    </div>
  );
}
