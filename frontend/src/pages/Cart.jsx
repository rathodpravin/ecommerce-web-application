import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { money } from '../utils/format';
import ProductImage from '../components/ProductImage';
import ConfirmDialog from '../components/ConfirmDialog';
import Loading from '../components/Loading';
import StateMessage from '../components/StateMessage';
import '../styles/Cart.css';

export default function Cart() {
  const { cart, loading, busy, updateItem, removeItem, refresh } = useCart();
  const navigate = useNavigate();
  const [toRemove, setToRemove] = useState(null);

  if (loading && cart.items.length === 0) return <div className="container section"><Loading label="Loading your cart…" /></div>;

  if (cart.items.length === 0) {
    return (
      <div className="container section">
        <StateMessage title="Your cart is empty" message="Looks like you haven't added anything yet.">
          <Link to="/products" className="btn btn-primary">Start shopping</Link>
        </StateMessage>
      </div>
    );
  }

  const confirmRemove = async () => {
    await removeItem(toRemove.itemId);
    setToRemove(null);
  };

  return (
    <div className="container section">
      <div className="page-head"><h1>Shopping cart</h1><p className="muted">{cart.totalItems} item{cart.totalItems === 1 ? '' : 's'}</p></div>

      <div className="cart-layout">
        <ul className="cart-list">
          {cart.items.map((item) => (
            <li key={item.itemId} className="cart-item">
              <Link to={`/products/${item.productId}`} className="cart-item-media"><ProductImage src={item.imageUrl} alt={item.productName} /></Link>
              <div className="cart-item-info">
                <Link to={`/products/${item.productId}`} className="cart-item-name">{item.productName}</Link>
                <span className="muted">{money(item.unitPrice)} each</span>
                {item.quantity > item.availableStock && <span className="field-error">Only {item.availableStock} in stock - please reduce the quantity.</span>}
                <button type="button" className="link-danger" onClick={() => setToRemove(item)} disabled={busy}>Remove</button>
              </div>
              <div className="qty-control" role="group" aria-label={`Quantity for ${item.productName}`}>
                <button type="button" aria-label="Decrease quantity" disabled={busy || item.quantity <= 1} onClick={() => updateItem(item.itemId, item.quantity - 1)}>−</button>
                <span className="qty-value" aria-live="polite">{item.quantity}</span>
                <button type="button" aria-label="Increase quantity" disabled={busy || item.quantity >= item.availableStock || item.quantity >= 100} onClick={() => updateItem(item.itemId, item.quantity + 1)}>+</button>
              </div>
              <div className="cart-item-subtotal">{money(item.subtotal)}</div>
            </li>
          ))}
        </ul>

        <aside className="summary">
          <h2>Order summary</h2>
          <dl>
            <div><dt>Subtotal</dt><dd>{money(cart.subtotal)}</dd></div>
            <div className="summary-total"><dt>Total</dt><dd>{money(cart.total)}</dd></div>
          </dl>
          <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => navigate('/checkout')} disabled={busy}>Proceed to checkout</button>
          <Link to="/products" className="btn btn-ghost btn-block">Continue shopping</Link>
          <button type="button" className="link-muted" onClick={refresh}>Refresh prices & stock</button>
        </aside>
      </div>

      <ConfirmDialog open={!!toRemove} title="Remove item?" message={toRemove ? `Remove “${toRemove.productName}” from your cart?` : ''}
        confirmLabel="Remove" danger busy={busy} onConfirm={confirmRemove} onCancel={() => setToRemove(null)} />
    </div>
  );
}
