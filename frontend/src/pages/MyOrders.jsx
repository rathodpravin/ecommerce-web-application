import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { getErrorMessage } from '../services/api';
import { canCustomerCancel, formatDate, money } from '../utils/format';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import Loading from '../components/Loading';
import StateMessage from '../components/StateMessage';
import '../styles/Orders.css';

export default function MyOrders() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    orderService.myOrders(page, 10)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => { if (!cancelled) setError(getErrorMessage(e, 'Could not load your orders.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  useEffect(() => load(), [load]);

  return (
    <div className="container section">
      <div className="page-head"><h1>My orders</h1></div>

      {loading && <Loading label="Loading your orders…" />}
      {!loading && error && (
        <StateMessage type="error" title="Couldn't load orders" message={error}>
          <button type="button" className="btn btn-primary" onClick={load}>Try again</button>
        </StateMessage>
      )}
      {!loading && !error && data?.content.length === 0 && (
        <StateMessage title="No orders yet" message="When you place an order it will appear here.">
          <Link to="/products" className="btn btn-primary">Start shopping</Link>
        </StateMessage>
      )}

      {!loading && !error && data?.content.length > 0 && (
        <>
          <ul className="order-list">
            {data.content.map((o) => (
              <li key={o.id} className="order-card">
                <div className="order-card-head">
                  <div><strong>{o.orderNumber}</strong><span className="muted"> · {formatDate(o.createdAt)}</span></div>
                  <StatusBadge status={o.status} />
                </div>
                <ul className="order-card-items">
                  {o.items.map((i) => <li key={i.id}>{i.productName} <span className="muted">× {i.quantity}</span></li>)}
                </ul>
                <div className="order-card-foot">
                  <span className="order-total">{money(o.totalAmount)}</span>
                  <div className="order-card-actions">
                    {canCustomerCancel(o.status) && <span className="muted small">Can be cancelled</span>}
                    <Link to={`/orders/${o.id}`} className="btn btn-ghost btn-sm">View details</Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
