import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';
import '../styles/Orders.css';

export default function Profile() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="container section narrow">
      <div className="page-head"><h1>My profile</h1></div>
      <div className="panel profile">
        <div className="avatar" aria-hidden="true">{user.fullName.charAt(0).toUpperCase()}</div>
        <dl className="profile-list">
          <div><dt>Name</dt><dd>{user.fullName}</dd></div>
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          <div><dt>Account type</dt><dd>{user.role === 'ADMIN' ? 'Administrator' : 'Customer'}</dd></div>
          <div><dt>Member since</dt><dd>{formatDate(user.createdAt)}</dd></div>
        </dl>
      </div>
      <div className="order-actions">
        <Link to="/my-orders" className="btn btn-primary">View my orders</Link>
        {isAdmin && <Link to="/admin" className="btn btn-ghost">Admin dashboard</Link>}
        <button type="button" className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
