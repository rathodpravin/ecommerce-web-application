import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import SearchBar from './SearchBar';
import '../styles/Navbar.css';

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    </svg>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label="ShopEase home">
          <span className="brand-mark" aria-hidden="true">S</span>ShopEase
        </Link>

        <button type="button" className="nav-toggle" aria-label="Toggle menu" aria-expanded={open} aria-controls="nav-menu" onClick={() => setOpen((o) => !o)}>
          <span /><span /><span />
        </button>

        <nav id="nav-menu" className={`nav-menu ${open ? 'open' : ''}`}>
          <ul className="nav-links">
            <li><NavLink to="/" end>Home</NavLink></li>
            <li><NavLink to="/products">Products</NavLink></li>
            {isAdmin && <li><NavLink to="/admin">Admin Dashboard</NavLink></li>}
          </ul>

          <SearchBar className="nav-search" onSearch={(q) => navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products')} />

          <div className="nav-actions">
            <Link to="/cart" className="cart-link" aria-label={`Cart, ${cart.totalItems} items`}>
              <CartIcon />
              {cart.totalItems > 0 && <span className="cart-count">{cart.totalItems}</span>}
            </Link>
            {isAuthenticated ? (
              <>
                <NavLink to="/profile" className="nav-user">{user.fullName.split(' ')[0]}</NavLink>
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
