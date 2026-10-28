import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { money } from '../utils/format';
import ProductImage from './ProductImage';
import '../styles/ProductCard.css';

export function StockLabel({ stock }) {
  if (stock <= 0) return <span className="stock stock-out">Out of stock</span>;
  if (stock <= 5) return <span className="stock stock-low">Only {stock} left</span>;
  return <span className="stock stock-in">In stock</span>;
}

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const { addItem, busy } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const outOfStock = product.stockQuantity <= 0;

  const handleAdd = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    addItem(product.id, 1);
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-media" aria-label={`View ${product.name}`}>
        <ProductImage src={product.imageUrl} alt={product.name} />
      </Link>
      <div className="product-card-body">
        <span className="product-card-category">{product.category}</span>
        <h3 className="product-card-title"><Link to={`/products/${product.id}`}>{product.name}</Link></h3>
        <div className="product-card-meta">
          <span className="price">{money(product.price)}</span>
          <StockLabel stock={product.stockQuantity} />
        </div>
        <div className="product-card-actions">
          <Link to={`/products/${product.id}`} className="btn btn-ghost btn-sm">Details</Link>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleAdd} disabled={outOfStock || busy}>
            {outOfStock ? 'Sold out' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
