import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { money } from '../utils/format';
import ProductImage from '../components/ProductImage';
import { StockLabel } from '../components/ProductCard';
import Loading from '../components/Loading';
import StateMessage from '../components/StateMessage';
import '../styles/Products.css';

const MAX_QTY = 100;

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { addItem, busy } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [qtyError, setQtyError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    productService.get(id)
      .then((p) => { if (!cancelled) { setProduct(p); setQty(1); } })
      .catch((e) => { if (!cancelled) setError(e.response?.status === 404 ? 'This product could not be found.' : getErrorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="container section"><Loading label="Loading product…" /></div>;
  if (error || !product) {
    return (
      <div className="container section">
        <StateMessage type="error" title="Product unavailable" message={error}>
          <Link to="/products" className="btn btn-primary">Back to products</Link>
        </StateMessage>
      </div>
    );
  }

  const max = Math.min(product.stockQuantity, MAX_QTY);
  const outOfStock = product.stockQuantity <= 0;

  const validate = (value) => {
    if (!Number.isInteger(value) || value < 1) return 'Enter a quantity of at least 1.';
    if (value > max) return `Only ${max} available.`;
    return '';
  };

  const onQtyChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setQty(Number.isNaN(value) ? '' : value);
    setQtyError('');
  };

  const handleAdd = async () => {
    const problem = validate(qty);
    if (problem) { setQtyError(problem); return; }
    if (!isAuthenticated) { navigate('/login', { state: { from: location.pathname } }); return; }
    await addItem(product.id, qty);
  };

  return (
    <div className="container section">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/products">Products</Link> / <Link to={`/products?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
      </nav>
      <div className="details">
        <div className="details-media"><ProductImage src={product.imageUrl} alt={product.name} /></div>
        <div className="details-info">
          <span className="product-card-category">{product.category}</span>
          <h1>{product.name}</h1>
          <div className="details-price">{money(product.price)}</div>
          <StockLabel stock={product.stockQuantity} />
          <p className="details-desc">{product.description || 'No description provided.'}</p>

          {outOfStock ? (
            <p className="alert alert-error">This product is currently out of stock.</p>
          ) : (
            <div className="details-buy">
              <div className="field">
                <label htmlFor="qty">Quantity</label>
                <div className="qty-control">
                  <button type="button" aria-label="Decrease quantity" onClick={() => { setQty(Math.max(1, (Number(qty) || 1) - 1)); setQtyError(''); }}>−</button>
                  <input id="qty" type="number" min="1" max={max} value={qty} onChange={onQtyChange} aria-invalid={!!qtyError} aria-describedby="qty-error" />
                  <button type="button" aria-label="Increase quantity" onClick={() => { setQty(Math.min(max, (Number(qty) || 0) + 1)); setQtyError(''); }}>+</button>
                </div>
                <span id="qty-error" className="field-error" role="alert">{qtyError}</span>
              </div>
              <button type="button" className="btn btn-primary btn-lg" onClick={handleAdd} disabled={busy}>Add to Cart</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
