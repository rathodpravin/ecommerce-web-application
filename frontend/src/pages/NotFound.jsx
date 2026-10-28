import { Link } from 'react-router-dom';
import StateMessage from '../components/StateMessage';

export default function NotFound() {
  return (
    <div className="container section">
      <StateMessage title="Page not found" message="The page you're looking for doesn't exist.">
        <Link to="/" className="btn btn-primary">Go home</Link>
      </StateMessage>
    </div>
  );
}
