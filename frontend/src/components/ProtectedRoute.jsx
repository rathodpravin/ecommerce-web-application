import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';
import StateMessage from './StateMessage';
import { Link } from 'react-router-dom';

/**
 * Usability only! Hiding a page does not secure it - the Spring Boot backend enforces every permission.
 * <ProtectedRoute>            -> any logged-in user
 * <ProtectedRoute adminOnly>  -> ADMIN only
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading label="Checking your session…" fullPage />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (adminOnly && user.role !== 'ADMIN') {
    return (
      <div className="container section">
        <StateMessage type="error" title="Access denied" message="This area is for administrators only.">
          <Link className="btn btn-primary" to="/">Back to home</Link>
        </StateMessage>
      </div>
    );
  }
  return children;
}
