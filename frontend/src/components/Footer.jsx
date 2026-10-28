import { Link } from 'react-router-dom';
import '../styles/Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand brand-footer"><span className="brand-mark" aria-hidden="true">S</span>ShopEase</div>
          <p className="footer-text">A simple online store demo built with React and Spring Boot.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <ul>
            <li><Link to="/products">All products</Link></li>
            <li><Link to="/cart">Your cart</Link></li>
            <li><Link to="/my-orders">My orders</Link></li>
          </ul>
        </div>
        <div>
          <h4>Account</h4>
          <ul>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Create account</Link></li>
            <li><Link to="/profile">Profile</Link></li>
          </ul>
        </div>
        <div>
          <h4>Customer support</h4>
          <p className="footer-text">Support contact details are provided by the store owner.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">© {new Date().getFullYear()} ShopEase. Demo application.</div>
      </div>
    </footer>
  );
}
